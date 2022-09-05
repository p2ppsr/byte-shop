exports.up = async knex => {
  await knex.schema.table('transaction', table => {
    table.string('orderID')
    table.string('identityKey')
  })
}

exports.down = async knex => {
  await knex.schema.table('transaction', table => {
    table.dropColumn('orderID')
    table.dropColumn('identityKey')
  })
}
