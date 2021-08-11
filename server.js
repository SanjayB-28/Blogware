if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}
const express = require('express')
const mongoose = require('mongoose')
const Article= require('./models/article')
const articleRouter = require('./routes/articles')
const methodOverride = require('method-override')
const bcrypt = require('bcrypt')
const passport = require('passport')
const initializePassport = require('./passport-config')
const flash=require('express-flash')
const session=require('express-session')
const app = express()

initializePassport(
  passport,
  email => users.find(user => user.email === email),
  id => users.find(user => user.id === id)
)

const users = []

mongoose.connect('mongodb://localhost/blogware',{ 
   useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true})

app.set('view engine', 'ejs')
app.use(express.urlencoded({ extended: false }))
app.use(methodOverride('_method'))
app.use(flash())
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}))

app.use(passport.initialize())
app.use(passport.session())

app.get('/', checkAuthenticated, async (req,res)=>{
    const articles = await Article.find().sort({
       createdAt: 'desc'})
    res.render('articles/index', {articles: articles})
})

app.get('/login', checkNotAuthenticated, (req,res)=>{
    res.render('login.ejs')
})  

app.post('/login', checkNotAuthenticated, passport.authenticate('local',{
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}))

app.get('/register', checkNotAuthenticated, (req,res)=>{
    res.render('register.ejs')
})

app.post('/register', checkNotAuthenticated, async (req,res)=>{
    try{
      const hashedPassword = await bcrypt.hash(req.body.password,10)
      users.push({
         id: Date.now().toString(),
         name: req.body.name,
         email: req.body.email,
         password: hashedPassword
      })
      res.redirect('/login')
    }catch{
      res.redirect('/register')
    }
})

app.delete('/logout', (req, res) => {
  req.logOut()
  res.redirect('/login')
})

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }

  res.redirect('/login')
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/')
  }
  next()
}

app.use('/articles', articleRouter)

app.listen(5000)