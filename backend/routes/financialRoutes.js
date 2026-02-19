const express = require('express');
const router = express.Router({ mergeParams: true }); 
const { protect } = require('../middleware/authMiddleware');
const { checkProjectMember, checkProjectOwner } = require('../middleware/projectAuth');
const fc = require('../controllers/financialController');

router.use(protect);
router.use(checkProjectMember); 


router.get('/overview', fc.getOverview);
router.put('/budget', checkProjectOwner, fc.adjustBudget);      


router.get('/forecast', fc.getSpendForecast);


router.get('/requests', fc.getFundRequests);                   
router.post('/requests', fc.createFundRequest);                 
router.patch('/requests/:requestId/approve', checkProjectOwner, fc.approveFundRequest);
router.patch('/requests/:requestId/reject',  checkProjectOwner, fc.rejectFundRequest);


router.get('/disbursements', fc.getDisbursements);
router.patch('/disbursements/:disbursementId/status', checkProjectOwner, fc.updateDisbursementStatus);
router.post('/disbursements/approve-all', checkProjectOwner, fc.approveAllPending);

router.get('/audit', fc.getAuditLog);

module.exports = router;