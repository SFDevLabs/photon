
/*!
 * Module dependencies.
 */

// Note: We can require users, articles and other cotrollers because we have
// set the NODE_PATH to be ./app/controllers (package.json # scripts # start)

var users = require('../app/controllers/users');
var albums = require('../app/controllers/albums');
var comments = require('../app/controllers/comments');
var tags = require('../app/controllers/tags');
var auth = require('./middlewares/authorization');

/**
 * Route middlewares
 */

var articleAuth = [auth.requiresLogin, auth.article.hasAuthorization];
var commentAuth = [auth.requiresLogin, auth.comment.hasAuthorization];

/**
 * Expose routes
 */

module.exports = function (app, passport) {

  // user routes
  app.get('/login', users.login);
  app.get('/signup', users.signup);
  app.get('/logout', users.logout);
  app.post('/users', users.create);
  app.post('/users/session',
    passport.authenticate('local', {
      failureRedirect: '/login',
      failureFlash: 'Invalid email or password.'
    }), users.session);
  app.get('/users/:userId', users.show);
  app.get('/auth/facebook',
    passport.authenticate('facebook', {
      scope: [ 'email', 'user_about_me'],
      failureRedirect: '/login'
    }), users.signin);
  app.get('/auth/facebook/callback',
    passport.authenticate('facebook', {
      failureRedirect: '/login'
    }), users.authCallback);
  app.get('/auth/github',
    passport.authenticate('github', {
      failureRedirect: '/login'
    }), users.signin);
  app.get('/auth/github/callback',
    passport.authenticate('github', {
      failureRedirect: '/login'
    }), users.authCallback);
  app.get('/auth/twitter',
    passport.authenticate('twitter', {
      failureRedirect: '/login'
    }), users.signin);
  app.get('/auth/twitter/callback',
    passport.authenticate('twitter', {
      failureRedirect: '/login'
    }), users.authCallback);
  app.get('/auth/google',
    passport.authenticate('google', {
      failureRedirect: '/login',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
      ]
    }), users.signin);
  app.get('/auth/google/callback',
    passport.authenticate('google', {
      failureRedirect: '/login'
    }), users.authCallback);
  app.get('/auth/linkedin',
    passport.authenticate('linkedin', {
      failureRedirect: '/login',
      scope: [
        'r_emailaddress'
      ]
    }), users.signin);
  app.get('/auth/linkedin/callback',
    passport.authenticate('linkedin', {
      failureRedirect: '/login'
    }), users.authCallback);

  app.param('userId', users.load);

  // article routes
  // app.get('/api/albums', albums.index);
  // app.put('/api/albums/:id', albums.update);
  // app.post('/api/albums', albums.create);


  // article routes
  app.param('id', albums.load);
  app.get('/', albums.index);
  app.get('/new', auth.requiresLogin, albums.new);
  app.post('/', auth.requiresLogin, albums.create);
  app.get('/:id', albums.show);
  app.get('/:id/edit', articleAuth, albums.edit);
  app.put('/:id', articleAuth, albums.update);
  app.delete('/:id', articleAuth, albums.destroy);

  app.post('/:id/upload', albums.uploadImage);

  //API
  app.get('/:id/widgets', albums.widgets);
  app.get('/:id/widgetsnew', albums.newWidget);
  app.put('/:id/widgets', albums.updateWidget);
  app.delete('/:id/widgets', albums.removeWidget);
  app.delete('/:id/widgets/all', albums.removeAllWidget);

  //Email
  //
  //
  app.post('/email', albums.email);

  

  // home route
  app.get('/', albums.index);

  // comment routes
  app.param('commentId', comments.load);
  app.post('/albums/:id/comments', auth.requiresLogin, comments.create);
  app.get('/albums/:id/comments', auth.requiresLogin, comments.create);
  app.delete('/albums/:id/comments/:commentId', commentAuth, comments.destroy);

  // tag routes
  app.get('/tags/:tag', tags.index);


  /**
   * Error handling
   */

  app.use(function (err, req, res, next) {
    // treat as 404
    if (err.message
      && (~err.message.indexOf('not found')
      || (~err.message.indexOf('Cast to ObjectId failed')))) {
      return next();
    }
    console.error(err.stack);
    // error page
    res.status(500).render('500', { error: err.stack });
  });

  // assume 404 since no middleware responded
  app.use(function (req, res, next) {
    res.status(404).render('404', {
      url: req.originalUrl,
      error: 'Not found'
    });
  });
}
