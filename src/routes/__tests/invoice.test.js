/* eslint-env jest */
const invoice = require('../invoice')
const createNewTransaction = require('../../utils/createNewTransaction')

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
      reference: 'MOCK_REFNO',
      fee: {
        model: 'sat/kb',
        value: 500
      }
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
  it('Returns error if numberOfBytes not a positive integer', async () => {
    validReq.body.numberOfBytes = -1337
    await invoice.func(validReq, mockRes)
    expect(mockRes.status).toHaveBeenLastCalledWith(400)
    expect(mockRes.json).toHaveBeenLastCalledWith(expect.objectContaining({
      status: 'error',
      code: 'ERR_INVALID_BYTES'
    }))
    validReq.body.numberOfBytes = 3.301
    await invoice.func(validReq, mockRes)
    expect(mockRes.status).toHaveBeenLastCalledWith(400)
    expect(mockRes.json).toHaveBeenLastCalledWith(expect.objectContaining({
      status: 'error',
      code: 'ERR_INVALID_BYTES'
    }))
    validReq.body.numberOfBytes = 'two'
    await invoice.func(validReq, mockRes)
    expect(mockRes.status).toHaveBeenLastCalledWith(400)
    expect(mockRes.json).toHaveBeenLastCalledWith(expect.objectContaining({
      status: 'error',
      code: 'ERR_INVALID_BYTES'
    }))
  })
  it('Returns error if numberOfBytes less than 10', async () => {
    validReq.body.numberOfBytes = 9
    await invoice.func(validReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      status: 'error',
      code: 'ERR_INVALID_BYTES'
    }))
  })
  it('Returns error if numberOfBytes more than 65000', async () => {
    validReq.body.numberOfBytes = 65001
    await invoice.func(validReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      status: 'error',
      code: 'ERR_INVALID_BYTES'
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
      ],
      fee: {
        model: 'sat/kb',
        value: 500
      }
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
