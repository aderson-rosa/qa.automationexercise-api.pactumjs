import { faker } from '@faker-js/faker';

export interface Produto {
  nome: string;
  preco: number;
  descricao: string;
  quantidade: number;
}

/**
 * Gera um produto válido com nome único por execução, já que o ServeRest
 * rejeita produtos com nome duplicado no ambiente compartilhado.
 */
export function buildProduto(overrides: Partial<Produto> = {}): Produto {
  return {
    nome: `${faker.commerce.productName()} ${Date.now()}`,
    preco: faker.number.int({ min: 10, max: 5000 }),
    descricao: faker.commerce.productDescription(),
    quantidade: faker.number.int({ min: 1, max: 100 }),
    ...overrides,
  };
}
