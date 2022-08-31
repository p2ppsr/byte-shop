const knex =
  (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging')
    ? require('knex')(require('../../knexfile.js').production)
    : require('knex')(require('../../knexfile.js').development)
const {
  MIGRATE_KEY
} = process.env

module.exports = {
  type: 'post',
  path: '/migrate',
  knex,
  summary: 'This is an administrative endpoint used by the server administrator to run any new database migrations and bring the database schema up-to-date.',
  parameters: {
    migratekey: 'The database migration key that was configured by the server administrator.'
  },
  exampleResponse: {
    status: 'success'
  },
  errors: [
    'ERR_UNAUTHORIZED'
  ],
  func: async (req, res) => {
    // req.body = { migratekey: 'my-great-key'}
    if (
      typeof MIGRATE_KEY === 'string' &&
      MIGRATE_KEY.length > 10 &&
      req.body.migratekey === MIGRATE_KEY
    ) {
      const result = await knex.migrate.latest()
      res.status(200).json({
        status: 'success',
        result
      })
    } else {
      res.status(401).json({
        status: 'error',
        code: 'ERR_UNAUTHORIZED',
        description: 'Migrate key is invalid'
      })
    }
  }
}
