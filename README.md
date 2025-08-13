# MindMap Research Engine (MRE)

Uma ferramenta ultra-rápida de pesquisa que gera mapas mentais dinâmicos para qualquer tópico.

## Features

- 🚀 **Ultra Rápido**: Resultados em tempo real com mapas que se montam progressivamente
- 📚 **Fontes Confiáveis**: Livros, artigos científicos, blogs e vídeos com citações e metadados
- 🎯 **Navegação Exploratória**: Expandir/colapsar nós, Deep Dive em subtemas
- 📄 **Exportação**: PNG, PDF, XMind e Markdown
- 👥 **Multi-tenant**: Workspaces com RBAC via Clerk
- 🔍 **Search em Tempo Real**: Integração com DeepSeek MCP

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui
- **Authentication**: Clerk (Organizations + RBAC)
- **Backend**: Convex (real-time database)
- **Mind Maps**: Cytoscape.js
- **Search**: DeepSeek MCP integration
- **Deployment**: Vercel

## Quick Start

### 1. Configurar Clerk

1. Crie uma conta no [Clerk](https://clerk.com)
2. Configure uma aplicação com Organizations habilitadas
3. Adicione as chaves no `.env.local`:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

4. **Importante**: Configure o template JWT para Convex:
   - No painel do Clerk, vá para "JWT Templates"
   - Clique em "Add JWT Template"
   - Selecione "Convex" como tipo
   - Nomeie o template como "convex"
   - Clique em "Create"

### 2. Configurar Convex

1. Crie uma conta no [Convex](https://convex.dev)
2. Execute `npx convex dev` para configurar o projeto
3. Adicione a URL do Convex no `.env.local`:

```bash
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
```

### 3. Instalar e Executar

```bash
npm install
npm run dev
```

### 4. Deploy no Vercel

```bash
npm run build
npx vercel --prod
```

## Estrutura do Projeto

```
app/
├── src/
│   ├── app/
│   │   ├── (landing)/                 # Landing page
│   │   ├── app/                       # Authenticated app
│   │   │   ├── [workspaceId]/
│   │   │   │   └── q/[queryId]/       # Mind map page
│   │   ├── api/
│   │   │   └── search/                # Search API
│   │   └── providers/                 # Convex + Clerk providers
│   └── middleware.ts                  # Auth middleware
├── components/ui/                     # shadcn/ui components
├── convex/                           # Convex backend
│   ├── schema.ts                     # Database schema
│   ├── queries.ts                    # Query functions
│   └── mutations.ts                  # Mutation functions
└── lib/                              # Utilities
```

## Database Schema

- **Workspaces**: Organizations/tenants
- **Queries**: Search requests with status tracking
- **Nodes**: Mind map nodes (topics, subtopics, authors, sources)
- **Edges**: Connections between nodes
- **Sources**: Citations with metadata
- **Notes**: User annotations
- **Stars**: Favorited nodes

## API Endpoints

- `POST /api/search` - Start a new search query
- Convex real-time queries for live updates

## Environment Variables

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/app
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/app

# Convex
NEXT_PUBLIC_CONVEX_URL=

# Optional: DeepSeek MCP
DEEPSEEK_API_KEY=
```

## Próximos Passos

1. Integrar o DeepSeek MCP real para pesquisas
2. Implementar exports (XMind, PDF)
3. Adicionar colaboração em tempo real
4. Sistema de billing/planos
5. Métricas e observabilidade

## Troubleshooting

### Erro: "No JWT template exists with name: convex"

Se você encontrar este erro, siga as instruções em `CLERK_JWT_SETUP.md` para configurar corretamente o template JWT no painel do Clerk.

## License

MIT# flash-search
