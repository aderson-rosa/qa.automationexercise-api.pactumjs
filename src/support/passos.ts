import { step } from 'allure-js-commons';

/**
 * Envolve um trecho do teste em um passo nomeado do relatório Allure.
 *
 * Os três verbos abaixo tornam a estrutura Triple A visível também no
 * relatório: quem lê o resultado enxerga a preparação, a ação e cada
 * validação como passos distintos, sem precisar abrir o código do teste.
 */
export function arrange<T>(descricao: string, execucao: () => T | Promise<T>): PromiseLike<T> {
  return step(`Arrange: ${descricao}`, execucao);
}

export function act<T>(descricao: string, execucao: () => T | Promise<T>): PromiseLike<T> {
  return step(`Act: ${descricao}`, execucao);
}

export function assertar<T>(descricao: string, execucao: () => T | Promise<T>): PromiseLike<T> {
  return step(`Assert: ${descricao}`, execucao);
}
