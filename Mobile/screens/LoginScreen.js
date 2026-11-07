
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Image,
  ActivityIndicator,
} from 'react-native';

import apiService from '../services/api';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function entrar() {
    if (carregando) return;

    setErro('');

    const emailNormalizado = email.trim().toLowerCase();

    if (!emailNormalizado || !senha) {
      setErro('Preencha seu e-mail e sua senha.');
      return;
    }

    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      emailNormalizado
    );

    if (!emailValido) {
      setErro('Digite um endereço de e-mail válido.');
      return;
    }

    try {
      setCarregando(true);

      await apiService.login(emailNormalizado, senha);

      // Confirma se o token foi realmente salvo.
      const token = await apiService.getToken();

      if (!token) {
        setErro(
          'O servidor respondeu, mas o token de autenticação não foi encontrado. Verifique a resposta do backend.'
        );
        return;
      }

      navigation.replace('Home');
    } catch (error) {
      console.log('Erro no login:', error);

      if (error.status === 401) {
        setErro('E-mail ou senha incorretos.');
      } else if (error.status === 403) {
        setErro('Acesso não autorizado. Verifique sua conta.');
      } else {
        setErro(
          error.message ||
            'Não foi possível entrar. Tente novamente.'
        );
      }
    } finally {
      setCarregando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F8F9FA"
      />

      <ScrollView
        contentContainerStyle={styles.conteudo}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cabecalho}>
          <Image
            source={require('../assets/logo.png')}
            style={styles.logoImagem}
            resizeMode="contain"
            accessibilityLabel="Logo Safe Bite"
          />

          <Text style={styles.slogan}>
            Mais segurança em cada refeição.
          </Text>
        </View>

        <View style={styles.cartao}>
          <Text style={styles.titulo}>Bem-vindo de volta!</Text>

          <Text style={styles.subtitulo}>
            Entre na sua conta para continuar.
          </Text>

          <View style={styles.campoContainer}>
            <Text style={styles.label}>E-mail</Text>

            <TextInput
              style={styles.input}
              placeholder="seu@email.com"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={(texto) => {
                setEmail(texto);
                setErro('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              editable={!carregando}
              returnKeyType="next"
            />
          </View>

          <View style={styles.campoContainer}>
            <Text style={styles.label}>Senha</Text>

            <View style={styles.senhaContainer}>
              <TextInput
                style={styles.inputSenha}
                placeholder="Digite sua senha"
                placeholderTextColor="#9CA3AF"
                value={senha}
                onChangeText={(texto) => {
                  setSenha(texto);
                  setErro('');
                }}
                secureTextEntry={!mostrarSenha}
                autoCapitalize="none"
                autoComplete="current-password"
                editable={!carregando}
                returnKeyType="done"
                onSubmitEditing={entrar}
              />

              <TouchableOpacity
                onPress={() => setMostrarSenha(!mostrarSenha)}
                style={styles.botaoMostrarSenha}
                disabled={carregando}
                accessibilityRole="button"
                accessibilityLabel={
                  mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'
                }
              >
                <Text style={styles.textoMostrarSenha}>
                  {mostrarSenha ? 'Ocultar' : 'Mostrar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {!!erro && (
            <Text style={styles.mensagemErro}>
              {erro}
            </Text>
          )}

          <TouchableOpacity
            style={[
              styles.botao,
              carregando && styles.botaoDesabilitado,
            ]}
            onPress={entrar}
            activeOpacity={0.8}
            disabled={carregando}
          >
            {carregando ? (
              <View style={styles.conteudoBotao}>
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />
                <Text style={styles.textoBotao}>Entrando...</Text>
              </View>
            ) : (
              <Text style={styles.textoBotao}>Entrar</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divisor}>
            <View style={styles.linha} />
            <Text style={styles.textoDivisor}>OU</Text>
            <View style={styles.linha} />
          </View>

          <View style={styles.cadastroContainer}>
            <Text style={styles.textoCadastro}>
              Ainda não tem uma conta?
            </Text>

            <TouchableOpacity
              onPress={() => navigation.navigate('Cadastro')}
              disabled={carregando}
            >
              <Text style={styles.link}>Criar conta</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.rodape}>
          SAFE BITE · Alimentação com mais segurança
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },

  conteudo: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 36,
  },

  cabecalho: {
    alignItems: 'center',
    marginBottom: 24,
  },

  logoImagem: {
    width: 190,
    height: 190,
    alignSelf: 'center',
    marginBottom: 8,
  },

  slogan: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },

  cartao: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  titulo: {
    fontSize: 23,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },

  subtitulo: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 21,
    marginBottom: 28,
  },

  campoContainer: {
    marginBottom: 20,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 9,
  },

  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 11,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#1A1A1A',
    backgroundColor: '#FFFFFF',
  },

  senhaContainer: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 11,
    paddingLeft: 14,
    paddingRight: 12,
  },

  inputSenha: {
    flex: 1,
    minHeight: 50,
    fontSize: 15,
    color: '#1A1A1A',
  },

  botaoMostrarSenha: {
    paddingVertical: 10,
    paddingLeft: 8,
  },

  textoMostrarSenha: {
    color: '#B77912',
    fontSize: 12,
    fontWeight: '700',
  },

  mensagemErro: {
    color: '#DC2626',
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 19,
  },

  botao: {
    minHeight: 52,
    backgroundColor: '#F5A623',
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },

  botaoDesabilitado: {
    opacity: 0.7,
  },

  conteudoBotao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },

  textoBotao: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  divisor: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 25,
  },

  linha: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },

  textoDivisor: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '600',
    marginHorizontal: 14,
  },

  cadastroContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
  },

  textoCadastro: {
    color: '#6B7280',
    fontSize: 13,
  },

  link: {
    color: '#B77912',
    fontSize: 13,
    fontWeight: '700',
  },

  rodape: {
    marginTop: 24,
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 11,
  },
});
