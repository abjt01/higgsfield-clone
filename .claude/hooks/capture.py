#!/usr/bin/env python3
"""
Automatic prompt/response capture for the 8x assignment.

Wired to two Claude Code hook events in .claude/settings.json:
  UserPromptSubmit -> append a PROMPT entry (verbatim, immediately)
  Stop             -> append the matching RESPONSE entry (final text only)

Only the prompt and the final assistant message are written. Thinking blocks,
tool calls, tool results, intermediate text and subagent traffic never reach
the log. The hook must never break a session, so every failure path exits 0
and drops a note in ~/.claude/agent-capture-errors.log instead.
"""

import glob
import json
import os
import re
import subprocess
import sys
import tempfile
from datetime import datetime, timezone

TOOL = "claude-code"
ERR_LOG = os.path.expanduser("~/.claude/agent-capture-errors.log")

FM_RE = re.compile(r"\A---\n.*?\n---\n", re.S)
# Entries count only at structural positions: the start of the entry region, or
# just after the "\n\n\n" separator append_entry writes between entries. Without
# the anchor, a response that quotes a log entry back -- routine in a project
# whose logs get discussed in-session -- is counted as a real entry and corrupts
# both the numbering and total_exchanges.
ENTRY_ANCHOR = r"(?:\A|(?<=\n\n\n))"
ENTRY_HDR_RE = re.compile(
    ENTRY_ANCHOR +
    r"\[LOG_ENTRY type=(PROMPT|RESPONSE) num=(\d+) session=\S+\]\n"
    r"timestamp: (\S+)\n"
    r"model: (.+)$",
    re.M,
)
MODEL_LINE_RE = re.compile(r"^model: (.+)$", re.M)

# Claude Code routes some machine-generated events through UserPromptSubmit
# (background-task notifications, system reminders, local command output).
# Those are not things a human asked, so a prompt made up entirely of them is
# skipped. A real prompt that merely carries one is still logged verbatim.
ENVELOPE_RE = re.compile(
    r"<(task-notification|system-reminder|local-command-stdout|local-command-stderr)\b.*?"
    r"</\1>",
    re.S,
)


def utc_now():
    dt = datetime.now(timezone.utc)
    return dt.strftime("%Y-%m-%dT%H:%M:%S.") + "%03dZ" % (dt.microsecond // 1000)


def log_error(msg):
    try:
        os.makedirs(os.path.dirname(ERR_LOG), exist_ok=True)
        with open(ERR_LOG, "a", encoding="utf-8") as fh:
            fh.write("%s %s\n" % (utc_now(), msg))
    except Exception:
        pass


# --------------------------------------------------------------------------
# transcript reading (used only to resolve the model name, and as a fallback
# for the final response when stdin does not carry it)
# --------------------------------------------------------------------------

def read_tail(path, max_bytes=2_000_000):
    try:
        size = os.path.getsize(path)
        with open(path, "rb") as fh:
            if size > max_bytes:
                fh.seek(size - max_bytes)
                fh.readline()  # discard partial line
            return fh.read().decode("utf-8", "replace").splitlines()
    except Exception:
        return []


def transcript_entries(path):
    out = []
    for line in read_tail(path):
        line = line.strip()
        if not line.startswith("{"):
            continue
        try:
            out.append(json.loads(line, strict=False))
        except Exception:
            continue
    return out


def last_assistant(entries):
    """Return (model, final_text) from the last main-thread assistant message."""
    model = None
    text = None
    for rec in reversed(entries):
        if rec.get("type") != "assistant" or rec.get("isSidechain"):
            continue
        msg = rec.get("message") or {}
        if not isinstance(msg, dict):
            continue
        if model is None and msg.get("model"):
            model = msg["model"]
        content = msg.get("content")
        if text is None and isinstance(content, list):
            parts = [
                c.get("text", "")
                for c in content
                if isinstance(c, dict) and c.get("type") == "text"
            ]
            parts = [p for p in parts if p.strip()]
            if parts:
                text = "\n".join(parts)
        if model and text:
            break
    return model, text


def previous_model(logs_dir):
    """Last model recorded in any earlier log file (turn-1 fallback)."""
    files = sorted(glob.glob(os.path.join(logs_dir, "*.md")), key=os.path.getmtime)
    for path in reversed(files):
        try:
            with open(path, encoding="utf-8") as fh:
                hits = MODEL_LINE_RE.findall(fh.read())
        except Exception:
            continue
        for value in reversed(hits):
            value = value.strip()
            if value and value != "unknown":
                return value
    return None


def git_author(project_dir):
    override = os.environ.get("AGENT_LOG_AUTHOR")
    if override:
        return override
    try:
        res = subprocess.run(
            ["git", "-C", project_dir, "config", "user.name"],
            capture_output=True, text=True, timeout=5,
        )
        name = res.stdout.strip()
        if name:
            return name
    except Exception:
        pass
    return "unknown"


# --------------------------------------------------------------------------
# log file assembly
# --------------------------------------------------------------------------

def build_frontmatter(sid, date, author, models, project, total, first_t, last_t):
    return (
        "---\n"
        "session_id: %s\n"
        "date: %s\n"
        "author: %s\n"
        "model: %s\n"
        "tool: %s\n"
        "project: %s\n"
        "total_exchanges: %d\n"
        "first_prompt_time: %s\n"
        "last_prompt_time: %s\n"
        "---\n"
    ) % (sid, date, author, models, TOOL, project, total, first_t, last_t)


def build_header(date, short, project, author):
    return (
        "\n# Session Log - %s\n\n"
        "Session: `%s` | Project: `%s` | Author: `%s`\n\n"
        "---\n\n"
    ) % (date, short, project, author)


def backfill_model(entries_text, num, short, model):
    """Fill in a PROMPT entry whose model was still unknown when it was written.

    Touches only the literal token `unknown` on that entry's model line. Entry
    bodies are never rewritten.
    """
    pat = re.compile(
        ENTRY_ANCHOR +
        r"(\[LOG_ENTRY type=PROMPT num=%d session=%s\]\ntimestamp: \S+\nmodel: )unknown\n"
        % (num, re.escape(short))
    )
    return pat.sub(lambda m: m.group(1) + model + "\n", entries_text, count=1)


def append_entry(logs_dir, sid, project_dir, kind, text, model):
    short = sid.split("-")[0]
    project = os.path.basename(os.path.abspath(project_dir))
    author = git_author(project_dir)

    lock_path = os.path.join(tempfile.gettempdir(), "agent-capture-%s.lock" % short)
    with open(lock_path, "a+") as lock:
        try:
            import fcntl
            fcntl.flock(lock.fileno(), fcntl.LOCK_EX)
        except Exception:
            pass

        matches = sorted(glob.glob(os.path.join(logs_dir, "*_%s.md" % sid)))
        if matches:
            path = matches[0]
            with open(path, encoding="utf-8") as fh:
                existing = fh.read()
        else:
            stamp = datetime.now(timezone.utc).strftime("%Y-%m-%d_%H-%M-%S")
            path = os.path.join(logs_dir, "%s_%s.md" % (stamp, sid))
            existing = ""

        rest = FM_RE.sub("", existing, count=1)
        idx = rest.find("[LOG_ENTRY ")
        entries_text = rest[idx:] if idx != -1 else ""

        prior = ENTRY_HDR_RE.findall(entries_text)
        num = sum(1 for e in prior if e[0] == "PROMPT")
        if kind == "PROMPT":
            num += 1
        else:
            num = max(num, 1)
            if model != "unknown":
                entries_text = backfill_model(entries_text, num, short, model)

        new_body = text.rstrip("\n")
        tail = entries_text[entries_text.rfind("[LOG_ENTRY "):] if "[LOG_ENTRY " in entries_text else ""
        if tail.startswith("[LOG_ENTRY type=%s num=%d " % (kind, num)) and tail.rstrip().endswith(new_body):
            return  # same event delivered twice; nothing new to record

        entries_text += (
            "[LOG_ENTRY type=%s num=%d session=%s]\n"
            "timestamp: %s\n"
            "model: %s\n\n"
            "%s\n\n\n"
        ) % (kind, num, short, utc_now(), model, text.rstrip("\n"))

        # recompute metadata from the entries themselves
        all_entries = ENTRY_HDR_RE.findall(entries_text)
        prompts = [e for e in all_entries if e[0] == "PROMPT"]
        first_t = prompts[0][2] if prompts else utc_now()
        last_t = prompts[-1][2] if prompts else first_t
        seen, models = set(), []
        for e in all_entries:
            m = e[3].strip()
            if m and m not in seen:
                seen.add(m)
                models.append(m)
        date = first_t[:10]

        out = build_frontmatter(
            sid, date, author, ", ".join(models) or "unknown",
            project, len(prompts), first_t, last_t,
        ) + build_header(date, short, project, author) + entries_text

        tmp = path + ".tmp"
        with open(tmp, "w", encoding="utf-8") as fh:
            fh.write(out)
        os.replace(tmp, path)


def load_payload(raw):
    """Parse hook stdin.

    Claude Code emits literal control characters (raw newlines, tabs) inside
    string values such as last_assistant_message, which strict JSON rejects.
    Retry leniently before giving up, and keep the raw payload if even that
    fails so a turn is never silently dropped.
    """
    if not raw.strip():
        return {}
    try:
        return json.loads(raw)
    except ValueError:
        pass
    try:
        return json.loads(raw, strict=False)
    except ValueError:
        log_error("unparseable payload: %s" % raw[:4000])
        raise


def main():
    raw = sys.stdin.read()
    payload = load_payload(raw)
    event = payload.get("hook_event_name") or ""
    if event not in ("UserPromptSubmit", "Stop"):
        return

    project_dir = (
        os.environ.get("CLAUDE_PROJECT_DIR") or payload.get("cwd") or os.getcwd()
    )
    logs_dir = os.path.join(project_dir, ".agent-logs")
    os.makedirs(logs_dir, exist_ok=True)

    sid = payload.get("session_id") or "unknown-session"
    entries = transcript_entries(payload.get("transcript_path") or "")
    t_model, t_text = last_assistant(entries)
    model = t_model or previous_model(logs_dir) or "unknown"

    if event == "UserPromptSubmit":
        text = payload.get("prompt") or ""
        kind = "PROMPT"
        if not ENVELOPE_RE.sub("", text).strip():
            return
    else:
        text = payload.get("last_assistant_message") or t_text or ""
        kind = "RESPONSE"

    if not text.strip():
        return
    append_entry(logs_dir, sid, project_dir, kind, text, model)


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # never break the session
        log_error("capture.py failed: %r" % (exc,))
    sys.exit(0)
