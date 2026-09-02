import { spec } from 'pactum';

export interface Credenciais {
  email: string;
  password: string;
}

/**
 * Monta a requisição de autenticação (POST /login).
 * Retorna o spec do Pactum para o teste encadear as próprias expectativas,
 * mantendo a montagem da requisição centralizada e as asserções no teste.
 */
export function postLogin(credenciais: Credenciais) {
  return spec().post('/login').withJson(credenciais);
}
