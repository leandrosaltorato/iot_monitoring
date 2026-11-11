const { Router } = require('express');
const medicaoController = require('../controllers/medicao.controller');

const router = Router();

router.post('/', medicaoController.criar);
router.get('/ultima', medicaoController.ultima); // antes de '/:id' caso exista no futuro
router.get('/', medicaoController.listar);

module.exports = router;
