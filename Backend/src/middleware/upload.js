const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Avatar storage — one image per user, stored in avatars/ folder
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: (req) => ({
    folder: 'medicare/avatars',
    public_id: `avatar_${req.user.id}`,
    overwrite: true,
    transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  }),
});

// Medical document storage — multiple files, stored in documents/ folder
const documentStorage = new CloudinaryStorage({
  cloudinary,
  params: (req) => ({
    folder: 'medicare/documents',
    public_id: `doc_${req.user.id}_${Date.now()}`,
    resource_type: 'auto',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'webp'],
  }),
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  cb(new Error('Only JPEG, PNG, WEBP, or PDF files are allowed'));
};

const imageFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  cb(new Error('Only JPEG, PNG, or WEBP images are allowed'));
};

exports.uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: imageFilter,
}).single('avatar');

exports.uploadDocument = multer({
  storage: documentStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter,
}).single('document');
