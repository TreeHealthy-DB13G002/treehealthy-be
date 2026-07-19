import Joi from "joi";

export const registerSchema = Joi.object({
  fullname: Joi.string().max(255).required(),
  username: Joi.string().alphanum().min(3).max(100).required(),
  password: Joi.string().min(6).required(),
  confirm_password: Joi.string() // Diubah dari confirmPassword ke snake_case
    .valid(Joi.ref("password"))
    .required()
    .messages({
      "any.only": "Konfirmasi kata sandi tidak cocok.",
    }),
});

export const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
});
