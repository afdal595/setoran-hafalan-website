#!/bin/bash
set -euo pipefail

BASE_URL="http://localhost:3000"
COOKIE_JAR="/tmp/setoran_cookies.txt"

status_code() {
  curl -s -o /dev/null -w "%{http_code}" "$@"
}

assert_status() {
  local label="$1"
  local actual="$2"
  local expected="$3"

  if [[ "$actual" == "$expected" ]]; then
    echo "PASS ${label}: ${actual}"
  else
    echo "FAIL ${label}: expected ${expected}, got ${actual}" >&2
    exit 1
  fi
}

echo "Using BASE_URL=${BASE_URL}"

echo "=== 1. Test accessing /dashboard while logged out ==="
STATUS=$(status_code "${BASE_URL}/dashboard")
assert_status "GET /dashboard (logged out)" "$STATUS" "307"

echo -e "\n=== 2. Login as admin (store cookie) ==="
LOGIN_RESPONSE=$(curl -s -c "${COOKIE_JAR}" -X POST "${BASE_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ldk.ac.id","role":"admin","password":"admin123"}')
if echo "$LOGIN_RESPONSE" | grep -q '"role":"admin"'; then
  echo "PASS POST /api/auth/login"
else
  echo "FAIL POST /api/auth/login: unexpected response ${LOGIN_RESPONSE}" >&2
  exit 1
fi

echo -e "\n=== 3. Access /dashboard with admin session (should work) ==="
STATUS=$(status_code -b "${COOKIE_JAR}" "${BASE_URL}/dashboard")
assert_status "GET /dashboard (with cookie)" "$STATUS" "200"

echo -e "\n=== 4. Test /api/auth/me with session ==="
STATUS=$(status_code -b "${COOKIE_JAR}" "${BASE_URL}/api/auth/me")
assert_status "GET /api/auth/me (with cookie)" "$STATUS" "200"

echo -e "\n=== 5. Access /admin/login while logged in (should work - public route) ==="
STATUS=$(status_code -b "${COOKIE_JAR}" "${BASE_URL}/admin/login")
assert_status "GET /admin/login (with cookie)" "$STATUS" "200"

echo -e "\n=== 6. Test admin-only endpoint while logged out (should 401) ==="
STATUS=$(status_code "${BASE_URL}/api/admin/me")
assert_status "GET /api/admin/me (without cookie)" "$STATUS" "401"

echo -e "\nAll guard checks passed."

