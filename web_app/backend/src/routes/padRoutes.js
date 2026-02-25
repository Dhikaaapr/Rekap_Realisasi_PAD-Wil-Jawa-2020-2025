const express = require('express');
const router = express.Router();
const padController = require('../controllers/padController');

router.get('/', padController.getAllPAD);
router.get('/detail', padController.getDetailedPAD);
router.get('/stats', padController.getSummaryStats);
router.post('/batch', padController.batchImport);
router.post('/batch-detail', padController.batchImportDetail);
router.post('/clear-details', padController.clearDetails);

module.exports = router;
