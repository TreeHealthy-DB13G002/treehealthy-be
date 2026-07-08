import Joi from 'joi';

export const registerSchema = Joi.object({
  fullname: Joi.string().max(255).required(),
  username: Joi.string().alphanum().min(3).max(100).required(),
  password: Joi.string().min(6).required(),
});

export const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
});

export const profileSchema = Joi.object({
  activities: Joi.string().valid('working', 'not_working', 'Freelance', 'Household', 'Student', 'Retired').required(),
  age: Joi.number().integer().min(18).max(120).required(), // Menerima umur asli, diubah ke skala oleh BE
  gender: Joi.number().valid(0, 1).required(), // 0 = female, 1 = male
  height: Joi.number().positive().required(),
  weight: Joi.number().positive().required(),
  family_diseases: Joi.array().items(Joi.string().valid('diabetes', 'hipertensi', 'jantung/kronis')).default([]),
});