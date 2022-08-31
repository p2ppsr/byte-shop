const { Authrite } = require('authrite-js')
// Singleton class for managing a single AuthriteClient instance
class AuthriteClient {
  constructor () {
    if (!AuthriteClient.instance) {
      AuthriteClient.instance = new Authrite()
    }
    return AuthriteClient.instance
  }
}

module.exports = AuthriteClient
