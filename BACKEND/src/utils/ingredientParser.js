const Restriction = require('../models/Restriction');
const normalize = s => {
  if (!s) return '';
  return s
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const removeQty = line => {
  return line
    .replace(/^\s*\d+([.,]\d+)?\s*(g|kg|ml|l|xicaras?|colheres?|colher|unidades?)?(\s+de)?\s*/i, '')
    .trim();
};

const extractIngredients = textOrArray => {
  if (!textOrArray) return [];

  if (Array.isArray(textOrArray)) {
    // Filtrar e processar cada ingrediente
    return textOrArray
      .map(i => {
        if (!i || typeof i !== 'string') return null;
        // Limitar tamanho de cada ingrediente (máximo 100 caracteres)
        const ingrediente = i.length > 100 ? i.substring(0, 100) : i;
        return normalize(removeQty(ingrediente));
      })
      .filter(i => i && i.length > 0 && i.length <= 100); // Filtrar nulos e muito longos
  }
  
  // Se for string, tentar dividir por vírgulas ou quebras de linha
  const lines = textOrArray
    .split(/[,\r?\n]/)
    .map(l => l.trim())
    .filter(Boolean)
    .filter(l => l.length <= 100); // Filtrar linhas muito longas
  
  return lines.map(l => {
    const normalized = normalize(removeQty(l));
    return normalized.length <= 100 ? normalized : normalized.substring(0, 100);
  });
};

const identifyRestrictionsFromIngredients = async ingredients => {
  const all = await Restriction.find({});
  const results = [];
  const normalizedIngredients = ingredients.map(i => normalize(i));
  for (const r of all) {
    const kws = r.palavras_chave && Array.isArray(r.palavras_chave) ? r.palavras_chave : [];
    const kwsNormalized = kws.map(k => normalize(k));
    for (const ing of normalizedIngredients) {
      for (const kw of kwsNormalized) {
        if (!kw) continue;
        if (ing.includes(kw) || kw.includes(ing)) {
          results.push({
            restrictionId: r._id,
            restrictionName: r.nome,
            ingrediente: ing,
            matchedKeyword: kw
          });
        }
      }
    }
  }
  const seen = new Set();
  const uniq = results.filter(x => {
    const key = `${x.restrictionId}::${x.ingrediente}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return uniq;
};

module.exports = {
  normalize,
  removeQty,
  extractIngredients,
  identifyRestrictionsFromIngredients
};