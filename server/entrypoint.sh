#!/bin/sh
set -e

if [ -n "$ACCOUNT_USERNAME" ] && [ -n "$ACCOUNT_PASSWORD" ]; then
  node server/create-account.js "$ACCOUNT_USERNAME" "$ACCOUNT_PASSWORD" || true
fi

exec node server/server.js
