const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');

const router = express.Router();

router.route('/')
.get(tourController.getAlltours)

.post(
  authController.protect,
  authController.restrictTo('guide-lead', 'manager', 'admin'),
  tourController.createTour)
;

router
.route('/:id')
.get(
  authController.protect,
  authController.restrictTo('guide-lead', 'manager', 'admin'),
  tourController.getTour)
.patch(
  authController.protect,
  authController.restrictTo('guide-lead', 'manager', 'admin'),
  tourController.updateTour)
.delete(
  authController.protect,
  authController.restrictTo('manager', 'admin'),
  tourController.deleteTour)
;





module.exports = router;