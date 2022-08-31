const AuthriteClient = require('./AuthriteClient')

module.exports = async ({ config, path, body }) => {
  console.log('createSignedRequest():config:', config)
  let result = await new AuthriteClient().request(
    `${config.serverURL}${path}`, {
      body,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }
  )
  result = JSON.parse(Buffer.from(result.body).toString('utf8'))
  if (typeof result === 'object' && result.status === 'error') {
    const e = new Error(result.description)
    Object
      .keys(result)
      .filter(x => x !== 'status' && x !== 'description')
      .forEach(x => { e[x] = result[x] })
    throw e
  }
  return result
}
