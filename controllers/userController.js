const multer = require('multer');
const sharp = require('sharp');
const User = require('./../models/userModel');
const catchAsync = require('./../util/catchAsync');
const AppError = require('./../util/appError');
const authController = require('./authController');
const factory = require('./handler');


/* Not to upload file to file system. to store it in memory before resizing */
const multerStorage = multer.memoryStorage();

/* Filter the files that not pictures */
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image ❗ Please upload image file', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

exports.uploadUserPhoto = upload.single('photo');

//Only for UpdateMe
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next();
  }
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 80 })
    .toFile(`public/img/users/${req.file.filename}`);


  next();
});

//to write updated user ID on the name of photo.Only when Update some user
exports.resizeUserPhotoAdmin = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next();
  }
  req.file.filename = `user-${req.params.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 80 })
    .toFile(`public/img/users/${req.file.filename}`);
  next();
});




const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
}

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
}

exports.updateMe = catchAsync(async (req, res, next) => {
  //check that user update his personal info and not password
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError('This page is not for password update. Please use UpdateMy Password', 400));
  }
  //filter object from req body that only allowed to be updated
  const filterBody = filterObj(req.body, 'name', 'email', 'phone', 'gender', 'country', 'employerTp');
  if (req.file) {
    filterBody.photo = req.file.filename;
  }
  // update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filterBody, {
    new: true,
    runValidators: true
  });
  res.status(200).json({
    status: 'Success',
    data: {
      user: updatedUser
    }
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  authController.logout;
  res.status(204).json({
    status: 'Success',
    data: null
  });

});





/* --------------------------------ADMIN OPTIONS TO MONIPULATE WITH USER---------------------------------------- */

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();
  res.status(200).json({
    status: 'Success',
    results: users.length,
    data: {
      users: users
    }
  });
});

exports.getAllUnActiveUsers = catchAsync(async (req, res, next) => {
  const users = await User.find({ active: false });
  res.status(200).json({
    status: 'Success',
    results: users.length,
    data: {
      users: users
    }
  });
});

exports.getUserById = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  res.status(200).json({
    status: 'Success',
    data: {
      users: user
    }
  });
});

exports.createUser = catchAsync(async (req, res, next) => {
  if (req.file) {
    filterBody.photo = req.file.filename;
  }
  const user = await User.create(req.body);
  res.status(201).json({
    status: 'Success',
    data: {
      users: user
    }
  });
});

exports.updateUser = catchAsync(async (req, res, next) => {
  const filterBody = filterObj(req.body, 'name', 'email', 'role', 'phone', 'gender', 'country', 'employerTp','active');

  if (req.file) {
    filterBody.photo = req.file.filename;
  }
  const updateThisdUser = await User.findByIdAndUpdate(req.params.id, filterBody, {
    new: true,
    runValidators: true
  });
  if (!updateThisdUser) {
    return next(new AppError('No document found with this ID', 404));
  }
  res.status(200).json({
    status: 'Success',
    data: {
      user: updateThisdUser
    }
  });
});

exports.deleteUser = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.params.id, { active: false });
  res.status(204).json({
    status: 'Success',
    data: null
  });
});

exports.getUser = factory.getOne(User);