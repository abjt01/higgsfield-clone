B=http://localhost:3100
probe() { printf "%-58s " "$1"; shift; code=$(curl -s -o /tmp/pbody -w "%{http_code}" "$@" --max-time 25); printf "%s  %s\n" "$code" "$(head -c 110 /tmp/pbody | tr -d '\n')"; }

echo "--- GET /api/generations ---"
probe "no cookie"                      "$B/api/generations"
probe "limit=abc"                      "$B/api/generations?limit=abc"
probe "limit=-5"                       "$B/api/generations?limit=-5"
probe "limit=99999"                    "$B/api/generations?limit=99999"
probe "cursor=garbage"                 "$B/api/generations?cursor=garbage"
probe "cursor=';DROP TABLE users;--"   "$B/api/generations?cursor=%27%3BDROP%20TABLE%20users%3B--"

echo "--- POST /api/generations ---"
p() { printf "%-58s " "$1"; code=$(curl -s -o /tmp/pbody -w "%{http_code}" -X POST "$B/api/generations" -H 'Content-Type: application/json' -d "$2" --max-time 25); printf "%s  %s\n" "$code" "$(head -c 110 /tmp/pbody | tr -d '\n')"; }
p "empty body"            ''
p "not json"              'hello'
p "null"                  'null'
p "array"                 '[]'
p "no prompt"             '{}'
p "prompt=number"         '{"prompt":123}'
p "prompt whitespace"     '{"prompt":"   "}'
p "prompt 5000 chars"     "{\"prompt\":\"$(python3 -c 'print("a"*5000)')\"}"
p "bad aspect"            '{"prompt":"x","aspectRatio":"999:1"}'
p "aspect=object"         '{"prompt":"x","aspectRatio":{}}'
p "unknown camera"        '{"prompt":"x","cameraId":"nope"}'
p "cameraId=number"       '{"prompt":"x","cameraId":42}'
p "prototype pollution"   '{"prompt":"x","__proto__":{"admin":true}}'

echo "--- GET /api/generations/[id] ---"
probe "nonexistent uuid"   "$B/api/generations/00000000-0000-0000-0000-000000000000"
probe "not a uuid"         "$B/api/generations/hello"
probe "sql-ish id"         "$B/api/generations/%27%20OR%201%3D1--"

echo "--- legacy /api/generate ---"
p2() { printf "%-58s " "$1"; code=$(curl -s -o /tmp/pbody -w "%{http_code}" -X POST "$B/api/generate" -H 'Content-Type: application/json' -d "$2" --max-time 40); printf "%s  %s\n" "$code" "$(head -c 80 /tmp/pbody | tr -d '\n')"; }
p2 "unauthenticated, uncosted generation" '{"prompt":"free image with no credits"}'
