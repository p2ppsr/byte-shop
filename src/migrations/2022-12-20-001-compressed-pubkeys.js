const bsv = require('babbage-bsv')

exports.up = async knex => {
    const transactions = await knex('transactions')
    for (const { transactionId, identityKey } of transactions) {
        await knex('transactions').where({ transactionId })
            .update({ 'identityKey': new bsv.PublicKey(identityKey).toCompressed().toString() })
    }
}

exports.down = async knex => {
    const transactions = await knex('transactions')
    for (const { transactionId, identityKey } of transactions) {
        await knex('transactions').where({ transactionId })
            .update({ 'identityKey': new bsv.PublicKey(identityKey).toUnCompressed().toString() })
    }
}