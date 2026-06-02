const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ── helpers ──────────────────────────────────────────────────────────────────
function userPayload(user) {
  return { id: user._id, name: user.name, email: user.email, role: user.role };
}

// ── Register (email/password) ─────────────────────────────────────────────────
exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password, phone, age, gender } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      // If the account was created via Google, tell the user to sign in with Google
      if (existing.authProvider === 'google') {
        return res.status(409).json({ success: false, message: 'This email is linked to a Google account. Please sign in with Google.' });
      }
      return res.status(409).json({ success: false, message: 'Email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    // force role to 'patient' for self-registration
    const user = await User.create({ name, email, password: hashed, role: 'patient', phone, age, gender, authProvider: 'local' });
    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: 'User registered',
      data: { user: userPayload(user) },
      token,
    });
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Email already exists' });
    }
    next(err);
  }
};

// ── Login (email/password) ────────────────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    if (user.isActive === false) {
      return res.status(403).json({ success: false, message: 'Account disabled. Contact support.' });
    }

    // Google-only account — no password set
    if (user.authProvider === 'google' || !user.password) {
      return res.status(401).json({ success: false, message: 'This account uses Google Sign-In. Please sign in with Google.' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = generateToken(user);

    return res.json({
      success: true,
      message: 'Login successful',
      data: { user: userPayload(user) },
      token,
    });
  } catch (err) {
    next(err);
  }
};

// ── Google Sign-In / Sign-Up ──────────────────────────────────────────────────
exports.googleAuth = async (req, res, next) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ success: false, message: 'Google credential is required' });
    }

    // Verify the ID token with Google
    let ticket;
    try {
      ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid Google token' });
    }

    const { sub: googleId, email, name, picture } = ticket.getPayload();

    // Find existing user by googleId or email
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
      // Account exists — check it is not disabled
      if (user.isActive === false) {
        return res.status(403).json({ success: false, message: 'Account disabled. Contact support.' });
      }

      // If found by email but was a local account, link the Google ID
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = 'google';
        if (!user.avatarUrl && picture) user.avatarUrl = picture;
        await user.save();
      }
    } else {
      // New user — create as patient
      user = await User.create({
        name,
        email,
        googleId,
        role: 'patient',
        authProvider: 'google',
        avatarUrl: picture || null,
        // no password for Google users
      });
    }

    const token = generateToken(user);

    return res.json({
      success: true,
      message: user.createdAt === user.updatedAt ? 'Account created' : 'Login successful',
      data: { user: userPayload(user) },
      token,
    });
  } catch (err) {
    next(err);
  }
};

// ── Me ────────────────────────────────────────────────────────────────────────
exports.me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({ user });
  } catch (err) {
    next(err);
  }
};
