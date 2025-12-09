const User = require('../Db_Functions/models/User');

function isValidString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

function isValidNumber(v) {
  return typeof v === 'number' && Number.isFinite(v);
}

async function registerEmployee(req, res) {
  try {
    const { name, age, class: className, subject, attendance } = req.body || {};

    if (!isValidString(name)) {
      return res.status(400).json({ error: 'Invalid or missing name' });
    }
    if (!isValidNumber(age)) {
      return res.status(400).json({ error: 'Invalid or missing age' });
    }
    if (!isValidString(className)) {
      return res.status(400).json({ error: 'Invalid or missing class' });
    }
    if (!isValidString(subject)) {
      return res.status(400).json({ error: 'Invalid or missing subject' });
    }
    if (!isValidString(attendance)) {
      return res.status(400).json({ error: 'Invalid or missing attendance' });
    }

    const newUser = await User.create({
      name: name.trim(),
      age,
      class: className.trim(),
      subject: subject.trim(),
      attendance,
    });

    const employee = {
      id: newUser._id,
      name: newUser.name,
      age: newUser.age,
      class: newUser.class,
      subject: newUser.subject,
      attendance: newUser.attendance,
      createdAt: newUser.createdAt,
    };

    return res.status(201).json({ message: 'Employee registered', employee });
  } catch (err) {
    console.error('registerEmployee error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  registerEmployee,
};
