const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function generateToken(accountId, role) {
  return jwt.sign({ accountId, role }, JWT_SECRET, { expiresIn: '7d' });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

function getTokenFromHeader(authHeader) {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    return parts[1];
  }
  return null;
}

// Express middleware: attach account to req if token provided
async function attachAccount(req, res, next) {
  try {
    const token = getTokenFromHeader(req.headers.authorization || req.headers.Authorization);
    if (!token) {
      req.account = null;
      return next();
    }
    const decoded = verifyToken(token);
    if (!decoded || !decoded.accountId) {
      req.account = null;
      return next();
    }
    // require inside function to avoid circular requires at module load
    const Account = require('../Db_Functions/models/Account');
    const account = await Account.findById(decoded.accountId).exec();
    req.account = account || null;
    return next();
  } catch (err) {
    console.error('attachAccount error:', err);
    req.account = null;
    return next();
  }
}

module.exports = {
  generateToken,
  verifyToken,
  getTokenFromHeader,
  attachAccount,
};
