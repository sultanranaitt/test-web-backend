const Account = require('../Db_Functions/models/Account');
const { generateToken } = require('./authHelpers');

async function register(req, res) {
  try {
    console.log('auth.register body:', req.body);
    // Public account creation: accepts name, email, password and optional role
    const { name, email, password, role } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Missing name, email, or password' });
    }

    // derive internal username from name to keep a unique handle
    const usernameBase = name.trim().toLowerCase().replace(/\s+/g, '');
    let username = usernameBase;
    let counter = 0;
    while (await Account.exists({ username })) {
      counter += 1;
      username = `${usernameBase}${counter}`;
    }

    const existing = await Account.findOne({ $or: [{ username }, { email }] });
    if (existing) {
      return res.status(409).json({ error: 'Name-derived username or email already exists' });
    }

    // Always create an admin account via this register endpoint
    const account = await Account.create({
      name: name.trim(),
      username,
      email: email.trim().toLowerCase(),
      password,
      role: 'admin',
    });

    return res.status(201).json({
      message: 'Account registered successfully',
      account: { id: account._id, name: account.name || account.username, email: account.email, role: account.role },
    });
  } catch (err) {
    console.error('register error:', err.message || err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}

async function login(req, res) {
  try {
    console.log('auth.login body:', req.body);
    // login now expects `email` and `password`
    const { email: loginEmail, password: loginPassword } = req.body || {};
    if (!loginEmail || !loginPassword) {
      return res.status(400).json({ error: 'Missing email or password' });
    }

    // Try Account collection first (admins and employee accounts)
    const account = await Account.findOne({ email: loginEmail.trim().toLowerCase() });
    if (account) {
      const isMatch = await account.comparePassword(loginPassword);
      if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });
      const token = generateToken(account._id, account.role);
      return res.status(200).json({ message: 'Login successful', token, account: { id: account._id, name: account.name || account.username, role: account.role } });
    }

    // Fallback: check User collection (employees may have credentials there)
    const User = require('../Db_Functions/models/User');
    const bcrypt = require('bcryptjs');
    const user = await User.findOne({ email: loginEmail.trim().toLowerCase() }).exec();
    if (!user || !user.password) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(loginPassword, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    // Create a token for this user as employee role
    const token = generateToken(user._id, 'employee');
    return res.status(200).json({ message: 'Login successful', token, account: { id: user._id, name: user.name, role: 'employee' } });
  } catch (err) {
    console.error('login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  register,
  login,
};
