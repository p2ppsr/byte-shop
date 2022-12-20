/* eslint-env jest */
const pay = require('../pay')
const mockKnex = require('mock-knex')
const bsv = require('babbage-bsv')
const atfinder = require('atfinder')

const { SERVER_PAYMAIL, HOSTING_DOMAIN } = process.env

jest.mock('atfinder')

const mockRes = {}
mockRes.status = jest.fn(() => mockRes)
mockRes.json = jest.fn(() => mockRes)
let queryTracker, validReq, validTx

describe('pay', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(e => {
      throw e
    })
    mockKnex.mock(pay.knex)
    queryTracker = require('mock-knex').getTracker()
    queryTracker.install()

    // We need to actually create a transaction that will work.
    // mocking the "bsv" library would be another option.
    const dataOutputScript = bsv
      .Script
      .buildSafeDataOut(['MOCK_REFNO']) // From the transaction
      .toHex()
    const bsvtx = new bsv.Transaction()
    bsvtx.addOutput(new bsv.Transaction.Output({
      script: dataOutputScript,
      satoshis: 0
    }))
    // No need to actually sign
    // This only works because we are mocking a successful transaction broadcast with atfinder. In reality, while this passes our validation, the miners would never accept this transaction and so no one could actually do something like this.
    const txhex = bsvtx.uncheckedSerialize()
    atfinder.submitSPVTransaction.mockReturnValue({ txid: 'MOCK_TXID' })

    validReq = {
      body: {
        rawTx: txhex,
        reference: 'MOCK_REFNO',
        inputs: 'MOCK_INPUTS',
        mapiResponses: 'MOCK_MAPI',
        proof: 'MOCK_PROOF'
      }
    }
    validTx = {
      amount: 133700,
      txid: null,
      paid: false
    }
  })
  afterEach(() => {
    jest.clearAllMocks()
    queryTracker.uninstall()
    mockKnex.unmock(pay.knex)
  })
  it('Returns error if reference is missing', async () => {
    delete validReq.body.reference
    await pay.func(validReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      status: 'error',
      code: 'ERR_NO_REF'
    }))
  })
  it('Returns error if rawTx is missing', async () => {
    delete validReq.body.rawTx
    await pay.func(validReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      status: 'error',
      code: 'ERR_NO_TX'
    }))
  })
  it('Queries for transactions with reference', async () => {
    queryTracker.on('query', (q, s) => {
      if (s === 1) {
        expect(q.method).toEqual('select')
        expect(q.sql).toEqual(
          'select `amount`, `txid`, `paid` from `transaction` where `reference` = ?'
        )
        expect(q.bindings).toEqual(['MOCK_REFNO'])
        q.response([validTx])
      } else {
        q.response([])
      }
    })
    await pay.func(validReq, mockRes)
  })
  it('Returns error if no transaction found', async () => {
    queryTracker.on('query', (q, s) => {
      if (s === 1) {
        q.response([]) // No results
      } else {
        q.response([])
      }
    })
    await pay.func(validReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      status: 'error',
      code: 'ERR_BAD_REF'
    }))
  })
  it('Returns error if transaction already paid', async () => {
    queryTracker.on('query', (q, s) => {
      if (s === 1) {
        q.response([{ ...validTx, paid: true, txid: 'MOCK_TXID' }])
      } else {
        q.response([])
      }
    })
    await pay.func(validReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      status: 'error',
      code: 'ERR_ALREADY_PAID',
      txid: 'MOCK_TXID'
    }))
  })
  it('Returns error if rawTx invalid', async () => {
    validReq.body.rawTx = 'foo is a bar'
    queryTracker.on('query', (q, s) => {
      if (s === 1) {
        q.response([validTx])
      } else {
        q.response([])
      }
    })
    await pay.func(validReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      status: 'error',
      code: 'ERR_BAD_TX'
    }))
  })
  it('Returns error if transaction has no data output', async () => {
    const bsvtx = new bsv.Transaction()
    validReq.body.rawTx = bsvtx.uncheckedSerialize()
    queryTracker.on('query', (q, s) => {
      if (s === 1) {
        q.response([validTx])
      } else {
        q.response([])
      }
    })
    await pay.func(validReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      status: 'error',
      code: 'ERR_TX_REJECTED'
    }))
  })
  it('Returns error if transaction has wrong data output script', async () => {
    const dataOutputScript = bsv
      .Script
      .buildSafeDataOut(['WRONG'])
      .toHex()
    const bsvtx = new bsv.Transaction()
    bsvtx.addOutput(new bsv.Transaction.Output({
      script: dataOutputScript,
      satoshis: 0
    }))
    validReq.body.rawTx = bsvtx.uncheckedSerialize()
    queryTracker.on('query', (q, s) => {
      if (s === 1) {
        q.response([validTx])
      } else {
        q.response([])
      }
    })
    await pay.func(validReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      status: 'error',
      code: 'ERR_TX_REJECTED'
    }))
  })
  it('Returns error if submitting to atfinder fails', async () => {
    atfinder.submitSPVTransaction.mockReturnValueOnce('no')
    queryTracker.on('query', (q, s) => {
      if (s === 1) {
        q.response([validTx])
      } else {
        q.response([])
      }
    })
    await pay.func(validReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      status: 'error',
      code: 'ERR_TX_REJECTED',
      description: 'This transaction was rejected: The transaction does not contain the required outputs.'
    }))
    // Also check the call to atfinder
    expect(atfinder.submitSPVTransaction).toHaveBeenLastCalledWith(
      SERVER_PAYMAIL,
      {
        rawTx: validReq.body.rawTx,
        inputs: 'MOCK_INPUTS',
        proof: 'MOCK_PROOF',
        mapiResponses: 'MOCK_MAPI',
        reference: 'MOCK_REFNO',
        metadata: {
          note: `Payment from ${HOSTING_DOMAIN}, 1337 bytes purchased, ref. MOCK_REFNO`
        }
      }
    )
  })
  it('Updates transaction with new TXID, bytes and paid', async () => {
    queryTracker.on('query', (q, s) => {
      if (s === 1) {
        q.response([validTx])
      } else {
        expect(q.method).toEqual('update')
        expect(q.sql).toEqual(
          'update `transaction` set `txid` = ?, `paid` = ?, `bytes` = ? where `reference` = ?'
        )
        expect(q.bindings).toEqual([
          expect.any(String),
          true,
          expect.any(Buffer),
          'MOCK_REFNO'
        ])
        q.response([])
      }
    })
    await pay.func(validReq, mockRes)
  })
  it('Returns bytes and note', async () => {
    queryTracker.on('query', (q, s) => {
      if (s === 1) {
        q.response([validTx])
      } else {
        q.response([])
      }
    })
    await pay.func(validReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      bytes: expect.any(String),
      note: expect.any(String)
    }))
  })
  it('Throws unknown errors', async () => {
    queryTracker.on('query', (q, s) => {
      throw new Error('Failed')
    })
    await expect(pay.func(validReq, mockRes)).rejects.toThrow()
  })
})
