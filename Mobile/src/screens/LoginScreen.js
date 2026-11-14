
import React, { useState } from 'react';

import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Botao, Campo } from '../components/ui';
import { useAuth } from '../AuthContext';
import { SERVER_URL } from '../config';
import { cores } from '../theme';

export default function LoginScreen({ navigation }) {
  const { entrar } = useAuth();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function enviar() {
    const inicio = Date.now();
    const tentativaId = `login-${inicio}`;

    // LOGS JSON
    function registrar(evento, dados = {}) {
      const log = {
        timestamp: new Date().toISOString(),
        sistema: 'SafeBite',
        origem: 'Mobile',
        tentativaId,
        evento,
        servidor: SERVER_URL,
        plataforma: Platform.OS,
        duracaoMs: Date.now() - inicio,
        ...dados,
      };

      console.log(JSON.stringify(log));
    }

    registrar('BOTAO_ENTRAR_PRESSIONADO');

    // Validação
    if (!email.trim() || !senha) {
      registrar('VALIDACAO_FALHOU', {
        emailPreenchido: !!email.trim(),
        senhaPreenchida: !!senha,
      });

      Alert.alert('Atenção', 'Informe e-mail e senha.');
      return;
    }

    setCarregando(true);

    registrar('LOGIN_INICIADO', {
      emailPreenchido: true,
      senhaPreenchida: true,
    });

    // Aviso após 10 segundos
    const avisoDemora = setTimeout(() => {
      registrar('LOGIN_DEMORANDO', {
        tempoLimiteAvisoMs: 10000,
        mensagem: 'Backend ainda não respondeu',
      });
    }, 10000);

    try {
      registrar('AUTH_CONTEXT_CHAMADO', {
        funcao: 'entrar',
      });

      await entrar(email.trim().toLowerCase(), senha);

      registrar('LOGIN_SUCESSO', {
        mensagem: 'Função entrar() concluída sem lançar erro',
      });

    } catch (error) {
      registrar('LOGIN_ERRO', {
        erro: {
          nome: error?.name || 'Erro desconhecido',
          mensagem: error?.message || 'Sem mensagem',
          stack: error?.stack || null,
        },
      });

      Alert.alert(
        'Não foi possível entrar',
        error?.message || 'Erro desconhecido ao conectar.'
      );

    } finally {
      clearTimeout(avisoDemora);
      setCarregando(false);

      registrar('LOGIN_FINALIZADO');
    }
  }

  return (
    <SafeAreaView style={s.tela}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={s.conteudo}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={s.marca}>Safe Bite</Text>

          <Text style={s.sub}>
            Receitas seguras para a sua alimentação
          </Text>

          <Campo
            rotulo="E-mail"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="voce@email.com"
          />

          <Campo
            rotulo="Senha"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
            placeholder="Sua senha"
          />

          <Botao
            titulo="Entrar"
            onPress={enviar}
            carregando={carregando}
          />

          <TouchableOpacity
            style={s.link}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={s.linkTexto}>
              Não tem conta? Cadastre-se
            </Text>
          </TouchableOpacity>

          <View style={s.rodape}>
            <Text style={s.servidor}>
              Servidor: {SERVER_URL}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
  conteudo: {
    padding: 24,
    paddingTop: 60,
  },
  marca: {
    fontSize: 34,
    fontWeight: '800',
    color: cores.primariaEscura,
    textAlign: 'center',
  },
  sub: {
    fontSize: 14,
    color: cores.mudo,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 36,
  },
  link: {
    alignItems: 'center',
    padding: 18,
  },
  linkTexto: {
    color: cores.primariaEscura,
    fontWeight: '700',
    fontSize: 14,
  },
  rodape: {
    marginTop: 24,
    alignItems: 'center',
  },
  servidor: {
    fontSize: 11,
    color: cores.mudo,
  },
});
