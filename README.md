# qa.automationexercise-api.pactumjs

![CI](https://github.com/aderson-rosa/qa.automationexercise-api.pactumjs/actions/workflows/ci.yml/badge.svg)

📊 **[Relatório Allure da última execução](https://aderson-rosa.github.io/qa.automationexercise-api.pactumjs/)** (publicado automaticamente pela pipeline)

Testes automatizados da API **[ServeRest](https://serverest.dev)** com **[PactumJS](https://pactumjs.github.io/)**, validação de contrato com **[Joi](https://joi.dev/)** e relatório **Allure**, escritos em **TypeScript** sobre o runner **Mocha** (sem Gherkin).

## ✅ Escopo automatizado

| Suíte | Endpoint | Cenários |
|---|---|---|
| **Login** (`@login`) | `POST /login` | login com sucesso · **contrato (Joi)** · senha incorreta (401) |
| **Usuários** (`@usuarios`) | `POST /usuarios` | cadastro com sucesso · **contrato (Joi)** · e-mail duplicado (400) |
| | `DELETE /usuarios/{_id}` | exclusão por id · id inexistente ("Nenhum registro excluído") |
| **Produtos** (`@produtos`) | `POST /produtos` | cadastro com sucesso · **contrato (Joi)** · sem token (401) · nome duplicado (400) |

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

Cada teste anexa ao relatório a **evidência da chamada** (método, URL, corpo enviado, status e corpo recebido), inclusive nos cenários aprovados: é o equivalente ao screenshot em testes de interface e permite auditar o que trafegou sem reexecutar a suíte. Campos sensíveis (`password`, `authorization`) são mascarados, já que o relatório fica publicado.

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
- **Contratos isolados em `schemas/`:** os testes de contrato usam Joi com `abortEarly: false`, reportando todas as violações de uma vez.
- **Triple A:** todos os testes seguem Arrange / Act / Assert com marcação explícita.
- **Auto-limpeza:** cada suíte cria e remove a própria massa (`before`/`after`/`afterEach`), deixando o ambiente como o encontrou.

## 🚀 Pipeline

O workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) roda em todo push/PR: instala dependências com `npm ci`, verifica os tipos, executa as três suítes e gera o relatório **Allure**, publicado de duas formas: como **artefato** da execução e, nas execuções da `main`, no **GitHub Pages**, em uma URL fixa que sempre reflete a última execução.
