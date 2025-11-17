#!/usr/bin/env bash
set -euo pipefail
BASE='http://localhost:4000/api'
AUTH='-u onlyvibes:supersecret'

# Prepare payload
cat > /tmp/e2e_event.json <<JSON
{
  "title":"Scripted E2E Event",
  "description":"Automated E2E test event",
  "category":"music",
  "dateTime":"2025-12-24T20:00:00.000Z",
  "location": { "name": "Script Club", "address": "1 Test Ave", "city": "Berlin", "country": "Germany" },
  "imageUrl": "https://picsum.photos/seed/e2e/400/200",
  "ownerId": "acct-002"
}
JSON

# Create event
CREATE_RESP=$(curl -s $AUTH -H "x-user-role: verified_user" -H "Content-Type: application/json" -d @/tmp/e2e_event.json $BASE/events)
echo "Create response:"; echo "$CREATE_RESP" | jq .
ID=$(echo "$CREATE_RESP" | jq -r .data.id)
if [ -z "$ID" ] || [ "$ID" = "null" ]; then
  echo "Failed to parse ID from create response"; exit 1
fi

# Read event
echo "GET created event"; curl -s $AUTH $BASE/events/$ID | jq .

# Update event
echo "Update event title"; curl -s $AUTH -H "x-user-role: verified_user" -H "Content-Type: application/json" -X PUT -d '{"title":"Scripted E2E Event — Updated"}' $BASE/events/$ID | jq .

# Read updated
echo "GET updated"; curl -s $AUTH $BASE/events/$ID | jq .

# Delete
echo "Delete event"; curl -s $AUTH -H "x-user-role: verified_user" -X DELETE $BASE/events/$ID -w "\nHTTP_CODE:%{http_code}\n"

# Confirm deletion
echo "GET after delete"; curl -s $AUTH -w "\nHTTP_CODE:%{http_code}\n" $BASE/events/$ID

echo "E2E completed successfully"
