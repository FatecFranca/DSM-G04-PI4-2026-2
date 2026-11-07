const express = require('express');
const router = express.Router({ mergeParams: true });
const { authenticate } = require('../middleware/auth');
const ratingController = require('../controllers/rating.controller');
const {
  createRatingSchema,
  updateRatingSchema,
  validate
} = require('../validators/rating.validator');

router.post(
  '/:id/ratings',
  authenticate,
  validate(createRatingSchema),
  ratingController.createRating
);
router.put(
  '/:id/ratings',
  authenticate,
  validate(updateRatingSchema),
  ratingController.updateRating
);
router.delete('/:id/ratings', authenticate, ratingController.deleteRating);
router.get('/:id/ratings', ratingController.getRatings);

module.exports = router;
