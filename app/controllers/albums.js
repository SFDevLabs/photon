
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
      return res.redirect('/'+article.url);
    }
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

  var matcher = files.match(patternFileExt)[0];
  if( matcher && matcher.toLowerCase()!=='.jpg' && matcher.toLowerCase()!=='.jpeg'){
    return res.send(415,'Unsupported file type. Please Upload a "jpeg" or "jpg" image.')
  }

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
  article = req.body;//extend(article, req.body);  //when we use backbone

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
 * API
 */

exports.widgets = function(req, res){

      res.json(req.album.widgets)

}
exports.newWidget=function(req, res){
  var album = req.album
  album.widgets.push({
            col: 1,
            row: 1,
            size_x: 1,
            size_y: 1,
        });
  album.save(function(err){
    if (!err) {
      return res.json({success:true})
    };
    req.flash('error', err);
    return res.redirect('/'+album._id);

    
  });
};

exports.removeWidget=function(req, res){
  var album = req.album
};
exports.removeAllWidget=function(req, res){
  var album = req.album
  album.widgets=[];
  album.save(function(err){
    if (!err) {
      return res.json({success:true})
    };
    req.flash('error', err);
    return res.redirect('/'+album._id);
  });
};



exports.updateWidget=function(req, res){
  var album = req.album
  
  //we loop the widget list and extend them one by one
  for (var i = album.widgets.length - 1; i >= 0; i--) {
    var bodyW = req.body.widgets[i]
    var albumW = album.widgets[i]
    album.widgets[i]=extend(albumW, bodyW);
  };
  
  album.save(function(err){
    if (!err) {
      return res.json({success:true})
    };
    req.flash('error', err);
    return res.redirect('/'+album._id);
    
  });
};

//end api


/**
 * Show
 */
exports.show = function (req, res){
  res.render('albums/show', {
    title: req.album.title,
    album: req.album,
  });
};

/**
 * Delete an article
 */

exports.destroy = function (req, res){
  var article = req.article;
  article.remove(function (err){
    req.flash('info', 'Deleted successfully');
    res.redirect('/');
  });
};

/**
 * Load
 */

exports.email = function (req, res){

  var files = Object.keys(req.files);

  files.each(function(){
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
  });

};
