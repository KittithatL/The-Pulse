const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/authMiddleware');
const { checkProjectMember, checkProjectOwner } = require('../middleware/projectAuth');
const dc = require('../controllers/decisionController');

router.use(protect);
router.use(checkProjectMember);

router.get('/',                    dc.getDecisions);           // ?category=&status=&period=&keyword=
router.post('/',                   dc.createDecision);
router.get('/report',              dc.getStrategyReport);      // AI Strategy Report
router.get('/:decisionId',         dc.getDecision);
router.put('/:decisionId',         dc.updateDecision);
router.patch('/:decisionId/archive', dc.archiveDecision);

router.post('/:decisionId/comments',            dc.addComment);
router.delete('/comments/:commentId',           dc.deleteComment);

 
router.post('/:decisionId/reactions',           dc.toggleReaction);

router.put('/:decisionId/stakeholders',         dc.updateStakeholders);

module.exports = router;