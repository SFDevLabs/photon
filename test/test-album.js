
/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , should = require('should')
  , request = require('supertest')
  , app = require('../server')
  , context = describe
  , User = mongoose.model('User')
  , Album = mongoose.model('Album')
  , agent = request.agent(app)

var count

/**
 * Articles tests
 */

describe('Album', function () {
  before(function (done) {
    // create a user
    var user = new User({
      email: 'foobar@example.com',
      name: 'Foo bar',
      username: 'foobar',
      password: 'foobar'
    })
    user.save(done)
  })

  describe('GET /', function () {
    it('should respond with Content-Type text/html', function (done) {
      agent
      .get('/')
      .expect('Content-Type', /html/)
      .expect(200)
      .expect(/Articles/)
      .end(done)
    })
  });

  describe('GET /articles/new', function () {
    // context('When not logged in', function () {
    //   it('should redirect to /login', function (done) {
    //     agent
    //     .get('/articles/new')
    //     .expect('Content-Type', /plain/)
    //     .expect(302)
    //     .expect('Location', '/login')
    //     .expect(/Moved Temporarily/)
    //     .end(done)
    //   })
    // })

    // context('When logged in', function () {
    //   before(function (done) {
    //     // login the user
    //     agent
    //     .post('/users/session')
    //     .field('email', 'foobar@example.com')
    //     .field('password', 'foobar')
    //     .end(done)
    //   })

    //   it('should respond with Content-Type text/html', function (done) {
    //     agent
    //     .get('/articles/new')
    //     .expect('Content-Type', /html/)
    //     .expect(200)
    //     .expect(/New Article/)
    //     .end(done)
    //   })
    // })
  })//end describe

  describe('POST /', function () {
    context('When not logged in', function () {
      it('should redirect to /login', function (done) {
        request(app)
        .get('/new')
        .expect('Content-Type', /plain/)
        .expect(302)
        .expect('Location', '/login')
        .expect(/Moved Temporarily/)
        .end(done)
      })
    })

    context('When logged in', function () {
      before(function (done) {
        // login the user
        agent
        .post('/users/session')
        .field('email', 'foobar@example.com')
        .field('password', 'foobar')
        .end(done)
      })

      describe('Invalid parameters', function () {
        before(function (done) {
          Album.count(function (err, cnt) {
            count = cnt
            done()
          })
        })

        it('should respond with error', function (done) {
          agent
          .post('/')
          .field('title', '')
          .field('body', 'foo')
          .expect('Content-Type', /html/)
          .expect(200)
          .expect(/Article title cannot be blank/)
          .end(done)
        })

        it('should not save to the database', function (done) {
          Album.count(function (err, cnt) {
            count.should.equal(cnt)
            done()
          })
        })
      })

      describe('Valid parameters', function () {
        before(function (done) {
          Album.count(function (err, cnt) {
            count = cnt
            done()
          })
        })

        it('should redirect to the new article page', function (done) {
          agent
          .post('/')
          .field('title', 'foo')
          .field('body', 'bar')
          .expect('Content-Type', /plain/)
          .expect('Location', /\//)
          .expect(302)
          .expect(/Moved Temporarily/)
          .end(done)
        })

        it('should insert a record to the database', function (done) {
          Album.count(function (err, cnt) {
            cnt.should.equal(count + 1)
            done()
          })
        })

        it('should save the article to the database', function (done) {
          Album
          .findOne({ title: 'foo'})
          .populate('user')
          .exec(function (err, album) {
            should.not.exist(err)
            album.should.be.an.instanceOf(Album)
            album.title.should.equal('foo')
            album.body.should.equal('bar')
            album.user.email.should.equal('foobar@example.com')
            album.user.name.should.equal('Foo bar')
            done()
          })
        })
      })
    })
  })

  after(function (done) {
    require('./helper').clearDb(done)
  })
})
