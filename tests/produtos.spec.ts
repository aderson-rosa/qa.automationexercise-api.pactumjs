import assert from 'node:assert/strict';
import { buildUsuario } from '../src/factories/usuario.factory';
import { buildProduto } from '../src/factories/produto.factory';
import { postUsuario, deleteUsuario } from '../src/services/usuarios.service';
import { postLogin } from '../src/services/login.service';
import { postProduto, deleteProduto } from '../src/services/produtos.service';
import { expectSchema, expectCamposObrigatorios } from '../src/support/schema.assert';
import { executarComEvidencia } from '../src/support/evidencias';
import { arrange, act, assertar } from '../src/support/passos';
import { cadastroProdutoSchema } from '../src/schemas/produto.schema';
import { respostaComMensagemSchema, erroCamposObrigatoriosSchema } from '../src/schemas/erro.schema';

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

      await assertar('corpo contém apenas a mensagem de sucesso e o _id no formato da API', () => {
        assert.deepEqual(
          Object.keys(corpo).sort(),
          ['_id', 'message'],
          'a resposta não deve conter campos além de message e _id',
        );
        assert.equal(corpo.message, 'Cadastro realizado com sucesso');
        // A API identifica os registros com 16 caracteres alfanuméricos.
        assert.match(corpo._id, /^[A-Za-z0-9]{16}$/);
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

      await assertar('schema exige mensagem e _id, rejeitando respostas incompletas', () => {
        expectCamposObrigatorios(corpo as unknown as Record<string, unknown>, cadastroProdutoSchema, [
          'message',
          '_id',
        ]);
      });
    });

    it('contrato: erro de campos obrigatórios adere ao schema', async () => {
      const produtoVazio = await arrange('requisição autenticada sem nenhum campo', () => ({}));

      const corpo = await act('enviar POST /produtos sem os campos obrigatórios', () =>
        executarComEvidencia<Record<string, string>>(
          postProduto(produtoVazio as never, token).expectStatus(400).returns('res.body'),
          'POST /produtos - campos obrigatórios ausentes',
        ),
      );

      await assertar('API aponta todos os campos obrigatórios do produto', () => {
        assert.deepEqual(corpo, {
          nome: 'nome é obrigatório',
          preco: 'preco é obrigatório',
          descricao: 'descricao é obrigatório',
          quantidade: 'quantidade é obrigatório',
        });
      });

      await assertar('contrato: erro de validação adere ao schema de campos obrigatórios', () => {
        expectSchema(corpo, erroCamposObrigatoriosSchema);
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

      await assertar('corpo traz apenas a mensagem de token ausente, sem criar registro', () => {
        assert.deepEqual(corpo, {
          message:
            'Token de acesso ausente, inválido, expirado ou usuário do token não existe mais',
        });
      });

      await assertar('contrato: resposta de erro adere ao schema de mensagem única', () => {
        expectSchema(corpo, respostaComMensagemSchema);
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

      await assertar('corpo traz apenas a mensagem de nome duplicado, sem criar registro', () => {
        assert.deepEqual(corpo, { message: 'Já existe produto com esse nome' });
      });

      await assertar('contrato: resposta de erro adere ao schema de mensagem única', () => {
        expectSchema(corpo, respostaComMensagemSchema);
      });
    });
  });
});
