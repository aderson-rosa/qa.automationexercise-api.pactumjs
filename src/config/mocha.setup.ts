import { request } from 'pactum';

/**
 * Configuração global executada antes das suítes: define a URL base e o
 * timeout padrão das requisições em um único lugar, evitando repetição
 * de configuração em cada teste.
 */
const BASE_URL = process.env.BASE_URL ?? 'https://serverest.dev';

request.setBaseUrl(BASE_URL);
request.setDefaultTimeout(15000);
