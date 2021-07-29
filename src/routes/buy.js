const knex =
  process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging'
    ? require('knex')(require('../../knexfile.js').production)
    : require('knex')(require('../../knexfile.js').development)
const bsv = require('bsv')
const atfinder = require('atfinder')

const { SERVER_PAYMAIL, HOSTING_DOMAIN } = process.env

module.exports = {
  type: 'post',
  path: '/buy',
  knex,
  summary: 'Use this route to pay an invoice and actually buy the sorta-random bytes. You will receive back the bytes, one by one, in hexadecimal format. You need to pay with a valid SPV Envelope, which is kind of the whole point.',
  parameters: {
    reference: 'The reference number you received when you created the invoice.',
    rawTx: 'A Bitcoin transaction that contains the outputs specified by the invoice. If the transaction is not already broadcast, it will be sent by the server.',
    inputs: 'Provide SPV proofs for each of the inputs to the BSV transaction. See the SPV Envelopes standard for details.',
    mapiResponses: 'Provide an array of mAPI responses for the transaction.',
    proof: 'If the payment transaction is somehow already confirmed, just provide its merkle proof in TSC format, omitting the inputs and mapiResponses fields in accordance with the SPV Envelope specification.'
  },
  exampleResponse: {
    bytes: 'deadbeef201912345678',
    note: '... (have to actually buy bytes to see what it says :p)'
  },
  func: async (req, res) => {
    try {
      const {
        reference,
        rawTx,
        inputs,
        mapiResponses,
        proof
      } = req.body

      // Handle missing fields
      if (!reference) {
        return res.status(400).json({
          status: 'error',
          code: 'ERR_NO_REF',
          description:
          'Missing reference number. Please use the reference number from your invoice.'
        })
      }
      if (!rawTx) {
        return res.status(400).json({
          status: 'error',
          code: 'ERR_NO_TX',
          description:
          'Provide a signed Bitcoin transaction paying this invoice.'
        })
      }

      const [transaction] = await knex('transaction').where({
        reference
      }).select(
        'amount', 'txid', 'paid'
      )
      if (!transaction) {
        return res.status(400).json({
          status: 'error',
          code: 'ERR_BAD_REF',
          description: 'The reference number you provided cannot be found.'
        })
      }
      if (transaction.paid) {
        return res.status(400).json({
          status: 'error',
          code: 'ERR_ALREADY_PAID',
          description: `The reference number you have provided is attached to an invoice that was already paid by a transaction with TXID ${transaction.txid}`,
          txid: transaction.txid
        })
      }

      // Check that the transaction contains the reference number output
      const expectedScript = bsv
        .Script
        .buildSafeDataOut([reference])
        .toHex()
      let tx
      try {
        tx = new bsv.Transaction(rawTx)
      } catch (e) {
        return res.status(400).json({
          status: 'error',
          code: 'ERR_BAD_TX',
          description: 'Unable to parse this Bitcoin transaction!'
        })
      }
      if (!tx.outputs.some((outputToTest, vout) => {
        try {
          if (
            outputToTest.script.toHex() === expectedScript &&
              outputToTest.satoshis === 0
          ) {
            return true
          } else {
            return false
          }
        } catch (e) {
          return false
        }
      })) {
        return res.status(400).json({
          status: 'error',
          code: 'ERR_TX_REJECTED',
          description: 'One or more outputs did not match what was requested by the invoice.'
        })
      }

      // Submit the payment to the Paymail server
      let txid, errorMessage
      try {
        const env = {
          rawTx,
          reference,
          inputs,
          mapiResponses,
          proof,
          metadata: {
            note: `Payment from ${HOSTING_DOMAIN}, ${transaction.amount / 100} bytes purchased, ref. ${reference}`
          }
        }
        const sent = await atfinder.submitSPVTransaction(SERVER_PAYMAIL, env)
        txid = sent.txid
      } catch (e) {
        // Info and not error, a user messed up and not us.
        console.info(e)
        if (e.response && e.response.data && e.response.data.description) {
          errorMessage = `${e.response.data.code}: ${e.response.data.description}`
        } else {
          errorMessage = e.message
        }
      }

      if (!txid) {
        return res.status(400).json({
          status: 'error',
          code: 'ERR_TX_REJECTED',
          description: `This transaction was rejected: ${errorMessage || 'The transaction does not contain the required outputs.'}`
        })
      }

      // At this point, we know that the customer has paid.
      // We can provide them with the goods or services they have purchased.

      // The number of bytes is 100x smaller than the number of satoshis
      const bytes = require('crypto').randomBytes(transaction.amount / 100)

      // Update the transaction with the payment status and txid
      await knex('transaction').where({
        reference
      }).update({
        txid,
        paid: true,
        bytes
      })

      return res.status(200).json({
        bytes: bytes.toString('hex'),
        note: `Thanks for doing business with the byte shop! By the way... have you ever heard of require("cryoto").randomBytes(${transaction.amount / 100})?`
      })
    } catch (e) {
      res.status(500).json({
        status: 'error',
        code: 'ERR_INTERNAL',
        description: 'An internal error has occurred.'
      })
      console.error(e)
      return null
    }
  }
}
