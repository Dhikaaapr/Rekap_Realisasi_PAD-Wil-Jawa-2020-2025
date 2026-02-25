const express = require('express');
const router = express.Router();
const pajakController = require('../controllers/pajakController');
const { checkRole } = require('../middleware/auth');

router.get('/provinsi', pajakController.getProvinsi);
router.post('/provinsi', checkRole(['admin', 'provinsi']), pajakController.upsertProvinsi);

router.get('/kabkota', pajakController.getKabKota);
router.post('/kabkota', checkRole(['admin', 'kabkota']), pajakController.upsertKabKota);

module.exports = router;
