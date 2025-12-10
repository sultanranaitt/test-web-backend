const User = require('../Db_Functions/models/User');
const Account = require('../Db_Functions/models/Account');
// public endpoint: no admin required

function isValidString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

function isValidNumber(v) {
  return typeof v === 'number' && Number.isFinite(v);
}

async function registerEmployee(req, res) {
  try {
    const { name, age, class: className, subject, attendance, email, password } = req.body || {};

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
    if (!isValidString(email) || !isValidString(password)) {
      return res.status(400).json({ error: 'Missing email or password for employee account' });
    }

    // Create employee account in Account collection so they can login
    // Use email local-part as username fallback
    const usernameBase = email.split('@')[0];
    let username = usernameBase;
    let counter = 0;
    while (await Account.exists({ username })) {
      counter += 1;
      username = `${usernameBase}${counter}`;
    }

    const account = await Account.create({
      name: name.trim(),
      username,
      email: email.trim().toLowerCase(),
      password,
      role: 'employee',
    });

    const newUser = await User.create({
      name: name.trim(),
      age,
      class: className.trim(),
      subject: subject.trim(),
      attendance,
      email: email.trim().toLowerCase(),
      password,
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

    return res.status(201).json({ message: 'Employee registered', employee, accountId: account._id });
  } catch (err) {
    console.error('registerEmployee error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  registerEmployee,
};
