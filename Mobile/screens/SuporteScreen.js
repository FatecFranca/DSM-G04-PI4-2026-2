
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  StatusBar,
  Linking,
} from 'react-native';

const perguntas = [
  {
    pergunta: 'Como funcionam as restrições alimentares?',
    resposta:
      'Você pode cadastrar suas restrições na área de perfil. Essas informações ajudam a identificar receitas que podem não ser adequadas às suas necessidades.',
  },
  {
    pergunta: 'Como encontro uma receita?',
    resposta:
      'Acesse a área de receitas e utilize a busca para encontrar opções pelo nome ou por termos relacionados ao prato desejado.',
  },
  {
    pergunta: 'Como publico uma receita?',
    resposta:
      'Acesse Publicações e selecione a opção para cadastrar uma receita. Preencha o título, os ingredientes e o modo de preparo.',
  },
  {
    pergunta: 'As receitas são totalmente seguras para pessoas alérgicas?',
    resposta:
      'Não necessariamente. Sempre confira os ingredientes, os rótulos e os riscos de contaminação cruzada. Em caso de dúvida, procure orientação profissional.',
  },
];

export default function SuporteScreen({ navigation }) {
  const [perguntaAberta, setPerguntaAberta] = useState(null);
  const [assunto, setAssunto] = useState('');
  const [mensagem, setMensagem] = useState('');

  function enviarMensagem() {
    if (!assunto.trim() || !mensagem.trim()) {
      Alert.alert(
        'Campos obrigatórios',
        'Preencha o assunto e descreva sua dúvida.'
      );
      return;
    }

    Alert.alert(
      'Mensagem validada',
      'O formulário está preenchido. O envio para a equipe de suporte será habilitado quando conectarmos o backend.'
    );
  }

  async function abrirEmail() {
    const email = 'suporte@safebite.com.br';
    const url = `mailto:${email}`;

    try {
      const disponivel = await Linking.canOpenURL(url);

      if (disponivel) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          'Não foi possível abrir o e-mail',
          `Entre em contato pelo endereço: ${email}`
        );
      }
    } catch {
      Alert.alert(
        'Contato',
        `Endereço de suporte demonstrativo: ${email}`
      );
    }
  }

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

          <Text style={styles.headerTitle}>Suporte</Text>

          <View style={styles.headerSpace} />
        </View>

        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Text style={styles.heroLetter}>?</Text>
          </View>

          <Text style={styles.heroTitle}>
            Como podemos ajudar?
          </Text>

          <Text style={styles.heroDescription}>
            Encontre respostas para suas dúvidas ou envie uma
            mensagem para nossa equipe.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Perguntas frequentes
          </Text>

          {perguntas.map((item, index) => {
            const aberta = perguntaAberta === index;

            return (
              <TouchableOpacity
                key={item.pergunta}
                style={styles.faqCard}
                activeOpacity={0.8}
                onPress={() =>
                  setPerguntaAberta(aberta ? null : index)
                }
              >
                <View style={styles.faqHeader}>
                  <Text style={styles.faqQuestion}>
                    {item.pergunta}
                  </Text>

                  <Text style={styles.faqArrow}>
                    {aberta ? '−' : '+'}
                  </Text>
                </View>

                {aberta && (
                  <Text style={styles.faqAnswer}>
                    {item.resposta}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Envie sua dúvida
          </Text>

          <View style={styles.formCard}>
            <Text style={styles.label}>Assunto</Text>

            <TextInput
              style={styles.input}
              value={assunto}
              onChangeText={setAssunto}
              placeholder="Ex.: problema com uma receita"
              placeholderTextColor="#9CA3AF"
              maxLength={100}
            />

            <Text style={styles.label}>Mensagem</Text>

            <TextInput
              style={[styles.input, styles.messageInput]}
              value={mensagem}
              onChangeText={setMensagem}
              placeholder="Descreva como podemos ajudar..."
              placeholderTextColor="#9CA3AF"
              multiline
              textAlignVertical="top"
              maxLength={1000}
            />

            <TouchableOpacity
              style={styles.sendButton}
              onPress={enviarMensagem}
            >
              <Text style={styles.sendButtonText}>
                Enviar mensagem
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>
            Outros canais de contato
          </Text>

          <Text style={styles.contactDescription}>
            Você também pode tentar entrar em contato por e-mail.
          </Text>

          <TouchableOpacity
            style={styles.emailButton}
            onPress={abrirEmail}
          >
            <Text style={styles.emailButtonText}>
              suporte@safebite.com.br
            </Text>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            O endereço acima é demonstrativo. Substitua-o pelo
            endereço oficial da equipe antes de publicar o aplicativo.
          </Text>
        </View>

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
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  backText: {
    fontSize: 34,
    color: '#1A1A1A',
    lineHeight: 38,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  headerSpace: {
    width: 40,
  },
  hero: {
    marginHorizontal: 16,
    marginTop: 20,
    padding: 24,
    borderRadius: 18,
    backgroundColor: '#FFF3DD',
    alignItems: 'center',
  },
  heroIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#F5A623',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  heroLetter: {
    fontSize: 30,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroTitle: {
    fontSize: 21,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  heroDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 21,
    marginTop: 9,
  },
  section: {
    marginHorizontal: 16,
    marginTop: 25,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 14,
  },
  faqCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    paddingHorizontal: 15,
    paddingVertical: 16,
    marginBottom: 10,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQuestion: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    lineHeight: 21,
    paddingRight: 10,
  },
  faqArrow: {
    fontSize: 23,
    color: '#D88900',
    fontWeight: '500',
  },
  faqAnswer: {
    fontSize: 13,
    lineHeight: 20,
    color: '#6B7280',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    padding: 17,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 12,
    color: '#1A1A1A',
    fontSize: 14,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  messageInput: {
    minHeight: 125,
  },
  sendButton: {
    height: 49,
    borderRadius: 10,
    backgroundColor: '#F5A623',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  contactCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 22,
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  contactDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
    marginTop: 8,
  },
  emailButton: {
    alignSelf: 'flex-start',
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 13,
    borderRadius: 9,
    backgroundColor: '#EAF8EF',
  },
  emailButtonText: {
    color: '#16803D',
    fontSize: 13,
    fontWeight: '700',
  },
  disclaimer: {
    fontSize: 11,
    lineHeight: 17,
    color: '#9CA3AF',
    marginTop: 12,
  },
  footer: {
    marginTop: 28,
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 12,
  },
});
