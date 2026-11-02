
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import {
  NavigationContainer,
} from '@react-navigation/native';

import {
  createNativeStackNavigator,
} from '@react-navigation/native-stack';

import AsyncStorage from '@react-native-async-storage/async-storage';

import LoginScreen from './screens/LoginScreen';
import CadastroScreen from './screens/CadastroScreen';
import RestricoesScreen from './screens/RestricoesScreen';

import HomeScreen from './screens/HomeScreen';
import InstrucoesScreen from './screens/InstrucoesScreen';
import ReceitasScreen from './screens/ReceitasScreen';
import ReceitaDetalheScreen from './screens/ReceitaDetalheScreen';
import PublicacoesScreen from './screens/PublicacoesScreen';
import ReceitaFormularioScreen from './screens/ReceitaFormularioScreen';
import PerfilScreen from './screens/PerfilScreen';
import SuporteScreen from './screens/SuporteScreen';

// NOVA TELA: BALANÇA NUTRICIONAL
import BalancaScreen from './screens/Balanca';

const Stack = createNativeStackNavigator();

export default function App() {
  const [carregando, setCarregando] = useState(true);
  const [autenticado, setAutenticado] = useState(false);

  useEffect(() => {
    verificarAutenticacao();
  }, []);

  async function verificarAutenticacao() {
    try {
      const token = await AsyncStorage.getItem('safebite_token');

      setAutenticado(!!token);
    } catch (error) {
      console.log('Erro ao verificar autenticação:', error);
      setAutenticado(false);
    } finally {
      setCarregando(false);
    }
  }

  if (carregando) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" color="#F5A623" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={autenticado ? 'Home' : 'Login'}
        screenOptions={{
          headerShown: false,
        }}
      >

        {/* AUTENTICAÇÃO */}

        <Stack.Screen
          name="Login"
          component={LoginScreen}
        />

        <Stack.Screen
          name="Cadastro"
          component={CadastroScreen}
        />

        <Stack.Screen
          name="Restricoes"
          component={RestricoesScreen}
        />

        {/* APLICAÇÃO */}

        <Stack.Screen
          name="Home"
          component={HomeScreen}
        />

        <Stack.Screen
          name="Instrucoes"
          component={InstrucoesScreen}
        />

        <Stack.Screen
          name="Receitas"
          component={ReceitasScreen}
        />

        <Stack.Screen
          name="ReceitaDetalhe"
          component={ReceitaDetalheScreen}
        />

        <Stack.Screen
          name="Publicacoes"
          component={PublicacoesScreen}
        />

        <Stack.Screen
          name="ReceitaFormulario"
          component={ReceitaFormularioScreen}
        />

        <Stack.Screen
          name="Perfil"
          component={PerfilScreen}
        />

        <Stack.Screen
          name="Suporte"
          component={SuporteScreen}
        />

        {/* BALANÇA NUTRICIONAL */}

        <Stack.Screen
          name="Balanca"
          component={BalancaScreen}
        />

      </Stack.Navigator>
    </NavigationContainer>
  );
}
