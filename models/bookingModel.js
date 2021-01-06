const mongoose = require('mongoose');


const bookingSchema = new mongoose.Schema({

  tour: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tour',
    required: [true, 'Booking must belong to a Tour!!']
  },
  tourDate: {
    type: Date,
    required: [true, 'Booking has belong to specific date!!']
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Booking must belong to a user']
  },
  price: {
    type: Number,
    required: [true, 'Booking mask have a price!!']
  },
  createdAt: {
    type: Date,
    default: Date.now()
  },
  paid: {
    type: Boolean,
    default: false
  },
  paymentMethode: {
    type: String,
    enum: ['cash', 'by Card'],
    default: 'cash'
  }
});

bookingSchema.pre(/^find/, function (next) {
  this.populate('user').populate({
    path: 'tour',
    select: ''
  });
  next();
});



const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;