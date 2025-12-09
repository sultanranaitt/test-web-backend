const User = require('../Db_Functions/models/User');

async function updateEmployee(req, res) {
  try {
    const { id, name, age, class: className, subject, attendance } = req.body || {};
    if (!id) return res.status(400).json({ error: 'Missing `id` in request body' });

    const updateData = {};
    if (typeof name === 'string' && name.trim().length) updateData.name = name.trim();
    if (typeof age === 'number' && Number.isFinite(age)) updateData.age = age;
    if (typeof className === 'string' && className.trim()) updateData.class = className.trim();
    if (typeof subject === 'string' && subject.trim()) updateData.subject = subject.trim();
    if (attendance !== undefined && attendance !== null) updateData.attendance = String(attendance).trim();

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No valid fields provided to update' });
    }

    const updated = await User.findByIdAndUpdate(id, updateData, { new: true }).exec();
    if (!updated) return res.status(404).json({ error: 'Employee not found' });

    return res.status(200).json({ message: 'Employee updated', employee: updated });
  } catch (err) {
    console.error('updateEmployee error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { updateEmployee };