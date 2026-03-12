const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/authMiddleware');
const {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  assignRole,
} = require('../controllers/projectRolesController');

router.use(protect);

router.put('/members/:userId/role', assignRole);  // specific ก่อน

router.get('/',           getRoles);
router.post('/',          createRole);
router.put('/:roleId',    updateRole);
router.delete('/:roleId', deleteRole);

module.exports = router;