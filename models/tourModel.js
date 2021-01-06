const mongoose = require('mongoose');
const slugify = require('slugify');


const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour mus have a name!!'],
      unique: true,
      trim: true
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have duration!']
    },
    maxGroupSize: {
      type: Number,
      required: [true, ' A group must have a Max Group Size']
    },
    ratingAvarage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be less or equal 5'],
      set: val => Math.round(val * 10) / 10 //Round Rating Avarage
    },
    ratingQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, 'Tour must have a price!!']
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) { return val < this.price; },
        message: 'Price discount should be less that price {{VALUE}}!!'
      }
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'Tour must have a discription!!']
    },
    difficulty: {
      type: String,
      required: [true, ' A tour must have difficulty'],
      lowercase: true,
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty mas be ( Easy or Medium or Difficult'
      }
    },

    description: {
      type: String,
      trim: true,
      required: [true, 'Tour must have a description!!']
    },
    imageCover: {
      type: String,
      required: [true, 'Tour must have a cover picture!!']
    },
    images: [String],
    createAt: {
      type: Date,
      default: Date.now(),
      select: false
    },
    startDates: [
      {
        date: {
          type: Date
        },
        currentGroupSize: {
          type: Number,
          default: 0
        }
      }
    ],

    closestDate: Date,
    secretTour: {
      type: Boolean,
      default: false
    },
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String,
      startTime: Date
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
      }
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      }
    ]
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

tourSchema.index({ price: 1, ratingsAvarage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

// To find gides of this tour that connected// looking by id in User collection
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: 'photo role name email phone'
  });
  next();
});

//virtual popupale of reviews
tourSchema.virtual('review', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id'
});

//Create slug for tour automaticaly
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// QUERY MIDLEWARE  hide the secret tour from searching
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});








const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;