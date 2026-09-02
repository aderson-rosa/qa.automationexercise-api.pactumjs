import { spec } from 'pactum';
import type { Produto } from '../factories/produto.factory';

/**
 * Monta a requisição de cadastro de produto (POST /produtos).
 * O token é opcional para permitir também o cenário negativo sem autenticação.
 */
export function postProduto(produto: Produto, token?: string) {
  const requisicao = spec().post('/produtos').withJson(produto);
  if (token) {
    requisicao.withHeaders('Authorization', token);
  }
  return requisicao;
}

/** Monta a requisição de exclusão de produto por id (DELETE /produtos/{_id}), usada na limpeza de dados. */
export function deleteProduto(id: string, token: string) {
  return spec().delete('/produtos/{_id}').withPathParams('_id', id).withHeaders('Authorization', token);
}
