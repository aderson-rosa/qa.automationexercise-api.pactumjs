import Joi from 'joi';

/**
 * Contrato da resposta de cadastro de usuário com sucesso (201):
 * mensagem fixa e _id alfanumérico de 16 caracteres, sem campos extras.
 */
export const cadastroUsuarioSchema = Joi.object({
  message: Joi.string().valid('Cadastro realizado com sucesso').required(),
  _id: Joi.string().alphanum().length(16).required(),
});
