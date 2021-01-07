const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const globalErrorHandler = require('./controllers/errorController');

const app = express();

app.enable('trust proxy');

app.use(cors({ credentials: true, origin: 'http://localhost:3000' }));

app.use(express.json({ limit: '10kb' }));

app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//ROUTES
app.use('/api/ver1/tours', tourRouter);
app.use('/api/ver1/users', userRouter);
app.use('/api/ver1/bookings', bookingRouter);
app.use('/api/ver1/reviews', reviewRouter);

// app.all('*', (req, res, next) => {
//   next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
// });

app.use(globalErrorHandler);

module.exports = app;
