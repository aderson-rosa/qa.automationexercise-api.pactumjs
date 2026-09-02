import assert from 'node:assert/strict';
import { buildUsuario } from '../src/factories/usuario.factory';
import { postUsuario, deleteUsuario } from '../src/services/usuarios.service';
import { expectSchema } from '../src/support/schema.assert';
import { cadastroUsuarioSchema } from '../src/schemas/usuario.schema';

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
      // Arrange
      const usuario = buildUsuario();

      // Act
      const corpo = await postUsuario(usuario).expectStatus(201).returns('res.body');

      // Assert
      assert.equal(corpo.message, 'Cadastro realizado com sucesso');
      assert.ok(corpo._id, 'o cadastro deve retornar o _id do usuário criado');
      idsParaLimpar.push(corpo._id);
    });

    it('contrato: resposta do cadastro com sucesso adere ao schema', async () => {
      // Arrange
      const usuario = buildUsuario();

      // Act
      const corpo = await postUsuario(usuario).expectStatus(201).returns('res.body');
      idsParaLimpar.push(corpo._id);

      // Assert
      expectSchema(corpo, cadastroUsuarioSchema);
    });

    it('não deve cadastrar usuário com e-mail já utilizado', async () => {
      // Arrange
      const usuario = buildUsuario();
      const id = await postUsuario(usuario).expectStatus(201).returns('_id');
      idsParaLimpar.push(id);

      // Act + Assert
      await postUsuario(usuario)
        .expectStatus(400)
        .expectJson({ message: 'Este email já está sendo usado' });
    });
  });

  describe('DELETE /usuarios/{_id}', () => {
    it('deve excluir um usuário existente por id', async () => {
      // Arrange
      const usuario = buildUsuario();
      const id = await postUsuario(usuario).expectStatus(201).returns('_id');

      // Act + Assert
      await deleteUsuario(id)
        .expectStatus(200)
        .expectJson({ message: 'Registro excluído com sucesso' });
    });

    it('deve informar quando nenhum registro é excluído (id inexistente)', async () => {
      // Arrange
      const idInexistente = 'aaaabbbbcccc0000';

      // Act + Assert (a API trata exclusão de id inexistente como operação sem efeito)
      await deleteUsuario(idInexistente)
        .expectStatus(200)
        .expectJson({ message: 'Nenhum registro excluído' });
    });
  });
});
