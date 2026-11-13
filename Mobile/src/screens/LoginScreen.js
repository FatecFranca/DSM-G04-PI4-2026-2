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
    if (!email.trim() || !senha) {
      Alert.alert('Atenção', 'Informe e-mail e senha.');
      return;
    }

    setCarregando(true);
    try {
      await entrar(email.trim().toLowerCase(), senha);
    } catch (e) {
      Alert.alert('Não foi possível entrar', e.message);
      setCarregando(false);
    }
  }

  return (
    <SafeAreaView style={s.tela}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={s.conteudo} keyboardShouldPersistTaps="handled">
          <Text style={s.marca}>Safe Bite</Text>
          <Text style={s.sub}>Receitas seguras para a sua alimentação</Text>

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

          <Botao titulo="Entrar" onPress={enviar} carregando={carregando} />

          <TouchableOpacity style={s.link} onPress={() => navigation.navigate('Register')}>
            <Text style={s.linkTexto}>Não tem conta? Cadastre-se</Text>
          </TouchableOpacity>

          <View style={s.rodape}>
            <Text style={s.servidor}>Servidor: {SERVER_URL}</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: 24, paddingTop: 60 },
  marca: { fontSize: 34, fontWeight: '800', color: cores.primariaEscura, textAlign: 'center' },
  sub: { fontSize: 14, color: cores.mudo, textAlign: 'center', marginTop: 8, marginBottom: 36 },
  link: { alignItems: 'center', padding: 18 },
  linkTexto: { color: cores.primariaEscura, fontWeight: '700', fontSize: 14 },
  rodape: { marginTop: 24, alignItems: 'center' },
  servidor: { fontSize: 11, color: cores.mudo },
});
