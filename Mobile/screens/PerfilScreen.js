
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TextInput,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PerfilScreen({ navigation }) {
  const [editando, setEditando] = useState(false);

  // Dados demonstrativos até conectar ao backend
  const [nome, setNome] = useState('Usuário Safe Bite');
  const [email, setEmail] = useState('usuario@email.com');

  function salvarAlteracoes() {
    if (!nome.trim() || !email.trim()) {
      Alert.alert('Atenção', 'Preencha o nome e o e-mail.');
      return;
    }

    Alert.alert(
      'Perfil',
      'Os dados foram validados. A integração para salvar as alterações será feita posteriormente.'
    );

    setEditando(false);
  }

  function sairDaConta() {
    Alert.alert(
      'Sair da conta',
      'Deseja realmente sair do Safe Bite?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              // Remove os dados de autenticação salvos
              await AsyncStorage.multiRemove([
                'safebite_token',
                'safebite_user',
              ]);

              // Limpa o histórico de navegação e retorna ao login
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              console.error('Erro ao sair da conta:', error);

              Alert.alert(
                'Erro',
                'Não foi possível sair da conta. Tente novamente.'
              );
            }
          },
        },
      ]
    );
  }

  function acessarRestricoes() {
    navigation.navigate('Restricoes');
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

          <Text style={styles.headerTitle}>Meu perfil</Text>

          <View style={styles.headerSpace} />
        </View>

        <View style={styles.profileCard}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.profileName}>{nome}</Text>
          <Text style={styles.profileEmail}>{email}</Text>

          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Conta Safe Bite</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados pessoais</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome completo</Text>

            <TextInput
              style={[
                styles.input,
                !editando && styles.inputDisabled,
              ]}
              value={nome}
              onChangeText={setNome}
              editable={editando}
              placeholder="Digite seu nome"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-mail</Text>

            <TextInput
              style={[
                styles.input,
                !editando && styles.inputDisabled,
              ]}
              value={email}
              onChangeText={setEmail}
              editable={editando}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="Digite seu e-mail"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {editando ? (
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setEditando(false)}
              >
                <Text style={styles.cancelButtonText}>
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={salvarAlteracoes}
              >
                <Text style={styles.saveButtonText}>
                  Salvar alterações
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setEditando(true)}
            >
              <Text style={styles.editButtonText}>
                Editar perfil
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Preferências alimentares
          </Text>

          <TouchableOpacity
            style={styles.optionCard}
            onPress={acessarRestricoes}
          >
            <View style={styles.optionIcon}>
              <Text style={styles.optionLetter}>R</Text>
            </View>

            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>
                Restrições alimentares
              </Text>

              <Text style={styles.optionDescription}>
                Consulte e configure suas restrições
              </Text>
            </View>

            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conta</Text>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={sairDaConta}
          >
            <Text style={styles.logoutButtonText}>
              Sair da conta
            </Text>
          </TouchableOpacity>
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
  profileCard: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF7E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  logo: {
    width: 85,
    height: 85,
  },
  profileName: {
    fontSize: 21,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  profileEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF8EF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    marginTop: 14,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#22C55E',
    marginRight: 7,
  },
  statusText: {
    color: '#16803D',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 14,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 7,
  },
  input: {
    height: 49,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    color: '#1A1A1A',
    fontSize: 14,
  },
  inputDisabled: {
    backgroundColor: '#F0F1F3',
    color: '#6B7280',
  },
  editButton: {
    backgroundColor: '#F5A623',
    borderRadius: 10,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 3,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 3,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  cancelButtonText: {
    color: '#4B5563',
    fontWeight: '600',
  },
  saveButton: {
    flex: 1.5,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#F5A623',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    width: 43,
    height: 43,
    borderRadius: 12,
    backgroundColor: '#FFF3DD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionLetter: {
    fontSize: 19,
    fontWeight: '800',
    color: '#D88900',
  },
  optionContent: {
    flex: 1,
    marginLeft: 12,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  optionDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 5,
  },
  arrow: {
    fontSize: 27,
    color: '#9CA3AF',
    marginLeft: 8,
  },
  logoutButton: {
    height: 49,
    borderWidth: 1,
    borderColor: '#F0B4B4',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 14,
  },
  footer: {
    marginTop: 30,
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 12,
  },
});
