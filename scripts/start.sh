#!/bin/bash

if [ $NODE_ENV = 'production' ] || [ $NODE_ENV = 'staging' ]
then
  echo "$GCP_STORAGE_CREDS" > /app/storage-creds.json
  npm run build
  node src/index.js
  exit
fi

until nc -z -v -w30 byte-shop-mysql 3115
do
  echo "Waiting for database connection..."
  sleep 1
done
knex migrate:latest
npm run dev