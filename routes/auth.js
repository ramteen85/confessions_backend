const express = require('express');
const {body} = require('express-validator');

const User = require('../models/user');
const authController = require('../controllers/auth');

const router = express.Router();

router.post('/register', [
    body('result.email')
    .isEmail()
    .withMessage("Please enter a valid email...")
    .custom((value, {req}) => {
        return User.findOne({email: value}).then(userDoc => {
            if(userDoc) {
                return Promise.reject('E-mail address already exists');
            }
        });
    })
    .normalizeEmail(),
    // body('result.password').trim().isLength({min: 5}),
    body('result.password').trim(),
    body('result.nickname')
    .trim()
    .not()
    .isEmpty()
], authController.register);


// log in user
router.post('/login', authController.login);

// get location info
router.post('/getUserLoc', authController.getUserLoc)

// save true location info
router.post('/saveTrueUserLoc', authController.saveTrueUserLoc);

// save rough location info
router.post('/saveRoughUserLoc', authController.saveRoughUserLoc);

// get user by name
router.post('/getUserById', authController.getUserById);

// get all users
router.post('/getAllUsers', authController.getAllUsers);

// get chat list
router.post('/getChatList', authController.getChatList);


module.exports = router;