const PatientProfile = require('../models/PatientProfile');

// Create or update profile for the authenticated user
exports.createOrUpdateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { medicalHistory, allergies, chronicDiseases } = req.body;

    const update = {
      medicalHistory: medicalHistory || '',
      allergies: Array.isArray(allergies) ? allergies : (allergies ? [allergies] : []),
      chronicDiseases: Array.isArray(chronicDiseases) ? chronicDiseases : (chronicDiseases ? [chronicDiseases] : []),
    };

    const profile = await PatientProfile.findOneAndUpdate(
      { user: userId },
      { $set: update, $setOnInsert: { user: userId } },
      { new: true, upsert: true }
    );

    res.json({ success: true, message: 'Profile saved', data: { profile } });
  } catch (err) {
    next(err);
  }
};

// Get profile for authenticated user
exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const profile = await PatientProfile.findOne({ user: userId }).populate('user', 'name email role');
    if (!profile) {
      return res.json({
        success: true,
        message: 'Profile not found yet',
        data: {
          profile: {
            medicalHistory: '',
            allergies: [],
            chronicDiseases: [],
            user: { _id: userId },
          },
        },
      });
    }
    res.json({ success: true, message: 'Profile retrieved', data: { profile } });
  } catch (err) {
    next(err);
  }
};
