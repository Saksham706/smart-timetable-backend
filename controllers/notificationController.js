import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { notifyClass } from '../utils/notificationHelper.js';
import { sendEmail } from "../utils/emailSender.js";

export const sendNotification = async (req, res) => {
  try {
    const { title, message, targetClass, type, sentByName } = req.body;

    // ------------------------------
    // 1. FIX: Attachment URL creation
    // ------------------------------
    let attachmentURL = null;

    if (req.file) {
      attachmentURL = `${process.env.BACKEND_URL}/uploads/notifications/${req.file.filename}`;
      console.log("Attachment URL => ", attachmentURL);
    }

    // ---------------------------------------------------
    // 2. Send notification inside system (database + class)
    // ---------------------------------------------------
    await notifyClass(
      targetClass,
      title,
      `[${sentByName || req.user.name}] ${message}`,
      type,
      attachmentURL
    );

    // -------------------------------
    // 3. Save notification for sender
    // -------------------------------
    const notificationRecord = new Notification({
      recipient: req.user._id,
      title,
      message,
      type,
      attachment: attachmentURL
    });

    await notificationRecord.save();

    // -------------------------
    // 4. Email all students
    // -------------------------
    const students = await User.find({ class: targetClass });

    for (const student of students) {
      await sendEmail(
        student.email,
        `New Notification: ${title}`,
        `
          <h3>${title}</h3>
          <p>${message}</p>
          ${attachmentURL ? `<a href="${attachmentURL}">Download Attachment</a>` : ""}
        `,
        attachmentURL   // <-- Add this
      );
    }

    // -------------------------
    // 5. Send response to admin
    // -------------------------
    res.status(201).json({
      success: true,
      message: "Notification sent successfully",
      data: notificationRecord
    });

  } catch (error) {
    console.log("Error Sending Notification:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = notifications.filter(n => !n.read).length;

    res.status(200).json({
      success: true,
      unreadCount,
      data: notifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications'
    });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking notification as read'
    });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { read: true }
    );


    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking all as read'
    });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting notification'
    });
  }
};

export const clearReadNotifications = async (req, res) => {
  try {
    const result = await Notification.deleteMany({
      recipient: req.user._id,
      read: true
    });

    console.log(`✅ Deleted ${result.deletedCount} read notifications`);

    res.status(200).json({
      success: true,
      message: 'Read notifications cleared'
    });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing notifications'
    });
  }
};
