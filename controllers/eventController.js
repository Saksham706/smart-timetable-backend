import Event from '../models/Event.js';
import User from '../models/User.js';

// ✅ CREATE EVENT
export const createEvent = async (req, res) => {
  try {
    const eventData = {
      ...req.body,
      createdBy: req.user._id
    };

    // Auto-generate serial number
    const lastEvent = await Event.findOne().sort({ serialNumber: -1 });
    eventData.serialNumber = lastEvent ? lastEvent.serialNumber + 1 : 1;

    const event = new Event(eventData);
    await event.save();

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      event
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating event',
      error: error.message
    });
  }
};

// ✅ GET ALL EVENTS
export const getAllEvents = async (req, res) => {
  try {
    const { 
      status, 
      schoolName, 
      levelOfEvents,
      search 
    } = req.query;

    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (schoolName) filter.schoolName = schoolName;
    if (levelOfEvents) filter.levelOfEvents = levelOfEvents;
    if (search) {
      filter.$or = [
        { eventName: { $regex: search, $options: 'i' } },
        { objective: { $regex: search, $options: 'i' } }
      ];
    }

    const events = await Event.find(filter)
      .populate('createdBy', 'name email')
      .populate('participants.userId', 'name email class')
      .sort({ eventStartDate: -1 });

    res.status(200).json({
      success: true,
      count: events.length,
      events
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching events',
      error: error.message
    });
  }
};

// ✅ GET EVENT BY ID
export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'name email role')
      .populate('participants.userId', 'name email class studentId');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.status(200).json({
      success: true,
      event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching event',
      error: error.message
    });
  }
};

// ✅ UPDATE EVENT
export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating event',
      error: error.message
    });
  }
};

// ✅ DELETE EVENT
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting event',
      error: error.message
    });
  }
};

// ✅ REGISTER FOR EVENT
export const registerForEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if registration deadline passed
    if (event.registrationDeadline && new Date() > event.registrationDeadline) {
      return res.status(400).json({
        success: false,
        message: 'Registration deadline has passed'
      });
    }

    const currentUserId = req.user._id.toString();

    // If already registered, return 200 (idempotent)
    const alreadyRegistered = event.participants.some(p => {
      // p.userId may be ObjectId, so convert to string for comparison
      return String(p.userId) === currentUserId;
    });

    if (alreadyRegistered) {
      // Option A: return 200 with success true and event (safer UX)
      return res.status(200).json({
        success: true,
        message: 'Already registered for this event',
        event
      });
    }

    // Register participant
    const participantData = {
      userId: req.user._id,
      name: req.user.name,
      email: req.user.email,
      studentId: req.user.studentId || req.user.employeeId,
      class: req.user.class
    };

    await event.registerParticipant(participantData);

    // load populated fields if you prefer (optional)
    const updatedEvent = await Event.findById(event._id).populate('participants.userId', 'name email class');

    res.status(200).json({
      success: true,
      message: 'Successfully registered for event',
      event: updatedEvent
    });
  } catch (error) {
    // If registerParticipant throws e.g. "Event is full" keep using 400
    const status = /full/i.test(error.message) ? 400 : 400;
    res.status(status).json({
      success: false,
      message: error.message
    });
  }
};


// ✅ UNREGISTER FROM EVENT
export const unregisterFromEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Remove participant
    event.participants = event.participants.filter(
      p => p.userId.toString() !== req.user._id.toString()
    );

    await event.save();

    res.status(200).json({
      success: true,
      message: 'Successfully unregistered from event',
      event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error unregistering from event',
      error: error.message
    });
  }
};

// ✅ GET UPCOMING EVENTS
export const getUpcomingEvents = async (req, res) => {
  try {
    const events = await Event.find({
      eventStartDate: { $gte: new Date() },
      status: 'Upcoming'
    })
      .populate('createdBy', 'name email')
      .sort({ eventStartDate: 1 })
      .limit(10);

    res.status(200).json({
      success: true,
      count: events.length,
      events
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching upcoming events',
      error: error.message
    });
  }
};

// ✅ GET MY EVENTS (Student/Teacher)
export const getMyEvents = async (req, res) => {
  try {
    const events = await Event.find({
      'participants.userId': req.user._id
    })
      .populate('createdBy', 'name email')
      .sort({ eventStartDate: -1 });

    res.status(200).json({
      success: true,
      count: events.length,
      events
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching your events',
      error: error.message
    });
  }
};

// ✅ GET EVENT STATISTICS
export const getEventStatistics = async (req, res) => {
  try {
    const totalEvents = await Event.countDocuments();
    const upcomingEvents = await Event.countDocuments({ status: 'Upcoming' });
    const ongoingEvents = await Event.countDocuments({ status: 'Ongoing' });
    const completedEvents = await Event.countDocuments({ status: 'Completed' });

    // Events by school
    const eventsBySchool = await Event.aggregate([
      {
        $group: {
          _id: '$schoolName',
          count: { $sum: 1 }
        }
      }
    ]);

    // Events by level
    const eventsByLevel = await Event.aggregate([
      {
        $group: {
          _id: '$levelOfEvents',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      statistics: {
        total: totalEvents,
        upcoming: upcomingEvents,
        ongoing: ongoingEvents,
        completed: completedEvents,
        bySchool: eventsBySchool,
        byLevel: eventsByLevel
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
};