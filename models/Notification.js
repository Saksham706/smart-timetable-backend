import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['assignment','announcement','exam','urgent','general'],
      default: 'general'
    },
    read: {
      type: Boolean,
      default: false
    },
    attachment: {
    type: String,
    default: null
  }
  },
  { timestamps: true }
);

export default mongoose.model('Notification', notificationSchema);
