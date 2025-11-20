import User from "../models/User.js";
import Timetable from "../models/Timetable.js";

// 📌 STUDENT DASHBOARD
export const getStudentDashboard = async (req, res) => {
  try {
    const studentClass = req.user.class;

    if (!studentClass) {
      return res.status(400).json({
        success: false,
        message: "Student class not found",
      });
    }

    // Get all timetable entries for this class
    const timetables = await Timetable.find({ class: studentClass });

    const totalClasses = timetables.length;

    // Count unique subjects
    const uniqueSubjects = [...new Set(timetables.map(t => t.subject))];
    const totalSubjects = uniqueSubjects.length;

    // Today's day
    const today = new Date()
      .toLocaleDateString("en-US", { weekday: "long" });

    const todaysClasses = timetables.filter(t => t.day === today);

    // Week classes (Mon–Sat)
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const thisWeekClasses = timetables.filter(t => days.includes(t.day));

    return res.json({
      success: true,
      stats: {
        totalClasses,
        totalSubjects,
        todaysClasses: todaysClasses.length,
        thisWeekClasses: thisWeekClasses.length,
      },
      todaysSchedule: todaysClasses.slice(0, 5),
      message: "Student dashboard data fetched successfully",
    });

  } catch (err) {
    console.error("Error in getStudentDashboard:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// 📌 TEACHER DASHBOARD
export const getTeacherDashboard = async (req, res) => {
  try {
    const teacherId = req.user._id;

    // Get all timetable entries of that teacher
    const timetables = await Timetable.find({ teacher: teacherId });

    const totalClasses = timetables.length;

    // Unique classes
    const uniqueClasses = [...new Set(timetables.map(t => t.class))];
    const totalUniqueClasses = uniqueClasses.length;

    // No assignment or attendance system → remove related logic

    // Today's schedule
    const today = new Date()
      .toLocaleDateString("en-US", { weekday: "long" });

    const todaysSchedule = timetables.filter(t => t.day === today);

    return res.json({
      success: true,
      stats: {
        totalClasses,
        totalUniqueClasses,
        todaysClasses: todaysSchedule.length,
      },
      todaysSchedule: todaysSchedule.slice(0, 5),
      message: "Teacher dashboard data fetched successfully",
    });

  } catch (err) {
    console.error("Error in getTeacherDashboard:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// 📌 ADMIN DASHBOARD
export const getAdminDashboard = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: "student" });
    const totalTeachers = await User.countDocuments({ role: "teacher" });
    const totalAdmins = await User.countDocuments({ role: "admin" });

    const totalTimetableEntries = await Timetable.countDocuments();

    // Recent 5 users
    const recentUsers = await User.find()
      .select("name email role createdAt")
      .sort({ createdAt: -1 })
      .limit(5);

    // Unique departments
    const users = await User.find().select("department");
    const departments = [...new Set(users.map(u => u.department).filter(Boolean))];

    return res.json({
      success: true,
      stats: {
        totalStudents,
        totalTeachers,
        totalAdmins,
        totalTimetableEntries,
        totalUsers: totalStudents + totalTeachers + totalAdmins,
      },
      recentUsers,
      departments,
      message: "Admin dashboard data fetched successfully",
    });

  } catch (err) {
    console.error("Error in getAdminDashboard:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// 📌 AUTO-SELECT DASHBOARD BASED ON ROLE
export const getDashboard = (req, res) => {
  if (req.user.role === "student") return getStudentDashboard(req, res);
  if (req.user.role === "teacher") return getTeacherDashboard(req, res);
  if (req.user.role === "admin") return getAdminDashboard(req, res);

  return res.status(400).json({
    success: false,
    message: "Unknown role",
  });
};
