import { attachment } from 'allure-js-commons';
import type Spec from 'pactum/src/models/Spec';

const CAMPOS_SENSIVEIS = ['password', 'senha', 'authorization'];

/**
 * Executa a requisição e anexa ao relatório Allure a evidência da chamada
 * (método, URL, corpo enviado, status e corpo recebido).
 *
 * Em testes de API não existe screenshot: a evidência equivalente é o par
 * requisição/resposta. Anexá-la também nos cenários aprovados permite auditar
 * o que de fato trafegou, sem reexecutar a suíte.
 */
export async function executarComEvidencia<T = unknown>(spec: Spec, nome: string): Promise<T> {
  try {
    return (await spec) as T;
  } finally {
    await anexarChamada(spec, nome);
  }
}

async function anexarChamada(spec: Spec, nome: string): Promise<void> {
  const interno = spec as unknown as {
    _request?: { method?: string; url?: string; body?: unknown };
    _response?: { statusCode?: number; json?: unknown };
    _expect?: { statusCode?: number; jsonLike?: unknown[]; json?: unknown[] };
  };

  // As validações de corpo ficam nos passos "Assert" do teste; aqui registra-se
  // apenas o que o próprio Pactum valida na resolução da requisição.
  const corpoEsperado = interno._expect?.json ?? [];

  const evidencia = {
    requisicao: {
      metodo: interno._request?.method,
      url: interno._request?.url,
      corpo: mascarar(interno._request?.body),
    },
    resposta: {
      status: interno._response?.statusCode,
      corpo: mascarar(interno._response?.json),
    },
    validacoes_aplicadas: {
      status_esperado: interno._expect?.statusCode,
      ...(corpoEsperado.length > 0 ? { corpo_esperado: mascarar(corpoEsperado) } : {}),
    },
  };

  await attachment(nome, JSON.stringify(evidencia, null, 2), 'application/json');
}

/**
 * Substitui o valor de campos sensíveis antes de gravar a evidência.
 * O relatório é publicado e fica acessível a quem tem o link, então senhas e
 * tokens não devem ser expostos, mesmo sendo massa de teste.
 */
function mascarar(valor: unknown): unknown {
  if (Array.isArray(valor)) {
    return valor.map(mascarar);
  }
  if (valor === null || typeof valor !== 'object') {
    return valor;
  }

  return Object.fromEntries(
    Object.entries(valor as Record<string, unknown>).map(([chave, item]) => [
      chave,
      CAMPOS_SENSIVEIS.includes(chave.toLowerCase()) ? '***' : mascarar(item),
    ]),
  );
}
