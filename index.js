const express = require('express');
const app = express();
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcryptjs');
let MongoStore = require('connect-mongo')(session);
const path = require('path');
require('dotenv').config();
const port = process.env.PORT || 3000;
const User = require('./models/User');

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
  })
  .then(() => {
    console.log('Mongodb connected');
  })
  .catch(err => console.log(`Mongodb error: ${err}`));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(
  session({
    resave: true,
    saveUninitialized: true,
    secret: process.env.SESSION_SECRET,
    store: new MongoStore({
      url: process.env.MONGODB_URI,
      mongooseConnection: mongoose.connection,
      autoReconnect: true
    }),
    cookie: {
      secure: false,
      maxAge: 6000000
    }
  })
);

app.get('/', (req, res) => {
  res.render('index');
});
app.get('/register', (req, res) => {
  res.render('register');
});
app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/register', (req, res) => {
  User.findOne({ email: req.body.email }).then(user => {
    if (user) {
      return console.log('User Exists');
    } else if (req.body.email && req.body.password && req.body.name) {
      const user = new User();
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(req.body.password, salt);

      user.name = req.body.name;
      user.email = req.body.email;
      user.password = hash;

      user
        .save()
        .then(user => {
          return res.status(200).json({ message: 'User Created', user });
        })
        .catch(err => console.log(err));
    }
  });
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
