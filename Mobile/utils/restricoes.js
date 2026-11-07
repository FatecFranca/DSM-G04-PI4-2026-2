// Funções compartilhadas entre ReceitasScreen e ReceitaDetalheScreen.

export function transformarLista(valor) {
  if (Array.isArray(valor)) {
    return valor;
  }

  if (typeof valor !== 'string' || !valor.trim()) {
    return [];
  }

  try {
    const resultado = JSON.parse(valor);

    if (Array.isArray(resultado)) {
      return resultado;
    }
  } catch (error) {
    // O conteúdo também pode ser texto separado por linhas.
  }

  return valor
    .split(/\r?\n|;/)
    .map((item) => item.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean);
}

export function normalizarTexto(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function obterDadosRestricoes(resposta) {
  if (Array.isArray(resposta)) {
    return resposta;
  }

  if (Array.isArray(resposta?.data)) {
    return resposta.data;
  }

  return [];
}

export function verificarConflitos(ingredientes, restricoes) {
  const conflitos = [];

  const ingredientesTexto = ingredientes.map((ingrediente) => {
    if (typeof ingrediente === 'string') {
      return ingrediente;
    }

    return (
      ingrediente?.nome ||
      ingrediente?.ingrediente ||
      ingrediente?.descricao ||
      ''
    );
  });

  restricoes.forEach((item) => {
    const restricao = item.restriction || item.restricao || item;

    const nomeRestricao =
      restricao.nome || 'Restrição alimentar';

    const palavrasChave = [
      ...(Array.isArray(restricao.palavras_chave)
        ? restricao.palavras_chave
        : []),
      ...(Array.isArray(item.palavras_chave_personalizadas)
        ? item.palavras_chave_personalizadas
        : []),
    ]
      .filter(Boolean)
      .map(normalizarTexto)
      .filter(Boolean);

    ingredientesTexto.forEach((ingrediente) => {
      const ingredienteNormalizado = normalizarTexto(ingrediente);

      if (!ingredienteNormalizado) {
        return;
      }

      const palavraEncontrada = palavrasChave.find(
        (palavra) => ingredienteNormalizado.includes(palavra)
      );

      if (palavraEncontrada) {
        conflitos.push({
          restricao: nomeRestricao,
          ingrediente,
          palavraChave: palavraEncontrada,
        });
      }
    });
  });

  return conflitos.filter(
    (conflito, index, lista) =>
      lista.findIndex(
        (outro) =>
          outro.restricao === conflito.restricao &&
          outro.ingrediente === conflito.ingrediente
      ) === index
  );
}