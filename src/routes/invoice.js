const crypto = require('crypto')
const bsv = require('babbage-bsv')
const {
  SERVER_PRIVATE_KEY,
  NODE_ENV
} = process.env
const knex =
  NODE_ENV === 'production' || NODE_ENV === 'staging'
    ? require('knex')(require('../../knexfile.js').production)
    : require('knex')(require('../../knexfile.js').development)

module.exports = {
  type: 'post',
  path: '/invoice',
  knex,
  summary: 'Use this route to create an invoice for the purchase of some bytes. The server will respond with a reference number and some Bitcoin transaction output scripts, which you should include in a transaction that pays the invoice.',
  parameters: {
    numberOfBytes: 'The number of random bytes to order. These are toilet paper, so that means a minimum of ten per customer. 100 satoshis each byte.',
    cool: 'A boolean indicating whether you request cool bytes. If you request cool bytes, you must also present an Authrite Cool Person Certificate'
  },
  exampleResponse: {
    status: 'success',
    identityKey: 'sdjlasldfj',
    message: 'Use /pay to submit the payment.',
    amount: 1337,
    orderID: 'asdfsdfsd=',
    cool: 'Boolean indicating whether cool bytes were invoiced'
  },
  errors: [
    'ERR_NO_BYTES',
    'ERR_INVALID_BYTES',
    'ERR_INTERNAL_PROCESSING_INVOICE'
  ],
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


      // If this person is requesting cool bytes, they must have a cool person 
      // certificate.
      let coolBytes = false
      if (req.body.cool === true) {
        // A function to reject the request if the certificate is invalid
        const invalidCert = () => res.status(400).json({
          status: 'error',
          code: 'ERR_NOT_COOL_ENOUGH',
          description: 'You require a Cool Person Certificate from CoolCert to buy Cool Bytes from the Byte Shop. Please obtain one at the following URL before continuing. https://coolcert-ui.babbage.systems',
          coolcertURL: 'https://coolcert-ui.babbage.systems'
        })

        // Because only one certificate type and certifier were requested in the requestedCertificateSet, we can assume that at most one certificate was provided with this request. We check its validity here.
        if (req.authrite.certificates.length !== 1) {
          return invalidCert()
        }

        let cert = req.authrite.certificates[0]
        // The certificate must be a valid certificate with the expected 
        // certifier and type
        if (
          cert.type !== 'AGfk/WrT1eBDXpz3mcw386Zww2HmqcIn3uY6x4Af1eo=' ||
          cert.certifier !== '0220529dc803041a83f4357864a09c717daa24397cf2f3fc3a5745ae08d30924fd'
        ) {
          return invalidCert()
        }

        // The "cool" field must be presented, decrypted and valid
        if (
          !cert.decryptedFields.cool ||
          cert.decryptedFields.cool !== 'true'
        ) {
          return invalidCert()
        }

        coolBytes = true
      }

      const amount = numberOfBytes * 100

      // Create a new transaction record
      const orderID = crypto.randomBytes(32).toString('base64')
      await knex('transaction').insert({
        orderID,
        amount,
        identityKey: req.authrite.identityKey,
        paid: false,
        cool: coolBytes,
        created_at: new Date(),
        updated_at: new Date()
      })

      // Return the required info to the sender
      return res.status(200).json({
        status: 'success',
        message: 'Use /pay to submit the payment.',
        identityKey: bsv.PrivateKey.fromHex(SERVER_PRIVATE_KEY).publicKey.toString(),
        amount,
        orderID,
        cool: coolBytes
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
