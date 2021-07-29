require('dotenv').config()

module.exports = {
  production: {
    client: process.env.KNEX_DB_CLIENT,
    connection: process.env.KNEX_DB_CONNECTION
      ? JSON.parse(process.env.KNEX_DB_CONNECTION)
      : undefined,
    useNullAsDefault: true,
    migrations: {
      directory: './src/migrations'
    }
  },
  development: {
    client: 'sqlite3',
    connection: {
      filename: process.env.DATABASE_FILENAME || './data/database.sqlite'
    },
    useNullAsDefault: true,
    migrations: {
      directory: './src/migrations'
    }
  }
}
