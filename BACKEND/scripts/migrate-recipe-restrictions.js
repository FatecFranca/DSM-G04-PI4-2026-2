/**
 * Script para migrar dados existentes em recipe_restrictions
 * Preenche restriction_id baseado em match de palavras-chave
 * 
 * Uso: node scripts/migrate-recipe-restrictions.js
 */

const { sequelize } = require('../src/config/database');
const { RecipeRestriction, Restriction } = require('../src/models');
const { Op } = require('sequelize');

async function migrateRecipeRestrictions() {
  try {
    console.log('🔄 Iniciando migração de recipe_restrictions...');

    // Buscar todas as recipe_restrictions sem restriction_id
    const recipeRestrictions = await RecipeRestriction.findAll({
      where: {
        restriction_id: null
      }
    });

    console.log(`📊 Encontradas ${recipeRestrictions.length} receitas sem restriction_id`);

    if (recipeRestrictions.length === 0) {
      console.log('✅ Nenhuma migração necessária!');
      return;
    }

    // Buscar todas as restrictions
    const allRestrictions = await Restriction.findAll();
    console.log(`📋 Total de restrições no catálogo: ${allRestrictions.length}`);

    let migrated = 0;
    let notMigrated = 0;

    for (const rr of recipeRestrictions) {
      let matched = false;

      // Obter palavras-chave da recipe_restriction
      const palavrasChave = rr.palavras_chave || [];
      const ingredienteRestritivo = (rr.ingrediente_restritivo || '').toLowerCase().trim();

      // Tentar fazer match com restrictions
      for (const restriction of allRestrictions) {
        const restrictionKeywords = restriction.palavras_chave || [];
        
        // Verificar se há match nas palavras-chave
        const hasMatch = palavrasChave.some(pk => {
          const pkLower = pk.toLowerCase().trim();
          return restrictionKeywords.some(rk => {
            const rkLower = rk.toLowerCase().trim();
            return pkLower === rkLower || 
                   pkLower.includes(rkLower) || 
                   rkLower.includes(pkLower);
          });
        }) || (ingredienteRestritivo && restrictionKeywords.some(rk => {
          const rkLower = rk.toLowerCase().trim();
          return ingredienteRestritivo.includes(rkLower) || 
                 rkLower.includes(ingredienteRestritivo);
        }));

        if (hasMatch) {
          // Atualizar com restriction_id
          rr.restriction_id = restriction.id;
          await rr.save();
          matched = true;
          migrated++;
          console.log(`✅ Migrado: recipe_restriction ${rr.id} → restriction ${restriction.id} (${restriction.nome})`);
          break;
        }
      }

      if (!matched) {
        notMigrated++;
        console.log(`⚠️  Não migrado: recipe_restriction ${rr.id} - nenhum match encontrado`);
        console.log(`   Ingrediente: ${rr.ingrediente_restritivo}`);
        console.log(`   Palavras-chave: ${JSON.stringify(palavrasChave)}`);
      }
    }

    console.log('\n📊 Resumo da migração:');
    console.log(`   ✅ Migradas: ${migrated}`);
    console.log(`   ⚠️  Não migradas: ${notMigrated}`);
    console.log(`   📝 Total processadas: ${recipeRestrictions.length}`);

    if (notMigrated > 0) {
      console.log('\n⚠️  ATENÇÃO: Algumas receitas não foram migradas automaticamente.');
      console.log('   Você pode precisar associá-las manualmente ou criar novas restrictions.');
    }

    console.log('\n✅ Migração concluída!');
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    throw error;
  }
}

// Executar migração
if (require.main === module) {
  migrateRecipeRestrictions()
    .then(() => {
      console.log('✅ Script finalizado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { migrateRecipeRestrictions };

