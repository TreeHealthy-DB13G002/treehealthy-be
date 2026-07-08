import jwt from 'jsonwebtoken';
import AuthenticationError from '../exceptions/AuthenticationError.js';

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AuthenticationError('Akses ditolak. Token tidak disediakan atau format salah.'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_KEY);
    req.user = { id: decoded.id, username: decoded.username };
    next();
  } catch (error) {
    next(new AuthenticationError('Token tidak valid atau telah kedaluwarsa.'));
  }
};

export default authMiddleware;