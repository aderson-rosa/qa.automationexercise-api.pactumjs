import assert from 'node:assert/strict';
import { buildUsuario, type Usuario } from '../src/factories/usuario.factory';
import { postUsuario, deleteUsuario } from '../src/services/usuarios.service';
import { postLogin } from '../src/services/login.service';
import { expectSchema } from '../src/support/schema.assert';
import { executarComEvidencia } from '../src/support/evidencias';
import { arrange, act, assertar } from '../src/support/passos';
import { loginComSucessoSchema } from '../src/schemas/login.schema';

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

      await assertar('resposta confirma o login e devolve token Bearer', () => {
        assert.equal(corpo.message, 'Login realizado com sucesso');
        assert.match(corpo.authorization, /^Bearer\s.+/);
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

      await assertar('API rejeita o acesso com a mensagem de credenciais inválidas', () => {
        assert.equal(corpo.message, 'Email e/ou senha inválidos');
      });
    });
  });
});
