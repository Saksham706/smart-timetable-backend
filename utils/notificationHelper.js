import Notification from '../models/Notification.js';
import User from '../models/User.js';

export const notifyClass = async (className, title, message, type) => {
  try {
    const students = await User.find({ class: className, role: 'student' });
    const notifications = students.map(student => ({
      recipient: student._id,
      title,
      message,
      type,
      read: false
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
  } catch (error) {
    console.error('Error notifying class:', error);
  }
};

export const notifyTeacher = async (teacherId, title, message, type) => {
  try {
    await Notification.create({
      recipient: teacherId,
      title,
      message,
      type,
      read: false
    });
  } catch (error) {
    console.error('Error notifying teacher:', error);
  }
};

export const notifyAdmin = async (title, message, type) => {
  try {
    const admins = await User.find({ role: 'admin' });
    const notifications = admins.map(admin => ({
      recipient: admin._id,
      title,
      message,
      type,
      read: false
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
  } catch (error) {
    console.error('Error notifying admins:', error);
  }
};
