import express from 'express';
import {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  registerForEvent,
  unregisterFromEvent,
  getUpcomingEvents,
  getMyEvents,
  getEventStatistics
} from '../controllers/eventController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { onlyAdmin, onlyAdminOrTeacher } from '../middlewares/roleMiddleware.js';

const router = express.Router();

// ✅ PUBLIC ROUTES
router.get('/upcoming', getUpcomingEvents);

// ✅ PROTECTED ROUTES (All logged-in users)
router.get('/', protect, getAllEvents);
router.get('/my-events', protect, getMyEvents);
router.get('/statistics', protect, getEventStatistics);
router.get('/:id', protect, getEventById);

// ✅ REGISTRATION ROUTES (Students/Teachers)
router.post('/:id/register', protect, registerForEvent);
router.post('/:id/unregister', protect, unregisterFromEvent);

// ✅ ADMIN/TEACHER ROUTES
router.post('/', protect, onlyAdminOrTeacher, createEvent);
router.put('/:id', protect, onlyAdminOrTeacher, updateEvent);
router.delete('/:id', protect, onlyAdmin, deleteEvent);

export default router;