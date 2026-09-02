import assert from 'node:assert/strict';
import { buildUsuario, type Usuario } from '../src/factories/usuario.factory';
import { postUsuario, deleteUsuario } from '../src/services/usuarios.service';
import { postLogin } from '../src/services/login.service';
import { expectSchema } from '../src/support/schema.assert';
import { executarComEvidencia } from '../src/support/evidencias';
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
      // Arrange
      const credenciais = { email: usuario.email, password: usuario.password };

      // Act
      const corpo = await executarComEvidencia<{ message: string; authorization: string }>(
        postLogin(credenciais).expectStatus(200).returns('res.body'),
        'POST /login - credenciais válidas',
      );

      // Assert
      assert.equal(corpo.message, 'Login realizado com sucesso');
      assert.match(corpo.authorization, /^Bearer\s.+/);
    });

    it('contrato: resposta do login com sucesso adere ao schema', async () => {
      // Arrange
      const credenciais = { email: usuario.email, password: usuario.password };

      // Act
      const corpo = await executarComEvidencia(
        postLogin(credenciais).expectStatus(200).returns('res.body'),
        'POST /login - contrato da resposta',
      );

      // Assert
      expectSchema(corpo, loginComSucessoSchema);
    });

    it('não deve autenticar com senha incorreta', async () => {
      // Arrange
      const credenciais = { email: usuario.email, password: 'senha-incorreta-123' };

      // Act + Assert (a expectativa é avaliada na resolução da requisição)
      await executarComEvidencia(
        postLogin(credenciais)
          .expectStatus(401)
          .expectJson({ message: 'Email e/ou senha inválidos' }),
        'POST /login - senha incorreta',
      );
    });
  });
});
