const bsv = require('bsv')
const atfinder = require('atfinder')

const { SERVER_PAYMAIL } = process.env

module.exports = async ({ amount, knex }) => {
  const {
    outputs,
    reference,
    fee
  } = await atfinder.requestOutputsForP2PTransaction(SERVER_PAYMAIL, amount)
  await knex('transaction').insert({
    reference,
    amount,
    paid: false
  })

  return {
    fee,
    reference,
    outputs: [
      ...outputs.map(x => ({
        outputScript: x.script,
        amount: x.satoshis
      })),
      {
        outputScript: bsv
          .Script
          .buildSafeDataOut([reference])
          .toHex(),
        amount: 0
      }
    ]
  }
}
