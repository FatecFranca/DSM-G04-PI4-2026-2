
import React from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
} from 'react-native';

export default function HomeScreen({ navigation }) {
  const atalhos = [
    {
      titulo: 'Receitas seguras para você',
      descricao:
        'Encontre pratos compatíveis com suas restrições alimentares. O sistema filtra automaticamente tudo que pode te prejudicar.',
      destino: 'Receitas',
      identificador: '01',
      cor: '#F5A623',
    },
    {
      titulo: 'Comunidade ativa',
      descricao:
        'Publique suas próprias receitas, avalie pratos de outros usuários e compartilhe dicas de substituição de ingredientes.',
      destino: 'Publicacoes',
      identificador: '02',
      cor: '#22C55E',
    },
    {
      titulo: 'Perfil personalizado',
      descricao:
        'Mantenha suas informações atualizadas, gerencie suas restrições e personalize sua experiência.',
      destino: 'Perfil',
      identificador: '03',
      cor: '#F97316',
    },
    {
      titulo: 'Como começar?',
      descricao:
        'Acesse o tutorial e aprenda a aproveitar todos os recursos que o Safe Bite tem a oferecer.',
      destino: 'Instrucoes',
      identificador: '04',
      cor: '#8B5CF6',
    },
    {
      titulo: 'Balança Inteligente',
      descricao:
        'Acompanhe o peso dos alimentos, as calorias e as informações do ambiente por meio da integração com o dispositivo IoT.',
      destino: 'Balanca',
      identificador: '05',
      cor: '#0EA5E9',
    },
  ];

  function abrirTela(destino) {
    const telaExiste = navigation
      .getState()
      .routeNames.includes(destino);

    if (telaExiste) {
      navigation.navigate(destino);
      return;
    }

    Alert.alert(
      'Tela indisponível',
      'Esta tela ainda não está disponível na navegação do aplicativo.'
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
      />

      <View style={styles.cabecalho}>
        <Image
          source={require('../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="Logo Safe Bite"
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.conteudo}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.banner}>
          <View style={styles.bannerTextoContainer}>
            <Text style={styles.bannerTitulo}>
              Bem-vindo(a) ao Safe Bite!
            </Text>

            <Text style={styles.bannerDescricao}>
              Sua vida pode ser mais saudável. Explore receitas
              adaptadas para o seu perfil alimentar.
            </Text>
          </View>

          <View style={styles.bannerDetalhe} />
        </View>

        <View style={styles.informativo}>
          <Text style={styles.informativoTitulo}>
            O que é o Safe Bite?
          </Text>

          <Text style={styles.informativoTexto}>
            O Safe Bite nasceu para ser uma solução para quem vive
            com restrições alimentares. Nossa plataforma ajuda você
            a informar suas restrições no cadastro e encontrar
            receitas adequadas ao seu perfil, com mais segurança.
          </Text>
        </View>

        <View style={styles.grade}>
          {atalhos.map((atalho) => (
            <TouchableOpacity
              key={atalho.identificador}
              style={styles.cartao}
              activeOpacity={0.8}
              onPress={() => abrirTela(atalho.destino)}
              accessibilityRole="button"
              accessibilityLabel={atalho.titulo}
            >
              <View
                style={[
                  styles.indicador,
                  { backgroundColor: atalho.cor },
                ]}
              />

              <Text
                style={[
                  styles.numero,
                  { color: atalho.cor },
                ]}
              >
                {atalho.identificador}
              </Text>

              <Text style={styles.cartaoTitulo}>
                {atalho.titulo}
              </Text>

              <Text style={styles.cartaoDescricao}>
                {atalho.descricao}
              </Text>

              <Text style={styles.acessar}>
                Acessar
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.rodape}>
          <Text style={styles.rodapeTitulo}>
            Safe Bite
          </Text>

          <Text style={styles.rodapeTexto}>
            Alimentação com mais segurança.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },

  cabecalho: {
    height: 66,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },

  logo: {
    width: 135,
    height: 54,
  },

  conteudo: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 32,
  },

  banner: {
    minHeight: 150,
    borderRadius: 16,
    backgroundColor: '#F5A623',
    overflow: 'hidden',
    justifyContent: 'center',
    marginBottom: 20,
    position: 'relative',
  },

  bannerTextoContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingRight: 35,
    zIndex: 1,
  },

  bannerTitulo: {
    fontSize: 23,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
  },

  bannerDescricao: {
    fontSize: 14,
    lineHeight: 21,
    color: '#FFFFFF',
    maxWidth: 310,
  },

  bannerDetalhe: {
    position: 'absolute',
    right: -55,
    top: -20,
    width: 125,
    height: 200,
    backgroundColor: '#22C55E',
    opacity: 0.75,
    borderRadius: 60,
    transform: [{ rotate: '25deg' }],
  },

  informativo: {
    backgroundColor: '#EFF8F2',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0EFE4',
  },

  informativoTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#356344',
    marginBottom: 10,
  },

  informativoTexto: {
    fontSize: 13,
    color: '#59665D',
    lineHeight: 20,
  },

  grade: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  cartao: {
    width: '48.3%',
    minHeight: 218,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
  },

  indicador: {
    width: 30,
    height: 4,
    borderRadius: 4,
    marginBottom: 12,
  },

  numero: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
  },

  cartaoTitulo: {
    fontSize: 14,
    fontWeight: '700',
    color: '#252525',
    lineHeight: 20,
    marginBottom: 8,
  },

  cartaoDescricao: {
    fontSize: 12,
    lineHeight: 18,
    color: '#777777',
    flex: 1,
  },

  acessar: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B77912',
    marginTop: 14,
  },

  rodape: {
    alignItems: 'center',
    marginTop: 18,
    paddingVertical: 12,
  },

  rodapeTitulo: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
  },

  rodapeTexto: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 5,
  },
});
