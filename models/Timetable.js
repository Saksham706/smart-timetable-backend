import mongoose from 'mongoose';
const timetableSchema = new mongoose.Schema(
  {
    class: { type: String, required: true },
    courseCode: { type: String, required: true },    // New course code field
    group: { type: String, default: 'A' },            // New group field, defaulting to 'A'
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    subject: { type: String, required: true },
    day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    location: { type: String, required: true },
    semester: { type: String, default: 'Fall 2025' }
  },
  { timestamps: true }
);
export default mongoose.model('Timetable', timetableSchema);