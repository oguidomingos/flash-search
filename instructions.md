# MindMap Research Engine (MRE)

**Ideia**: Ferramenta ultra‑rápida de pesquisa por qualquer tema. O usuário digita um tópico (ex.: "Persuasão") e recebe um **mind map** dinâmico no estilo XMind com tópicos principais (Psicologia, Behaviorismo, Neurologia, Comunicação etc.), subtemas, autores/expoentes, **fontes** (livros, artigos científicos, blog posts, notícias, vídeos), e “conhecimentos randômicos”. Integração com **MCP (DeepSeek)** para orquestrar busca semântica e categorização.

Stack-alvo: **Next.js (Vercel edge + serverless)**, **Convex** (dados em tempo real), **Clerk** (auth/RBAC/billing), **AWS EventBridge** (eventos cross-domain), **S3 + CloudFront** (arquivos/CDN). Segurança via **JWT** e auditoria com **tenantId/actorId**.

---

## 1) Objetivos e requisitos

* **Tempo‑real**: mapa se monta progressivamente à medida que os resultados chegam (streaming / live queries Convex).
* **Cobertura ampla de fontes**: livros, artigos científicos, blogs, notícias, vídeos; agrupados por tópicos e subtemas.
* **Navegação exploratória**: expandir/colapsar nós; “Deep Dive” em qualquer subtema; salvamento de nós favoritos e anotações.
* **Citações e confiabilidade**: cada nó de conteúdo referencia a(s) fonte(s) com metadados (título, autor, ano, URL/DOI, tipo).
* **Multi‑tenant**: organizações (workspaces) com RBAC (owner/admin/member/viewer) via Clerk; limites por plano (billing).
* **Exportação**: snapshot do mapa (imagem), **arquivo XMind**, PDF/Markdown com referências.

---

## 2) Personas e casos de uso

* **Pesquisador/Aluno**: Levantamento rápido de estado‑da‑arte com citações prioritárias.
* **Profissional de produto/marketing**: Visão panorâmica de conceitos, experts e peças de mídia.
* **Criador de conteúdo**: Curadoria de links e ideias com exportação do mapa.

---

## 3) Arquitetura lógica (alto nível)

```
Web (Next.js/Edge)  ─►  API Edge: /api/mcp/query
                      │
                      ├─► EventBridge (search.requested)
                      │           │
                      │           ├─► MCP Worker (DeepSeek MCP) ─► Coletores (acadêmico, web, vídeos)
                      │           │              │
                      │           │              └─► Normalizador/Rankeador ─► Convex (mutations)
                      │           │
                      │           └─► DLQ/Alerta
Client (React) ◄──── Convex (live queries) ◄──── Resultados incrementais

Exportações (XMind/PDF/Imagem) ─► S3 ─► CloudFront
Auth/RBAC/Billing ─► Clerk (JWT no edge)
Logs/Auditoria ─► Convex + EventBridge (log.* events)
```

---

## 4) Domínio e dados (Convex)

### Entidades principais

* **Workspace** `{ id, name, plan, clerkOrgId, ownerId, createdAt }`
* **User** `{ id, clerkUserId, name, email, createdAt }` (mapeado via Clerk)
* **Membership** `{ workspaceId, userId, role }` (RBAC: owner|admin|member|viewer)
* **Query** `{ id, workspaceId, topic, sourcesRequested[], status, startedAt, completedAt, params, createdBy }`
* **Node** `{ id, queryId, workspaceId, label, type, parentNodeId?, score, metadata, createdAt }`
  `type`: topic|subtopic|author|paper|book|blog|news|video|fact
* **Edge** `{ id, queryId, fromNodeId, toNodeId, relation }` (ex.: relates\_to, cited\_by, expands)
* **Source** `{ id, queryId, nodeId, kind, title, authors[], year?, publisher?, url?, doi?, snippet?, rank }`
* **Note** `{ id, nodeId, workspaceId, userId, text, createdAt }`
* **Star** `{ id, nodeId, workspaceId, userId, createdAt }`
* **Export** `{ id, queryId, workspaceId, kind: 'xmind'|'pdf'|'png', status, s3Key?, url?, createdAt }`
* **AuditLog** `{ id, workspaceId, actorId, action, targetType, targetId, metadata, ts }`
* **RateLimit** `{ key, windowStart, count }`
* **Billing** (via Clerk + webhooks; armazenar snapshots minimalistas): `{ workspaceId, plan, seats, renewalAt, limits }`

### Índices/consultas típicas

* `nodesByQuery(queryId)`; `sourcesByNode(nodeId)`; `edgesByQuery(queryId)`
* `queriesByWorkspace(workspaceId)`; `notesByNode(nodeId)`
* `searchNodes(workspaceId, text)` (FTS opcional com pré‑tokenização/embeddings)

---

## 5) Funcionalidades por fase

### MVP (S1–S2)

1. **Input de tema** + execução de busca (trigger MCP) com resultados incrementais no mapa.
2. **Visualização mind map** (pan/zoom, expandir/colapsar, tooltip de fonte, destaque por tipo).
3. **Citações e metadados** (autor/ano/tipo/DOI/URL) por nó.
4. **Salvar favoritos e notas**.
5. **Auth + RBAC** (Clerk) com workspaces multi‑tenant; rate limiting por plano.
6. **Export PNG** do mapa; caching via S3/CloudFront.

### V1.1 (S3–S4)

* **Export XMind** e **PDF/Markdown** com referências.
* **Deep Dive** sob demanda (expandir subtemas com nova consulta focalizada).
* **Linkagem inteligente** (deduplicação + arestas semânticas entre nós).

### V1.2+

* **Ranking com sinais de qualidade** (citações, venue, h-index do autor, atualidade).
* **Modo acadêmico**: filtros (apenas journals, intervalo de datas, peer‑review), ABNT/APA para bibliografia.
* **Colaboração**: presença em tempo real, comentários em nós.

---

## 6) Mapeamento para a stack

### 6.1 Next.js (Vercel)

**Rotas (App Router)**

* `/(app)`

  * `/` – Landing (marketing + demo read-only)
  * `/app` – Shell autenticado (layout com Clerk `<SignedIn/>`)
  * `/app/:workspaceId` – Home do workspace (queries recentes)
  * `/app/:workspaceId/q/:queryId` – Mind map da consulta
* **APIs (Edge/Serverless)**

  * `POST /api/mcp/query` (Edge Runtime) → valida JWT, enfileira evento `search.requested` (EventBridge) e cria `Query` no Convex.
  * `GET /api/export/:queryId.png|pdf|xmind` (Serverless) → gera export, salva no S3, retorna URL CloudFront.
  * `POST /api/webhooks/clerk` (Serverless) → sincroniza org/users/roles/billing.
  * `POST /api/webhooks/billing` (Serverless, se necessário) → atualiza limites.

**Client**

* UI React + **Cytoscape.js** (ou D3) para o mind map.
* Convex **useQuery**/**useMutation** para tempo‑real; suspense/streaming.

### 6.2 Convex (dados em tempo real)

* **Queries**: `nodesByQuery`, `edgesByQuery`, `sourcesByNode`, `queriesByWorkspace`, `searchNodes`.
* **Mutations**: `createQuery`, `appendNodesAndSources`, `addEdge`, `addNote`, `toggleStar`, `updateQueryStatus`, `logAudit`, `rateLimitInc`.
* **Actions** (server side/cron)**:** `exportMap`, `ingestFromMCP` (recebe payloads), `linkageDedup`.

### 6.3 Clerk (auth/RBAC/billing)

* **Organizações** como workspaces; papéis: `owner`, `admin`, `member`, `viewer`.
* **JWT** com claims `{ tenantId, role }` (orgId → workspaceId); enforced em **todas** as queries/mutations.
* **Webhooks** para provisionar `Workspace`, `Membership` e limites de plano.

### 6.4 AWS EventBridge

* **Bus**: `mre-prod-bus`.
* **Events** (detail-type):

  * `search.requested` { queryId, workspaceId, topic, params, actorId }
  * `mcp.chunk` { queryId, items\[], cursor?, done }
  * `mcp.failed` { queryId, error }
  * `export.requested` { queryId, kind }
  * `log.audit` { workspaceId, actorId, action, targetType, targetId, metadata }
* **Rules**: roteiam para **MCP Worker** (Lambda/Fargate), **Convex action endpoint** (para ingest), **DLQ** e **Observability**.

### 6.5 S3 + CloudFront

* Buckets: `mre-exports` (privado, acesso via signed URL) e `mre-cache` (público através de CloudFront).
* Armazena: imagens de snapshot do mapa, arquivos `.xmind`, PDFs/MD, thumbnails dos vídeos/livros.

---

## 7) Fluxos críticos

### 7.1 Execução de pesquisa (MCP)

1. **POST** `/api/mcp/query` com `{ topic, filters? }`.
2. Middleware (Edge) valida JWT (Clerk), **rateLimitInc** (Convex), cria `Query` (status: `running`).
3. Publica `search.requested` **EventBridge**.
4. **MCP Worker** (DeepSeek MCP) recebe o evento:

   * Aciona **connectors**: acadêmico (CrossRef/Semantic Scholar), web/news, YouTube, blogs/RSS.
   * Gera **taxonomia** (tópicos/subtemas) e normaliza fontes.
   * Emite `mcp.chunk` com lotes de nós/fontes (streaming-like).
5. Regra EventBridge → **Convex action** `ingestFromMCP` para cada chunk → `appendNodesAndSources`.
6. Client (mind map) recebe atualizações via **useQuery** e renderiza incrementalmente.
7. Ao fim, Worker publica `mcp.chunk { done: true }` → `updateQueryStatus('done')`.

### 7.2 Deep Dive

* Click em nó `topic|subtopic` → `POST /api/mcp/query` com `topic = "<nó>"` + `parentQueryId` → reaproveita contexto e liga arestas `expands`.

### 7.3 Exportações

* Usuário pede export → publica `export.requested` → action `exportMap` gera PNG/PDF/XMind, salva em **S3** e retorna signed URL (CloudFront).

---

## 8) Segurança, RBAC e auditoria

* **RBAC** (Clerk Org):

  * `owner/admin`: executar buscas, ver tudo, gerenciar billing/usuários.
  * `member`: executar buscas, editar notas, favoritar.
  * `viewer`: leitura do workspace.
* **Enforcement** em todas as queries/mutations do Convex verificando `jwt.orgId → workspaceId` e `role`.
* **Rate limiting** por `tenantId` (janela deslizante) e por `actorId` para evitar abuso.
* **Auditoria**: registrar `search.requested`, `node.starred`, `note.created`, `export.requested`, `settings.updated`.
* **Privacidade**: armazenar apenas metadados necessários de fontes; evitar conteúdo integral quando possível.
* **Assinatura de URLs** (S3) e **TTL** para exportações.

---

## 9) Plano de execução (tarefas)

### Sprint 1 – Fundamentos

* Setup Next.js (App Router) no Vercel
* Integração **Clerk** (sign-in, orgs, roles) + middleware JWT (Edge)
* Convex: schema inicial + queries/mutations base + guards de RBAC
* UI shell + página do mapa (Cytoscape) com nós mockados
* Endpoint `/api/mcp/query` (stub) + publicação em EventBridge (mock)

### Sprint 2 – Ingestão/Tempo-real

* Lambda/Fargate MCP Worker (skeleton) consumindo `search.requested`
* Action `ingestFromMCP` (Convex) + atualizações incrementais
* Rate limiting e auditoria básica
* Export PNG (servidor) → S3 + CloudFront

### Sprint 3 – Fontes reais e Deep Dive

* Conectores acadêmico/web/vídeo; normalizador de metadados
* Dedup/merge de nós + arestas semânticas
* Deep Dive + favoritos + notas

### Sprint 4 – Export XMind/PDF e Billing

* Geração **.xmind** e **PDF/Markdown**
* Webhooks Clerk (billing/limites) + telas de planos/upgrade
* Observabilidade (métricas + tracing) e hardening de segurança

---

## 10) Snippets de código (base)

### 10.1 Next.js – Middleware (Clerk + RBAC claims)

```ts
// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtected = createRouteMatcher([
  '/app(.*)',
  '/api/(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isProtected(req)) return;
  const { userId, orgId, sessionClaims } = auth();
  if (!userId || !orgId) return new Response('Unauthorized', { status: 401 });
  // Exemplo: exigir role mínima
  const role = (sessionClaims?.org_role as string) || 'viewer';
  (req as any).authCtx = { userId, orgId, role };
});

export const config = {
  matcher: [
    '/((?!_next|.*\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js)).*)',
  ]
};
```

### 10.2 Next.js (Edge) – disparar pesquisa via EventBridge

```ts
// src/app/api/mcp/query/route.ts
import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const { userId, orgId } = auth();
  if (!userId || !orgId) return new Response('Unauthorized', { status: 401 });

  const body = await req.json();
  const { topic, params } = body;
  if (!topic) return new Response('Missing topic', { status: 400 });

  // 1) Cria Query no Convex (via HTTP action)
  const query = await fetch(process.env.CONVEX_ACTION_CREATE_QUERY!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.CONVEX_ACTION_TOKEN}` },
    body: JSON.stringify({ orgId, userId, topic, params })
  }).then(r => r.json());

  // 2) Publica evento no EventBridge
  await fetch(process.env.EVENTBRIDGE_PUT_EVENT_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      'DetailType': 'search.requested',
      'Source': 'mre.web',
      'Detail': JSON.stringify({ queryId: query.id, workspaceId: query.workspaceId, topic, params, actorId: userId })
    })
  });

  return Response.json({ queryId: query.id });
}
```

### 10.3 Convex – schema e guards

```ts
// convex/schema.ts
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  workspaces: defineTable({ name: v.string(), plan: v.string(), clerkOrgId: v.string(), ownerId: v.string(), createdAt: v.number() })
    .index('byOrg', ['clerkOrgId']),
  memberships: defineTable({ workspaceId: v.id('workspaces'), userId: v.string(), role: v.string() })
    .index('byWorkspaceUser', ['workspaceId', 'userId']),
  queries: defineTable({ workspaceId: v.id('workspaces'), topic: v.string(), status: v.string(), createdBy: v.string(), params: v.any(), startedAt: v.optional(v.number()), completedAt: v.optional(v.number()) })
    .index('byWorkspace', ['workspaceId']),
  nodes: defineTable({ queryId: v.id('queries'), workspaceId: v.id('workspaces'), label: v.string(), type: v.string(), parentNodeId: v.optional(v.id('nodes')), score: v.optional(v.number()), metadata: v.optional(v.any()), createdAt: v.number() })
    .index('byQuery', ['queryId']),
  edges: defineTable({ queryId: v.id('queries'), fromNodeId: v.id('nodes'), toNodeId: v.id('nodes'), relation: v.string() })
    .index('byQuery', ['queryId']),
  sources: defineTable({ queryId: v.id('queries'), nodeId: v.id('nodes'), kind: v.string(), title: v.string(), authors: v.optional(v.array(v.string())), year: v.optional(v.number()), url: v.optional(v.string()), doi: v.optional(v.string()), snippet: v.optional(v.string()), rank: v.optional(v.number()) })
    .index('byNode', ['nodeId']),
  notes: defineTable({ nodeId: v.id('nodes'), workspaceId: v.id('workspaces'), userId: v.string(), text: v.string(), createdAt: v.number() })
    .index('byNode', ['nodeId']),
  stars: defineTable({ nodeId: v.id('nodes'), workspaceId: v.id('workspaces'), userId: v.string(), createdAt: v.number() })
    .index('byNodeUser', ['nodeId', 'userId']),
  audit: defineTable({ workspaceId: v.id('workspaces'), actorId: v.string(), action: v.string(), targetType: v.string(), targetId: v.string(), metadata: v.any(), ts: v.number() })
    .index('byWorkspaceTs', ['workspaceId', 'ts'])
});
```

```ts
// convex/_utils/auth.ts
import { QueryCtx, MutationCtx } from 'convex/server';

export function assertTenant(ctx: QueryCtx | MutationCtx, workspaceId: string) {
  const { auth } = ctx; // Clerk
  const claims = auth.getUserIdentity();
  if (!claims) throw new Error('Unauthenticated');
  const orgId = claims.orgId as string;
  if (!orgId) throw new Error('Missing org');
  // map orgId -> workspaceId (cache local/Convex)
  if (workspaceId !== mapOrgToWorkspaceId(orgId)) throw new Error('Forbidden');
}

export function assertRole(ctx: QueryCtx | MutationCtx, minRole: 'viewer'|'member'|'admin'|'owner') {
  const order = ['viewer','member','admin','owner'];
  const role = (ctx.auth.getUserIdentity()?.orgRole as string) || 'viewer';
  if (order.indexOf(role) < order.indexOf(minRole)) throw new Error('Forbidden');
}
```

### 10.4 Convex – Ingestão incremental a partir do MCP

```ts
// convex/mutations.ts
import { mutation, action, query } from 'convex/server';
import { v } from 'convex/values';
import { assertTenant, assertRole } from './_utils/auth';

export const createQuery = mutation({
  args: { workspaceId: v.id('workspaces'), topic: v.string(), params: v.optional(v.any()), createdBy: v.string() },
  handler: async (ctx, args) => {
    assertTenant(ctx, args.workspaceId);
    assertRole(ctx, 'member');
    const qId = await ctx.db.insert('queries', { ...args, status: 'running', startedAt: Date.now(), completedAt: undefined });
    await ctx.db.insert('audit', { workspaceId: args.workspaceId, actorId: args.createdBy, action: 'search.requested', targetType: 'query', targetId: String(qId), metadata: { topic: args.topic }, ts: Date.now() });
    return { id: qId };
  }
});

export const appendNodesAndSources = mutation({
  args: { queryId: v.id('queries'), workspaceId: v.id('workspaces'), items: v.array(v.any()) },
  handler: async (ctx, { queryId, workspaceId, items }) => {
    assertTenant(ctx, workspaceId);
    assertRole(ctx, 'member');
    for (const it of items) {
      const nodeId = await ctx.db.insert('nodes', { queryId, workspaceId, label: it.label, type: it.type, parentNodeId: it.parentNodeId, score: it.score, metadata: it.meta, createdAt: Date.now() });
      for (const s of (it.sources || [])) {
        await ctx.db.insert('sources', { queryId, nodeId, kind: s.kind, title: s.title, authors: s.authors, year: s.year, url: s.url, doi: s.doi, snippet: s.snippet, rank: s.rank });
      }
      if (it.parentNodeId) {
        await ctx.db.insert('edges', { queryId, fromNodeId: it.parentNodeId, toNodeId: nodeId, relation: 'expands' });
      }
    }
  }
});

export const updateQueryStatus = mutation({
  args: { queryId: v.id('queries'), workspaceId: v.id('workspaces'), status: v.string() },
  handler: async (ctx, a) => {
    assertTenant(ctx, a.workspaceId);
    await ctx.db.patch(a.queryId, { status: a.status, completedAt: a.status === 'done' ? Date.now() : undefined });
  }
});

export const nodesByQuery = query({
  args: { queryId: v.id('queries') },
  handler: async (ctx, { queryId }) => {
    return await ctx.db.query('nodes').withIndex('byQuery', q => q.eq('queryId', queryId)).collect();
  }
});
```

### 10.5 MCP Worker (Node.js) – consumo EventBridge e emissão de chunks

```ts
// workers/mcp/index.ts
import { getEvents } from './lib/eventbridge';
import { deepseekMcp } from './lib/mcp';
import { putEvent } from './lib/eventbridge';

export async function handler(ev: any) {
  const { topic, queryId, workspaceId, actorId, params } = JSON.parse(ev.detail);
  try {
    const stream = await deepseekMcp.searchAndCluster({ topic, params });
    for await (const batch of stream) {
      await putEvent('mcp.chunk', { queryId, workspaceId, items: batch.items });
    }
    await putEvent('mcp.chunk', { queryId, workspaceId, items: [], done: true });
  } catch (error) {
    await putEvent('mcp.failed', { queryId, workspaceId, error: String(error) });
  }
}
```

### 10.6 EventBridge – util simples (HTTP → PutEvents via API GW)

```ts
// workers/lib/eventbridge.ts
export async function putEvent(detailType: string, detail: any) {
  await fetch(process.env.EVENTBRIDGE_PUT_EVENT_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ DetailType: detailType, Source: 'mre.mcp', Detail: JSON.stringify(detail) })
  });
}
```

### 10.7 Export – gerar PNG e armazenar em S3

```ts
// src/app/api/export/[queryId]/route.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function GET(req: NextRequest, { params }: { params: { queryId: string } }) {
  const imageBuffer = await renderMapToPng(params.queryId); // usa headless (puppeteer) ou canvas server-side
  const key = `exports/${params.queryId}.png`;
  await s3.send(new PutObjectCommand({ Bucket: process.env.S3_EXPORTS!, Key: key, Body: imageBuffer, ContentType: 'image/png' }));
  const url = `${process.env.CLOUDFRONT_URL}/${key}`;
  return Response.json({ url });
}
```

### 10.8 UI – Mind Map (Cytoscape) com live query

```tsx
// src/app/(app)/[workspaceId]/q/[queryId]/page.tsx
'use client';
import CytoscapeComponent from 'react-cytoscapejs';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export default function MindMap({ params }: { params: { workspaceId: string, queryId: string }}) {
  const nodes = useQuery(api.mutations.nodesByQuery, { queryId: params.queryId as any }) || [];
  const elements = nodes.map((n: any) => ({ data: { id: n._id, label: n.label, type: n.type } }));
  return (
    <div className="h-full w-full">
      <CytoscapeComponent elements={elements} style={{ width: '100%', height: '100%' }} layout={{ name: 'cose' }} />
    </div>
  );
}
```

---

## 11) Observabilidade e SRE

* **Métricas chave**: p50/p95 de `search.requested → first-node`, throughput de `mcp.chunk`, taxa de erro de conectores, itens por consulta.
* **Tracing**: `queryId` como traceId; propagar em logs/headers.
* **Alertas**: ausência de `mcp.chunk` > N segundos, `mcp.failed`>0, latência de export > SLA.

---

## 12) Limites de plano (exemplo)

* **Free**: 3 workspaces, 5 buscas/dia, export PNG; sem XMind/PDF.
* **Pro**: ilimitado, XMind/PDF, Deep Dive 3 níveis, filtros avançados.
* **Team**: seat-based; colaboração em tempo real e SSO.

---

## 13) Checklist de segurança

* Validar e sanitizar `topic`/params (evitar prompt injection para conectores).
* Resolver URLs/DOIs com timeout e user‑agent explícito; respeito a `robots.txt`.
* Assinaturas curtas para URLs de export (S3) + cache control via CloudFront.
* Política de CORS restrita; CSP estrita na UI.
* Rate limit incremental por IP + tenant + actorId.

---

## 14) Próximos passos

1. Criar repositório monorepo (apps/web, workers/mcp, infra/terraform).
2. Provisionar Clerk (orgs, roles, webhooks) e Convex.
3. Criar EventBridge bus + regra → Lambda MCP Worker.
4. Implementar fluxo end‑to‑end com mocks; depois plugar conectores MCP reais.
5. Entregar MVP com export PNG e iteração de UX do mind map.
