const createError = require('http-errors');
const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const cookieParser = require('cookie-parser');
const log = require('logger').express;
const logger = require('logger').logger;
const sassMiddleware = require('node-sass-middleware');
const config = require('config');
const helmet = require('helmet')

//offline\online http routes
const isRoutesAvailable = true;//false;
const setRoutesAvailable = (status) => {
  if( setRoutesAvailable === status ) {
    logger.debug(`routes available is already ${status}`)
    return;
  }

  isRoutesAvailable = status;
}

const staticDir = config.get('httpServer:staticDir');
const routesDir = path.join(__dirname, 'routes');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(log);
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(sassMiddleware({
  src: staticDir,
  dest: staticDir,
  indentedSyntax: false, // true = .sass and false = .scss
  sourceMap: true
}));
app.use(express.static(staticDir));

app.use(function(req, res, next) {
  if(isRoutesAvailable) {
    next();
  } else {
    next(createError(503));
  }
});

//auto require routes
fs.readdirSync(routesDir).forEach((file) => {
  const routePath = path.join(routesDir, file);


  if (path.extname(file) !== '.js' &&  !fs.lstatSync(routePath).isDirectory()) {
    //junk files
		return;
  }
  
  let routePrefix = `/${path.basename(file, '.js')}`;
  if (routePrefix === '/index') {
    routePrefix = '/';
  }

  app.use(routePrefix, require(routePath));
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
module.exports.setRoutesAvailable = setRoutesAvailable;
