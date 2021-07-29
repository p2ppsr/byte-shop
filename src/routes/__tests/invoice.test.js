const invoice = require('../invoice')
const createNewTransaction = require('../../utils/createNewTransaction')

const {
  HOSTING_DOMAIN,
  ROUTING_PREFIX
} = process.env

jest.mock('../../utils/createNewTransaction')

const mockRes = {}
mockRes.status = jest.fn(() => mockRes)
mockRes.json = jest.fn(() => mockRes)
let validReq

describe('invoice', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(e => {
      throw e
    })
    createNewTransaction.mockReturnValue({
      outputs: [
        { amount: 2250, outputScript: 'MOCK_OS_1' },
        { amount: 750, outputScript: 'MOCK_OS_2' }
      ],
      reference: 'MOCK_REFNO'
    })
    validReq = {
      body: {
        numberOfBytes: 1337
      }
    }
  })
  afterEach(() => {
    jest.clearAllMocks()
  })
  it('Returns error if numberOfBytes missing', async () => {
    delete validReq.body.numberOfBytes
    await invoice.func(validReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      status: 'error',
      code: 'ERR_NO_BYTES'
    }))
  })
  it('Calls createNewTransaction with correct parameters', async () => {
    await invoice.func(validReq, mockRes)
    expect(createNewTransaction).toHaveBeenCalledWith({
      knex: invoice.knex,
      amount: 133700
    })
  })
  it('Returns successful response', async () => {
    await invoice.func(validReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith({
      reference: 'MOCK_REFNO',
      outputs: [
        { amount: 2250, outputScript: 'MOCK_OS_1' },
        { amount: 750, outputScript: 'MOCK_OS_2' }
      ]
    })
  })
  it('Throws unknown errors', async () => {
    createNewTransaction.mockImplementation(() => {
      throw new Error('Failed')
    })
    await expect(invoice.func(validReq, mockRes)).rejects.toThrow(
      new Error('Failed')
    )
  })
})
