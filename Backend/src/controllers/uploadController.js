const User = require('../models/User');
const PatientProfile = require('../models/PatientProfile');
const cloudinary = require('../config/cloudinary');

// Upload or replace avatar for any authenticated user
exports.uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const avatarUrl = req.file.path; // Cloudinary URL from multer-storage-cloudinary

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatarUrl },
      { new: true }
    ).select('-password');

    res.json({ success: true, message: 'Avatar updated', data: { avatarUrl, user } });
  } catch (err) {
    next(err);
  }
};

// Delete avatar for authenticated user
exports.deleteAvatar = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.avatarUrl) {
      const publicId = `medicare/avatars/avatar_${req.user.id}`;
      await cloudinary.uploader.destroy(publicId).catch(() => {}); // best-effort
    }

    user.avatarUrl = null;
    await user.save();

    res.json({ success: true, message: 'Avatar removed' });
  } catch (err) {
    next(err);
  }
};

// Upload a medical document for a patient
exports.uploadDocument = async (req, res, next) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ success: false, message: 'Only patients can upload medical documents' });
    }
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const url = req.file.path;
    const publicId = req.file.filename; // set by CloudinaryStorage
    const originalName = req.file.originalname || 'document';
    const mime = req.file.mimetype || '';

    let type = 'other';
    if (mime.startsWith('image/')) type = 'image';
    else if (mime === 'application/pdf') type = 'pdf';

    const document = { url, publicId, name: originalName, type };

    const profile = await PatientProfile.findOneAndUpdate(
      { user: req.user.id },
      {
        $push: { documents: document },
        $setOnInsert: { user: req.user.id },
      },
      { new: true, upsert: true }
    );

    const addedDoc = profile.documents[profile.documents.length - 1];
    res.status(201).json({ success: true, message: 'Document uploaded', data: { document: addedDoc } });
  } catch (err) {
    next(err);
  }
};

// Delete a medical document
exports.deleteDocument = async (req, res, next) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ success: false, message: 'Only patients can delete their documents' });
    }

    const { docId } = req.params;
    const profile = await PatientProfile.findOne({ user: req.user.id });
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });

    const doc = profile.documents.id(docId);
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });

    // Remove from Cloudinary
    if (doc.publicId) {
      const resourceType = doc.type === 'pdf' ? 'raw' : 'image';
      await cloudinary.uploader.destroy(doc.publicId, { resource_type: resourceType }).catch(() => {});
    }

    profile.documents.pull(docId);
    await profile.save();

    res.json({ success: true, message: 'Document deleted' });
  } catch (err) {
    next(err);
  }
};
