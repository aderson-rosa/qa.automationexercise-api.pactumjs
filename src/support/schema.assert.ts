import { AssertionError } from 'node:assert';
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
