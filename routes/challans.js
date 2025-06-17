const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { createChallan, getChallans } = require('../controllers/challanController');

router.post('/', auth, createChallan);
router.get('/', auth, getChallans);

module.exports = router;
