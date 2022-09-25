exports.up = async knex => {
  await knex.schema.table('transaction', table => {
    table.boolean('cool')
  })
}

exports.down = async knex => {
  await knex.schema.table('transaction', table => {
    table.dropColumn('cool')
  })
}
