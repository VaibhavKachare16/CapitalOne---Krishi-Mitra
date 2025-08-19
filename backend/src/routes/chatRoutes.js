const express = require('express');
const router = express.Router();

const { postMessage, postUserMessage } = require('../controllers/chatController');

// Public demo endpoint
router.post('/message', postMessage);
router.post('/user-message', postUserMessage);

module.exports = router;



