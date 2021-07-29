#!/bin/bash

# Create .env file
echo "Generating .env file..."
echo "NODE_ENV=$NODE_ENV" > .env
echo "ROUTING_PREFIX=$ROUTING_PREFIX" >> .env
echo "HOSTING_DOMAIN=$HOSTING_DOMAIN" >> .env
echo "KNEX_DB_CONNECTION=$KNEX_DB_CONNECTION" >> .env
echo "KNEX_DB_CLIENT=$KNEX_DB_CLIENT" >> .env
echo "MIGRATE_KEY=$MIGRATE_KEY" >> .env
echo "GCP_PROJECT_ID=$GCP_PROJECT_ID" >> .env
echo "SERVER_PAYMAIL=$SERVER_PAYMAIL" >> .env

# Create deployment file with needed variables
if [ $NODE_ENV = "production" ]; then
  echo "Generating production GAE descriptor..."
  echo "runtime: nodejs14" > app.production.yaml
  echo "service: default" >> app.production.yaml
else
  echo "Generating staging GAE descriptor..."
  echo "runtime: nodejs14" > app.staging.yaml
  echo "service: staging" >> app.staging.yaml
fi
