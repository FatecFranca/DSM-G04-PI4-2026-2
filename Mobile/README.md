# Safe Bite Mobile

App novo em Expo (React Native) que usa o backend e o MongoDB que já existem.
Não é preciso alterar nada no backend.

## 1. Criar o projeto e instalar as dependências

```bash
npx create-expo-app@latest safebite-mobile --template blank
cd safebite-mobile

npx expo install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs react-native-screens react-native-safe-area-context @react-native-async-storage/async-storage expo-image-picker expo-constants @expo/vector-icons paho-mqtt
```

(O comando `npx expo install` escolhe sozinho as versões certas para o seu Expo.)

## 2. Copiar os arquivos

Copie para dentro da pasta `safebite-mobile` que você acabou de criar:

- `App.js` (substitui o que veio no projeto)
- a pasta `src/` inteira

## 3. Rodar

1. Suba o backend normalmente (porta 3001) no mesmo computador.
2. No projeto do app: `npx expo start -c`
3. Abra no celular com o Expo Go (celular e computador na mesma rede Wi-Fi).

O app descobre sozinho o IP do computador. Se o backend estiver em OUTRO computador
ou você usar o modo túnel, edite `src/config.js` e preencha `SERVER_URL_MANUAL`
(exemplo: `'http://192.168.0.10:3001'`).

## O que tem

- Login e cadastro, com renovação automática do token (sem "token expirado").
- Lista de receitas com busca, filtro "só compatíveis comigo" e selo de possível conflito.
- Detalhe da receita com foto, ingredientes, aviso de conflito e avaliações.
- Criar receita com foto (publicar ou rascunho), listar e excluir as suas.
- Restrições alimentares (marcar e desmarcar).
- Balança inteligente (IoT via MQTT): peso, calorias, ambiente, alarme, controles e monitor.
- Dashboard alimentar (dados demonstrativos): abre pela tela da Balança ou pelo Perfil.
- Perfil e sair.

## Se algo falhar

- "Não foi possível falar com o servidor": backend desligado, firewall bloqueando a porta 3001
  ou celular em outra rede. Teste `http://IP-DO-PC:3001/api/recipes` no navegador do celular.
- A tela de login mostra, no rodapé, qual endereço o app está usando.
