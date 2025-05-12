const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const path = require("path");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const userId = req.user.id;
    const extension = file.originalname.split(".").pop().toLowerCase();

    const fileType = file.mimetype === "application/pdf" ? "raw" : "image";

    return {
      folder: `faktuflow/${userId}`,
      allowed_formats: ["jpg", "png", "pdf"],
      public_id: path.parse(file.originalname).name,
      resource_type: extension === "pdf" ? "raw" : "image",
    };
  },
});
module.exports = { cloudinary, storage };
