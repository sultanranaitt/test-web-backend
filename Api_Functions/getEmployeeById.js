const User = require('../Db_Functions/models/User');

async function getEmployeeById(req, res) {
  try {
    const id = req.params.id || (req.body && req.body.id);
    if (!id) return res.status(400).json({ error: 'Missing `id` parameter' });

    const emp = await User.findById(id).exec();
    if (!emp) return res.status(404).json({ error: 'Employee not found' });

    return res.status(200).json({
      message: 'Employee fetched',
      employee: {
        id: emp._id,
        name: emp.name,
        age: emp.age,
        class: emp.class,
        subject: emp.subject,
        attendance: emp.attendance,
        createdAt: emp.createdAt,
      },
    });
  } catch (err) {
    console.error('getEmployeeById error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { getEmployeeById };