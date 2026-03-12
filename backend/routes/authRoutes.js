const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticate = require('../middleware/authenticate');

router.post('/register',       authController.register);
router.post('/login',          authController.login);
router.get('/me',              authenticate, authController.getCurrentUser);

router.post('/forgot-password',authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

router.post('/2fa/setup',      authenticate, authController.setupTOTP);
router.post('/2fa/verify',     authenticate, authController.verifyAndEnable2FA);
router.post('/2fa/disable',    authenticate, authController.disable2FA);

router.get('/login-history',   authenticate, authController.getLoginHistory);

module.exports = router;