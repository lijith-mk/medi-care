const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => res.json({ status: 'ok' }));

// auth routes
router.use('/auth', require('./auth'));

module.exports = router;
