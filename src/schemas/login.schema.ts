import Joi from 'joi';

/**
 * Contrato da resposta de login com sucesso (200):
 * mensagem fixa e token no formato "Bearer <jwt>", sem campos extras.
 */
export const loginComSucessoSchema = Joi.object({
  message: Joi.string().valid('Login realizado com sucesso').required(),
  authorization: Joi.string().pattern(/^Bearer\s.+/).required(),
});
