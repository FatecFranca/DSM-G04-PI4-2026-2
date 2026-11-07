const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const restrictionController = require('../controllers/restriction.controller');
const {
  addUserRestrictionSchema,
  updateUserRestrictionSchema,
  validate
} = require('../validators/restriction.validator');

router.get('/', restrictionController.getAllRestrictions);
router.get('/users', authenticate, restrictionController.getUserRestrictions);
router.post(
  '/users',
  authenticate,
  validate(addUserRestrictionSchema),
  restrictionController.addUserRestriction
);
router.delete('/users/:id', authenticate, restrictionController.deleteUserRestriction);
router.put(
  '/users/:id',
  authenticate,
  validate(updateUserRestrictionSchema),
  restrictionController.updateUserRestriction
);

module.exports = router;
