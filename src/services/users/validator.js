import Joi from 'joi';

export const registerSchema = Joi.object({
  fullname: Joi.string().max(255).required(),
  username: Joi.string().alphanum().min(3).max(100).required(),
  password: Joi.string().min(6).required(),
  confirm_password: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': 'Konfirmasi kata sandi tidak cocok.',
    }),
});

export const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
});

// Skema untuk Halaman Assessment (tanpa fullname & username)
export const assessmentSchema = Joi.object({
  age: Joi.number().integer().min(18).max(120).required(),
  height: Joi.number().positive().required(),
  weight: Joi.number().positive().required(),
  gender: Joi.number().valid(0, 1).required(), // 0 = female, 1 = male
  activities: Joi.string().valid('working', 'not_working', 'freelance', 'household', 'student', 'retired').required(),
  family_diseases: Joi.array().items(Joi.string().valid('diabetes', 'hipertensi', 'jantung/kronis')).default([]),
});

// Skema untuk Halaman Update Profile (termasuk fullname & username)
export const profileUpdateSchema = Joi.object({
  fullname: Joi.string().max(255).required(),
  username: Joi.string().alphanum().min(3).max(100).required(),
  age: Joi.number().integer().min(18).max(120).required(),
  height: Joi.number().positive().required(),
  weight: Joi.number().positive().required(),
  gender: Joi.number().valid(0, 1).required(),
  activities: Joi.string().valid('working', 'not_working', 'freelance', 'household', 'student', 'retired').required(),
  family_diseases: Joi.array().items(Joi.string().valid('diabetes', 'hipertensi', 'jantung/kronis')).default([]),
});