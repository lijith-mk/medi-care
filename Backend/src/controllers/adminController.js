const User = require('../models/User');
const Appointment = require('../models/Appointment');
const bcrypt = require('bcryptjs');

exports.createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, age, gender } = req.body;

    const allowedRoles = ['patient', 'doctor', 'receptionist', 'lab', 'admin'];
    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'name, email, password, and role are required' });
    }
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: `Role must be one of: ${allowedRoles.join(', ')}` });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ success: false, message: 'Email already in use' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, role, phone, age, gender });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { user: { id: user._id, name: user.name, email: user.email, role: user.role, isActive: user.isActive } },
    });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ success: false, message: 'Email already in use' });
    next(err);
  }
};

exports.getAllUsers = async (req, res, next) => {
  try {
    const { role, q = '', page = '1', limit = '10' } = req.query;
    const filter = {};
    const allowedRoles = ['patient', 'doctor', 'receptionist', 'lab', 'admin'];
    if (role) {
      if (!allowedRoles.includes(role)) {
        return res.status(400).json({ success: false, message: 'Invalid role filter' });
      }
      filter.role = role;
    }

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ];
    }

    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const limitNumber = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
    const skip = (pageNumber - 1) * limitNumber;

    const [users, total] = await Promise.all([
      User.find(filter)
      .select('name email role isActive createdAt updatedAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber),
      User.countDocuments(filter),
    ]);

    res.json({
      success: true,
      message: 'Users retrieved',
      data: {
        users,
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total,
          totalPages: Math.max(Math.ceil(total / limitNumber), 1),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.id;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'admin') return res.status(400).json({ success: false, message: 'Admin accounts cannot be disabled' });
    if (user._id.toString() === currentUserId) {
      return res.status(400).json({ success: false, message: 'You cannot disable your own account' });
    }

    if (user.isActive) {
      const activeAdminCount = await User.countDocuments({ role: 'admin', isActive: true });
      if (user.role === 'admin' && activeAdminCount <= 1) {
        return res.status(400).json({ success: false, message: 'At least one active admin must remain enabled' });
      }
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.isActive ? 'enabled' : 'disabled'}`,
      data: { user: { id: user._id, name: user.name, email: user.email, role: user.role, isActive: user.isActive } },
    });
  } catch (err) {
    next(err);
  }
};

exports.getAllAppointments = async (req, res, next) => {
  try {
    const { status, from, to, q = '', page = '1', limit = '10' } = req.query;
    const filter = {};

    const allowedStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (status) {
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status filter' });
      }
      filter.status = status;
    }

    if (from || to) {
      filter.appointmentDate = {};
      if (from) {
        const fromDate = new Date(from);
        if (Number.isNaN(fromDate.getTime())) {
          return res.status(400).json({ success: false, message: 'Invalid from date' });
        }
        filter.appointmentDate.$gte = fromDate;
      }
      if (to) {
        const toDate = new Date(to);
        if (Number.isNaN(toDate.getTime())) {
          return res.status(400).json({ success: false, message: 'Invalid to date' });
        }
        filter.appointmentDate.$lte = toDate;
      }
    }

    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const limitNumber = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
    const skip = (pageNumber - 1) * limitNumber;

    const pipeline = [
      { $match: filter },
      { $lookup: { from: 'users', localField: 'patient', foreignField: '_id', as: 'patient' } },
      { $lookup: { from: 'users', localField: 'doctor', foreignField: '_id', as: 'doctor' } },
      { $unwind: '$patient' },
      { $unwind: '$doctor' },
    ];

    if (q) {
      pipeline.push({
        $match: {
          $or: [
            { 'patient.name': { $regex: q, $options: 'i' } },
            { 'patient.email': { $regex: q, $options: 'i' } },
            { 'doctor.name': { $regex: q, $options: 'i' } },
            { 'doctor.email': { $regex: q, $options: 'i' } },
          ],
        },
      });
    }

    pipeline.push(
      { $sort: { appointmentDate: 1 } },
      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: limitNumber },
            {
              $project: {
                _id: 1,
                appointmentDate: 1,
                symptoms: 1,
                status: 1,
                createdBy: 1,
                createdAt: 1,
                updatedAt: 1,
                patient: { _id: '$patient._id', name: '$patient.name', email: '$patient.email', role: '$patient.role' },
                doctor: { _id: '$doctor._id', name: '$doctor.name', email: '$doctor.email', role: '$doctor.role' },
              },
            },
          ],
          meta: [{ $count: 'total' }],
        },
      }
    );

    const [result] = await Appointment.aggregate(pipeline);
    const appointments = result?.data || [];
    const total = result?.meta?.[0]?.total || 0;

    res.json({
      success: true,
      message: 'Appointments retrieved',
      data: {
        appointments,
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total,
          totalPages: Math.max(Math.ceil(total / limitNumber), 1),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getStats = async (req, res, next) => {
  try {
    const [totalUsers, totalPatients, totalDoctors, totalAppointments, pendingCount, confirmedCount, completedCount, cancelledCount] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ role: 'patient' }),
      User.countDocuments({ role: 'doctor' }),
      Appointment.countDocuments({}),
      Appointment.countDocuments({ status: 'pending' }),
      Appointment.countDocuments({ status: 'confirmed' }),
      Appointment.countDocuments({ status: 'completed' }),
      Appointment.countDocuments({ status: 'cancelled' }),
    ]);

    res.json({
      success: true,
      message: 'Stats retrieved',
      data: {
        stats: {
          totalUsers,
          totalPatients,
          totalDoctors,
          totalAppointments,
          appointmentsByStatus: {
            pending: pendingCount,
            confirmed: confirmedCount,
            completed: completedCount,
            cancelled: cancelledCount,
          },
        },
      },
    });
  } catch (err) {
    next(err);
  }
};
