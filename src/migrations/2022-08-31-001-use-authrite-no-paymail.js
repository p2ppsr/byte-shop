exports.up = async knex => {
    await knex.schema.table('transaction', table => {
        table.string('orderId')
        table.string('identityKey')
        table.integer('numberOfBytes')
    })
}

exports.down = async knex => {
    await knex.schema.table('transaction', table => {
        table.dropColumn('orderId')
        table.dropColumn('identityKey')
        table.dropColumn('numberOfBytes')
    })
}