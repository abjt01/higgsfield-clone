# CAPTURE-TEST.md

Proof that automatic prompt/response capture is installed and firing.

## 1. Tool and model

| | |
|---|---|
| Tool | **Claude Code** CLI, v2.1.274, macOS (darwin 25.6.0) |
| Model | **`claude-opus-5`** (Opus 5, 1M context), effort `xhigh` |
| Planning vs. execution | Same model for both. Claude Code runs one model per session; it plans and executes in the same loop. No separate planner. A mid-build switch would show up per-entry in the `model:` field and in the session frontmatter, which lists every distinct model seen. |
| Automatic hook mechanism? | **Yes.** Claude Code has a first-class hooks system: shell commands bound to lifecycle events, configured in `settings.json`. Verified against the reference at <https://code.claude.com/docs/en/hooks> rather than assumed. |

## 2. Mechanism and config

Two hook events, both wired to one script:

- **`UserPromptSubmit`** — fires when a prompt is submitted, before the model sees it.
  Receives the verbatim `prompt` on stdin as JSON.
- **`Stop`** — fires when the turn ends. Receives `last_assistant_message`, the full
  text of the final response, plus `transcript_path`.

Because the prompt and the final response are each handed to the hook directly, nothing
in between is ever seen: no thinking blocks, no tool calls, no tool results, no
intermediate text, no retries. The transcript is read only to resolve the model name
(and as a fallback if `last_assistant_message` is empty).

Files changed:

| File | Role |
|---|---|
| `.claude/settings.json` | Hook config. Project-scoped and committed, so it applies to every session started in this repo, by anyone who clones it. |
| `.claude/hooks/capture.py` | The capture script. Python 3 stdlib only, no dependencies. |

`.claude/settings.json`:

```json
{
  "hooks": {
    "UserPromptSubmit": [
      { "hooks": [ { "type": "command", "command": "python3",
                     "args": ["${CLAUDE_PROJECT_DIR}/.claude/hooks/capture.py"],
                     "timeout": 20 } ] }
    ],
    "Stop": [
      { "hooks": [ { "type": "command", "command": "python3",
                     "args": ["${CLAUDE_PROJECT_DIR}/.claude/hooks/capture.py"],
                     "timeout": 20 } ] }
    ]
  }
}
```

Behaviour notes, so the log can be read honestly:

- One file per session, `.agent-logs/YYYY-MM-DD_HH-MM-SS_<session-id>.md`.
- The PROMPT entry is written **immediately** on submit, not buffered until the turn
  ends, so a prompt still lands if the turn is aborted or interrupted.
- Frontmatter (`total_exchanges`, `last_prompt_time`, `model`) is recomputed from the
  entries on each append. Entry bodies are never rewritten.
- The one exception: if the model name was not yet resolvable when a PROMPT was written
  (only possible on the very first turn of the first session), the literal token
  `unknown` on that entry's `model:` line is filled in when the turn closes. Nothing
  else is ever edited after the fact.
- The hook never breaks a session: all failures exit 0 and are appended to
  `~/.claude/agent-capture-errors.log`.
- `.agent-logs/` is **not** in `.gitignore`. There is no `.gitignore` in this repo.

## 3. Where the canaries landed

- `.agent-logs/2026-09-17_21-55-29_d390708f-0c89-4b88-b4ba-ac5dbc1d55dd.md` — session 1
- `.agent-logs/2026-09-17_21-55-32_6ada9a97-c21c-4e32-a4e9-1366fe0e9491.md` — session 2

Two different session IDs, two separate `claude` processes. The second session was
started after the hook was installed and inherited it from the committed project
config — the hook is installed in the repo, not in one live session.

## 4. Both canary entries, raw

From `.agent-logs/2026-09-17_21-55-29_d390708f-0c89-4b88-b4ba-ac5dbc1d55dd.md`:

    [LOG_ENTRY type=PROMPT num=1 session=d390708f]
    timestamp: 2026-09-17T21:55:29.104Z
    model: claude-opus-5

    CAPTURE TEST — 8x assignment, Abhijeet Yadav. Reply with one short sentence confirming you received this. Do not use any tools.


    [LOG_ENTRY type=RESPONSE num=1 session=d390708f]
    timestamp: 2026-09-17T21:55:31.200Z
    model: claude-opus-5

    Received — capture test acknowledged, Abhijeet Yadav, 8x assignment.

From `.agent-logs/2026-09-17_21-55-32_6ada9a97-c21c-4e32-a4e9-1366fe0e9491.md`:

    [LOG_ENTRY type=PROMPT num=1 session=6ada9a97]
    timestamp: 2026-09-17T21:55:32.103Z
    model: claude-opus-5

    CAPTURE TEST 2 — second session, 8x assignment, Abhijeet Yadav. Reply with one short sentence confirming you received this. Do not use any tools.


    [LOG_ENTRY type=RESPONSE num=1 session=6ada9a97]
    timestamp: 2026-09-17T21:55:34.169Z
    model: claude-opus-5

    Received — CAPTURE TEST 2, second session, 8x assignment, Abhijeet Yadav.

## 5. What did not work first

**1. Strict JSON parsing dropped every response.** `json.loads` rejects literal control
characters inside string values, and Claude Code's `Stop` payload puts raw newlines
inside `last_assistant_message`. Every `Stop` hook died with
`JSONDecodeError: Invalid control character at: line 1 column 127`, so prompts were
landing and responses were silently vanishing. Visible in
`~/.claude/agent-capture-errors.log` at `21:42:34Z` and `21:44:56Z`. Fixed by retrying
with `strict=False`, and by dumping the raw payload to the error log if even that fails,
so a turn can never disappear without a trace.

**2. The first canary session went rogue.** I ran the canary as
`claude -p "CAPTURE TEST — ..."` with full tool access. That session had no task other
than the canary string, found the half-built capture setup and the failing error log in
the repo, and spent eight minutes autonomously editing `.claude/hooks/capture.py` —
it independently applied the same `strict=False` fix. I killed it (PID 14203), diffed
the file to confirm that was its only change, and then rewrote that section myself so
the code in the repo is the version I intended. Its log had a PROMPT and no
RESPONSE, because I killed the process before the turn ended. Later canaries were run
with `--disallowedTools "Bash,Edit,Write,NotebookEdit,Task,Agent,..."`. That log was
removed later for the reason in item 7.

**3. `--max-turns 1` produced prompts with no responses.** Added to stop the sessions
wandering, it instead aborted them mid-tool-call, so there was never a final assistant
message for `Stop` to log. Confirmed by reading the canary transcripts: the only
assistant blocks were `thinking` and `tool_use`, no `text`. The hook was correct; the
test was wrong. The two logs from that round were prompt-only for this reason, and were
removed later for the reason in item 7.

**4. Background task notifications were being logged as prompts.** Claude Code routes
machine-generated events (`<task-notification>`, `<system-reminder>`) through
`UserPromptSubmit`. One landed in `.agent-logs/2026-09-17_21-51-42_e64f6b83-...md` as
PROMPT num=1 — a background job failure report, recorded as though I had typed it.
That entry is still there.
Added a filter that skips a prompt only when it consists *entirely* of such envelopes;
a real prompt that merely carries one is still logged verbatim, uncleaned. The already
captured bogus entry is **left in place** rather than deleted.

**5. Considered and rejected: reconstructing both entries from the transcript at
`Stop` time.** Simpler — one hook instead of two — but a prompt would be lost whenever
a turn was interrupted before it ended, which is exactly when the log is most
interesting. Writing the PROMPT on submit costs a second hook and is worth it.

**6. Minor:** `timeout` is not on macOS zsh by default, and zsh's `echo` interprets
`\n`, which corrupted a hand-built JSON test payload and produced a misleading
`JSONDecodeError` in the very first offline test. Test-harness noise, not a hook bug;
later offline tests build payloads with `json.dumps`.

**7. Every canary before the last two carried the wrong name.** I seeded the canary
string with the name attached to the account email instead of asking whose submission
this is. Corrected to **Abhijeet Yadav** (GitHub `abjt01`) and re-run in two fresh
sessions; those are the canaries in section 4.

The `author:` field was correct throughout — it reads `git config user.name`, which is
already the GitHub handle the format asks for. Only the canary prompt text was wrong.

At the author's instruction I then **deleted the five superseded canary logs and
rewrote the two commits that contained them**, so the incorrect name does not ship in a
public repo. Flagging it plainly because it cuts against the "do not delete an entry"
rule: what was removed was pre-build canary traffic carrying another person's name, not
working record, and the failures those canaries exposed are all still described above.
Nothing from the build itself has been removed, and nothing will be.
