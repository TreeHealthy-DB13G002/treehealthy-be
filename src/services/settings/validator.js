import Joi from 'joi';

export const settingsUpdateSchema = Joi.object({
  fullname: Joi.string().max(255).required(),
  username: Joi.string().alphanum().min(3).max(100).required(),
  age: Joi.number().integer().min(18).max(120).required(),
  height: Joi.number().positive().required(),
  weight: Joi.number().positive().required(),
  gender: Joi.number().valid(0, 1).required(),
  // Disesuaikan dengan penamaan parameter terbaru dari PDF Halaman 17
  activityLevel: Joi.string().valid('working', 'not_working', 'freelance', 'household', 'student', 'retired').required(),
  familyHistory: Joi.array().items(Joi.string().valid('hypertension', 'diabetes', 'heart_disease')).default([]),
});