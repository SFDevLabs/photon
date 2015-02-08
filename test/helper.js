
/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , async = require('async')
  , Article = mongoose.model('Album')
  , User = mongoose.model('User')

/**
 * Clear database
 *
 * @param {Function} done
 * @api public
 */

exports.clearDb = function (done) {
  async.parallel([
    function (cb) {
      User.collection.remove(cb)
    },
    function (cb) {
      Article.collection.remove(cb)
    }
  ], done)
}
