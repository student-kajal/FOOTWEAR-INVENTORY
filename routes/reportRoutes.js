
const express = require('express');
const router = express.Router();
const { getSalaryReport } = require('../controllers/productController');

router.get('/salary', getSalaryReport);

module.exports = router;
