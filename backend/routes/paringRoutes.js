const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createPairingRequest,
  getMyPairingRequests,
  acceptPairingRequest,
  declinePairingRequest,
  getMyPairs,
} = require('../controllers/pairingController');

router.use(protect);

router.post('/request',              createPairingRequest);
router.get('/my-requests',           getMyPairingRequests);
router.get('/my-pairs',             getMyPairs); 
router.patch('/:requestId/accept',   acceptPairingRequest);
router.patch('/:requestId/decline',  declinePairingRequest);

module.exports = router;