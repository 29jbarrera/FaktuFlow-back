const { cloudinary, storage } = require("../utils/cloudinary");
const multer = require("multer");
const path = require("path");

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|jpg|jpeg|png/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten archivos PDF, JPG o PNG"));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

module.exports = { upload };
