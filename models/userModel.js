const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const catchAsync = require('./../util/catchAsync');


const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, ' Please tell us your name!!'],
    trim: true
  },
  email: {
    type: String,
    unique: true,
    lowercase: true,
    required: [true, ' Please provide us your Email'],
    validate: {
      validator: validator.isEmail,
      message: 'Please provide valid Email Adress!!'
    }
  },
  phone: {
    type: Number,
    required: [true, ' Please provide us your phone number'],
    trim: true,
  },
  photo: {
    type: String,
    default: 'default.jpg'
  },
  role: {
    type: String,
    enum: ['user', 'userVIP', 'guide', 'guide-lead', 'manager', 'admin'],
    default: 'user'
  },
  gender: {
    type: String,
    enum: ['male', 'female'],
    lowercase: true,
    default: 'female'
  },
  country: {
    type: String,
    default: 'Greece'
  },
  employerTp: {
    type: Boolean,
    default: true
  },
  password: {
    type: String,
    required: [true, 'Please enter password!!'],
    minlength: 8,
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password!!'],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: 'Password not same, please check!! \u1F632'
    }
  },
  passwordChangeAt: {
    type: Date
  },
  passwordResetToken: String,
  passwordResetExpires: Date,

  createDate: {
    type: Date,
    default: Date.now()
  },
  active: {
    type: Boolean,
    default: true

  },
  lastLogIn: {
    type: Date,
    default: Date.now()
  }

});


//before saving user, crypt his password
userSchema.pre('save', async function (next) {
  //run function if password was modify
  if (!this.isModified('password')) return next();
  //encrypt user password
  this.password = await bcrypt.hash(this.password, 12);
  //deleting and not showing user Confirm password value
  this.passwordConfirm = undefined;
  next();
});

//if password was changed. write the password change time - 1s
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangeAt = Date.now() - 1000;
  next();
});



//looking in requests only users that active
// userSchema.pre(/^find/, function (next) {
//   this.find({ active: { $ne: false } });
//   next();
// });


/* enc the password that user try to log in and compare with password in DB */
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

//check if the user change password after the token was created
userSchema.methods.changePasswordAfter = function (JWTTimeStamp) {
  if (this.passwordChangeAt) {
    const changedTimestamp = parseInt(this.passwordChangeAt.getTime() / 1000, 10);
    return JWTTimeStamp < changedTimestamp;
  }
  // False means NOT changed
  return false;
};


//create password Rest Token for 10 min to change password
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};



const User = mongoose.model('User', userSchema);
module.exports = User;