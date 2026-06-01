const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/register', [
  body('name').notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
], authController.register);

router.post('/login', [
  body('email').isEmail(),
  body('password').exists(),
], authController.login);

router.get('/me', auth, authController.me);

module.exports = router;
