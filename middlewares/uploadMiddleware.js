import multer from "multer";
import path from "path";

// Storage: save files in /uploads/notifications
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/notifications");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

// Allow only PDFs (extend if needed)
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["application/pdf"];
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error("Only PDF files are allowed"), false);
  }
  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});
