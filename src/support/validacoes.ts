import assert from 'node:assert/strict';
import { step, attachment } from 'allure-js-commons';
import type { ObjectSchema } from 'joi';
import { expectSchema, expectCamposObrigatorios } from './schema.assert';

/**
 * Conjunto de validações que se registram no relatório.
 *
 * Cada função abaixo cria um passo nomeado no Allure e anexa o par
 * esperado/recebido. Sem isso o relatório mostraria apenas o nome da asserção,
 * e quem audita o resultado não conseguiria ver o que de fato foi comparado.
 */

/** Valida o corpo inteiro da resposta, o que também reprova campos extras. */
export async function validarCorpo(recebido: unknown, esperado: unknown): Promise<void> {
  await step('Corpo completo da resposta', async () => {
    await anexarComparacao('corpo', esperado, recebido);
    assert.deepEqual(recebido, esperado);
  });
}

/** Valida o conjunto exato de chaves presentes no corpo. */
export async function validarChaves(corpo: object, chavesEsperadas: string[]): Promise<void> {
  const esperado = [...chavesEsperadas].sort();
  await step(`Chaves do corpo: ${esperado.join(', ')}`, async () => {
    const recebido = Object.keys(corpo).sort();
    await anexarComparacao('chaves', esperado, recebido);
    assert.deepEqual(recebido, esperado, 'a resposta não deve conter campos além dos esperados');
  });
}

/** Valida o valor de um campo específico do corpo. */
export async function validarCampo(
  campo: string,
  recebido: unknown,
  esperado: unknown,
): Promise<void> {
  await step(`Campo "${campo}"`, async () => {
    await anexarComparacao(campo, esperado, recebido);
    assert.deepEqual(recebido, esperado);
  });
}

/** Valida o formato de um campo quando o valor é gerado pela aplicação (ids, tokens). */
export async function validarFormato(
  campo: string,
  recebido: string,
  padrao: RegExp,
  descricaoDoPadrao: string,
): Promise<void> {
  await step(`Campo "${campo}" no formato ${descricaoDoPadrao}`, async () => {
    await anexarComparacao(campo, descricaoDoPadrao, recebido);
    assert.match(recebido, padrao);
  });
}

/** Valida o corpo contra um schema Joi e registra quais campos o contrato exige. */
export async function validarSchema(
  corpo: unknown,
  schema: ObjectSchema,
  nomeDoContrato: string,
): Promise<void> {
  await step(`Contrato "${nomeDoContrato}"`, async () => {
    const descricao = schema.describe();
    const campos = Object.entries(descricao.keys ?? {}).map(([campo, definicao]) => {
      const detalhe = definicao as { type?: string; flags?: { presence?: string } };
      return `${campo}: ${detalhe.type}${detalhe.flags?.presence === 'required' ? ' (obrigatório)' : ''}`;
    });

    await attachment(
      `contrato: ${nomeDoContrato}`,
      JSON.stringify({ campos_do_contrato: campos, corpo_validado: corpo }, null, 2),
      'application/json',
    );

    expectSchema(corpo, schema);
  });
}

/** Comprova que o schema exige cada campo informado, removendo um de cada vez. */
export async function validarObrigatoriedade(
  corpoValido: Record<string, unknown>,
  schema: ObjectSchema,
  campos: string[],
): Promise<void> {
  await step(`Obrigatoriedade dos campos: ${campos.join(', ')}`, async () => {
    await attachment(
      'obrigatoriedade verificada',
      JSON.stringify(
        {
          metodo: 'remover um campo por vez do corpo válido e exigir que o schema falhe',
          campos_verificados: campos,
        },
        null,
        2,
      ),
      'application/json',
    );

    expectCamposObrigatorios(corpoValido, schema, campos);
  });
}

async function anexarComparacao(nome: string, esperado: unknown, recebido: unknown): Promise<void> {
  await attachment(
    'esperado x recebido',
    JSON.stringify({ validacao: nome, esperado, recebido }, null, 2),
    'application/json',
  );
}
