import express from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearReadNotifications,
  sendNotification
} from '../controllers/notificationController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { onlyAdminOrTeacher } from '../middlewares/roleMiddleware.js';
import { upload } from '../middlewares/uploadMiddleware.js';


const router = express.Router();


// ✅ SPECIFIC ROUTES FIRST (before :id routes)

// Send notification route (must be before /:id routes)
router.post('/send', protect, onlyAdminOrTeacher, sendNotification);

// Mark all as read
router.put('/read-all', protect, markAllAsRead);


// Clear read notifications
router.delete('/clear-read', protect, clearReadNotifications);

// ✅ GENERAL ROUTES AFTER SPECIFIC ONES

// Get all notifications
router.get('/', protect, getNotifications);

// ✅ PARAMETERIZED ROUTES LAST

// Mark as read by ID
router.put('/:id/read', protect, markAsRead);

// Delete notification by ID
router.delete('/:id', protect, deleteNotification);

router.post("/sends", protect,onlyAdminOrTeacher,upload.single("attachment"),sendNotification);

export default router;
