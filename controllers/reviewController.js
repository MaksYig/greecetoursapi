const Tour = require('../models/tourModel');
const Review = require('../models/reviewModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../util/catchAsync');
const AppError = require('../util/appError');

exports.setTourUserIds = (req, res, next) => {
  // Allow nested routes
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.getAllReviews = catchAsync(async (req,res,next)=>{

  const reviews = await Review.find({});

  res.status(200).json({
    status: 'Success',
    results: reviews.length,
    reviews: reviews
  });

});

exports.createReview = catchAsync(async (req,res,next)=>{

  //check if customer already leaved review for this tour
  const checkReview = await Review({user: res.locals.user.id});
  console.log(checkReview);



 const review = await Review.create(req.body);
 res.status(200).json({
   status: 'Success',
   review: review
 });
});

