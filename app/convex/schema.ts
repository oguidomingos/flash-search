import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  workspaces: defineTable({ 
    name: v.string(), 
    plan: v.string(), 
    clerkOrgId: v.string(), 
    ownerId: v.string(), 
    createdAt: v.number() 
  }).index('byOrg', ['clerkOrgId']),

  memberships: defineTable({ 
    workspaceId: v.id('workspaces'), 
    userId: v.string(), 
    role: v.string() 
  }).index('byWorkspaceUser', ['workspaceId', 'userId']),

  queries: defineTable({ 
    workspaceId: v.id('workspaces'), 
    topic: v.string(), 
    status: v.string(), 
    createdBy: v.string(), 
    params: v.optional(v.any()), 
    startedAt: v.optional(v.number()), 
    completedAt: v.optional(v.number()) 
  }).index('byWorkspace', ['workspaceId']),

  nodes: defineTable({ 
    queryId: v.id('queries'), 
    workspaceId: v.id('workspaces'), 
    label: v.string(), 
    type: v.string(), 
    parentNodeId: v.optional(v.id('nodes')), 
    score: v.optional(v.number()), 
    metadata: v.optional(v.any()), 
    createdAt: v.number() 
  }).index('byQuery', ['queryId']),

  edges: defineTable({ 
    queryId: v.id('queries'), 
    fromNodeId: v.id('nodes'), 
    toNodeId: v.id('nodes'), 
    relation: v.string() 
  }).index('byQuery', ['queryId']),

  sources: defineTable({ 
    queryId: v.id('queries'), 
    nodeId: v.id('nodes'), 
    kind: v.string(), 
    title: v.string(), 
    authors: v.optional(v.array(v.string())), 
    year: v.optional(v.number()), 
    url: v.optional(v.string()), 
    doi: v.optional(v.string()), 
    snippet: v.optional(v.string()), 
    rank: v.optional(v.number()) 
  }).index('byNode', ['nodeId']),

  notes: defineTable({ 
    nodeId: v.id('nodes'), 
    workspaceId: v.id('workspaces'), 
    userId: v.string(), 
    text: v.string(), 
    createdAt: v.number() 
  }).index('byNode', ['nodeId']),

  stars: defineTable({ 
    nodeId: v.id('nodes'), 
    workspaceId: v.id('workspaces'), 
    userId: v.string(), 
    createdAt: v.number() 
  }).index('byNodeUser', ['nodeId', 'userId']),

  audit: defineTable({ 
    workspaceId: v.id('workspaces'), 
    actorId: v.string(), 
    action: v.string(), 
    targetType: v.string(), 
    targetId: v.string(), 
    metadata: v.any(), 
    ts: v.number() 
  }).index('byWorkspaceTs', ['workspaceId', 'ts']),

  rateLimit: defineTable({
    key: v.string(),
    windowStart: v.number(),
    count: v.number()
  }).index('byKey', ['key']),

  billing: defineTable({
    workspaceId: v.id('workspaces'),
    plan: v.string(),
    seats: v.optional(v.number()),
    renewalAt: v.optional(v.number()),
    limits: v.optional(v.any())
  }).index('byWorkspace', ['workspaceId'])
});