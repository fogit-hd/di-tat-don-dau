#!/bin/sh
set -eu

API_URL="${API_URL:-${VITE_API_URL:-}}"
SOCKET_URL="${SOCKET_URL:-${VITE_SOCKET_URL:-$API_URL}}"
GOOGLE_CLIENT_ID="${GOOGLE_CLIENT_ID:-${VITE_GOOGLE_CLIENT_ID:-}}"

js_escape() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

cat > /usr/share/nginx/html/config.js <<EOF
window.__APP_CONFIG__ = {
  apiUrl: "$(js_escape "$API_URL")",
  socketUrl: "$(js_escape "$SOCKET_URL")",
  googleClientId: "$(js_escape "$GOOGLE_CLIENT_ID")"
};
EOF

if [ -n "${API_UPSTREAM:-}" ]; then
  API_UPSTREAM="${API_UPSTREAM%/}"
  export API_UPSTREAM
  envsubst '${API_UPSTREAM}' < /etc/nginx/proxy.conf.template > /etc/nginx/conf.d/default.conf
else
  cp /etc/nginx/static.conf /etc/nginx/conf.d/default.conf
fi

exec nginx -g 'daemon off;'
