import assert from 'node:assert/strict';
import { buildUsuario } from '../src/factories/usuario.factory';
import { postUsuario, deleteUsuario } from '../src/services/usuarios.service';
import { expectSchema, expectCamposObrigatorios } from '../src/support/schema.assert';
import { executarComEvidencia } from '../src/support/evidencias';
import { arrange, act, assertar } from '../src/support/passos';
import { cadastroUsuarioSchema } from '../src/schemas/usuario.schema';
import { respostaComMensagemSchema, erroCamposObrigatoriosSchema } from '../src/schemas/erro.schema';

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

    it('contrato: resposta do cadastro com sucesso adere ao schema', async () => {
      const usuario = await arrange('usuário válido com e-mail único', () => buildUsuario());

      const corpo = await act('cadastrar em POST /usuarios', () =>
        executarComEvidencia<{ _id: string }>(
          postUsuario(usuario).expectStatus(201).returns('res.body'),
          'POST /usuarios - contrato da resposta',
        ),
      );
      idsParaLimpar.push(corpo._id);

      await assertar('corpo adere ao schema Joi de cadastro com sucesso', () => {
        expectSchema(corpo, cadastroUsuarioSchema);
      });

      await assertar('schema exige mensagem e _id, rejeitando respostas incompletas', () => {
        expectCamposObrigatorios(corpo as unknown as Record<string, unknown>, cadastroUsuarioSchema, [
          'message',
          '_id',
        ]);
      });
    });

    it('contrato: erro de campos obrigatórios adere ao schema', async () => {
      const usuarioVazio = await arrange('requisição sem nenhum campo do cadastro', () => ({}));

      const corpo = await act('enviar POST /usuarios sem os campos obrigatórios', () =>
        executarComEvidencia<Record<string, string>>(
          postUsuario(usuarioVazio as never).expectStatus(400).returns('res.body'),
          'POST /usuarios - campos obrigatórios ausentes',
        ),
      );

      await assertar('API aponta todos os campos obrigatórios do cadastro', () => {
        assert.deepEqual(corpo, {
          nome: 'nome é obrigatório',
          email: 'email é obrigatório',
          password: 'password é obrigatório',
          administrador: 'administrador é obrigatório',
        });
      });

      await assertar('contrato: erro de validação adere ao schema de campos obrigatórios', () => {
        expectSchema(corpo, erroCamposObrigatoriosSchema);
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
        executarComEvidencia<{ message: string }>(
          postUsuario(usuario).expectStatus(400).returns('res.body'),
          'POST /usuarios - e-mail duplicado',
        ),
      );

      await assertar('corpo traz apenas a mensagem de e-mail duplicado, sem criar registro', () => {
        assert.deepEqual(corpo, { message: 'Este email já está sendo usado' });
      });

      await assertar('contrato: resposta de erro adere ao schema de mensagem única', () => {
        expectSchema(corpo, respostaComMensagemSchema);
      });
    });
  });

  describe('DELETE /usuarios/{_id}', () => {
    it('deve excluir um usuário existente por id', async () => {
      const id = await arrange('usuário criado para ser excluído', () =>
        postUsuario(buildUsuario()).expectStatus(201).returns('_id'),
      );

      const corpo = await act('excluir em DELETE /usuarios/{_id}', () =>
        executarComEvidencia<{ message: string }>(
          deleteUsuario(id).expectStatus(200).returns('res.body'),
          'DELETE /usuarios/{_id} - exclusão com sucesso',
        ),
      );

      await assertar('corpo traz apenas a confirmação da exclusão', () => {
        assert.deepEqual(corpo, { message: 'Registro excluído com sucesso' });
      });

      await assertar('contrato: resposta da exclusão adere ao schema de mensagem única', () => {
        expectSchema(corpo, respostaComMensagemSchema);
      });
    });

    it('deve informar quando nenhum registro é excluído (id inexistente)', async () => {
      const idInexistente = await arrange('id inexistente no formato aceito pela API', () => 'aaaabbbbcccc0000');

      const corpo = await act('excluir em DELETE /usuarios/{_id}', () =>
        executarComEvidencia<{ message: string }>(
          deleteUsuario(idInexistente).expectStatus(200).returns('res.body'),
          'DELETE /usuarios/{_id} - id inexistente',
        ),
      );

      // A API trata exclusão de id inexistente como operação sem efeito, e não como erro.
      await assertar('corpo traz apenas a informação de que nada foi excluído', () => {
        assert.deepEqual(corpo, { message: 'Nenhum registro excluído' });
      });

      await assertar('contrato: resposta adere ao schema de mensagem única', () => {
        expectSchema(corpo, respostaComMensagemSchema);
      });
    });
  });
});
