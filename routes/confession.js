const express = require('express');


const confessionsController = require('../controllers/confessions');

const router = express.Router();


// create a confession
router.post('/new', confessionsController.createConfession);

// get all confessions
router.post('/closest', confessionsController.getNearestConfessions);

// get the most popular confessions
router.post('/popular', confessionsController.getPopularConfessions);

// get the most hated confessions
router.post('/hated', confessionsController.getHatedConfessions);

// get latest confessions
router.post('/latest', confessionsController.getLatestConfessions);


// get single confession
router.post('/post', confessionsController.getConfession);

// heart confession
router.post('/heartPost', confessionsController.heartPost);

// hate confession
router.post('/hatePost', confessionsController.hatePost);

// delete confession
router.post('/delete', confessionsController.deleteConfession);


module.exports = router;