import { faker } from '@faker-js/faker';

export interface Usuario {
  nome: string;
  email: string;
  password: string;
  administrador: 'true' | 'false';
}

/**
 * Gera um usuário válido com e-mail único por execução (timestamp + aleatório),
 * evitando colisão com dados de execuções anteriores no ambiente compartilhado
 * do ServeRest. Campos podem ser sobrescritos pontualmente via `overrides`.
 */
export function buildUsuario(overrides: Partial<Usuario> = {}): Usuario {
  return {
    nome: faker.person.fullName(),
    email: `qa.${Date.now()}.${faker.string.alphanumeric(6).toLowerCase()}@zigtest.com.br`,
    password: faker.internet.password({ length: 12 }),
    administrador: 'true',
    ...overrides,
  };
}
