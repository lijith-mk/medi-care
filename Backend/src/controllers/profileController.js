const User = require('../models/User');
const PatientProfile = require('../models/PatientProfile');
const DoctorProfile = require('../models/DoctorProfile');
const LabProfile = require('../models/LabProfile');
const ReceptionistProfile = require('../models/ReceptionistProfile');

const modelByRole = {
  patient: PatientProfile,
  doctor: DoctorProfile,
  lab: LabProfile,
  receptionist: ReceptionistProfile,
};

// Fields allowed per role to prevent mass-assignment
const allowedFields = {
  patient: ['medicalHistory', 'allergies', 'chronicDiseases', 'currentMedications',
            'bloodGroup', 'height', 'weight', 'address', 'emergencyContact'],
  doctor: ['specialization', 'department', 'qualification', 'experience',
           'consultationFee', 'availableDays', 'availableTime', 'bio'],
  lab: ['labName', 'labType', 'qualification', 'experience'],
  receptionist: ['deskNumber', 'shift'],
};

function pickFields(body, fields) {
  return fields.reduce((acc, key) => {
    if (body[key] !== undefined) acc[key] = body[key];
    return acc;
  }, {});
}

// Determine if a profile is "complete enough" to dismiss the banner
function isComplete(role, profile) {
  if (!profile) return false;
  if (role === 'patient') return !!(profile.bloodGroup && profile.emergencyContact?.name);
  if (role === 'doctor') return !!(profile.specialization && profile.department && profile.qualification);
  if (role === 'lab') return !!(profile.labName && profile.labType);
  if (role === 'receptionist') return !!(profile.deskNumber && profile.shift);
  return true; // admin has no extra profile
}

// GET /api/profile
exports.getProfile = async (req, res, next) => {
  try {
    const { id, role } = req.user;
    const Model = modelByRole[role];

    // admin has no extended profile — return just user
    if (!Model) {
      const user = await User.findById(id).select('-password');
      return res.json({ success: true, data: { profile: null, user } });
    }

    const [profile, user] = await Promise.all([
      Model.findOne({ user: id }),
      User.findById(id).select('-password'),
    ]);

    res.json({ success: true, data: { profile: profile || null, user } });
  } catch (err) {
    next(err);
  }
};

// PUT /api/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { id, role } = req.user;
    const Model = modelByRole[role];
    if (!Model) return res.status(400).json({ success: false, message: 'No extended profile for this role' });

    const allowed = allowedFields[role] || [];
    const update = pickFields(req.body, allowed);

    const profile = await Model.findOneAndUpdate(
      { user: id },
      { $set: update, $setOnInsert: { user: id } },
      { new: true, upsert: true }
    );

    // Update profileCompleted on User
    const completed = isComplete(role, profile);
    await User.findByIdAndUpdate(id, { profileCompleted: completed });

    res.json({ success: true, message: 'Profile updated', data: { profile } });
  } catch (err) {
    next(err);
  }
};
