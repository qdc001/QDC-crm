# KommoCRM Clone

CRM completo com funcionalidades inspiradas no Kommo (amoCRM). Construído com React + Node.js + PostgreSQL.

---

## Stack Tecnológica

### Frontend
- **React 19** + TypeScript + Vite
- **Tailwind CSS** para styling
- **@dnd-kit** para drag-and-drop no pipeline Kanban
- **Recharts** para gráficos e analytics
- **Zustand** para gestão de estado global
- **React Router v6** para navegação
- **Socket.io client** para actualizações em tempo real
- **React Hot Toast** para notificações

### Backend
- **Node.js** + Express + TypeScript
- **Prisma ORM** com PostgreSQL
- **Socket.io** para tempo real (WebSockets)
- **JWT** para autenticação
- **Bcrypt** para hash de palavras-passe
- **Multer** para upload de ficheiros
- **Nodemailer** para envio de emails

### Deploy
- **Frontend** → Vercel
- **Backend + PostgreSQL** → Railway

---

## Módulos Implementados

| Módulo | Status | Descrição |
|--------|--------|-----------|
| Autenticação | Completo | Login, registo, JWT, workspace |
| Dashboard | Completo | KPIs, gráficos, pipeline overview |
| Pipeline Kanban | Completo | Drag-and-drop, etapas, leads |
| Caixa de Entrada | Completo (UI) | WhatsApp, Email, Instagram |
| Gestão de Leads | Backend completo | CRUD, filtros, actividades |
| Gestão de Contactos | Backend completo | Pessoas e empresas |
| Tarefas | Backend completo | Tipos, datas, estados |
| Notas | Backend completo | Notas por lead |
| Analytics | Backend completo | Receita, conversão, pipeline |
| Automatizações | Schema + API base | Triggers e acções |
| Chatbots | Schema + API base | Construtor visual |
| Templates | Schema + API base | Mensagens pré-definidas |
| Integrações | Schema + API base | WhatsApp, Email, etc. |
| Equipa | Backend completo | Utilizadores e permissões |
| Webhooks | Schema implementado | Eventos externos |
| Campos Personalizados | Schema + API base | Campos customizados |
| Upload de Ficheiros | Backend completo | Gestão de ficheiros |
| Notificações | Backend completo | Sistema de notificações |

---

## Estrutura do Projecto

```
kommo-clone/
├── frontend/                    # React App
│   ├── src/
│   │   ├── components/
│   │   │   └── layout/
│   │   │       └── AppLayout.tsx    # Sidebar + Topbar
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   └── RegisterPage.tsx
│   │   │   ├── DashboardPage.tsx    # KPIs + charts
│   │   │   ├── PipelinePage.tsx     # Kanban board
│   │   │   ├── InboxPage.tsx        # Mensagens unificadas
│   │   │   ├── LeadsPage.tsx
│   │   │   ├── ContactsPage.tsx
│   │   │   ├── TasksPage.tsx
│   │   │   ├── AutomationsPage.tsx
│   │   │   ├── ChatbotsPage.tsx
│   │   │   ├── AnalyticsPage.tsx
│   │   │   ├── TemplatesPage.tsx
│   │   │   ├── IntegrationsPage.tsx
│   │   │   ├── TeamPage.tsx
│   │   │   └── SettingsPage.tsx
│   │   ├── store/
│   │   │   └── index.ts             # Zustand stores
│   │   ├── lib/
│   │   │   └── api.ts               # Axios client + tipos
│   │   └── App.tsx                  # Router
│   └── package.json
│
└── backend/                     # Node.js API
    ├── prisma/
    │   └── schema.prisma            # Esquema completo BD
    ├── src/
    │   ├── middleware/
    │   │   ├── auth.ts              # JWT middleware
    │   │   ├── errorHandler.ts
    │   │   └── rateLimiter.ts
    │   ├── routes/
    │   │   ├── auth.ts              # Login, registo
    │   │   ├── leads.ts             # CRUD leads + mover
    │   │   ├── contacts.ts
    │   │   ├── pipelines.ts
    │   │   ├── stages.ts
    │   │   ├── messages.ts
    │   │   ├── tasks.ts
    │   │   ├── notes.ts
    │   │   ├── analytics.ts         # Dashboard + receita
    │   │   ├── users.ts
    │   │   └── ...
    │   └── server.ts                # Express + Socket.io
    └── package.json
```

---

## Instalação Local

### Pré-requisitos
- Node.js 18+
- PostgreSQL 14+

### 1. Clonar e instalar

```bash
# Frontend
cd frontend
npm install

# Backend
cd backend
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cd backend
cp .env.example .env
# Editar .env com as tuas credenciais
```

### 3. Base de dados

```bash
cd backend
npx prisma db push        # Criar tabelas
npx prisma generate       # Gerar cliente
npx prisma studio         # Ver dados (opcional)
```

### 4. Iniciar

```bash
# Backend (porta 3001)
cd backend
npm run dev

# Frontend (porta 5173)
cd frontend
npm run dev
```

Acede em: **http://localhost:5173**

---

## Deploy na Web

### Frontend → Vercel

1. Faz push do repositório para GitHub
2. Em [vercel.com](https://vercel.com), importa o projecto
3. Define **Root Directory** como `frontend`
4. Adiciona variável de ambiente:
   - `VITE_API_URL` → URL do teu backend no Railway

### Backend + BD → Railway

1. Em [railway.app](https://railway.app), cria novo projecto
2. Adiciona **PostgreSQL** database
3. Adiciona o serviço do **backend** (aponta para a pasta `backend`)
4. Define as variáveis de ambiente:
   - `DATABASE_URL` → fornecida automaticamente pelo Railway
   - `JWT_SECRET` → string aleatória segura
   - `FRONTEND_URL` → URL do teu frontend no Vercel
   - `NODE_ENV` → `production`
5. O comando de start é `npm run build && npm start`

---

## Funcionalidades Principais

### Pipeline Kanban (inspirado no Kommo)
- Drag-and-drop de leads entre etapas
- Múltiplos pipelines
- Criação rápida de leads por etapa
- Valor por etapa calculado automaticamente
- Cores personalizadas por etapa

### Caixa de Entrada Unificada
- WhatsApp, Email, Instagram, Telegram, Webchat
- Histórico completo de conversas
- Resposta rápida com templates
- Notas internas
- Criação de leads a partir de conversas

### Sistema de Automatizações
- Triggers: mudança de etapa, novo lead, mensagem recebida, etc.
- Acções: enviar mensagem, atribuir lead, criar tarefa, webhook
- Condições: filtros por campos, tags, valores

### Chatbot Builder
- Construtor visual de fluxos (sem código)
- Integração com WhatsApp Cloud API
- Captura automática de leads
- Respostas com IA (extensível)

---

## API Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | /api/auth/register | Criar conta + workspace |
| POST | /api/auth/login | Autenticar |
| GET | /api/auth/me | Utilizador actual |
| GET | /api/leads | Listar leads |
| POST | /api/leads | Criar lead |
| PATCH | /api/leads/:id | Actualizar lead |
| PATCH | /api/leads/:id/move | Mover lead no pipeline |
| DELETE | /api/leads/:id | Eliminar lead |
| GET | /api/pipelines | Listar pipelines |
| POST | /api/pipelines | Criar pipeline |
| GET | /api/contacts | Listar contactos |
| POST | /api/contacts | Criar contacto |
| GET | /api/messages | Mensagens |
| POST | /api/messages | Enviar mensagem |
| GET | /api/tasks | Tarefas |
| GET | /api/analytics/dashboard | KPIs dashboard |
| GET | /api/analytics/revenue | Receita mensal |

---

## Roadmap

- [ ] Integração WhatsApp Cloud API (Meta)
- [ ] Integração Email (IMAP/SMTP)
- [ ] Integração Instagram Direct
- [ ] Chatbot builder visual completo
- [ ] Editor de automatizações
- [ ] Relatórios avançados (funil, coort)
- [ ] App mobile (React Native)
- [ ] API pública (webhooks)
- [ ] Multi-idioma (PT, EN, ES)

---

## Licença

MIT — Podes usar, modificar e distribuir livremente.
