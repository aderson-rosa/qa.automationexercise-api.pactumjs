import { spec } from 'pactum';
import type { Usuario } from '../factories/usuario.factory';

/** Monta a requisição de cadastro de usuário (POST /usuarios). */
export function postUsuario(usuario: Usuario) {
  return spec().post('/usuarios').withJson(usuario);
}

/** Monta a requisição de exclusão de usuário por id (DELETE /usuarios/{_id}). */
export function deleteUsuario(id: string) {
  return spec().delete('/usuarios/{_id}').withPathParams('_id', id);
}
