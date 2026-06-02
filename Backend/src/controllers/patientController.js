const PatientProfile = require('../models/PatientProfile');
const User = require('../models/User');

// Create or update patient profile (legacy + extended fields)
exports.createOrUpdateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      medicalHistory, allergies, chronicDiseases, currentMedications,
      bloodGroup, height, weight, address, emergencyContact,
    } = req.body;

    const update = {
      medicalHistory: medicalHistory || '',
      allergies: Array.isArray(allergies) ? allergies : (allergies ? [allergies] : []),
      chronicDiseases: Array.isArray(chronicDiseases) ? chronicDiseases : (chronicDiseases ? [chronicDiseases] : []),
      currentMedications: Array.isArray(currentMedications) ? currentMedications : (currentMedications ? [currentMedications] : []),
    };
    if (bloodGroup !== undefined) update.bloodGroup = bloodGroup;
    if (height !== undefined) update.height = height;
    if (weight !== undefined) update.weight = weight;
    if (address !== undefined) update.address = address;
    if (emergencyContact !== undefined) update.emergencyContact = emergencyContact;

    const profile = await PatientProfile.findOneAndUpdate(
      { user: userId },
      { $set: update, $setOnInsert: { user: userId } },
      { new: true, upsert: true }
    );

    // Mark profile completed if key fields present
    const completed = !!(profile.bloodGroup && profile.emergencyContact?.name);
    await User.findByIdAndUpdate(userId, { profileCompleted: completed });

    res.json({ success: true, message: 'Profile saved', data: { profile } });
  } catch (err) {
    next(err);
  }
};

// Get profile for authenticated patient
exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const profile = await PatientProfile.findOne({ user: userId }).populate('user', 'name email role avatarUrl profileCompleted');
    if (!profile) {
      return res.json({
        success: true,
        message: 'Profile not found yet',
        data: {
          profile: {
            medicalHistory: '', allergies: [], chronicDiseases: [],
            currentMedications: [], bloodGroup: '', height: null, weight: null,
            address: '', emergencyContact: { name: '', phone: '' }, documents: [],
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
