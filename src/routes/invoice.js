const crypto = require('crypto')
const bsv = require('bsv')

const {
  SERVER_PRIVATE_KEY,
  HOSTING_DOMAIN,
  ROUTING_PREFIX,
  NODE_ENV
} = process.env

const knex =
  process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging'
    ? require('knex')(require('../../knexfile.js').production)
    : require('knex')(require('../../knexfile.js').development)

//const createNewTransaction = require('../utils/createNewTransaction')

module.exports = {
  type: 'post',
  path: '/invoice',
  knex,
  summary: 'Use this route to create an invoice for the purchase of some bytes. The server will respond with a reference number and some Bitcoin transaction output scripts, which you should include in a transaction that pays the invoice.',
  parameters: {
    numberOfBytes: 'The number of random bytes to order. These are toilet paper, so that means a minimum of ten per customer. 100 satoshis each byte.'
  },
  exampleResponse: {
    reference: 'fjsodf+s/4Ssje==',
    outputs: [
      {
        amount: 1209,
        outputScript: '76...88ac'
      },
      {
        amount: 0,
        outputScript: '006a...'
      }
    ]
  },
  func: async (req, res) => {
    try {
      const { numberOfBytes } = req.body

      // Handle missing bytes
      if (typeof numberOfBytes === 'undefined') {
        return res.status(400).json({
          status: 'error',
          code: 'ERR_NO_BYTES',
          description:
            'I need you to tell me how many bytes you want, sir.'
        })
      }

      // Number of bytes must be a positive integer
      if (!Number.isInteger(Number(numberOfBytes)) || numberOfBytes <= 0) {
        return res.status(400).json({
          status: 'error',
          code: 'ERR_INVALID_BYTES',
          description:
            'The number of bytes must be a positive integer.'
        })
      }

      // Number of bytes must be 10 or more
      if (numberOfBytes < 10) {
        return res.status(400).json({
          status: 'error',
          code: 'ERR_INVALID_BYTES',
          description:
            'The number of bytes must be 10 or more. These are toilet paper, and it\'s March of 2020. You need to buy all the bytes before they are gone.'
        })
      }

      // Number of bytes must not be more than 65000
      if (numberOfBytes > 65000) {
        return res.status(400).json({
          status: 'error',
          code: 'ERR_INVALID_BYTES',
          description:
            'I know you like bytes. But do you *really* need that many? We only have 65,000 left.'
        })
      }

      // Create a new transaction, the amount is 100 * the number of bytes
      const orderId = crypto.randomBytes(32).toString('base64')
      const amount = numberOfBytes * 100
      const when = new Date()
      await knex('transaction').insert({
        numberOfBytes,
        amount,
        orderId,
        paid: false,
        identityKey: req.authrite.identityKey,
        created_at: when,
        updated_at: when
      })

      // Return the required info to the sender
      return res.status(200).json({
        status: 'success',
        message: 'Use /buy to submit the payment.',
        identityKey: bsv.PrivateKey.fromHex(SERVER_PRIVATE_KEY).publicKey.toString(),
        amount,
        orderId,
        numberOfBytes
      })
    } catch (e) {
      console.error(e)
      return res.status(500).json({
        status: 'error',
        code: 'ERR_INTERNAL_PROCESSING_INVOICE',
        description: 'An internal error has occurred while processing invoice.'
      })
    }
  }
}
