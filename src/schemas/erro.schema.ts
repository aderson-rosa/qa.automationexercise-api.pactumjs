import Joi from 'joi';

/**
 * Contrato das respostas que trazem uma única mensagem, usado tanto para
 * confirmações (exclusão realizada) quanto para erros de negócio e de
 * autenticação. Vale para todos os recursos, por isso vive fora dos schemas
 * de cada um.
 */
export const respostaComMensagemSchema = Joi.object({
  message: Joi.string().required(),
});

/**
 * Contrato do erro de campos obrigatórios: a API responde um objeto onde cada
 * chave é o campo ausente e o valor é a mensagem correspondente.
 * `pattern` garante que qualquer campo reportado siga o formato de mensagem,
 * e `min(1)` impede que um objeto vazio passe como erro de validação válido.
 */
export const erroCamposObrigatoriosSchema = Joi.object()
  .pattern(Joi.string(), Joi.string().pattern(/é obrigatório$/))
  .min(1);
