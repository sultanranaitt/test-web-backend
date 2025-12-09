const Account = require('../Db_Functions/models/Account');
const { generateToken } = require('./authHelpers');

async function register(req, res) {
  try {
    console.log('auth.register body:', req.body);
    const { username, email, password, role } = req.body || {};

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Missing username, email, or password' });
    }

    const existing = await Account.findOne({ $or: [{ username }, { email }] });
    if (existing) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }

    const account = await Account.create({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password,
      role: role === 'admin' ? 'admin' : 'employee',
    });

    return res.status(201).json({
      message: 'Account registered successfully',
      account: { id: account._id, username: account.username, email: account.email, role: account.role },
    });
  } catch (err) {
    console.error('register error:', err.message || err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}

async function login(req, res) {
  try {
    console.log('auth.login body:', req.body);
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ error: 'Missing username or password' });
    }

    const account = await Account.findOne({ username });
    if (!account) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await account.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(account._id, account.role);

    return res.status(200).json({
      message: 'Login successful',
      token,
      account: { id: account._id, username: account.username, role: account.role },
    });
  } catch (err) {
    console.error('login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  register,
  login,
};
