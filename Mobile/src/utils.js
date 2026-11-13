export function idDe(item) {
  return item ? String(item.id ?? item._id ?? '') : '';
}

export function iniciais(nome) {
  return String(nome || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

// Converte ingredientes (array, JSON em texto ou texto por linhas) em lista de textos.
export function lista(valor) {
  if (Array.isArray(valor)) {
    return valor
      .map((i) => (typeof i === 'string' ? i : i?.nome || i?.ingrediente || ''))
      .filter(Boolean);
  }
  if (typeof valor === 'string') {
    try {
      const json = JSON.parse(valor);
      if (Array.isArray(json)) return lista(json);
    } catch (e) {
      // não é JSON: segue como texto
    }
    return valor.split(/\r?\n|;/).map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

// Nomes das restrições do usuário que aparecem nos ingredientes detectados da receita (lista).
export function conflitosDaReceita(receita, idsRestricoes) {
  const detectadas = Array.isArray(receita?.restricoes_detectadas)
    ? receita.restricoes_detectadas
    : [];
  const nomes = [];
  detectadas.forEach((d) => {
    const id = String(d.restricao_id ?? '');
    if (id && idsRestricoes.has(id)) {
      const nome = d.restricao_nome || 'Restrição';
      if (!nomes.includes(nome)) nomes.push(nome);
    }
  });
  return nomes;
}

// Avisos detalhados para a tela da receita.
export function montarAvisos(receita, idsRestricoes) {
  const avisos = [];
  (receita?.restrictions || []).forEach((r) => {
    const id = String(r.restricao_id ?? r.restriction_id ?? '');
    if (id && idsRestricoes.has(id)) {
      avisos.push(
        `${r.ingrediente_restritivo || 'Ingrediente'} (${r.restricao_nome || 'restrição'})`
      );
    }
  });
  if (!avisos.length && receita?.hasRestrictionConflict) {
    (receita.conflictingRestrictions || []).forEach((c) =>
      avisos.push(c.ingredient || 'Ingrediente')
    );
  }
  return avisos;
}

export function idsDasRestricoes(resposta) {
  const ids = new Set();
  const dados = Array.isArray(resposta?.data) ? resposta.data : [];
  dados.forEach((u) => {
    if (u?.restriction_id) ids.add(String(u.restriction_id));
  });
  return ids;
}
