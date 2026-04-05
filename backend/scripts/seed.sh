#!/usr/bin/env bash
# Load demo data into PostgreSQL (recommended local profile: local-postgres).
# Seeds multiple users across several weeks (base + -b/-c tiers, expanded RCDO); see seed.sql header.
# Requires: psql, migrations applied, database created.
#
# Env (optional): PGHOST PGPORT PGUSER PGDATABASE DB_PASSWORD
# Defaults match docker-compose.yml / application-local-postgres.yml: localhost:5432, db wctdb, user wct.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

export PGHOST="${PGHOST:-localhost}"
export PGPORT="${PGPORT:-5432}"
export PGUSER="${PGUSER:-wct}"
export PGDATABASE="${PGDATABASE:-wctdb}"
export PGPASSWORD="${DB_PASSWORD:-${PGPASSWORD:-}}"

if ! command -v psql >/dev/null 2>&1; then
  echo "error: psql not found. Install PostgreSQL client tools." >&2
  exit 1
fi

psql -v ON_ERROR_STOP=1 -f "$SCRIPT_DIR/seed.sql"
echo "Seed completed."
