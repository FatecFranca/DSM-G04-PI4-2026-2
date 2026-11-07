/**
 * Script para verificar se as variáveis de ambiente estão configuradas
 * Execute: node scripts/check-env.js
 */

require('dotenv').config();

console.log('🔍 Verificando configuração do .env...\n');

const requiredVars = {
  JWT_SECRET: {
    required: true,
    description: 'Chave secreta para assinar tokens JWT',
    secure: true
  },
  JWT_EXPIRES_IN: {
    required: false,
    description: 'Tempo de expiração do token (padrão: 24h)',
    default: '24h'
  },
  DB_HOST: {
    required: true,
    description: 'Host do banco de dados PostgreSQL'
  },
  DB_PORT: {
    required: true,
    description: 'Porta do PostgreSQL',
    default: '5432'
  },
  DB_NAME: {
    required: true,
    description: 'Nome do banco de dados'
  },
  DB_USER: {
    required: true,
    description: 'Usuário do banco de dados'
  },
  DB_PASSWORD: {
    required: true,
    description: 'Senha do banco de dados',
    secure: true
  },
  PORT: {
    required: false,
    description: 'Porta do servidor (padrão: 3001)',
    default: '3001'
  }
};

let allOk = true;
const issues = [];

console.log('📋 Verificando variáveis:\n');

for (const [varName, config] of Object.entries(requiredVars)) {
  const value = process.env[varName];
  const isSet = value !== undefined && value !== '';
  const isRequired = config.required;

  if (isRequired && !isSet) {
    console.log(`❌ ${varName}: NÃO CONFIGURADO`);
    console.log(`   ${config.description}`);
    if (config.default) {
      console.log(`   💡 Valor padrão sugerido: ${config.default}`);
    }
    console.log('');
    allOk = false;
    issues.push({ varName, issue: 'não configurado' });
  } else if (isSet) {
    if (config.secure) {
      const displayValue = value.length > 20 ? `${value.substring(0, 20)}...` : '***';
      console.log(`✅ ${varName}: Configurado (${displayValue})`);
    } else {
      console.log(`✅ ${varName}: ${value}`);
    }
    console.log(`   ${config.description}\n`);
  } else if (!isRequired) {
    console.log(`⚠️  ${varName}: Não configurado (usando padrão: ${config.default})`);
    console.log(`   ${config.description}\n`);
  }
}

// Verificação especial para JWT_SECRET
if (process.env.JWT_SECRET) {
  const jwtSecret = process.env.JWT_SECRET;

  console.log('🔐 Verificando JWT_SECRET...\n');

  if (jwtSecret === 'seu_jwt_secret_super_seguro_mude_em_producao_123456789') {
    console.log('⚠️  ATENÇÃO: Você está usando o JWT_SECRET de exemplo!');
    console.log('   Isso é aceitável para desenvolvimento, mas:');
    console.log('   - NUNCA use em produção');
    console.log('   - Gere um novo com: node scripts/generate-jwt-secret.js\n');
  } else if (jwtSecret.length < 32) {
    console.log('⚠️  ATENÇÃO: JWT_SECRET muito curto!');
    console.log('   Recomendado: pelo menos 32 caracteres');
    console.log('   Gere um novo com: node scripts/generate-jwt-secret.js\n');
    allOk = false;
    issues.push({ varName: 'JWT_SECRET', issue: 'muito curto' });
  } else {
    console.log('✅ JWT_SECRET parece seguro (tamanho adequado)\n');
  }
} else {
  console.log('❌ JWT_SECRET não configurado!\n');
  console.log('   Gere um com: node scripts/generate-jwt-secret.js\n');
}

// Resumo
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (allOk) {
  console.log('✅ Todas as variáveis obrigatórias estão configuradas!\n');
  console.log('💡 Como funciona o JWT_SECRET:');
  console.log('   - É uma CHAVE SECRETA (string) usada para ASSINAR os tokens');
  console.log('   - Os TOKENS JWT são gerados AUTOMATICAMENTE quando você:');
  console.log('     • Faz registro (POST /api/auth/register)');
  console.log('     • Faz login (POST /api/auth/login)');
  console.log('   - Você NÃO precisa criar tokens manualmente');
  console.log('   - O sistema cria os tokens usando o JWT_SECRET\n');
} else {
  console.log('❌ Algumas variáveis estão faltando ou incorretas!\n');
  console.log('📝 Problemas encontrados:');
  issues.forEach(({ varName, issue }) => {
    console.log(`   - ${varName}: ${issue}`);
  });
  console.log('\n💡 Soluções:');
  console.log('   1. Copie o arquivo env.example para .env');
  console.log('   2. Configure as variáveis necessárias');
  console.log('   3. Para JWT_SECRET, gere um novo: node scripts/generate-jwt-secret.js');
  process.exit(1);
}
