import assert from 'node:assert/strict';
import { buildUsuario } from '../src/factories/usuario.factory';
import { buildProduto } from '../src/factories/produto.factory';
import { postUsuario, deleteUsuario } from '../src/services/usuarios.service';
import { postLogin } from '../src/services/login.service';
import { postProduto, deleteProduto } from '../src/services/produtos.service';
import { expectSchema } from '../src/support/schema.assert';
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
      // Arrange
      const produto = buildProduto();

      // Act
      const corpo = await postProduto(produto, token).expectStatus(201).returns('res.body');

      // Assert
      assert.equal(corpo.message, 'Cadastro realizado com sucesso');
      assert.ok(corpo._id, 'o cadastro deve retornar o _id do produto criado');
      produtosParaLimpar.push(corpo._id);
    });

    it('contrato: resposta do cadastro de produto com sucesso adere ao schema', async () => {
      // Arrange
      const produto = buildProduto();

      // Act
      const corpo = await postProduto(produto, token).expectStatus(201).returns('res.body');
      produtosParaLimpar.push(corpo._id);

      // Assert
      expectSchema(corpo, cadastroProdutoSchema);
    });

    it('não deve cadastrar produto sem token de autenticação', async () => {
      // Arrange
      const produto = buildProduto();

      // Act + Assert
      await postProduto(produto)
        .expectStatus(401)
        .expectJson({
          message: 'Token de acesso ausente, inválido, expirado ou usuário do token não existe mais',
        });
    });

    it('não deve cadastrar produto com nome duplicado', async () => {
      // Arrange
      const produto = buildProduto();
      const id = await postProduto(produto, token).expectStatus(201).returns('_id');
      produtosParaLimpar.push(id);

      // Act + Assert
      await postProduto(produto, token)
        .expectStatus(400)
        .expectJson({ message: 'Já existe produto com esse nome' });
    });
  });
});
