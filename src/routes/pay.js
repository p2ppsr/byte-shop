const { Ninja } = require('ninja-base')
const {
  DOJO_URL,
  SERVER_PRIVATE_KEY,
  NODE_ENV
} = process.env
const knex =
  NODE_ENV === 'production' || NODE_ENV === 'staging'
    ? require('knex')(require('../../knexfile.js').production)
    : require('knex')(require('../../knexfile.js').development)

module.exports = {
  type: 'post',
  path: '/pay',
  knex,
  summary: 'Use this route to pay an invoice and actually buy the sorta-random bytes. You will receive back the bytes, one by one, in hexadecimal format. You need to pay with a valid SPV Envelope, which is kind of the whole point.',
  parameters: {
    orderID: 'xyz',
    transaction: 'transaction envelope (rawTx, mapiResponses, inputs, proof), with additional outputs array containing key derivation information',
    'transaction.outputs': 'An array of outputs descriptors, each including vout, satoshis, derivationPrefix, and derivationSuffix',
    description: 'Transaction description'
  },
  exampleResponse: {
    status: 'success',
    bytes: 'deadbeef201912345678',
    note: '... (have to actually buy bytes to see what it says :p)'
  },
  errors: [
    'ERR_TRANSACTION_NOT_FOUND',
    'ERR_ALREADY_PAID',
    'ERR_PAYMENT_INVALID',
    'ERR_INTERNAL_PAYMENT_PROCESSING'
  ],
  func: async (req, res) => {
    try {
      // Find valid request transaction
      const [transaction] = await knex('transaction').where({
        identityKey: req.authrite.identityKey,
        orderID: req.body.orderID
      })

      if (!transaction) {
        return res.status(400).json({
          status: 'error',
          code: 'ERR_TRANSACTION_NOT_FOUND',
          description: 'A transaction for the specified request was not found!'
        })
      }

      if (transaction.paid) {
        return res.status(400).json({
          status: 'error',
          code: 'ERR_ALREADY_PAID',
          description: `The order id you have provided is attached to an invoice that was already paid and is for Order Id ${transaction.orderID}`,
          orderID: transaction.orderID
        })
      }
      req.body.transaction.outputs = req.body.transaction.outputs.map(x => ({
        ...x,
        senderIdentityKey: req.authrite.identityKey
      }))
      const ninja = new Ninja({
        privateKey: SERVER_PRIVATE_KEY,
        config: {
          dojoURL: DOJO_URL
        }
      })

      // Submit and verify the payment
      let processedTransaction
      try {
        processedTransaction = await ninja.submitDirectTransaction({
          protocol: '3241645161d8',
          transaction: req.body.transaction,
          senderIdentityKey: req.authrite.identityKey,
          note: req.body.description,
          amount: transaction.amount
        })
      } catch (e) { // Propagate processing errors to the client
        if (!e.code) throw e
        return res.status(400).json({
          status: 'error',
          code: e.code,
          description: e.message,
          outputIndex: e.outputIndex
        })
      }
      if (!processedTransaction) {
        return res.status(400).json({
          status: 'error',
          code: 'ERR_PAYMENT_INVALID',
          description: 'Could not validate payment!'
        })
      }

      // Update transaction
      await knex('transaction').where({
        identityKey: req.authrite.identityKey,
        orderID: req.body.orderID,
        paid: false
      }).update({
        reference: processedTransaction.reference,
        paid: true,
        updated_at: new Date()
      })

      // At this point, we know that the customer has paid.
      // We can provide them with the bytes they have purchased.

      // The number of bytes is 100x smaller than the number of satoshis
      let bytes = require('crypto')
        .randomBytes(transaction.amount / 100)
        .toString('hex')
      
      // For cool bytes, prefix with 1337
      if (transaction.cool) {
        bytes = '1337' + bytes
      }
      
      await knex('transaction').where({
        identityKey: req.authrite.identityKey,
        orderID: req.body.orderID,
        paid: true
      }).update({
        bytes,
        updated_at: new Date()
      })
      return res.status(200).json({
        status: 'success',
        bytes,
        note: `Thanks for doing business with the byte shop! By the way... have you ever heard of require("crypto").randomBytes(${transaction.amount / 100})?`
      })
    } catch (e) {
      console.error(e)
      if (global.Bugsnag) global.Bugsnag.notify(e)
      res.status(500).json({
        status: 'error',
        code: 'ERR_INTERNAL_PAYMENT_PROCESSING',
        description: 'An internal error has occurred.'
      })
    }
  }
}
