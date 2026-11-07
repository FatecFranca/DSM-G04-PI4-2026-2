require('dotenv').config();
const { connectDB } = require('./database');
const Restriction = require('../models/Restriction');

const restrictions = [
  // ─── ALERGIAS ───────────────────────────────────────────────
  {
    nome: 'Glúten',
    categoria: 'alergia',
    palavras_chave: [
      'gluten', 'glúten', 'trigo', 'centeio', 'cevada', 'aveia',
      'farinha de trigo', 'farinha', 'semolina', 'espelta', 'kamut',
      'triticale', 'malte', 'amido de trigo', 'pão', 'macarrão',
      'massa', 'biscoito', 'bolacha', 'bolo', 'cerveja'
    ]
  },
  {
    nome: 'Lactose',
    categoria: 'intolerância',
    palavras_chave: [
      'lactose', 'leite', 'leite de vaca', 'leite integral', 'leite desnatado',
      'leite em pó', 'queijo', 'iogurte', 'manteiga', 'creme de leite',
      'requeijão', 'nata', 'whey', 'caseína', 'soro de leite',
      'ricota', 'mussarela', 'parmesão', 'cream cheese', 'coalho',
      'brie', 'gorgonzola', 'catupiry'
    ]
  },
  {
    nome: 'Amendoim',
    categoria: 'alergia',
    palavras_chave: [
      'amendoim', 'pasta de amendoim', 'manteiga de amendoim',
      'óleo de amendoim', 'farinha de amendoim', 'paçoca',
      'pé de moleque', 'amendoim torrado', 'amendoim cru'
    ]
  },
  {
    nome: 'Nozes e Castanhas',
    categoria: 'alergia',
    palavras_chave: [
      'nozes', 'castanha', 'castanha do pará', 'castanha de caju',
      'avelã', 'amêndoa', 'pistache', 'macadâmia', 'noz pecã',
      'noz moscada', 'pinhão', 'pinha', 'mix de nuts', 'granola',
      'tahine', 'tahini', 'gergelim', 'sésamo'
    ]
  },
  {
    nome: 'Ovo',
    categoria: 'alergia',
    palavras_chave: [
      'ovo', 'ovos', 'clara', 'gema', 'clara de ovo', 'gema de ovo',
      'albumina', 'lecitina de ovo', 'maionese', 'merengue',
      'omelette', 'omelete', 'quiche', 'creme de ovo'
    ]
  },
  {
    nome: 'Frutos do Mar',
    categoria: 'alergia',
    palavras_chave: [
      'camarão', 'caranguejo', 'lagosta', 'siri', 'lagostim',
      'mexilhão', 'marisco', 'ostra', 'mariscos', 'vieira',
      'polvo', 'lula', 'frutos do mar', 'seafood', 'kani'
    ]
  },
  {
    nome: 'Peixe',
    categoria: 'alergia',
    palavras_chave: [
      'peixe', 'atum', 'salmão', 'tilápia', 'bacalhau', 'sardinha',
      'anchova', 'anchova', 'robalo', 'dourado', 'linguado',
      'merluza', 'pescada', 'cação', 'molho de peixe', 'worcestershire',
      'colatura', 'peixe frito', 'filé de peixe'
    ]
  },
  {
    nome: 'Soja',
    categoria: 'alergia',
    palavras_chave: [
      'soja', 'tofu', 'edamame', 'missô', 'shoyu', 'molho de soja',
      'leite de soja', 'farinha de soja', 'proteína de soja',
      'tempeh', 'óleo de soja', 'lecitina de soja', 'natto',
      'protéina texturizada de soja', 'pts', 'pve'
    ]
  },
  {
    nome: 'Gergelim',
    categoria: 'alergia',
    palavras_chave: [
      'gergelim', 'sésamo', 'tahine', 'tahini', 'óleo de gergelim',
      'pasta de gergelim', 'sementes de gergelim'
    ]
  },

  // ─── DIETAS ──────────────────────────────────────────────────
  {
    nome: 'Vegetariano',
    categoria: 'dieta',
    palavras_chave: [
      'carne', 'carne bovina', 'carne suína', 'frango', 'peru',
      'pato', 'peixe', 'atum', 'salmão', 'aves', 'bacon',
      'presunto', 'salame', 'linguiça', 'salsicha', 'mortadela',
      'carne de porco', 'costela', 'filé', 'alcatra', 'contrafilé',
      'picanha', 'músculo', 'patinho', 'coxinha', 'fraldinha'
    ]
  },
  {
    nome: 'Vegano',
    categoria: 'dieta',
    palavras_chave: [
      'carne', 'frango', 'peixe', 'leite', 'queijo', 'manteiga',
      'ovo', 'ovos', 'mel', 'gelatina', 'creme de leite',
      'iogurte', 'requeijão', 'whey', 'caseína', 'albumina',
      'ghee', 'banha', 'toucinho', 'bacon', 'presunto',
      'colágeno', 'lactose', 'soro de leite'
    ]
  },
  {
    nome: 'Sem Carne Vermelha',
    categoria: 'dieta',
    palavras_chave: [
      'carne bovina', 'carne vermelha', 'boi', 'vaca', 'vitela',
      'cordeiro', 'carneiro', 'cabrito', 'búfalo', 'alcatra',
      'picanha', 'costela', 'contrafilé', 'filé mignon', 'patinho',
      'músculo', 'acém', 'coxão', 'maminha', 'fraldinha',
      'carne de porco', 'suína', 'leitão', 'bacon', 'presunto',
      'linguiça', 'salsicha', 'mortadela', 'salame'
    ]
  },

  // ─── CONDIÇÕES MÉDICAS ───────────────────────────────────────
  {
    nome: 'Diabetes',
    categoria: 'condição médica',
    palavras_chave: [
      'açúcar', 'açúcar refinado', 'açúcar mascavo', 'mel',
      'frutose', 'glicose', 'xarope de milho', 'rapadura',
      'melado', 'calda de bordo', 'maple syrup', 'sacarose',
      'dextrose', 'maltose', 'refrigerante', 'suco industrializado',
      'doce', 'bolo', 'torta', 'chocolate ao leite', 'brigadeiro',
      'sorvete', 'pudim', 'mousse', 'geleia', 'doce de leite'
    ]
  },
  {
    nome: 'Hipertensão (Baixo Sódio)',
    categoria: 'condição médica',
    palavras_chave: [
      'sal', 'sódio', 'sal refinado', 'sal marinho', 'sal rosa',
      'molho de soja', 'shoyu', 'missô', 'glutamato monossódico',
      'ajinomoto', 'caldo knorr', 'caldo de carne', 'caldo de galinha',
      'molho inglês', 'worcestershire', 'molho de ostra',
      'azeitona', 'picles', 'conservas', 'embutidos', 'defumados',
      'queijo parmesão', 'anchovas', 'molho de peixe', 'capers'
    ]
  },
  {
    nome: 'Colesterol Alto',
    categoria: 'condição médica',
    palavras_chave: [
      'banha', 'manteiga', 'gordura animal', 'bacon', 'toucinho',
      'gema de ovo', 'creme de leite', 'gordura saturada',
      'óleo de coco', 'pele de frango', 'carnes gordas',
      'embutidos', 'salsicha', 'mortadela', 'salame',
      'queijo amarelo', 'queijo prato', 'cheddar', 'gouda'
    ]
  },
  {
    nome: 'Doença Celíaca',
    categoria: 'condição médica',
    palavras_chave: [
      'gluten', 'glúten', 'trigo', 'centeio', 'cevada', 'aveia',
      'farinha de trigo', 'semolina', 'espelta', 'kamut',
      'triticale', 'malte', 'amido de trigo', 'molho de soja',
      'shoyu', 'cerveja', 'farinha', 'pão', 'macarrão',
      'massa', 'biscoito', 'bolacha'
    ]
  },

  // ─── OUTRAS RESTRIÇÕES ────────────────────────────────────────
  {
    nome: 'Frutos Cítricos',
    categoria: 'alergia',
    palavras_chave: [
      'limão', 'laranja', 'tangerina', 'grapefruit', 'toranja',
      'lima', 'bergamota', 'pomelo', 'suco de laranja',
      'suco de limão', 'raspas de laranja', 'raspas de limão',
      'ácido cítrico', 'limonada', 'laranjada'
    ]
  },
  {
    nome: 'Carne de Porco',
    categoria: 'restrição religiosa',
    palavras_chave: [
      'porco', 'suíno', 'carne de porco', 'bacon', 'presunto',
      'salame', 'linguiça de porco', 'salsicha de porco',
      'mortadela', 'toucinho', 'banha', 'leitão', 'costela de porco',
      'pernil', 'lombo de porco', 'calabresa', 'copa', 'pancetta'
    ]
  },
  {
    nome: 'Álcool',
    categoria: 'restrição religiosa',
    palavras_chave: [
      'vinho', 'cerveja', 'cachaça', 'rum', 'vodka', 'whisky',
      'conhaque', 'licor', 'champagne', 'espumante', 'sidra',
      'sake', 'álcool', 'alcoolico', 'aguardente', 'brandy',
      'gin', 'tequila', 'pinga', 'caipirinha'
    ]
  },
  {
    nome: 'Frutose',
    categoria: 'intolerância',
    palavras_chave: [
      'frutose', 'mel', 'agave', 'xarope de milho', 'maçã',
      'pera', 'manga', 'melancia', 'uva', 'cereja',
      'figo', 'suco de fruta', 'xarope de frutose',
      'sorbitol', 'manitol', 'polialcoois'
    ]
  },
  {
    nome: 'Cafeína',
    categoria: 'intolerância',
    palavras_chave: [
      'café', 'cafeína', 'cappuccino', 'espresso', 'nescafé',
      'chá preto', 'chá verde', 'chá mate', 'guaraná',
      'energético', 'coca-cola', 'refrigerante de cola',
      'chocolate amargo', 'cacau', 'chocolate'
    ]
  }
];

const seed = async () => {
  try {
    await connectDB();

    const count = await Restriction.countDocuments();

    if (count > 0) {
      console.log(`⚠️  Banco já possui ${count} restrições. Pulando seed.`);
      console.log('   Para forçar o seed, use: npm run seed:force');
      process.exit(0);
    }

    await Restriction.insertMany(restrictions);
    console.log(`✅ ${restrictions.length} restrições alimentares inseridas com sucesso!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao executar seed:', error.message);
    process.exit(1);
  }
};

const seedForce = async () => {
  try {
    await connectDB();
    await Restriction.deleteMany({});
    await Restriction.insertMany(restrictions);
    console.log(`✅ Seed forçado: ${restrictions.length} restrições reinseridas!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao executar seed:', error.message);
    process.exit(1);
  }
};

// Permite chamar com --force para recriar tudo
if (process.argv.includes('--force')) {
  seedForce();
} else {
  seed();
}