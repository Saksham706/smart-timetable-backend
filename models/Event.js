import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  // ✅ BASIC INFO
  serialNumber: {
    type: Number,
    required: true
  },
  schoolName: {
    type: String,
    required: true,
    enum: ['SOET', 'SOBAS', 'SOL', 'SOM', 'SOPH', 'SOSS']
  },
  eventName: {
    type: String,
    required: true
  },
  
  // ✅ DATES
  eventStartDate: {
    type: Date,
    required: true
  },
  eventEndDate: {
    type: Date,
    required: true
  },
  
  // ✅ EVENT DETAILS
  preferredUpdateFrequency: {
    type: String,
    enum: ['Daily', 'Weekly', 'Monthly', 'One-time']
  },
  eventDuration: {
    type: String, // "Full day", "Half day", "1-2 Hrs"
    required: true
  },
  
  // ✅ NAAC DETAILS
  levelOfEvents: {
    type: String,
    enum: ['Inter-University', 'State', 'National', 'International'],
    required: true
  },
  naacRequirement: {
    type: String // e.g., "5.3.3", "6.3.3"
  },
  
  // ✅ SDG GOALS
  sdgGoals: [{
    type: String // e.g., "SDG 4", "SDG 9"
  }],
  sdgOutcomes: {
    type: String
  },
  
  // ✅ CATEGORIZATION
  schoolEventType: {
    type: String,
    enum: [
      'Inter-University',
      'Intra-University',
      'Conference',
      'Symposium',
      'Workshop',
      'Seminar',
      'Hackathon',
      'Competition',
      'FDP',
      'Other'
    ]
  },
  categorization: {
    type: String // "hack-a-thon", "FDP", "symposium", etc.
  },
  
  // ✅ ORGANIZERS
  organizersFacultyIncharge: [{
    name: String,
    employeeId: String
  }],
  
  // ✅ MODE & TARGET
  modeOfEvent: {
    type: String,
    enum: ['Online', 'Offline', 'Hybrid']
  },
  targetGroup: {
    type: String // "Engineering students", "faculty", etc.
  },
  
  // ✅ OBJECTIVES
  objective: {
    type: String,
    required: true
  },
  
  // ✅ METHODOLOGY
  methodology: {
    type: String
  },
  
  // ✅ EVALUATION
  evaluation: {
    type: String
  },
  
  // ✅ EXPECTED OUTCOME
  expectedOutcome: {
    type: String
  },
  
  // ✅ PROCESSES
  toolsAndProcesses: {
    type: String
  },
  
  // ✅ REGISTRATION
  registrationLink: {
    type: String
  },
  registrationDeadline: {
    type: Date
  },
  maxParticipants: {
    type: Number
  },
  
  // ✅ PARTICIPANTS
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    email: String,
    studentId: String,
    class: String,
    registeredAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // ✅ STATUS
  status: {
    type: String,
    enum: ['Upcoming', 'Ongoing', 'Completed', 'Cancelled'],
    default: 'Upcoming'
  },
  
  // ✅ ATTACHMENTS
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileType: String
  }],
  
  // ✅ CREATED BY
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // ✅ TIMESTAMPS
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// ✅ PRE-SAVE MIDDLEWARE
eventSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// ✅ VIRTUAL: Participant Count
eventSchema.virtual('participantCount').get(function() {
  return this.participants ? this.participants.length : 0;
});

// ✅ METHOD: Check if event is full
eventSchema.methods.isFull = function() {
  if (!this.maxParticipants) return false;
  return this.participants.length >= this.maxParticipants;
};

// ✅ METHOD: Register participant
eventSchema.methods.registerParticipant = function(userData) {
  if (this.isFull()) {
    throw new Error('Event is full');
  }
  
  // Check if already registered
  const alreadyRegistered = this.participants.some(
    p => p.userId.toString() === userData.userId.toString()
  );
  
  if (alreadyRegistered) {
    throw new Error('Already registered for this event');
  }
  
  this.participants.push(userData);
  return this.save();
};

const Event = mongoose.model('Event', eventSchema);
export default Event;