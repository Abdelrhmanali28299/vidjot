const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const methodOverride = require('method-override')
const flash = require('connect-flash')
const session = require('express-session')
const path = require('path')
const bcrypt = require('bcryptjs')
const passport = require('passport')
const Idea = require('./models/Idea')
const User = require('./models/user')
const { ensureAuthenticated } = require('./helpers/auth')
require('./config/passport')(passport)

const app = express()

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(methodOverride('_method'))
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(flash())
app.use(function (req, res, next) {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.user = req.user || null;
    next();
})
app.use(express.static(path.join(__dirname, 'public')))

mongoose.connect('mongodb://abdoali28299:Abdo282990ali@ds259111.mlab.com:59111/vidjot', { useNewUrlParser: true })
    .then(() => {
        console.log('mongodb connected')
    })
    .catch((err) => {
        console.log(err)
    })

app.set('view engine', 'ejs')

app.get('/', (req, res) => {
    res.render('index.ejs', { data: 'Welcome' })
})

app.get('/about', (req, res) => {
    res.render('about.ejs', { data: 'about' })
})

app.get('/ideas', ensureAuthenticated, (req, res) => {
    Idea.find({ user: req.user.id })
        .sort({ date: 'desc' })
        .then((data) => {
            res.render('idea.ejs', { data })
        })
})

app.get('/ideas/add', ensureAuthenticated, (req, res) => {
    res.render('add.ejs', { detail: null, title: null, errors: null })
})

app.post('/ideas/add', ensureAuthenticated, (req, res) => {
    let err = [];
    if (!req.body.title) {
        err.push({ text: 'please add title' })
    }
    if (!req.body.details) {
        err.push({ text: 'please add details' })
    }
    if (err.length > 0) {
        res.render('add.ejs', {
            errors: err,
            title: req.body.title,
            detail: req.body.details
        });
    } else {
        let idea = new Idea({
            title: req.body.title,
            details: req.body.details,
            user: req.user.id
        })
        idea.save().then((data) => {
            req.flash('success_msg', 'Video idea added')
            res.redirect('/ideas')
        })
    }
})

app.get('/ideas/edit/:id', ensureAuthenticated, (req, res) => {
    Idea.findOne({ _id: req.params.id })
        .then((data) => {
            if (data.user === req.user.id) {
                res.render('edit.ejs', { errors: null, data })
            } else {
                req.flash('error_msg', 'Not Authorized')
                res.redirect('/ideas')
            }
        })
})

app.post('/ideas/edit/:id', ensureAuthenticated, (req, res) => {
    let err = [];
    if (!req.body.title) {
        err.push({ text: 'please add title' })
    }
    if (!req.body.details) {
        err.push({ text: 'please add details' })
    }
    if (err.length > 0) {
        res.render('edit.ejs', {
            errors: err,
            data: {
                title: req.body.title,
                detail: req.body.details
            }
        });
    } else {
        Idea.updateOne({ _id: req.params.id }, {
            title: req.body.title,
            details: req.body.details
        })
            .then((data) => {
                req.flash('success_msg', 'Video idea updated');
                res.redirect('/ideas');
            })
    }
})

app.delete('/ideas/delete/:id', ensureAuthenticated, (req, res) => {
    Idea.remove({ _id: req.params.id })
        .then(() => {
            req.flash('success_msg', 'Video idea removed');
            res.redirect('/ideas');
        });
})

app.get('/user/login', (req, res) => {
    res.render('login.ejs')
})

app.get('/user/register', (req, res) => {
    res.render('register.ejs', { errors: null })
})

app.post('/user/register', (req, res) => {
    let err = []
    if (req.body.password !== req.body.password2) {
        err.push({ text: "passwords don't match" })
    }
    if (req.body.password.length < 4) {
        err.push({ text: "password very small, password must be at least 4 charecter" })
    }
    if (err.length > 0) {
        res.render('register.ejs', {
            errors: err
        })
    } else {
        User.findOne({ email: req.body.email }).then(data => {
            if (data) {
                req.flash('error_msg', 'Email already regsitered');
                res.redirect('/user/register');
            } else {
                let user = new User({
                    name: req.body.name,
                    email: req.body.email,
                    password: req.body.password
                })

                bcrypt.genSalt(10, function (err, salt) {
                    bcrypt.hash(user.password, salt, function (err, hash) {
                        if (err) throw err
                        user.password = hash
                        user.save()
                            .then((data) => {
                                req.flash('success_msg', 'You are now registered and can login')
                                res.redirect('/user/login')
                            })
                    });
                });
            }
        })
    }
})

app.post('/user/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/ideas',
        failureRedirect: '/user/login',
        failureFlash: true
    })(req, res, next)
})

app.get('/user/logout', (req, res) => {
    req.logOut()
    req.flash('success_msg', 'You are loged out');
    res.redirect('/user/login')
})

const port = process.env.PORT || 5050
app.listen(port, () => {
    console.log('listening now')
})