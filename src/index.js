require('dotenv').config()
const express = require('express')
const bodyparser = require('body-parser')
const prettyjson = require('prettyjson')
const routes = require('./routes')

// This allows you to remotely debug your server in the cloud
if (process.env.NODE_ENV !== 'development') {
  require('@google-cloud/debug-agent').start({
    serviceContext: { enableCanary: false }
  })
}

const HTTP_PORT = process.env.PORT || process.env.HTTP_PORT || 8080
const ROUTING_PREFIX = process.env.ROUTING_PREFIX || ''

const app = express()
app.use(bodyparser.json())

// This ensures that HTTPS is used unless you are in development mode
app.use((req, res, next) => {
  if (
    !req.secure &&
    req.get('x-forwarded-proto') !== 'https' &&
    process.env.NODE_ENV !== 'development'
  ) {
    return res.redirect('https://' + req.get('host') + req.url)
  }
  next()
})

// This allows the API to be used when CORS is enforced
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  )
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS, POST')
  next()
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

// This adds all the API routes
routes.forEach((route) => {
  app[route.type](`${ROUTING_PREFIX}${route.path}`, route.func)
})

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
