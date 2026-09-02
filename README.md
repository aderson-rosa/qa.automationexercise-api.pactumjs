# qa.automationexercise-api.pactumjs

![CI](https://github.com/aderson-rosa/qa.automationexercise-api.pactumjs/actions/workflows/ci.yml/badge.svg)

📊 **[Relatório Allure da última execução](https://aderson-rosa.github.io/qa.automationexercise-api.pactumjs/)** (publicado automaticamente pela pipeline)

Testes automatizados da API **[ServeRest](https://serverest.dev)** com **[PactumJS](https://pactumjs.github.io/)**, validação de contrato com **[Joi](https://joi.dev/)** e relatório **Allure**, escritos em **TypeScript** sobre o runner **Mocha** (sem Gherkin).

## ✅ Escopo automatizado

| Suíte | Endpoint | Cenários |
|---|---|---|
| **Login** (`@login`) | `POST /login` | login com sucesso · **contrato de sucesso (Joi)** · senha incorreta (401) · **contrato do erro de campos obrigatórios (400)** |
| **Usuários** (`@usuarios`) | `POST /usuarios` | cadastro com sucesso · **contrato de sucesso (Joi)** · e-mail duplicado (400) · **contrato do erro de campos obrigatórios (400)** |
| | `DELETE /usuarios/{_id}` | exclusão por id · id inexistente ("Nenhum registro excluído") |
| **Produtos** (`@produtos`) | `POST /produtos` | cadastro com sucesso · **contrato de sucesso (Joi)** · sem token (401) · nome duplicado (400) · **contrato do erro de campos obrigatórios (400)** |

Além dos cenários solicitados, cada endpoint recebeu casos negativos de valor (autenticação, duplicidade, exclusão sem efeito) para cobrir as classes de equivalência principais de cada operação.

## 🔧 Pré-requisitos

- **Node.js 20+** (LTS) e **npm**
- Acesso à internet (os testes rodam contra o ambiente público `https://serverest.dev`)
- **Java 8+** apenas para gerar/abrir o relatório Allure localmente (o Allure CLI roda sobre a JVM)

Nenhuma variável de ambiente é obrigatória. Para apontar para outra instância do ServeRest (ex.: local via Docker), defina `BASE_URL`:

```bash
BASE_URL=http://localhost:3000 npm test
```

## ▶️ Instalação e execução

```bash
npm install
npm test               # todas as suítes
npm run test:login     # apenas a suíte de Login
npm run test:usuarios  # apenas a suíte de Usuários
npm run test:produtos  # apenas a suíte de Produtos
```

## 📊 Relatório Allure

Cada execução grava os resultados em `allure-results/` (o resultado também aparece no console, via reporter `spec`). Para gerar e abrir o relatório:

```bash
npm run report:allure
```

Cada teste aparece no relatório com **todos os seus passos**, na estrutura Triple A:

```
Arrange: usuário válido com e-mail único
Act: cadastrar em POST /usuarios
  └── POST /usuarios - cadastro com sucesso        [requisição, resposta e status validado]
Assert: corpo confirma o cadastro e devolve o _id, sem campos extras
  ├── Chaves do corpo: _id, message                [esperado x recebido]
  ├── Campo "message"                              [esperado x recebido]
  └── Campo "_id" no formato 16 caracteres alfanuméricos   [esperado x recebido]
```

Cada validação vira um passo próprio com o par **esperado x recebido** anexado, e não apenas o nome da asserção: o relatório mostra o que foi comparado. Nos testes de contrato, o anexo lista **os campos exigidos pelo schema** e o corpo validado.

A **evidência da chamada** (método, URL, corpo enviado, status, corpo recebido e as validações aplicadas pelo framework) é anexada em todos os cenários, inclusive nos aprovados: é o equivalente ao screenshot em testes de interface e permite auditar o que trafegou sem reexecutar a suíte. Campos sensíveis (`password`, `authorization`) são mascarados, já que o relatório fica publicado.

O relatório também registra o ambiente da execução (URL base, versão do Node e se rodou local ou no CI), para que um relatório isolado seja interpretável.

## 🗂️ Estrutura e padrões

```
├── src
│   ├── config/mocha.setup.ts   # base URL e timeout definidos uma única vez
│   ├── factories/              # massa de dados única por execução (Faker)
│   ├── schemas/                # contratos Joi, um por recurso
│   ├── services/               # Service Objects: montagem das requisições por recurso
│   └── support/               # asserção de contrato e evidência de chamada (Allure)
└── tests/                      # suítes (login, usuários, produtos)
```

Decisões que sustentam o crescimento do projeto sem duplicação:

- **Service Object por recurso:** a montagem da requisição (rota, corpo, headers) vive em `src/services`; os testes encadeiam apenas as **expectativas**. Um endpoint novo entra criando um service e um spec.
- **Factories com dados únicos:** e-mails e nomes de produto levam timestamp, evitando colisão no ambiente compartilhado do ServeRest e permitindo reexecuções ilimitadas.
- **Contratos de sucesso e de erro:** além do contrato das respostas de sucesso, há schemas para as respostas de erro — mensagem única (401/400 de negócio) e erro de campos obrigatórios, em que cada chave é o campo ausente. Os testes de contrato usam Joi com `abortEarly: false`, reportando todas as violações de uma vez.
- **Obrigatoriedade verificada, não presumida:** `expectCamposObrigatorios` remove um campo por vez de um corpo válido e exige que o schema passe a falhar. Sem isso, um campo declarado opcional por engano tornaria o teste de contrato incapaz de detectar uma resposta incompleta.
- **Triple A visível no relatório:** os helpers `arrange`, `act` e `assertar` (`src/support/passos.ts`) transformam cada fase em um passo nomeado do Allure, então a estrutura do teste é legível para quem lê o relatório sem abrir o código.
- **Validação completa do corpo:** as asserções cobrem o corpo inteiro da resposta, e não apenas um campo. Respostas de mensagem única são comparadas com `deepEqual` (o que também reprova campos extras inesperados) e, nos cadastros, além da mensagem, valida-se o conjunto exato de chaves e o formato do `_id` (16 caracteres alfanuméricos) e do token (`Bearer <jwt>`).
- **Auto-limpeza:** cada suíte cria e remove a própria massa (`before`/`after`/`afterEach`), deixando o ambiente como o encontrou.

## 🚀 Pipeline

O workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) roda em todo push/PR: instala dependências com `npm ci`, verifica os tipos, executa as três suítes e gera o relatório **Allure**, publicado de duas formas: como **artefato** da execução e, nas execuções da `main`, no **GitHub Pages**, em uma URL fixa que sempre reflete a última execução.
