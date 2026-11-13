import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { AuthProvider, useAuth } from './src/AuthContext';
import { cores } from './src/theme';

import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import RecipesScreen from './src/screens/RecipesScreen';
import RecipeDetailScreen from './src/screens/RecipeDetailScreen';
import RecipeFormScreen from './src/screens/RecipeFormScreen';
import MyRecipesScreen from './src/screens/MyRecipesScreen';
import RestrictionsScreen from './src/screens/RestrictionsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import BalancaScreen from './src/screens/BalancaScreen';
import DashboardScreen from './src/screens/DashboardScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const ICONES = {
  Receitas: 'restaurant-outline',
  Minhas: 'book-outline',
  Restricoes: 'shield-checkmark-outline',
  Balanca: 'scale-outline',
  Perfil: 'person-outline',
};

function Abas() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerTitleAlign: 'center',
        tabBarActiveTintColor: cores.primariaEscura,
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={ICONES[route.name]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Receitas" component={RecipesScreen} />
      <Tab.Screen name="Minhas" component={MyRecipesScreen} options={{ title: 'Minhas receitas' }} />
      <Tab.Screen name="Restricoes" component={RestrictionsScreen} options={{ title: 'Restrições' }} />
      <Tab.Screen name="Balanca" component={BalancaScreen} options={{ title: 'Balança', headerShown: false }} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function Rotas() {
  const { carregando, usuario } = useAuth();

  if (carregando) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={cores.primaria} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerTitleAlign: 'center' }}>
        {usuario ? (
          <>
            <Stack.Screen name="Abas" component={Abas} options={{ headerShown: false }} />
            <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} options={{ title: 'Receita' }} />
            <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} />
            <Stack.Screen name="RecipeForm" component={RecipeFormScreen} options={{ title: 'Nova receita' }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Criar conta' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Rotas />
    </AuthProvider>
  );
}
