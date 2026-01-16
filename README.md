# BreakerBot App

Aplicativo mobile para gerenciamento do BreakerBot, desenvolvido com React Native e Expo.

## 🚀 Tecnologias

- **React Native** - Framework para desenvolvimento mobile
- **Expo** - Plataforma para desenvolvimento React Native
- **Expo Router** - Navegação baseada em arquivos
- **TypeScript** - Tipagem estática
- **AsyncStorage** - Armazenamento local

## 📱 Funcionalidades

- **Autenticação** - Login via código SMS/WhatsApp
- **Perfil** - Visualização e edição do perfil do usuário
- **Ranking** - Visualização do ranking de usuários
- **Amigo Secreto** - Gerenciamento de grupos de amigo secreto
- **Configurações** - Configurações do sistema (admin)
- **Backups** - Gerenciamento de backups de usuários (admin)

## 🎨 Tema

O app suporta temas claro, escuro e automático (seguindo o sistema).

## 📦 Instalação

1. Clone o repositório
2. Instale as dependências:

```bash
npm install
```

3. Crie o arquivo `.env` baseado no `.env.example`:

```env
EXPO_PUBLIC_API_URL=http://seu-servidor:3001
```

## 🏃 Executando

### Desenvolvimento

```bash
# Iniciar o servidor de desenvolvimento
npm start

# Iniciar no Android
npm run android

# Iniciar na Web
npm run web
```

### Build para produção

```bash
# Build para Android
npm run build:android

# Build para Web
npm run build:web
```

## 📁 Estrutura do Projeto

```
├── src/
│   ├── app/                    # Telas (Expo Router)
│   │   ├── (tabs)/            # Telas com navegação por tabs
│   │   │   ├── _layout.tsx    # Layout das tabs
│   │   │   ├── index.tsx      # Perfil
│   │   │   ├── ranking.tsx    # Ranking
│   │   │   ├── amigo-secreto.tsx
│   │   │   ├── settings.tsx   # Configurações (admin)
│   │   │   └── backups.tsx    # Backups (admin)
│   │   ├── _layout.tsx        # Layout root
│   │   ├── index.tsx          # Tela inicial (redirect)
│   │   ├── login.tsx          # Login
│   │   └── verify.tsx         # Verificação de código
│   ├── components/
│   │   └── ui/                # Componentes UI reutilizáveis
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Input.tsx
│   │       ├── Switch.tsx
│   │       └── Toast.tsx
│   ├── constants/
│   │   └── theme.ts           # Constantes de tema (cores, espaçamento)
│   ├── contexts/
│   │   ├── AuthContext.tsx    # Contexto de autenticação
│   │   └── ThemeContext.tsx   # Contexto de tema
│   └── lib/
│       ├── api.ts             # Cliente da API
│       └── storage.ts         # Wrapper do AsyncStorage
├── assets/                    # Assets do app (ícones, splash)
├── app.json                   # Configuração do Expo
├── babel.config.js
├── metro.config.js
├── package.json
└── tsconfig.json
```

## 🔗 API

O app se comunica com a API do BreakerBot. Certifique-se de que a API está rodando antes de usar o app.

### Endpoints utilizados:

- `POST /api/auth/getCode` - Solicitar código de verificação
- `POST /api/auth/login` - Fazer login
- `POST /api/auth/verify` - Verificar token
- `POST /api/auth/logout` - Fazer logout
- `GET /api/users` - Listar usuários
- `GET /api/users/:id` - Obter usuário
- `PATCH /api/users/:id` - Atualizar usuário
- `GET /api/daily-bonus` - Obter bônus diário
- `GET /api/mentions` - Obter configurações de menções
- `PUT /api/mentions` - Atualizar menções
- `GET /api/admins` - Listar administradores
- `GET /api/backup/users` - Listar backups
- `POST /api/backup/restore/:id` - Restaurar backup
- `GET /api/amigo-secreto/user/:id` - Obter grupos de amigo secreto
- `PATCH /api/amigo-secreto/:groupId/presente` - Atualizar presente

## 📄 Licença

Projeto privado.
