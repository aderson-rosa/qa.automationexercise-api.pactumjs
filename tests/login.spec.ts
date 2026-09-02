import assert from 'node:assert/strict';
import { buildUsuario, type Usuario } from '../src/factories/usuario.factory';
import { postUsuario, deleteUsuario } from '../src/services/usuarios.service';
import { postLogin } from '../src/services/login.service';
import { expectSchema, expectCamposObrigatorios } from '../src/support/schema.assert';
import { executarComEvidencia } from '../src/support/evidencias';
import { arrange, act, assertar } from '../src/support/passos';
import { loginComSucessoSchema } from '../src/schemas/login.schema';
import { respostaComMensagemSchema, erroCamposObrigatoriosSchema } from '../src/schemas/erro.schema';

describe('Login @login', () => {
  describe('POST /login', () => {
    let usuario: Usuario;
    let usuarioId: string;

    // Massa de teste da suíte: um usuário real cadastrado antes e removido ao final,
    // para que os testes de login não dependam de dados pré-existentes do ambiente.
    before(async () => {
      usuario = buildUsuario();
      usuarioId = await postUsuario(usuario).expectStatus(201).returns('_id');
    });

    after(async () => {
      await deleteUsuario(usuarioId).expectStatus(200);
    });

    it('deve autenticar um usuário com credenciais válidas', async () => {
      const credenciais = await arrange('credenciais do usuário cadastrado na suíte', () => ({
        email: usuario.email,
        password: usuario.password,
      }));

      const corpo = await act('autenticar em POST /login', () =>
        executarComEvidencia<{ message: string; authorization: string }>(
          postLogin(credenciais).expectStatus(200).returns('res.body'),
          'POST /login - credenciais válidas',
        ),
      );

      await assertar('corpo contém apenas mensagem de sucesso e token JWT no padrão Bearer', () => {
        assert.deepEqual(
          Object.keys(corpo).sort(),
          ['authorization', 'message'],
          'a resposta não deve conter campos além de message e authorization',
        );
        assert.equal(corpo.message, 'Login realizado com sucesso');
        // Token no formato "Bearer <header>.<payload>.<assinatura>".
        assert.match(corpo.authorization, /^Bearer\s[\w-]+\.[\w-]+\.[\w-]+$/);
      });
    });

    it('contrato: resposta do login com sucesso adere ao schema', async () => {
      const credenciais = await arrange('credenciais do usuário cadastrado na suíte', () => ({
        email: usuario.email,
        password: usuario.password,
      }));

      const corpo = await act('autenticar em POST /login', () =>
        executarComEvidencia(
          postLogin(credenciais).expectStatus(200).returns('res.body'),
          'POST /login - contrato da resposta',
        ),
      );

      await assertar('corpo adere ao schema Joi de login com sucesso', () => {
        expectSchema(corpo, loginComSucessoSchema);
      });

      await assertar('schema exige mensagem e token, rejeitando respostas incompletas', () => {
        expectCamposObrigatorios(corpo as Record<string, unknown>, loginComSucessoSchema, [
          'message',
          'authorization',
        ]);
      });
    });

    it('não deve autenticar com senha incorreta', async () => {
      const credenciais = await arrange('credenciais com senha inválida', () => ({
        email: usuario.email,
        password: 'senha-incorreta-123',
      }));

      const corpo = await act('tentar autenticar em POST /login', () =>
        executarComEvidencia<{ message: string }>(
          postLogin(credenciais).expectStatus(401).returns('res.body'),
          'POST /login - senha incorreta',
        ),
      );

      await assertar('corpo traz apenas a mensagem de credenciais inválidas, sem token', () => {
        assert.deepEqual(corpo, { message: 'Email e/ou senha inválidos' });
      });

      await assertar('contrato: resposta de erro adere ao schema de mensagem única', () => {
        expectSchema(corpo, respostaComMensagemSchema);
        expectCamposObrigatorios(corpo as unknown as Record<string, unknown>, respostaComMensagemSchema, [
          'message',
        ]);
      });
    });

    it('contrato: erro de campos obrigatórios adere ao schema', async () => {
      const credenciaisVazias = await arrange('requisição sem e-mail e sem senha', () => ({}));

      const corpo = await act('enviar POST /login sem os campos obrigatórios', () =>
        executarComEvidencia<Record<string, string>>(
          postLogin(credenciaisVazias as never).expectStatus(400).returns('res.body'),
          'POST /login - campos obrigatórios ausentes',
        ),
      );

      await assertar('API aponta e-mail e senha como obrigatórios', () => {
        assert.deepEqual(corpo, {
          email: 'email é obrigatório',
          password: 'password é obrigatório',
        });
      });

      await assertar('contrato: erro de validação adere ao schema de campos obrigatórios', () => {
        expectSchema(corpo, erroCamposObrigatoriosSchema);
      });
    });
  });
});
