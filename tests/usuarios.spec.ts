import { buildUsuario } from '../src/factories/usuario.factory';
import { postUsuario, deleteUsuario } from '../src/services/usuarios.service';
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
import { cadastroUsuarioSchema } from '../src/schemas/usuario.schema';
import { respostaComMensagemSchema, erroCamposObrigatoriosSchema } from '../src/schemas/erro.schema';

// A API identifica os registros com 16 caracteres alfanuméricos.
const FORMATO_ID = /^[A-Za-z0-9]{16}$/;

describe('Usuários @usuarios', () => {
  // Ids criados pelos testes; a limpeza roda após cada teste para deixar o
  // ambiente compartilhado do ServeRest como foi encontrado.
  const idsParaLimpar: string[] = [];

  afterEach(async () => {
    while (idsParaLimpar.length > 0) {
      await deleteUsuario(idsParaLimpar.pop()!).expectStatus(200);
    }
  });

  describe('POST /usuarios', () => {
    it('deve cadastrar um novo usuário', async () => {
      const usuario = await arrange('usuário válido com e-mail único', () => buildUsuario());

      const corpo = await act('cadastrar em POST /usuarios', () =>
        executarComEvidencia<{ message: string; _id: string }>(
          postUsuario(usuario).expectStatus(201).returns('res.body'),
          'POST /usuarios - cadastro com sucesso',
        ),
      );
      idsParaLimpar.push(corpo._id);

      await assertar('corpo confirma o cadastro e devolve o _id, sem campos extras', async () => {
        await validarChaves(corpo, ['message', '_id']);
        await validarCampo('message', corpo.message, 'Cadastro realizado com sucesso');
        await validarFormato('_id', corpo._id, FORMATO_ID, '16 caracteres alfanuméricos');
      });
    });

    it('contrato: resposta do cadastro com sucesso adere ao schema', async () => {
      const usuario = await arrange('usuário válido com e-mail único', () => buildUsuario());

      const corpo = await act('cadastrar em POST /usuarios', () =>
        executarComEvidencia<Record<string, unknown> & { _id: string }>(
          postUsuario(usuario).expectStatus(201).returns('res.body'),
          'POST /usuarios - contrato da resposta',
        ),
      );
      idsParaLimpar.push(corpo._id);

      await assertar('contrato de sucesso é cumprido e exige todos os campos', async () => {
        await validarSchema(corpo, cadastroUsuarioSchema, 'cadastro de usuário com sucesso');
        await validarObrigatoriedade(corpo, cadastroUsuarioSchema, ['message', '_id']);
      });
    });

    it('contrato: erro de campos obrigatórios adere ao schema', async () => {
      const usuarioVazio = await arrange('requisição sem nenhum campo do cadastro', () => ({}));

      const corpo = await act('enviar POST /usuarios sem os campos obrigatórios', () =>
        executarComEvidencia<Record<string, unknown>>(
          postUsuario(usuarioVazio as never).expectStatus(400).returns('res.body'),
          'POST /usuarios - campos obrigatórios ausentes',
        ),
      );

      await assertar('API aponta todos os campos obrigatórios do cadastro', async () => {
        await validarCorpo(corpo, {
          nome: 'nome é obrigatório',
          email: 'email é obrigatório',
          password: 'password é obrigatório',
          administrador: 'administrador é obrigatório',
        });
        await validarSchema(corpo, erroCamposObrigatoriosSchema, 'erro de campos obrigatórios');
      });
    });

    it('não deve cadastrar usuário com e-mail já utilizado', async () => {
      const usuario = await arrange('usuário já cadastrado na aplicação', async () => {
        const novo = buildUsuario();
        const id = await postUsuario(novo).expectStatus(201).returns('_id');
        idsParaLimpar.push(id);
        return novo;
      });

      const corpo = await act('repetir o cadastro com o mesmo e-mail', () =>
        executarComEvidencia<Record<string, unknown>>(
          postUsuario(usuario).expectStatus(400).returns('res.body'),
          'POST /usuarios - e-mail duplicado',
        ),
      );

      await assertar('corpo traz apenas a mensagem de e-mail duplicado', async () => {
        await validarCorpo(corpo, { message: 'Este email já está sendo usado' });
        await validarSchema(corpo, respostaComMensagemSchema, 'erro com mensagem única');
      });
    });
  });

  describe('DELETE /usuarios/{_id}', () => {
    it('deve excluir um usuário existente por id', async () => {
      const id = await arrange('usuário criado para ser excluído', () =>
        postUsuario(buildUsuario()).expectStatus(201).returns('_id'),
      );

      const corpo = await act('excluir em DELETE /usuarios/{_id}', () =>
        executarComEvidencia<Record<string, unknown>>(
          deleteUsuario(id).expectStatus(200).returns('res.body'),
          'DELETE /usuarios/{_id} - exclusão com sucesso',
        ),
      );

      await assertar('corpo confirma a exclusão do registro', async () => {
        await validarCorpo(corpo, { message: 'Registro excluído com sucesso' });
        await validarSchema(corpo, respostaComMensagemSchema, 'resposta com mensagem única');
      });
    });

    it('deve informar quando nenhum registro é excluído (id inexistente)', async () => {
      const idInexistente = await arrange(
        'id inexistente no formato aceito pela API',
        () => 'aaaabbbbcccc0000',
      );

      const corpo = await act('excluir em DELETE /usuarios/{_id}', () =>
        executarComEvidencia<Record<string, unknown>>(
          deleteUsuario(idInexistente).expectStatus(200).returns('res.body'),
          'DELETE /usuarios/{_id} - id inexistente',
        ),
      );

      // A API trata exclusão de id inexistente como operação sem efeito, e não como erro.
      await assertar('corpo informa que nenhum registro foi excluído', async () => {
        await validarCorpo(corpo, { message: 'Nenhum registro excluído' });
        await validarSchema(corpo, respostaComMensagemSchema, 'resposta com mensagem única');
      });
    });
  });
});
