import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { Botao, Campo } from '../components/ui';
import { useAuth } from '../AuthContext';
import { cores } from '../theme';

export default function RegisterScreen() {
  const { cadastrar } = useAuth();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [idade, setIdade] = useState('');
  const [telefone, setTelefone] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function enviar() {
    if (!nome.trim() || !email.trim() || !senha) {
      Alert.alert('Atenção', 'Preencha nome, e-mail e senha.');
      return;
    }
    if (senha !== confirmar) {
      Alert.alert('Atenção', 'As senhas não conferem.');
      return;
    }

    setCarregando(true);
    try {
      await cadastrar({
        nome_completo: nome.trim(),
        email: email.trim().toLowerCase(),
        senha,
        idade: idade ? Number(idade) : undefined,
        telefone: telefone.trim() || undefined,
      });
    } catch (e) {
      Alert.alert('Não foi possível cadastrar', e.message);
      setCarregando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: cores.fundo }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={s.conteudo} keyboardShouldPersistTaps="handled">
        <Campo rotulo="Nome completo" value={nome} onChangeText={setNome} />
        <Campo
          rotulo="E-mail"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Campo rotulo="Senha" value={senha} onChangeText={setSenha} secureTextEntry />
        <Campo
          rotulo="Confirmar senha"
          value={confirmar}
          onChangeText={setConfirmar}
          secureTextEntry
        />
        <Campo
          rotulo="Idade (opcional)"
          value={idade}
          onChangeText={setIdade}
          keyboardType="numeric"
        />
        <Campo
          rotulo="Telefone (opcional)"
          value={telefone}
          onChangeText={setTelefone}
          keyboardType="phone-pad"
        />

        <Botao titulo="Criar conta" onPress={enviar} carregando={carregando} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  conteudo: { padding: 24 },
});
