// set up env before requiring
process.env.SERVER_PAYMAIL = 'test@dev.test'

const createNewTransaction = require('../createNewTransaction')
const mockKnex = require('mock-knex')
const knex =
  (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging')
    ? require('knex')(require('../../../knexfile.js').production)
    : require('knex')(require('../../../knexfile.js').development)
const bsv = require('bsv')
const atfinder = require('atfinder')

jest.mock('atfinder')

const mockRes = {}
mockRes.status = jest.fn(() => mockRes)
mockRes.json = jest.fn(() => mockRes)
let queryTracker, validInput

describe('createNewTransaction', () => {
  beforeEach(() => {
    atfinder.requestOutputsForP2PTransaction.mockReturnValue({
      outputs: [{
        script: '001212',
        satoshis: 1337
      }],
      fee: {
        model: 'sat/kb',
        value: 500
      },
      reference: 'MOCK_REFNO'
    })
    jest.spyOn(console, 'error').mockImplementation(e => {
      throw e
    })
    mockKnex.mock(knex)
    queryTracker = require('mock-knex').getTracker()
    queryTracker.install()
    validInput = {
      amount: 1337,
      knex
    }
  })
  afterEach(() => {
    jest.clearAllMocks()
    queryTracker.uninstall()
    mockKnex.unmock(knex)
  })
  it('Calls requestOutputsForP2PTransaction', async () => {
    queryTracker.on('query', q => q.response([]))
    await createNewTransaction(validInput)
    expect(atfinder.requestOutputsForP2PTransaction)
      .toHaveBeenLastCalledWith('test@dev.test', 1337)
  })
  it('Inserts a new transaction', async () => {
    queryTracker.on('query', q => {
      expect(q.method).toEqual('insert')
      expect(q.sql).toEqual(
        'insert into `transaction` (`amount`, `paid`, `reference`) values (?, ?, ?)'
      )
      expect(q.bindings).toEqual([
        1337,
        false,
        'MOCK_REFNO'
      ])
      q.response([])
    })
    await createNewTransaction(validInput)
  })
  it('Returns the correct values', async () => {
    queryTracker.on('query', q => q.response([]))
    const returnValue = await createNewTransaction(validInput)
    expect(returnValue).toEqual({
      reference: 'MOCK_REFNO',
      outputs: [
        {
          outputScript: '001212',
          amount: 1337
        },
        {
          outputScript: bsv
            .Script
            .buildSafeDataOut([returnValue.reference])
            .toHex(),
          amount: 0
        }
      ],
      fee: {
        model: 'sat/kb',
        value: 500
      }
    })
  })
})
