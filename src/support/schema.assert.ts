import assert, { AssertionError } from 'node:assert';
import type { ObjectSchema } from 'joi';

/**
 * Valida o corpo de uma resposta contra um schema Joi (teste de contrato).
 * Acumula todas as violações (abortEarly: false) para que o relatório mostre
 * o contrato inteiro quebrado, e não apenas o primeiro campo divergente.
 */
export function expectSchema(body: unknown, schema: ObjectSchema): void {
  const { error } = schema.validate(body, { abortEarly: false });
  if (error) {
    throw new AssertionError({
      message: `Contrato violado: ${error.details.map((d) => d.message).join('; ')}`,
    });
  }
}

/**
 * Comprova que o schema realmente exige os campos informados: remove um campo
 * por vez de um corpo válido e verifica que a validação passa a falhar.
 *
 * Sem esta checagem, um campo declarado como opcional por engano passaria
 * despercebido e o teste de contrato daria uma falsa sensação de cobertura,
 * já que uma resposta incompleta continuaria sendo aceita.
 */
export function expectCamposObrigatorios(
  corpoValido: Record<string, unknown>,
  schema: ObjectSchema,
  campos: string[],
): void {
  for (const campo of campos) {
    const corpoIncompleto = { ...corpoValido };
    delete corpoIncompleto[campo];

    const { error } = schema.validate(corpoIncompleto, { abortEarly: false });
    assert.ok(error, `o schema deveria exigir o campo "${campo}", mas aceitou a resposta sem ele`);
  }
}
