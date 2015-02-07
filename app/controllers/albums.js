
/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
var Album = mongoose.model('Album')
var utils = require('../../lib/utils')
var extend = require('util')._extend

/**
 * Load
 */

exports.load = function (req, res, next, id){
  var User = mongoose.model('User');

  Album.load(id, function (err, album) {
    console.log(album, err)
    if (err) return next(err);
    if (!album) return next(new Error('not found'));
    req.album = album;
    next();
  });
};

/**
 * List
 */

exports.index = function (req, res){
  var page = (req.param('page') > 0 ? req.param('page') : 1) - 1;
  var perPage = 30;
  var options = {
    perPage: perPage,
    page: page
  };

  Album.list(options, function (err, articles) {
    if (err) return res.render('500');
    Album.count().exec(function (err, count) {
     // res.send(articles)
      res.render('albums/index', {
        title: 'Articles',
        articles: articles,
        page: page + 1,
        pages: Math.ceil(count / perPage)
      });
    });
  });
};

/**
 * New article
 */

exports.new = function (req, res){
  res.render('albums/new', {
    title: 'New Article',
    article: new Album({})
  });
};

/**
 * Create an article
 * Upload an image
 */

exports.create = function (req, res) {
  var article = new Album(req.body);
  var images = req.files.image
    ? [req.files.image]
    : undefined;

  article.user = req.user;
  article.save(function (err) {
    if (!err) {
      req.flash('success', 'Successfully created article!');
      return res.redirect('/'+article._id);
    }
    console.log(err);
    res.render('albums/new', {
      title: 'New Article',
      article: article,
      errors: utils.errors(err.errors || err)
    });
  });
};

/*
 * upload Image
 */
exports.uploadImage = function(req, res){
  var album = req.album;
  var files = req.files.file.path;
  var patternFileExt=/\.[0-9a-z]+$/i
  if( files.match(patternFileExt)[0]!=='.jpg' && files.match(patternFileExt)[0]!=='.jpeg'){
    return res.send(415,'Unsupported file type. Please Upload a "jpeg" or "jpg" image.')
  }

  //return res.send('nada')


  //return res.send(req.files.file)
  if (!files || files.length===0){ return res.send([])};

  album.uploadAndSave(files, req.user.id, function(err) {
      if (!err) {
       return res.send(req.album)
      }else{
        return res.send(err)
      }
    });
};

/**
 * Edit an article
 */

exports.edit = function (req, res) {
  res.render('albums/edit', {
    title: 'Edit ' + req.article.title,
    article: req.article
  });
};

/**
 * Update article
 */

exports.update = function (req, res){
  var article = req.album;
  var images = req.files.image
    ? [req.files.image]
    : undefined;

  // make sure no one changes the user
  delete req.body.user;
  article = extend(article, req.body);

  article.uploadAndSave(images, function (err) {
    if (!err) {
      return res.redirect('/' + article._id);
    }

    res.render('albums/edit', {
      title: 'Edit Article',
      article: article,
      errors: utils.errors(err.errors || err)
    });
  });
};

/**
 * Show
 */

exports.show = function (req, res){
  res.render('albums/show', {
    title: req.album.title,
    article: req.album
  });
};

/**
 * Delete an article
 */

exports.destroy = function (req, res){
  var article = req.article;
  article.remove(function (err){
    req.flash('info', 'Deleted successfully');
    res.redirect('/articles');
  });
};
