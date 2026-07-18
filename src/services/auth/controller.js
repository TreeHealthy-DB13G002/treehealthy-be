import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import UserRepository from './repositories.js';
import { registerSchema, loginSchema } from './validator.js';
import InvariantError from '../../exceptions/InvariantError.js';
import AuthenticationError from '../../exceptions/AuthenticationError.js';

class AuthController {
  async register(req, res, next) {
    try {
      const { error, value } = registerSchema.validate(req.body);
      if (error) {
        throw new InvariantError(error.details[0].message);
      }

      const { fullname, username, password } = value;

      const userExists = await UserRepository.findUserByUsername(username);
      if (userExists) {
        throw new InvariantError('Username sudah terdaftar.');
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await UserRepository.createUser(fullname, username, hashedPassword);

      return res.status(201).json({
        status: 'success',
        message: 'Registrasi berhasil.',
        data: {
          userId: newUser.id,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { error, value } = loginSchema.validate(req.body);
      if (error) {
        throw new InvariantError(error.details[0].message);
      }

      const { username, password } = value;
      const user = await UserRepository.findUserByUsername(username);

      if (!user) {
        throw new AuthenticationError('Kredensial yang Anda berikan salah.');
      }

      const isPasswordMatch = await bcrypt.compare(password, user.password);
      if (!isPasswordMatch) {
        throw new AuthenticationError('Kredensial yang Anda berikan salah.');
      }

      const token = jwt.sign(
        { id: user.id, username: user.username },
        process.env.ACCESS_TOKEN_KEY,
        { expiresIn: '1d' }
      );

      const profile = await UserRepository.findProfileByUserId(user.id);
      const hasProfile = !!profile;

      return res.status(200).json({
        status: 'success',
        message: 'Login berhasil.',
        data: {
          token,
          hasProfile,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();