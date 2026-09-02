import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { request } from 'pactum';

/**
 * Configuração global executada antes das suítes: define a URL base e o
 * timeout padrão das requisições em um único lugar, evitando repetição
 * de configuração em cada teste.
 */
const BASE_URL = process.env.BASE_URL ?? 'https://serverest.dev';

request.setBaseUrl(BASE_URL);
request.setDefaultTimeout(15000);

registrarAmbienteNoAllure();

/**
 * Registra no relatório Allure contra qual ambiente a execução rodou.
 * Sem isso, um relatório isolado não permite saber se os resultados vieram
 * do ambiente público ou de uma instância local do ServeRest.
 */
function registrarAmbienteNoAllure(): void {
  const propriedades = [
    `URL_base=${BASE_URL}`,
    `Node=${process.version}`,
    `Executado_em=${process.env.CI ? 'GitHub Actions' : 'local'}`,
  ].join('\n');

  const diretorio = join(process.cwd(), 'allure-results');
  mkdirSync(diretorio, { recursive: true });
  writeFileSync(join(diretorio, 'environment.properties'), propriedades, 'utf8');
}
