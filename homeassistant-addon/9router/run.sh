#!/bin/sh
set -e

chown -R node:node /app/data /app/data-home 2>/dev/null || true

su-exec node node custom-server.js &
ROUTER_PID=$!

i=0
while [ "$i" -lt 60 ]; do
    if nc -z 127.0.0.1 20128 2>/dev/null; then
        break
    fi
    i=$((i + 1))
    sleep 1
done

if ! kill -0 "$ROUTER_PID" 2>/dev/null; then
    echo "9Router failed to start"
    exit 1
fi

exec nginx -c /etc/nginx/nginx.conf
