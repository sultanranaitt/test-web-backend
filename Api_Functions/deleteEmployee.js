const User = require('../Db_Functions/models/User');

async function deleteEmployee(req, res) {
  try {
    const id = req.params.id || (req.body && req.body.id);
    if (!id) return res.status(400).json({ error: 'Missing `id` parameter' });

    const deleted = await User.findByIdAndDelete(id).exec();
    if (!deleted) return res.status(404).json({ error: 'Employee not found' });

    return res.status(200).json({ message: 'Employee deleted', employee: deleted });
  } catch (err) {
    console.error('deleteEmployee error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { deleteEmployee };