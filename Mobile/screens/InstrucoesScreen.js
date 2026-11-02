
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';

const etapas = [
  {
    numero: '01',
    titulo: 'Configure suas restrições',
    descricao:
      'Informe suas alergias e intolerâncias para personalizar sua experiência no Safe Bite.',
  },
  {
    numero: '02',
    titulo: 'Explore as receitas',
    descricao:
      'Pesquise receitas e consulte os ingredientes e o modo de preparo antes de escolher o que fazer.',
  },
  {
    numero: '03',
    titulo: 'Confira os ingredientes',
    descricao:
      'Leia atentamente a composição dos alimentos e verifique possíveis riscos de contaminação cruzada.',
  },
  {
    numero: '04',
    titulo: 'Compartilhe suas receitas',
    descricao:
      'Cadastre suas próprias receitas para compartilhar ideias com a comunidade.',
  },
];

export default function InstrucoesScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor="#FFFFFF"
        barStyle="dark-content"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Como começar</Text>

          <View style={styles.headerSpace} />
        </View>

        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Text style={styles.heroIconText}>SB</Text>
          </View>

          <Text style={styles.heroTitle}>
            Bem-vindo ao Safe Bite
          </Text>

          <Text style={styles.heroDescription}>
            Descubra receitas, organize suas preferências
            alimentares e encontre informações para fazer
            escolhas mais conscientes.
          </Text>
        </View>

        <View style={styles.stepsSection}>
          <Text style={styles.sectionTitle}>
            Comece em 4 passos
          </Text>

          {etapas.map((etapa, index) => (
            <View style={styles.stepRow} key={etapa.numero}>
              <View style={styles.timeline}>
                <View style={styles.numberCircle}>
                  <Text style={styles.numberText}>
                    {etapa.numero}
                  </Text>
                </View>

                {index !== etapas.length - 1 && (
                  <View style={styles.timelineLine} />
                )}
              </View>

              <View style={styles.stepCard}>
                <Text style={styles.stepTitle}>
                  {etapa.titulo}
                </Text>

                <Text style={styles.stepDescription}>
                  {etapa.descricao}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>
            Sua segurança vem primeiro
          </Text>

          <Text style={styles.warningDescription}>
            As informações do aplicativo não garantem que uma
            receita seja segura para todas as pessoas. Sempre
            confira os rótulos e os ingredientes e considere o
            risco de contaminação cruzada.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Restricoes')}
        >
          <Text style={styles.primaryButtonText}>
            Configurar restrições
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Receitas')}
        >
          <Text style={styles.secondaryButtonText}>
            Explorar receitas
          </Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          Safe Bite · Alimentação com mais segurança
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    width: 35,
    height: 40,
    justifyContent: 'center',
  },
  backText: {
    fontSize: 34,
    lineHeight: 38,
    color: '#1A1A1A',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  headerSpace: {
    width: 35,
  },
  hero: {
    marginHorizontal: 16,
    marginTop: 20,
    padding: 24,
    backgroundColor: '#FFF3DD',
    borderRadius: 18,
    alignItems: 'center',
  },
  heroIcon: {
    width: 65,
    height: 65,
    borderRadius: 20,
    backgroundColor: '#F5A623',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 17,
  },
  heroIconText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  heroDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 10,
  },
  stepsSection: {
    marginHorizontal: 18,
    marginTop: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 20,
  },
  stepRow: {
    flexDirection: 'row',
    minHeight: 112,
  },
  timeline: {
    width: 48,
    alignItems: 'center',
  },
  numberCircle: {
    width: 39,
    height: 39,
    borderRadius: 13,
    backgroundColor: '#EAF8EF',
    borderWidth: 1,
    borderColor: '#B7E4C5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#16803D',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#D8EBDD',
    marginVertical: 5,
  },
  stepCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    padding: 15,
    marginLeft: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  stepDescription: {
    fontSize: 13,
    lineHeight: 20,
    color: '#6B7280',
    marginTop: 7,
  },
  warningCard: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 4,
    borderLeftColor: '#F5A623',
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  warningDescription: {
    fontSize: 12,
    lineHeight: 19,
    color: '#6B7280',
    marginTop: 7,
  },
  primaryButton: {
    height: 50,
    marginHorizontal: 16,
    marginTop: 22,
    borderRadius: 11,
    backgroundColor: '#F5A623',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryButton: {
    height: 48,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#22C55E',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16803D',
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 25,
  },
});
