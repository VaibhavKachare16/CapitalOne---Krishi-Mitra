const express = require('express');
const router = express.Router();

const { getShcByAadhar } = require('../controllers/shcController');

// Public for now; can protect later
router.get('/:aadharNumber', getShcByAadhar);

module.exports = router;



