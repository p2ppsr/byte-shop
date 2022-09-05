const createSignedRequest = require('./createSignedRequest')
const { CONFIG } = require('./defaults')

/**
 * Creates an invoice for a Byte Shop purchase.
 *
 * @param {Object} obj All parameters are given in an object.
 * @param {Object} obj.config config object, see config section.
 * @param {Number} obj.numberOfBytes The how many bytes to buy.
  *
 * @returns {Promise<Object>} The invoice object, containing `message` giving details, `identityKey` receipient's private key, `amount` (satoshis), `orderID`, for referencing this contract payment and passed to the `buy` function, and the `status`.
 */
module.exports = async ({ config = CONFIG, numberOfBytes } = {}) => {
  // Send a request to get the invoice
  const invoice = await createSignedRequest({
    config,
    path: '/invoice',
    body: {
      numberOfBytes
    }
  })
  // console.log('invoice:', invoice)
  if (invoice.status === 'error') {
    const e = new Error(invoice.description)
    e.code = invoice.code
    throw e
  }
  return invoice
}
