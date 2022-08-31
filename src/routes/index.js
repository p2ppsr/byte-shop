module.exports = {
  preAuthrite: [
    require('./migrate')
  ],
  postAuthrite: [
    require('./invoice'),
    require('./buy')
  ]
}
