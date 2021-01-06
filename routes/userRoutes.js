const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);
router.get('/resetPassword/:token', authController.findByResetToken);

router.get(
  '/me',
  authController.protect,
  userController.getMe,
  userController.getUserById
);
router.get('/isLogged__in', authController.protect);

router.patch(
  '/updateMe',
  authController.protect,
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
);

router.patch(
  '/updateMyPassword',
  authController.protect,
  authController.updatePassword
);
router.delete('/deleteMe', authController.protect, userController.deleteMe);

/* ---------------------------ADMIN OPTIONS--------------------------------------------------- */

router
  .route('/')
  .post(
    authController.protect,
    authController.restrictTo('admin'),
    userController.createUser
  )
  .get(
    authController.protect,
    authController.restrictTo('admin'),
    userController.getAllUsers
  );

router
  .route('/unactive')
  .get(
    authController.protect,
    authController.restrictTo('admin'),
    userController.getAllUnActiveUsers
  );

router
  .route('/:id')
  .get(
    authController.protect,
    authController.restrictTo('admin'),
    userController.getUser
  ) //Admin option

  .patch(
    authController.protect,
    authController.restrictTo('admin'),
    userController.uploadUserPhoto,
    userController.resizeUserPhotoAdmin,
    userController.updateUser
  )

  .delete(
    authController.protect,
    authController.restrictTo('admin'),
    userController.deleteUser
  );

module.exports = router;
