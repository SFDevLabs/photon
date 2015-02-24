
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var Imager = require('imager');
var config = require('../../config/config');

var imagerConfig = require(config.root + '/config/imager.js');
var utils = require('../../lib/utils');

var Schema = mongoose.Schema;

/**
 * Getters
 */

var getTags = function (tags) {
  return tags.join(',');
};

/**
 * Setters
 */

var setTags = function (tags) {
  return tags.split(',');
};

/**
 * Article Schema
 */

var AlbumSchema = new Schema({
  title: {type : String, default : '', trim : true},
  body: {type : String, default : '', trim : true},
  url  : {type : String, default : '', trim : true},
  user: {type : Schema.ObjectId, ref : 'User'},
  comments: [{
    body: { type : String, default : '' },
    user: { type : Schema.ObjectId, ref : 'User' },
    createdAt: { type : Date, default : Date.now }
  }],
  // media: [{
  //   cdnUri: String,
  //   cdnUriProxy:String,
  //   fileName: String,
  //   user: {type : Schema.ObjectId, ref : 'User'},
  //   deleted: {type : Date, default : null},
  //   createdAt: { type : Date, default : Date.now }
  // }],
  widgets:[{
    col: { type : Number, default : null },
    row: { type : Number, default : null },
    size_x: { type : Number, default : null },
    size_y: { type : Number, default : null },
    offset_x: { type : Number, default : null },
    offset_y: { type : Number, default : null },
    scale: { type : Number, default : null },
    caption: { type : Date, default : null },
    location: [{ type : Number, default : null }, { type : Number, default : null }],
    type: {type : String, default : '', trim : true},
    mediaIndex: { type : Number, default : null },
    createdAt: { type : Date, default : Date.now },
    cdnUri: String,
    cdnUriProxy:String,
    fileName: String,
    user: {type : Schema.ObjectId, ref : 'User'},
    deleted: {type : Date, default : null},
    createdAt: { type : Date, default : Date.now }
  }],
  createdAt  : {type : Date, default : Date.now}
});

/**
 * Validations
 */

AlbumSchema.path('title').required(true, 'Article title cannot be blank');


/**
 * Pre-add hook
 */

AlbumSchema.pre('save', function (next) {
  this.url=this.title.replace(" ","-");
  //this.save();
  next();
});

/**
 * Pre-remove hook
 */

AlbumSchema.pre('remove', function (next) {
  var imager = new Imager(imagerConfig, 'S3');
  var files = this.image.files;

  // if there are files associated with the item, remove from the cloud too
  imager.remove(files, function (err) {
    if (err) return next(err);
  }, 'article');

  next();
});

/**
 * Pre-save hook
 */

// AlbumSchema.pre('save', function (next) {
//   This is where me make a custom url from the title!
//   this.url=this.title;
//   next();
// });

/**
 * Methods
 */

AlbumSchema.methods = {

  /**
   * Save article and upload image
   *
   * @param {Object} images
   * @param {Function} cb
   * @api private
   */
  uploadAndSave: function (images, userId, cb) {

    var imager = new Imager(imagerConfig, 'S3');
    var self = this;
    var type = "image"

    this.validate(function (err) {
      if (err) return cb(err);
      imager.upload(images, function (err, cdnUri, files) {
        if (err) return cb(err);
        if (files.length) {
          files.forEach(function(val){
            console.log(cdnUri.replace(/^http:\/\/$/,''))
            cdnUri = cdnUri.replace(/\bhttp:\/\//gi,'')
            // var index = self.media.push({ 
            //     cdnUri : cdnUri
            //   , cdnUriProxy : config.cdnProxy[cdnUri]
            //   , file : val
            //   , user:userId
            //   , type:type
            // });
            self.widgets.push({
              col: 1,
              row: 1,
              size_x: 1,
              size_y: 1,
              cdnUri : cdnUri,
              fileName : val,
              user:userId,
              type:type,
              cdnUriProxy : config.cdnProxy[cdnUri],
            });
          });
          self.save(cb);
        }//end of if statmet
        
      }, 'article');
    });
  },

  /**
   * Add comment
   *
   * @param {User} user
   * @param {Object} comment
   * @param {Function} cb
   * @api private
   */

  addComment: function (user, comment, cb) {
    var notify = require('../mailer');

    this.comments.push({
      body: comment.body,
      user: user._id
    });

    if (!this.user.email) this.user.email = 'email@product.com';
    notify.comment({
      article: this,
      currentUser: user,
      comment: comment.body
    });

    this.save(cb);
  },

  /**
   * Remove comment
   *
   * @param {commentId} String
   * @param {Function} cb
   * @api private
   */

  removeComment: function (commentId, cb) {
    var index = utils.indexof(this.comments, { id: commentId });
    if (~index) this.comments.splice(index, 1);
    else return cb('not found');
    this.save(cb);
  }
}

/**
 * Statics
 */

AlbumSchema.statics = {

  /**
   * Find article by id
   *
   * @param {ObjectId} id
   * @param {Function} cb
   * @api private
   */

  load: function (id, cb) {
    this.findOne({ url : id })
      .populate('user', 'name email username')
      .populate('comments.user')
      .exec(cb);
  },

  /**
   * List articles
   *
   * @param {Object} options
   * @param {Function} cb
   * @api private
   */

  list: function (options, cb) {
    var criteria = options.criteria || {}

    this.find(criteria)
      .populate('user', 'name username')
      .sort({'createdAt': -1}) // sort by date
      .limit(options.perPage)
      .skip(options.perPage * options.page)
      .exec(cb);
  }
}

mongoose.model('Album', AlbumSchema);
