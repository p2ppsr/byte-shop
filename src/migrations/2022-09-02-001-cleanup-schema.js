exports.up = async knex => {
    // Reorder the columns for convenience.
    // Remove the unused "reference" column.
    await knex.schema.dropTable('transaction')

    await knex.schema.createTable('transaction', table => {
        table.increments('transactionId')
        table.integer('numberOfBytes')
        table.bigInteger('amount')
        table.string('orderId')
        table.boolean('paid')
        table.string('txid')
        table.binary('bytes')
        table.timestamps()
        table.string('identityKey')
    })
}

exports.down = async knex => {
    await knex.schema.table('transaction', table => {
        table.string('reference', 64)
    })
}
