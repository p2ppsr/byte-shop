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

// This allows you to remotely debug your server in the cloud
if (NODE_ENV !== 'development') {
  require('@google-cloud/debug-agent').start({
    serviceContext: { enableCanary: false }
  })
}

const app = express()
app.use(bodyparser.json())

// This allows the API to be used when CORS is enforced
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', '*')
  res.header('Access-Control-Allow-Methods', '*')
  res.header('Access-Control-Expose-Headers', '*')
  res.header('Access-Control-Allow-Private-Network', 'true')
  if ('OPTIONS' === req.method) {
    res.send(200)
  } else {
    next()
  }
})

// This is a simple API request logger
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

// This makes the documentation site available
app.use(express.static('public'))

// This avoids issues with pre-flight requests
app.options('*', (req, res) =>
  res.status(200).json({
    message: 'Send a POST request to see the results.'
  })
)

const addRoute = route => {
  // If we need middleware for a route, attach it
  if (route.middleware) {
    app[route.type](
      `${ROUTING_PREFIX}${route.path}`,
      route.middleware,
      route.func
    )
  } else {
    app[route.type](`${ROUTING_PREFIX}${route.path}`, route.func)
  }
}

// Cycle through UNSECURED pre-authrite routes first:
preAuthrite.filter(x => x.unsecured).forEach((route) => addRoute(route))

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

// Cycle through SECURED pre-Authrite routes after the HTTPS redirect
preAuthrite.filter(x => !x.unsecured).forEach((route) => addRoute(route))

// Authrite is enforced from here forward
app.use(authrite.middleware({
  serverPrivateKey: SERVER_PRIVATE_KEY,
  baseUrl: HOSTING_DOMAIN
}))

// This adds all the API routes
postAuthrite.filter(x => !x.unsecured).forEach((route) => addRoute(route))

// This is the 404 route
app.use((req, res) => {
  console.log('404', req.url)
  res.status(404).json({
    status: 'error',
    error: 'Route not found.'
  })
})

// This starts the API server listening for requests
app.listen(HTTP_PORT, () => {
  console.log('ByteShop listening on port', HTTP_PORT)
})
