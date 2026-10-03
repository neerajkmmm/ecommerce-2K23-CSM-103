const jwt = require('jsonwebtoken');

function adminToken() {
  return jwt.sign({ sub: 1, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

function customerToken() {
  return jwt.sign({ sub: 2, role: 'customer' }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

module.exports = { adminToken, customerToken };
