import Timetable from '../models/Timetable.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { checkOverlap as checkTimeOverlap } from '../utils/overlapChecker.js';
import { notifyClass, notifyTeacher } from '../utils/notificationHelper.js';


export const reassignClass = async (req, res) => {
  try {
    const { timetableId, newTeacherId, mergeType } = req.body; // mergeType: 'merge' or 'replace'
    const timetable = await Timetable.findById(timetableId);
    if (!timetable) {
      return res.status(404).json({ success: false, message: 'Timetable not found' });
    }

    // Check if new teacher exists and is eligible
    const newTeacher = await User.findById(newTeacherId);
    if (!newTeacher || newTeacher.role !== 'teacher') {
      return res.status(400).json({ success: false, message: 'Invalid teacher' });
    }

    // Check if new teacher already has a class at that time
    const conflicts = await Timetable.find({
      teacher: newTeacherId,
      day: timetable.day,
      $or: [
        { startTime: { $lt: timetable.endTime }, endTime: { $gt: timetable.startTime } }
      ]
    });

    if (conflicts.length > 0 && mergeType !== 'merge') {
      return res.status(409).json({
        success: false,
        message: 'Teacher already has class at given time. Choose merge to proceed.',
        conflicts
      });
    }

    // Update teacher assignment - currently no special "merge" handling implemented (can extend)
    timetable.teacher = newTeacherId;
    await timetable.save();

    // Notify students in the class
    await notifyClass(
      timetable.class,
      `Teacher changed for ${timetable.subject} (${timetable.courseCode} - Group ${timetable.group})`,
      `The class on ${timetable.day} at ${timetable.startTime} is now with ${newTeacher.name}`,
      'teacher_changed'
    );

    // Notify the new teacher
    await notifyTeacher(
      newTeacherId,
      `Class assigned to you`,
      `You have been assigned ${timetable.subject} (${timetable.courseCode} - Group ${timetable.group}) on ${timetable.day}, ${timetable.startTime}-${timetable.endTime}`,
      'class_assigned'
    );

    res.status(200).json({ success: true, message: 'Class reassigned successfully', timetable });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


export const createTimetable = async (req, res) => {
  try {
    console.log('Creating timetable with data:', req.body);

    const { class: classname, courseCode, group, teacher, subject, day, startTime, endTime, location, semester } = req.body;

    // ✅ Validate required fields
    if (!classname || !courseCode || !subject || !day || !startTime || !endTime || !location) {
      console.error('Missing required fields:', { classname, courseCode, subject, day, startTime, endTime, location });
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: class, courseCode, subject, day, startTime, endTime, location'
      });
    }

    // ✅ Validate day format
    const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    if (!validDays.includes(day)) {
      return res.status(400).json({
        success: false,
        message: `Invalid day. Must be one of: ${validDays.join(', ')}`
      });
    }

    // ✅ Check if teacher exists (if provided)
    if (teacher && teacher.trim() !== '') {
      console.log('Checking if teacher exists:', teacher);

      const teacherExists = await User.findById(teacher);
      if (!teacherExists) {
        return res.status(404).json({
          success: false,
          message: 'Teacher not found. Please check the Teacher ID.'
        });
      }
      if (teacherExists.role !== 'teacher') {
        return res.status(400).json({
          success: false,
          message: 'Selected user is not a teacher'
        });
      }

      // ✅ Check for schedule overlap
      const hasOverlap = await checkTimeOverlap(teacher, day, startTime, endTime);
      if (hasOverlap) {
        return res.status(400).json({
          success: false,
          message: 'Teacher has a conflicting class at this time'
        });
      }
    }

    // ✅ Create timetable
    console.log('Creating timetable entry...');
    const timetable = await Timetable.create({
      class: classname.trim(),
      courseCode: courseCode.trim(),
      group: group?.trim() || 'A',
      teacher: teacher && teacher.trim() !== '' ? teacher : null,
      subject: subject.trim(),
      day,
      startTime,
      endTime,
      location: location.trim(),
      semester: semester?.trim() || 'Fall 2025'
    });

    console.log('Timetable created:', timetable._id);

    // ✅ Notify students in this class
    try {
      await notifyClass(
        classname,
        `New class scheduled: ${subject} (${courseCode} - Group ${group || 'A'})`,
        `Class ${classname}, Course ${courseCode}, Group ${group || 'A'} has a new ${subject} class on ${day} from ${startTime} to ${endTime} in ${location}`,
        'class_scheduled'
      );
    } catch (notifyError) {
      console.error('Error sending notification:', notifyError);
      // Don't fail the request if notification fails
    }

    // ✅ Notify teacher if assigned
    if (teacher && teacher.trim() !== '') {
      try {
        await notifyTeacher(
          teacher,
          `New class assigned: ${subject} (${courseCode} - Group ${group || 'A'})`,
          `You have been assigned to teach ${subject} (${courseCode} - Group ${group || 'A'}) to ${classname} on ${day} from ${startTime} to ${endTime}`,
          'class_assigned'
        );
      } catch (notifyError) {
        console.error('Error notifying teacher:', notifyError);
        // Don't fail the request if notification fails
      }
    }

    res.status(201).json({
      success: true,
      message: 'Timetable created successfully',
      data: timetable
    });

  } catch (error) {
    console.error('Error creating timetable:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating timetable',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};


export const getAllTimetables = async (req, res) => {
  try {
    const { class: classname, day, courseCode, group } = req.query;

    let filter = {};
    if (classname) filter.class = classname;
    if (day) filter.day = day;
    if (courseCode) filter.courseCode = courseCode;
    if (group) filter.group = group;

    const timetables = await Timetable.find(filter)
      .populate('teacher', 'name email department')
      .sort({ day: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      count: timetables.length,
      data: timetables
    });

  } catch (error) {
    console.error('Error fetching timetables:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching timetables'
    });
  }
};


export const getStudentTimetable = async (req, res) => {
  try {
    const studentClass = req.user.class;

    if (!studentClass) {
      return res.status(400).json({
        success: false,
        message: 'Student class not found'
      });
    }

    const timetable = await Timetable.find({ class: studentClass })
      .populate('teacher', 'name email department')
      .sort({ day: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      data: timetable
    });

  } catch (error) {
    console.error('Error fetching student timetable:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching student timetable'
    });
  }
};


export const getTeacherTimetable = async (req, res) => {
  try {
    const teacherId = req.user._id;

    const timetable = await Timetable.find({ teacher: teacherId })
      .populate('teacher', 'name email department')
      .sort({ day: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      data: timetable
    });

  } catch (error) {
    console.error('Error fetching teacher timetable:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching teacher timetable'
    });
  }
};


export const checkOverlap = async (req, res) => {
  try {
    const { day, startTime, endTime, teacherId } = req.body;

    if (!day || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide day, startTime, and endTime'
      });
    }

    const teacher = teacherId || req.user._id;

    const overlappingClasses = await Timetable.find({
      teacher,
      day,
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime }
        }
      ]
    }).populate('teacher', 'name email');

    res.status(200).json({
      success: true,
      hasOverlap: overlappingClasses.length > 0,
      conflicts: overlappingClasses.map(item => ({ conflictWith: item }))
    });

  } catch (error) {
    console.error('Error checking overlap:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking overlap'
    });
  }
};


export const updateTimetable = async (req, res) => {
  try {
    const { id } = req.params;

    const updateData = { ...req.body };

    // Optional: trim strings and validate fields here as needed

    const timetable = await Timetable.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .populate('teacher', 'name email department');

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'Timetable not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Timetable updated successfully',
      data: timetable
    });

  } catch (error) {
    console.error('Error updating timetable:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating timetable'
    });
  }
};


export const deleteTimetable = async (req, res) => {
  try {
    const { id } = req.params;

    const timetable = await Timetable.findByIdAndDelete(id);

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'Timetable not found'
      });
    }

    // ✅ Notify students about cancellation
    try {
      await notifyClass(
        timetable.class,
        `Class cancelled: ${timetable.subject} (${timetable.courseCode} - Group ${timetable.group})`,
        `The ${timetable.subject} class (${timetable.courseCode} - Group ${timetable.group}) on ${timetable.day} from ${timetable.startTime} to ${timetable.endTime} has been cancelled.`,
        'class_cancelled'
      );
    } catch (notifyError) {
      console.error('Error notifying cancellation:', notifyError);
    }

    res.status(200).json({
      success: true,
      message: 'Timetable deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting timetable:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting timetable'
    });
  }
};
