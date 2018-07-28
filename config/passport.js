const bcrypt = require('bcryptjs')
const localStrategy = require('passport-local').Strategy
const mongoose = require('mongoose')
const User = require('../models/user')

module.exports = function (passport) {
    passport.use(new localStrategy({ usernameField: 'email' }, (email, password, done) => {
        User.findOne({ email: email })
            .then(user => {
                if (!user) {
                    return done(null, false, { message: 'no User exist' });
                }
                bcrypt.compare(password, user.password, (err, match) => {
                    if (err) throw err
                    if (match) {
                        return done(null, user)
                    } else {
                        return done(null, false, { message: 'password Incorrect' });
                    }
                })
            })
    }))

    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function (id, done) {
        User.findById(id, function (err, user) {
            done(err, user);
        });
    });
}