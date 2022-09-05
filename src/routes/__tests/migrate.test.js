/* eslint-env jest */
const migrate = require('../migrate')

jest.mock('knex', () => () => ({
  migrate: {
    latest: jest.fn()
  }
}))

const res = {}
res.status = jest.fn(() => res)
res.json = jest.fn(() => res)

describe('migrate', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })
  it('Runs migrations when key is valid', async () => {
    await migrate.func({ body: { migratekey: process.env.MIGRATE_KEY } }, res)
    expect(migrate.knex.migrate.latest).toHaveBeenCalled()
    expect(res.status).toHaveBeenLastCalledWith(200)
    expect(res.json).toHaveBeenLastCalledWith({
      status: 'success'
    })
  })
  it('Returns error when migrate key is invalid', async () => {
    await migrate.func({
      body: {
        migratekey: `INVALID_${process.env.MIGRATE_KEY}`
      }
    }, res)
    expect(migrate.knex.migrate.latest).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenLastCalledWith(401)
    expect(res.json).toHaveBeenLastCalledWith(
      expect.objectContaining({
        status: 'error',
        code: 'ERR_UNAUTHORIZED'
      })
    )
  })
})
