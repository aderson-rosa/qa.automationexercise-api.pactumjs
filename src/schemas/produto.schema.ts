import Joi from 'joi';

/**
 * Contrato da resposta de cadastro de produto com sucesso (201):
 * mesma estrutura do cadastro de usuário, validada de forma independente
 * para que uma mudança em um contrato não passe despercebida no outro.
 */
export const cadastroProdutoSchema = Joi.object({
  message: Joi.string().valid('Cadastro realizado com sucesso').required(),
  _id: Joi.string().alphanum().length(16).required(),
});
