const express = require('express');
const accountController = require('../controllers/accountController');

const router = express.Router();

router.get('/accounts', accountController.listAccounts);
router.post('/accounts', accountController.createAccount);
router.post('/accounts/login', accountController.loginAccount);
router.get('/accounts/:userId', accountController.getAccount);
router.put('/accounts/:userId', accountController.updateAccount);
router.delete('/accounts/:userId', accountController.deleteAccount);

module.exports = router;
