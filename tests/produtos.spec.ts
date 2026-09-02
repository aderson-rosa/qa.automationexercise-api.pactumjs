import assert from 'node:assert/strict';
import { buildUsuario } from '../src/factories/usuario.factory';
import { buildProduto } from '../src/factories/produto.factory';
import { postUsuario, deleteUsuario } from '../src/services/usuarios.service';
import { postLogin } from '../src/services/login.service';
import { postProduto, deleteProduto } from '../src/services/produtos.service';
import { expectSchema } from '../src/support/schema.assert';
import { executarComEvidencia } from '../src/support/evidencias';
import { arrange, act, assertar } from '../src/support/passos';
import { cadastroProdutoSchema } from '../src/schemas/produto.schema';

describe('Produtos @produtos', () => {
  let token: string;
  let usuarioAdminId: string;
  const produtosParaLimpar: string[] = [];

  // O cadastro de produtos exige um usuário administrador autenticado; a suíte
  // cria a própria massa (admin + token) e remove tudo ao final.
  before(async () => {
    const admin = buildUsuario({ administrador: 'true' });
    usuarioAdminId = await postUsuario(admin).expectStatus(201).returns('_id');
    token = await postLogin({ email: admin.email, password: admin.password })
      .expectStatus(200)
      .returns('authorization');
  });

  after(async () => {
    while (produtosParaLimpar.length > 0) {
      await deleteProduto(produtosParaLimpar.pop()!, token).expectStatus(200);
    }
    await deleteUsuario(usuarioAdminId).expectStatus(200);
  });

  describe('POST /produtos', () => {
    it('deve cadastrar um novo produto', async () => {
      const produto = await arrange('produto válido com nome único', () => buildProduto());

      const corpo = await act('cadastrar em POST /produtos com token de administrador', () =>
        executarComEvidencia<{ message: string; _id: string }>(
          postProduto(produto, token).expectStatus(201).returns('res.body'),
          'POST /produtos - cadastro com sucesso',
        ),
      );
      produtosParaLimpar.push(corpo._id);

      await assertar('cadastro confirmado com o _id do produto criado', () => {
        assert.equal(corpo.message, 'Cadastro realizado com sucesso');
        assert.ok(corpo._id, 'o cadastro deve retornar o _id do produto criado');
      });
    });

    it('contrato: resposta do cadastro de produto com sucesso adere ao schema', async () => {
      const produto = await arrange('produto válido com nome único', () => buildProduto());

      const corpo = await act('cadastrar em POST /produtos com token de administrador', () =>
        executarComEvidencia<{ _id: string }>(
          postProduto(produto, token).expectStatus(201).returns('res.body'),
          'POST /produtos - contrato da resposta',
        ),
      );
      produtosParaLimpar.push(corpo._id);

      await assertar('corpo adere ao schema Joi de cadastro de produto', () => {
        expectSchema(corpo, cadastroProdutoSchema);
      });
    });

    it('não deve cadastrar produto sem token de autenticação', async () => {
      const produto = await arrange('produto válido, sem token na requisição', () => buildProduto());

      const corpo = await act('cadastrar em POST /produtos sem cabeçalho Authorization', () =>
        executarComEvidencia<{ message: string }>(
          postProduto(produto).expectStatus(401).returns('res.body'),
          'POST /produtos - sem token de autenticação',
        ),
      );

      await assertar('API bloqueia o cadastro por ausência de token', () => {
        assert.equal(
          corpo.message,
          'Token de acesso ausente, inválido, expirado ou usuário do token não existe mais',
        );
      });
    });

    it('não deve cadastrar produto com nome duplicado', async () => {
      const produto = await arrange('produto já cadastrado na aplicação', async () => {
        const novo = buildProduto();
        const id = await postProduto(novo, token).expectStatus(201).returns('_id');
        produtosParaLimpar.push(id);
        return novo;
      });

      const corpo = await act('repetir o cadastro com o mesmo nome', () =>
        executarComEvidencia<{ message: string }>(
          postProduto(produto, token).expectStatus(400).returns('res.body'),
          'POST /produtos - nome duplicado',
        ),
      );

      await assertar('API rejeita a duplicidade de nome', () => {
        assert.equal(corpo.message, 'Já existe produto com esse nome');
      });
    });
  });
});
