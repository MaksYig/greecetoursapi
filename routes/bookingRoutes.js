const express = require('express');
const bookingController = require('./../controllers/bookingController');
const authController = require('./../controllers/authController');



const router = express.Router();

router
.route('/')
.get(authController.protect,authController.restrictTo('admin'), bookingController.getAllBookings);

router
  .route('/:id&:date')
  .post(authController.protect, bookingController.createBookingCash);

router
  .route('/checkout-session/:tourId&:date')
  .get(authController.protect, bookingController.getCheckoutSession);

router
  .route('/my')
  .get(authController.protect, bookingController.getMyBoikings);

router
  .route('/:id')
  .delete(authController.protect, bookingController.deleteMyBooking);






module.exports = router;

