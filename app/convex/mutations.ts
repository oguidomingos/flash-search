import { mutation } from './_generated/server';
import { v } from 'convex/values';
import { assertTenant, assertRole, getCurrentUser } from './_utils/auth';

export const createWorkspace = mutation({
  args: { 
    name: v.string(), 
    clerkOrgId: v.string(), 
    plan: v.optional(v.string()) 
  },
  handler: async (ctx, args) => {
    const identity = await getCurrentUser(ctx);
    
    const workspaceId = await ctx.db.insert('workspaces', {
      name: args.name,
      plan: args.plan || 'free',
      clerkOrgId: args.clerkOrgId,
      ownerId: identity.subject,
      createdAt: Date.now()
    });
    
    // Create membership for owner
    await ctx.db.insert('memberships', {
      workspaceId,
      userId: identity.subject,
      role: 'owner'
    });
    
    return { id: workspaceId };
  }
});

export const createQuery = mutation({
  args: { 
    workspaceId: v.id('workspaces'), 
    topic: v.string(), 
    params: v.optional(v.any()) 
  },
  handler: async (ctx, args) => {
    const { identity } = await assertTenant(ctx, args.workspaceId);
    await assertRole(ctx, 'member');
    
    const queryId = await ctx.db.insert('queries', {
      workspaceId: args.workspaceId,
      topic: args.topic,
      params: args.params,
      status: 'running',
      createdBy: identity.subject,
      startedAt: Date.now()
    });
    
    // Log audit
    await ctx.db.insert('audit', {
      workspaceId: args.workspaceId,
      actorId: identity.subject,
      action: 'search.requested',
      targetType: 'query',
      targetId: queryId,
      metadata: { topic: args.topic },
      ts: Date.now()
    });
    
    return { id: queryId };
  }
});

export const appendNodesAndSources = mutation({
  args: { 
    queryId: v.id('queries'), 
    workspaceId: v.id('workspaces'), 
    items: v.array(v.any()) 
  },
  handler: async (ctx, { queryId, workspaceId, items }) => {
    await assertTenant(ctx, workspaceId);
    await assertRole(ctx, 'member');
    
    for (const item of items) {
      const nodeId = await ctx.db.insert('nodes', {
        queryId,
        workspaceId,
        label: item.label,
        type: item.type,
        parentNodeId: item.parentNodeId,
        score: item.score,
        metadata: item.metadata,
        createdAt: Date.now()
      });
      
      // Add sources
      for (const source of (item.sources || [])) {
        await ctx.db.insert('sources', {
          queryId,
          nodeId,
          kind: source.kind,
          title: source.title,
          authors: source.authors,
          year: source.year,
          url: source.url,
          doi: source.doi,
          snippet: source.snippet,
          rank: source.rank
        });
      }
      
      // Add edge if parent exists
      if (item.parentNodeId) {
        await ctx.db.insert('edges', {
          queryId,
          fromNodeId: item.parentNodeId,
          toNodeId: nodeId,
          relation: 'expands'
        });
      }
    }
  }
});

export const updateQueryStatus = mutation({
  args: { 
    queryId: v.id('queries'), 
    workspaceId: v.id('workspaces'), 
    status: v.string() 
  },
  handler: async (ctx, args) => {
    await assertTenant(ctx, args.workspaceId);
    
    await ctx.db.patch(args.queryId, {
      status: args.status,
      completedAt: args.status === 'done' ? Date.now() : undefined
    });
  }
});

export const addNote = mutation({
  args: {
    nodeId: v.id('nodes'),
    workspaceId: v.id('workspaces'),
    text: v.string()
  },
  handler: async (ctx, args) => {
    const { identity } = await assertTenant(ctx, args.workspaceId);
    await assertRole(ctx, 'member');
    
    return await ctx.db.insert('notes', {
      nodeId: args.nodeId,
      workspaceId: args.workspaceId,
      userId: identity.subject,
      text: args.text,
      createdAt: Date.now()
    });
  }
});

export const toggleStar = mutation({
  args: {
    nodeId: v.id('nodes'),
    workspaceId: v.id('workspaces')
  },
  handler: async (ctx, args) => {
    const { identity } = await assertTenant(ctx, args.workspaceId);
    await assertRole(ctx, 'member');
    
    const existing = await ctx.db
      .query('stars')
      .withIndex('byNodeUser', (q) => 
        q.eq('nodeId', args.nodeId).eq('userId', identity.subject)
      )
      .first();
    
    if (existing) {
      await ctx.db.delete(existing._id);
      return { starred: false };
    } else {
      await ctx.db.insert('stars', {
        nodeId: args.nodeId,
        workspaceId: args.workspaceId,
        userId: identity.subject,
        createdAt: Date.now()
      });
      return { starred: true };
    }
  }
});