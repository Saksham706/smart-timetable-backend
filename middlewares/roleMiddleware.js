export const onlyAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: `Only admins can access this route. Your role: ${req.user.role}`
    });
  }
  next();
};

// ✅ NEW: Admin OR Teacher
export const onlyAdminOrTeacher = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated'
    });
  }

  if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
    return res.status(403).json({
      success: false,
      message: 'Only admins and teachers can access this route'
    });
  }
  next();
};

export const onlyTeacher = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated'
    });
  }

  if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Only teachers can access this route'
    });
  }
  next();
};

export const onlyStudent = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated'
    });
  }

  if (req.user.role !== 'student') {
    return res.status(403).json({
      success: false,
      message: 'Only students can access this route'
    });
  }
  next();
};
