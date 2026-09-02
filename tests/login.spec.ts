import { buildUsuario, type Usuario } from '../src/factories/usuario.factory';
import { postUsuario, deleteUsuario } from '../src/services/usuarios.service';
import { postLogin } from '../src/services/login.service';
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

      await assertar('corpo traz mensagem de sucesso e token JWT, sem campos extras', async () => {
        await validarChaves(corpo, ['message', 'authorization']);
        await validarCampo('message', corpo.message, 'Login realizado com sucesso');
        await validarFormato(
          'authorization',
          corpo.authorization,
          /^Bearer\s[\w-]+\.[\w-]+\.[\w-]+$/,
          'Bearer <header>.<payload>.<assinatura>',
        );
      });
    });

    it('contrato: resposta do login com sucesso adere ao schema', async () => {
      const credenciais = await arrange('credenciais do usuário cadastrado na suíte', () => ({
        email: usuario.email,
        password: usuario.password,
      }));

      const corpo = await act('autenticar em POST /login', () =>
        executarComEvidencia<Record<string, unknown>>(
          postLogin(credenciais).expectStatus(200).returns('res.body'),
          'POST /login - contrato da resposta',
        ),
      );

      await assertar('contrato de sucesso é cumprido e exige todos os campos', async () => {
        await validarSchema(corpo, loginComSucessoSchema, 'login com sucesso');
        await validarObrigatoriedade(corpo, loginComSucessoSchema, ['message', 'authorization']);
      });
    });

    it('não deve autenticar com senha incorreta', async () => {
      const credenciais = await arrange('credenciais com senha inválida', () => ({
        email: usuario.email,
        password: 'senha-incorreta-123',
      }));

      const corpo = await act('tentar autenticar em POST /login', () =>
        executarComEvidencia<Record<string, unknown>>(
          postLogin(credenciais).expectStatus(401).returns('res.body'),
          'POST /login - senha incorreta',
        ),
      );

      await assertar('corpo traz apenas a mensagem de credenciais inválidas', async () => {
        await validarCorpo(corpo, { message: 'Email e/ou senha inválidos' });
        await validarSchema(corpo, respostaComMensagemSchema, 'erro com mensagem única');
        await validarObrigatoriedade(corpo, respostaComMensagemSchema, ['message']);
      });
    });

    it('contrato: erro de campos obrigatórios adere ao schema', async () => {
      const credenciaisVazias = await arrange('requisição sem e-mail e sem senha', () => ({}));

      const corpo = await act('enviar POST /login sem os campos obrigatórios', () =>
        executarComEvidencia<Record<string, unknown>>(
          postLogin(credenciaisVazias as never).expectStatus(400).returns('res.body'),
          'POST /login - campos obrigatórios ausentes',
        ),
      );

      await assertar('API aponta e-mail e senha como obrigatórios', async () => {
        await validarCorpo(corpo, {
          email: 'email é obrigatório',
          password: 'password é obrigatório',
        });
        await validarSchema(corpo, erroCamposObrigatoriosSchema, 'erro de campos obrigatórios');
      });
    });
  });
});
