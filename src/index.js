require('dotenv').config()
const express = require('express')
const bodyparser = require('body-parser')
const prettyjson = require('prettyjson')
const { preAuthrite, postAuthrite } = require('./routes')
const authrite = require('authrite-express')
const {
  NODE_ENV,
  PORT,
  SERVER_PRIVATE_KEY,
  HOSTING_DOMAIN
} = process.env
const HTTP_PORT = PORT || process.env.HTTP_PORT || 8080
const ROUTING_PREFIX = process.env.ROUTING_PREFIX || ''
const app = express()
app.use(bodyparser.json())

// This ensures that HTTPS is used unless you are in development mode
app.use((req, res, next) => {
  if (
    !req.secure &&
    req.get('x-forwarded-proto') !== 'https' &&
    NODE_ENV !== 'development'
  ) {
    return res.redirect('https://' + req.get('host') + req.url)
  }
  next()
})

// This allows the API to be used when CORS is enforced
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', '*')
  res.header('Access-Control-Allow-Methods', '*')
  res.header('Access-Control-Expose-Headers', '*')
  res.header('Access-Control-Allow-Private-Network', 'true')
  if (req.method === 'OPTIONS') {
    res.sendStatus(200)
  } else {
    next()
  }
})

// logger
app.use((req, res, next) => {
  console.log('[' + req.method + '] <- ' + req._parsedUrl.pathname)
  const logObject = { ...req.body }
  console.log(prettyjson.render(logObject, { keysColor: 'blue' }))
  res.nologJson = res.json
  res.json = json => {
    res.nologJson(json)
    console.log('[' + req.method + '] -> ' + req._parsedUrl.pathname)
    console.log(prettyjson.render(json, { keysColor: 'green' }))
  }
  next()
})

app.use(express.static('public'))

// Unsecured pre-Authrite routes are added first

// Cycle through pre-authrite routes
preAuthrite.forEach((route) => {
  app[route.type](`${ROUTING_PREFIX}${route.path}`, route.func)
})

// Authrite is enforced from here forward
app.use(authrite.middleware({
  serverPrivateKey: SERVER_PRIVATE_KEY,
  baseUrl: HOSTING_DOMAIN,
  // This allows you to request certificates from clients
  requestedCertificates: {

    // Specify the types of certificates to request...
    // Here, we are requesting a "Cool Person Certificate"
    types: {
      // Provide an arra of fields the client should reveal for each type
      // of certificate which you request
      'AGfk/WrT1eBDXpz3mcw386Zww2HmqcIn3uY6x4Af1eo=': ['cool']
    },
    // Provide a list of certifiers you trust. Here, we are trusting
    // CoolCert, the CA that issues Cool Person Certificates.
    certifiers: ['0247431387e513406817e5e8de00901f8572759012f5ed89b33857295bcc2651f8']
  }
}))

// Post-Authrite routes are added
postAuthrite.forEach((route) => {
  app[route.type](`${ROUTING_PREFIX}${route.path}`, route.func)
})

// route not found error returned
app.use((req, res) => {
  console.log('404', req.url)
  res.status(404).json({
    status: 'error',
    code: 'ERR_ROUTE_NOT_FOUND',
    description: 'Route not found.'
  })
})

// This starts the API server listening for requests
app.listen(HTTP_PORT, () => {
  console.log('Byte-Shop listening on port', HTTP_PORT)
})
