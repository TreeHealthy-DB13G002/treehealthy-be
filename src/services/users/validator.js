import Joi from 'joi';

export const registerSchema = Joi.object({
  fullname: Joi.string().max(255).required(),
  username: Joi.string().alphanum().min(3).max(100).required(),
  password: Joi.string().min(6).required(),
  confirm_password: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': 'Konfirmasi kata sandi tidak cocok dengan kata sandi yang dimasukkan.',
      'any.required': 'Konfirmasi kata sandi wajib diisi.',
    }),
});

export const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
});

export const profileSchema = Joi.object({
  // Menambahkan fullname dan username untuk kebutuhan pembaruan data dasar
  fullname: Joi.string().max(255).required(),
  username: Joi.string().alphanum().min(3).max(100).required(),
  
  activities: Joi.string().valid('working', 'not_working', 'freelance', 'household', 'student', 'retired').required(),
  age: Joi.number().integer().min(18).max(120).required(),
  gender: Joi.number().valid(0, 1).required(), // 0 = female, 1 = male
  height: Joi.number().positive().required(),
  weight: Joi.number().positive().required(),
  family_diseases: Joi.array().items(Joi.string().valid('diabetes', 'hipertensi', 'jantung/kronis')).default([]),
});