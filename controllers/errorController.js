const AppError = require('./../util/appError');

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleJWTError = () => {
  return new AppError('Invalid Token!! Please login again', 401);
};

const handleJWTExpiredError = () => {
  return new AppError('Your token has expired!! Please login again', 401)
};

const handleDuplicateFieldsDB = err => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const sendErrorDev = (err, req, res) => {
  //API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  }
  //Render Web Site
  console.log('ERROR', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong! 😧',
    msg: err.message
  });
};

const sendErrorProd = (err, req, res) => {
  //API
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    }
    //log error
    console.log('ERROR', err);
    return res.status(500).json({
      status: 'Error',
      message: 'Something went wrong! 😧'
    });
  }
  //render Web site
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something wrong!',
      msg: err.message
    });
  }
  //log error
  console.log('ERROR \u1F525', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something wrong!',
    msg: 'Please try again later!!'
  });
};


module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, req, res);

  }
};

