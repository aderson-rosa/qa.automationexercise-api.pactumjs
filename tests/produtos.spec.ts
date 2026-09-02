import { buildUsuario } from '../src/factories/usuario.factory';
import { buildProduto } from '../src/factories/produto.factory';
import { postUsuario, deleteUsuario } from '../src/services/usuarios.service';
import { postLogin } from '../src/services/login.service';
import { postProduto, deleteProduto } from '../src/services/produtos.service';
import { executarComEvidencia } from '../src/support/evidencias';
import { arrange, act, assertar } from '../src/support/passos';
import {
  validarCorpo,
  validarChaves,
  validarCampo,
  validarFormato,
  validarSchema,
  validarObrigatoriedade,
} from '../src/support/validacoes';
import { cadastroProdutoSchema } from '../src/schemas/produto.schema';
import { respostaComMensagemSchema, erroCamposObrigatoriosSchema } from '../src/schemas/erro.schema';

// A API identifica os registros com 16 caracteres alfanuméricos.
const FORMATO_ID = /^[A-Za-z0-9]{16}$/;

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

      await assertar('corpo confirma o cadastro e devolve o _id, sem campos extras', async () => {
        await validarChaves(corpo, ['message', '_id']);
        await validarCampo('message', corpo.message, 'Cadastro realizado com sucesso');
        await validarFormato('_id', corpo._id, FORMATO_ID, '16 caracteres alfanuméricos');
      });
    });

    it('contrato: resposta do cadastro de produto com sucesso adere ao schema', async () => {
      const produto = await arrange('produto válido com nome único', () => buildProduto());

      const corpo = await act('cadastrar em POST /produtos com token de administrador', () =>
        executarComEvidencia<Record<string, unknown> & { _id: string }>(
          postProduto(produto, token).expectStatus(201).returns('res.body'),
          'POST /produtos - contrato da resposta',
        ),
      );
      produtosParaLimpar.push(corpo._id);

      await assertar('contrato de sucesso é cumprido e exige todos os campos', async () => {
        await validarSchema(corpo, cadastroProdutoSchema, 'cadastro de produto com sucesso');
        await validarObrigatoriedade(corpo, cadastroProdutoSchema, ['message', '_id']);
      });
    });

    it('contrato: erro de campos obrigatórios adere ao schema', async () => {
      const produtoVazio = await arrange('requisição autenticada sem nenhum campo', () => ({}));

      const corpo = await act('enviar POST /produtos sem os campos obrigatórios', () =>
        executarComEvidencia<Record<string, unknown>>(
          postProduto(produtoVazio as never, token).expectStatus(400).returns('res.body'),
          'POST /produtos - campos obrigatórios ausentes',
        ),
      );

      await assertar('API aponta todos os campos obrigatórios do produto', async () => {
        await validarCorpo(corpo, {
          nome: 'nome é obrigatório',
          preco: 'preco é obrigatório',
          descricao: 'descricao é obrigatório',
          quantidade: 'quantidade é obrigatório',
        });
        await validarSchema(corpo, erroCamposObrigatoriosSchema, 'erro de campos obrigatórios');
      });
    });

    it('não deve cadastrar produto sem token de autenticação', async () => {
      const produto = await arrange('produto válido, sem token na requisição', () => buildProduto());

      const corpo = await act('cadastrar em POST /produtos sem cabeçalho Authorization', () =>
        executarComEvidencia<Record<string, unknown>>(
          postProduto(produto).expectStatus(401).returns('res.body'),
          'POST /produtos - sem token de autenticação',
        ),
      );

      await assertar('corpo traz apenas a mensagem de token ausente', async () => {
        await validarCorpo(corpo, {
          message:
            'Token de acesso ausente, inválido, expirado ou usuário do token não existe mais',
        });
        await validarSchema(corpo, respostaComMensagemSchema, 'erro com mensagem única');
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
        executarComEvidencia<Record<string, unknown>>(
          postProduto(produto, token).expectStatus(400).returns('res.body'),
          'POST /produtos - nome duplicado',
        ),
      );

      await assertar('corpo traz apenas a mensagem de nome duplicado', async () => {
        await validarCorpo(corpo, { message: 'Já existe produto com esse nome' });
        await validarSchema(corpo, respostaComMensagemSchema, 'erro com mensagem única');
      });
    });
  });
});
