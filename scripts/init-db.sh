#!/usr/bin/env bash
set -e

DB_NAME=${1:-setoran_hafalan}
DB_USER=${2:-setoran_user}
DB_PASS=${3:-password_aman}
SCHEMA_SOURCE="$(pwd)/src/lib/schema.sql"
SCHEMA_TMP="/tmp/schema.sql"

sudo -u postgres psql <<EOSQL
CREATE DATABASE ${DB_NAME};
CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
\q
EOSQL

cp "${SCHEMA_SOURCE}" "${SCHEMA_TMP}"

echo "Database ${DB_NAME} and user ${DB_USER} created."
echo "Schema copied to ${SCHEMA_TMP}."
echo "Now run the schema file with:"
echo "sudo -u postgres bash -c 'cd /tmp && psql -d ${DB_NAME} -f ${SCHEMA_TMP}'"
