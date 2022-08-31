const bsv = require('bsv')
const { createAction, getPublicKey } = require('@babbage/sdk')
const createSignedRequest = require('./createSignedRequest')
const { CONFIG } = require('./defaults')

/**
 * Submit payment for an invoice to buy some bytes from the byte-shop.
 *
 * @param {Object} obj All parameters are given in an object.
 * @param {Object} obj.config config object, see config section.
 * @param {String} obj.description The description to be used for the payment.
 * @param {String} obj.orderID The hosting invoice reference.
 * @param {String} obj.recipientPublicKey Public key of the host receiving the payment.
 * @param {Number} obj.amount The number of satoshis being paid.
 *
 * @returns {Promise<Object>} The pay object, contains the `bytes` purchased and the `status`'.
 */
module.exports = async ({
  config = CONFIG,
  description,
  orderID,
  recipientPublicKey,
  amount
} = {}) => {
  // Pay the host for some bytes, this return the txid.
  const derivationPrefix = require('crypto').randomBytes(10).toString('base64')
  const derivationSuffix = require('crypto').randomBytes(10).toString('base64')

  // Derive the public key used for creating the output script
  const derivedPublicKey = await getPublicKey({
    protocolID: [2, '3241645161d8'],
    keyID: `${derivationPrefix} ${derivationSuffix}`,
    counterparty: recipientPublicKey
  })

  // Create an output script that can only be unlocked with the corresponding derived private key
  const script = new bsv.Script(
    bsv.Script.fromAddress(bsv.Address.fromPublicKey(
      bsv.PublicKey.fromString(derivedPublicKey)
    ))
  ).toHex()
  const payment = await createAction({
    description,
    outputs: [{
      script,
      satoshis: amount
    }]
  })
  if (payment.status === 'error') {
    const e = new Error(payment.description)
    e.code = payment.code
    throw e
  }
  // console.log('payment:', payment)
  const buy = await createSignedRequest({
    config,
    path: '/buy',
    body: {
      orderID,
      transaction: {
        ...payment,
        outputs: [{
          vout: 0,
          satoshis: amount,
          derivationPrefix,
          derivationSuffix
        }]
      },
      description
    }
  })
  // console.log('buy:', buy)
  if (buy.status === 'error') {
    const e = new Error(buy.description)
    e.code = buy.code
    throw e
  }
  return buy
}
