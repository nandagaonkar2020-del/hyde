const express = require('express');
const User = require('../models/User');
const { requireAdmin } = require('../middleware/auth');
const router = express.Router();

// GET all users
router.get('/', async (req, res) => {
  const users = await User.find().select('-password');
  res.json(users);
});

// GET one user
router.get('/:id', async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

// CREATE user (admin only)
router.post('/', requireAdmin, async (req, res) => {
  const { name, email, password, role } = req.body;
  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ message: 'Email already exists' });
  const newUser = new User({ name, email, password, role });
  await newUser.save();
  res.status(201).json({ message: 'User created' });
});

// UPDATE user
router.put('/:id', requireAdmin, async (req, res) => {
  const { name, role } = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, { name, role }, { new: true });
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

// DELETE user
router.delete('/:id', requireAdmin, async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: 'User deleted' });
});

module.exports = router;
