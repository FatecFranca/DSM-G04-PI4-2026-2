
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
} from 'react-native';

import apiService from '../services/api';

export default function CadastroScreen({ navigation }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);

  async function cadastrar() {
    setErro('');
    setSucesso(false);

    if (carregando) return;

    if (
      !nome.trim() ||
      !email.trim() ||
      !senha ||
      !confirmarSenha
    ) {
      setErro('Preencha todos os campos.');
      return;
    }

    const emailNormalizado = email.trim().toLowerCase();
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      emailNormalizado
    );

    if (!emailValido) {
      setErro('Digite um endereço de e-mail válido.');
      return;
    }

    if (senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem.');
      return;
    }

    try {
      setCarregando(true);

      const resposta = await apiService.register({
        nome_completo: nome.trim(),
        email: emailNormalizado,
        senha,
        tem_restricao: false,
      });

      if (resposta?.success === false) {
        throw new Error(
          resposta.message || 'Não foi possível criar a conta.'
        );
      }

      setSucesso(true);
      setErro('Conta criada com sucesso! Faça login para continuar.');

      setNome('');
      setEmail('');
      setSenha('');
      setConfirmarSenha('');
    } catch (error) {
      console.error('Erro no cadastro:', error);

      if (error.status === 409) {
        setErro('Este e-mail já está cadastrado.');
      } else if (error.status === 400) {
        const detalhes = error.data?.errors
          ?.map((item) => item.message)
          .filter(Boolean)
          .join(' ');

        setErro(
          detalhes ||
          error.message ||
          'Confira os dados informados.'
        );
      } else {
        setErro(
          error.message ||
          'Não foi possível realizar o cadastro. Tente novamente.'
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
        <TouchableOpacity
          style={styles.voltar}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.7}
        >
          <Text style={styles.textoVoltar}>
            {'<'} Voltar para o login
          </Text>
        </TouchableOpacity>

        <View style={styles.cabecalho}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoTexto}>SB</Text>
          </View>

          <Text style={styles.logo}>SAFE BITE</Text>

          <Text style={styles.slogan}>
            Crie sua conta e comece agora.
          </Text>
        </View>

        <View style={styles.cartao}>
          <Text style={styles.titulo}>Criar conta</Text>

          <Text style={styles.subtitulo}>
            Preencha os dados para se cadastrar.
          </Text>

          <View style={styles.campoContainer}>
            <Text style={styles.label}>Nome completo</Text>

            <TextInput
              style={styles.input}
              placeholder="Digite seu nome"
              placeholderTextColor="#9CA3AF"
              value={nome}
              onChangeText={(texto) => {
                setNome(texto);
                setErro('');
                setSucesso(false);
              }}
              autoCapitalize="words"
              autoCorrect={false}
              autoComplete="name"
              returnKeyType="next"
            />
          </View>

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
                setSucesso(false);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              returnKeyType="next"
            />
          </View>

          <View style={styles.campoContainer}>
            <Text style={styles.label}>Senha</Text>

            <View style={styles.senhaContainer}>
              <TextInput
                style={styles.inputSenha}
                placeholder="Mínimo de 6 caracteres"
                placeholderTextColor="#9CA3AF"
                value={senha}
                onChangeText={(texto) => {
                  setSenha(texto);
                  setErro('');
                  setSucesso(false);
                }}
                secureTextEntry={!mostrarSenha}
                autoCapitalize="none"
                autoComplete="new-password"
                returnKeyType="next"
              />

              <TouchableOpacity
                style={styles.botaoMostrar}
                onPress={() => setMostrarSenha(!mostrarSenha)}
                accessibilityRole="button"
                accessibilityLabel={
                  mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'
                }
              >
                <Text style={styles.textoMostrar}>
                  {mostrarSenha ? 'Ocultar' : 'Mostrar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.campoContainer}>
            <Text style={styles.label}>Confirmar senha</Text>

            <View style={styles.senhaContainer}>
              <TextInput
                style={styles.inputSenha}
                placeholder="Digite a senha novamente"
                placeholderTextColor="#9CA3AF"
                value={confirmarSenha}
                onChangeText={(texto) => {
                  setConfirmarSenha(texto);
                  setErro('');
                  setSucesso(false);
                }}
                secureTextEntry={!mostrarConfirmacao}
                autoCapitalize="none"
                autoComplete="new-password"
                returnKeyType="done"
                onSubmitEditing={cadastrar}
              />

              <TouchableOpacity
                style={styles.botaoMostrar}
                onPress={() =>
                  setMostrarConfirmacao(!mostrarConfirmacao)
                }
                accessibilityRole="button"
                accessibilityLabel={
                  mostrarConfirmacao
                    ? 'Ocultar confirmação da senha'
                    : 'Mostrar confirmação da senha'
                }
              >
                <Text style={styles.textoMostrar}>
                  {mostrarConfirmacao ? 'Ocultar' : 'Mostrar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {!!erro && (
            <Text
              style={[
                styles.mensagem,
                sucesso
                  ? styles.mensagemSucesso
                  : styles.mensagemErro,
              ]}
            >
              {erro}
            </Text>
          )}

          <TouchableOpacity
            style={[
              styles.botao,
              carregando && styles.botaoDesabilitado,
            ]}
            onPress={cadastrar}
            activeOpacity={0.8}
            disabled={carregando}
          >
            <Text style={styles.textoBotao}>
              {carregando ? 'Criando conta...' : 'Criar minha conta'}
            </Text>
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.textoLogin}>
              Já possui uma conta?
            </Text>

            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.link}>Entrar</Text>
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
    paddingVertical: 24,
  },

  voltar: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    marginBottom: 20,
  },

  textoVoltar: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },

  cabecalho: {
    alignItems: 'center',
    marginBottom: 28,
  },

  logoContainer: {
    width: 58,
    height: 58,
    borderRadius: 17,
    backgroundColor: '#F5A623',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  logoTexto: {
    fontSize: 23,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },

  logo: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: 2,
  },

  slogan: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },

  cartao: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  titulo: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },

  subtitulo: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 21,
    marginBottom: 24,
  },

  campoContainer: {
    marginBottom: 18,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },

  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 11,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#1A1A1A',
    backgroundColor: '#FFFFFF',
  },

  senhaContainer: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 11,
    paddingLeft: 14,
    paddingRight: 10,
  },

  inputSenha: {
    flex: 1,
    minHeight: 48,
    fontSize: 14,
    color: '#1A1A1A',
  },

  botaoMostrar: {
    paddingVertical: 10,
    paddingLeft: 8,
  },

  textoMostrar: {
    color: '#B77912',
    fontSize: 12,
    fontWeight: '700',
  },

  mensagem: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
  },

  mensagemErro: {
    color: '#DC2626',
  },

  mensagemSucesso: {
    color: '#15803D',
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
    opacity: 0.6,
  },

  textoBotao: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 24,
  },

  textoLogin: {
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
