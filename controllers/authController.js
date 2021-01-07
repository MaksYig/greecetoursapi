const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../util/catchAsync');
const Email = require('./../util/email');
const AppError = require('./../util/appError');

//create secret body for user
const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user.id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXP_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: false, //set to true if your using https
  };
  // if (req.secure || req.headers('x-forwarded-proto') === 'https') {
  //   cookieOptions.secure = true;
  // }
  /* (req.secure || req.headers('x-forwarded-proto') === 'https') - use this only when web online */
  /* (process.env.NODE__ENV === 'production')--only for dev mode */

  res.cookie('jwt', token, cookieOptions);
  user.password = undefined;
  res.status(statusCode).json({
    status: 'Success',
    token,
    data: {
      user: user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  //check if user already exist
  const user = await User.findOne({ email: req.body.email });
  if (user) {
    return next(new AppError('User with this email is alredy exist!!'), 401);
  }

  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    lastLogIn: Date.now(),
  });

  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();
  createSendToken(newUser, 201, req, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  //check in DB that Email and Password exists
  if (!email || !password) {
    return next(new AppError('Please provide Email and Password', 400));
  }

  //check if the user exist and password is correct
  const user = await User.findOne({ email: email }).select('+password');

  //check if user account active or was deleted
  if (!user) {
    return next(new AppError('Your account is not exist', 401));
  }

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect Email or Password', 401));
  }
  /* Find the current user and update LastLogin Time */
  await user.update({ $set: { lastLogIn: Date.now() } });
  //if everything is OK and user status is Active-> send token to user
  createSendToken(user, 200, req, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({
    status: 'Success',
  });
};

//check if user = protected user has all nessecary tokens
exports.protect = catchAsync(async (req, res, next) => {
  //getting token and check if its there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
    console.log(token);
  }
  if (!token) {
    return next(
      new AppError('Your are not loggedin.Please login to get access', 401)
    );
  }
  //verification of validate token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  //check if the user still exist and not deleted
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('Thse user belonging to this token no longer exist', 401)
    );
  }
  //check if the user change password after the token was created
  if (currentUser.changePasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please login again!', 401)
    );
  }
  //access to protect router (using the app as logdin user)
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

//for API request Loggedin user

exports.isLoggedInAPI = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      //verify current token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );
      //check if the user still exist
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }
      //check if the user changed password after token was created
      if (currentUser.changePasswordAfter(decoded.iat)) {
        return next();
      }
      //THERE IS A LOGED IN USER
      res.locals.user = currentUser;
      res.status(200).json({
        status: 'Success',
        userLogged: true,
        data: {
          user: res.locals.user,
        },
      });
      return next();
    } catch (err) {
      return next();
    }
  } else {
    res.status(200).json({
      status: 'Fail',
      userLogged: false,
      meassage: 'The user doesnt have Auth token',
    });
    return next();
  }
};

//check if user logedin
exports.isLoogedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      //verify current token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );
      //check if the user still exist
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }
      //check if the user changed password after token was created
      if (currentUser.changePasswordAfter(decoded.iat)) {
        return next();
      }
      //THERE IS A LOGED IN USER
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

// permitions to app users
exports.restrictTo = (...role) => {
  return (req, res, next) => {
    if (!role.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action 😒')
      );
    }
    next();
  };
};

//forgot password //sending token to reset password
exports.forgotPassword = catchAsync(async (req, res, next) => {
  //get user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(
      new AppError('There is not user with that Email adress 😕', 404)
    );
  }
  //generate the random token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  try {
    //send reset password token to user email
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/users/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();
    res.status(200).json({
      status: 'Success',
      message: 'Check your Email. We send you a reset Password Token',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError('There was an error sending the mail.Try again later!', 500)
    );
  }
});

//find user by Reset Token
exports.findByResetToken = catchAsync(async (req, res, naxt) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  //find user with this token
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  console.log(req.params.token);
  res.status(200).json({
    status: 'Success',
    user: user,
  });
});

//reset password from sended email
exports.resetPassword = catchAsync(async (req, res, next) => {
  // get user basen on the token that was send
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  //find user with this token
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  //save new password only if token has not expired and if user exist
  if (!user) {
    return next(new AppError('Token is invalid or has expired!!', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  //login user and send JWT
  createSendToken(user, 200, req, res);
});

//change password for loggedin user from panel
exports.updatePassword = catchAsync(async (req, res, next) => {
  //find current user in DB
  const user = await User.findById(req.user.id).select('+password');
  //check if posted password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong!', 401));
  }
  //if current password is right
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  //log in the user and send new token
  createSendToken(user, 200, req, res);
});
