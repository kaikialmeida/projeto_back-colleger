const router = require('express').Router();
const auth = require('../middleware/auth');
const user = require('../controllers/userController');
const category = require('../controllers/categoryController');
const product = require('../controllers/productController');

// usuários e token
router.post('/v1/user/token', user.token);
router.post('/v1/user', user.create);
router.get('/v1/user/:id', user.getById);
router.put('/v1/user/:id', auth, user.update);
router.delete('/v1/user/:id', auth, user.remove);

// categorias
router.get('/v1/category/search', category.search);
router.get('/v1/category/:id', category.getById);
router.post('/v1/category', auth, category.create);
router.put('/v1/category/:id', auth, category.update);
router.delete('/v1/category/:id', auth, category.remove);

// produtos
router.get('/v1/product/search', product.search);
router.get('/v1/product/:id', product.getById);
router.post('/v1/product', auth, product.create);
router.put('/v1/product/:id', auth, product.update);
router.delete('/v1/product/:id', auth, product.remove);

module.exports = router;
