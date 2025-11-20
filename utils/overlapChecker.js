import Timetable from '../models/Timetable.js';

export const checkOverlap = async (teacherId, day, startTime, endTime, excludeId = null) => {
  try {
    const query = {
      teacher: teacherId,
      day,
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime }
        }
      ]
    };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const overlap = await Timetable.findOne(query);
    return !!overlap;
  } catch (error) {
    console.error('Error checking overlap:', error);
    return false;
  }
};


export const convertTimeToMinutes = (timeString) => {
  const [time, period] = timeString.split(' ');
  let [hours, minutes] = time.split(':').map(Number);

  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }

  return hours * 60 + minutes;
};
