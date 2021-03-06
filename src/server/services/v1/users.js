import Resource from 'koa-resource-router'
import validate from 'parameter'
import parse from 'co-body'
import hashids from 'src/shared/utils/hashids-plus'
import RestAuth from 'src/server/passport/auth/rest-auth'
import db from 'src/server/db'
import nunjucks from 'nunjucks'
import { verify } from 'src/shared/actions/SignupActions'

const User = db.users

export default new Resource('users', {
  // GET /users
  index: function *(next) {
    const sitekey = require('config').ReCAPTCHA.KEY
    this.body = { sitekey: sitekey }
  },
  // POST /users
  create: function *(next) {
    const body = yield parse(this)
    const rule = {
      name: { type: 'string', required: false, allowEmpty: true },
      password: { type: 'password', compare: 'passwordCheck' },
      passwordCheck: 'password',
      email: 'email',
      recaptcha: { type: 'string', required: true, allowEmpty: false }
    }
    const errors = validate(rule, body)

    if (errors) {
      this.type = 'json'
      this.status = 200
      this.body = errors
      return
    }

    if (process.env.NODE_ENV !== 'test') {
      const checkReCAPTCHA = yield verify({
        secret: require('config').ReCAPTCHA.SECRET,
        response: body.recaptcha
      })

      if (!checkReCAPTCHA.success) {
        this.type = 'json'
        this.status = 200
        this.body = checkReCAPTCHA
        return
      }
    }

    try {
      const user = yield User.create(body)
      this.type = 'json'
      this.status = 201
      this.body = hashids.encodeJson(user)
    } catch (err) {
      this.type = 'json'
      this.status = 200
      this.body = err
    }
  },
  // GET /users/:user
  show: [ RestAuth, function *(next) {
    try {
      if (hashids.decode(this.params.user) !== +this.user.id) {
        throw new Error('user check failed')
      }

      const user = yield User.load(this.params.user)

      this.type = 'json'
      this.status = 200
      this.body = hashids.encodeJson(user)
    } catch (err) {
      this.type = 'json'
      this.status = 404
      this.body = err
    }
  }],
  // GET /users/:user/edit
  edit: function *(next) {
    this.body = 'users'
  },
  // PUT /users/:user
  update: [ RestAuth, function *(next) {
    const body = yield parse(this)

    const rule = {
      name: { type: 'string', required: false, allowEmpty: true },
      password: { type: 'password', compare: 'passwordCheck' },
      passwordCheck: 'password'
    }
    const errors = validate(rule, body)
    if (errors) {
      this.type = 'json'
      this.status = 200
      this.body = errors
      return
    }

    try {
      if (hashids.decode(this.params.user) !== +this.user.id) {
        throw new Error('user check failed')
      }

      const user = yield User.update(this.params.user, body)
      this.type = 'json'
      this.status = 201
      this.body = hashids.encodeJson(user)
    } catch (err) {
      this.type = 'json'
      this.status = 404
      this.body = err
    }
  }],
  // DELETE /users/:user
  destroy: [ RestAuth, function *(next) {
    try {
      const body = yield User.load(this.params.user)
      if (hashids.decode(this.params.user) !== +this.user.id) {
        throw new Error('user check failed')
      }

      const user = yield User.delete(this.params.user)
      this.type = 'json'
      this.status = 200
      this.body = hashids.encodeJson(user)
    } catch (err) {
      this.type = 'json'
      this.status = 404
      this.body = err
    }
  }]
})
