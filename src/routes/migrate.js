const knex =
  (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging')
    ? require('knex')(require('../../knexfile.js').production)
    : require('knex')(require('../../knexfile.js').development)

module.exports = {
  type: 'post',
  path: '/migrate',
  knex,
  hidden: true,
  func: async (req, res) => {
    const {
      MIGRATE_KEY
    } = process.env
    if (
      typeof MIGRATE_KEY === 'string' &&
      req.body.migrateKey === MIGRATE_KEY
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
