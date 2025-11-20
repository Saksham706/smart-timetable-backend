import express from 'express';
import {
  createTimetable,
  getAllTimetables,
  getStudentTimetable,
  getTeacherTimetable,
  checkOverlap,
  updateTimetable,
  deleteTimetable,
  reassignClass
} from '../controllers/timetableController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { onlyAdmin } from '../middlewares/roleMiddleware.js';
import { onlyAdminOrTeacher } from '../middlewares/roleMiddleware.js';

const router = express.Router();

// ✅ SPECIFIC ROUTES MUST COME FIRST (before :id routes)


router.post('/reassign', protect, onlyAdminOrTeacher, reassignClass);
// Student-specific route
router.get('/student', protect, getStudentTimetable);

// Teacher-specific route
router.get('/teacher', protect, getTeacherTimetable);


// Check overlap route
router.post('/check-overlap', protect, checkOverlap);


// ✅ GENERAL ROUTES AFTER SPECIFIC ONES

// Create new timetable (POST)
router.post('/', protect, onlyAdmin, createTimetable);


// Get all timetables (GET)
router.get('/', protect, onlyAdmin, getAllTimetables);


// ✅ PARAMETERIZED ROUTES LAST

// Update timetable by ID
router.put('/:id', protect, onlyAdmin, updateTimetable);


// Delete timetable by ID
router.delete('/:id', protect, onlyAdmin, deleteTimetable);


export default router;
