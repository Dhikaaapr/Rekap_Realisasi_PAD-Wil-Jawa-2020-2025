const express = require('express');
const router = express.Router();
const retribusiController = require('../controllers/retribusiController');

router.get('/', retribusiController.getRetribusi);
router.post('/', retribusiController.upsertRetribusi);

module.exports = router;
