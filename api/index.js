const { Router } = require('express');
const medicaoRoutes = require('./src/routes/medicao.routes');

const router = Router();

router.use('/medicoes', medicaoRoutes);

module.exports = router;
