exports.up = async knex => {
  await knex.schema.createTable('transaction', table => {
    table.increments('transactionId')
    table.timestamps()
    table.string('reference', 64)
    table.bigInteger('amount')
    table.string('txid')
    table.boolean('paid')
    table.binary('bytes')
  })
}

exports.down = async knex => {
  await knex.schema.dropTable('transaction')
}
