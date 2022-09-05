module.exports = {
  preAuthrite: [
    require('./migrate')
  ],
  postAuthrite: [
    require('./pay'),
    require('./invoice')
  ]
}
