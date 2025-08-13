import { query } from 'convex/server';
import { v } from 'convex/values';
import { assertTenant, getCurrentUser } from './_utils/auth';

export const getWorkspaceByOrgId = query({
  args: { clerkOrgId: v.string() },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);
    
    return await ctx.db
      .query('workspaces')
      .withIndex('byOrg', (q) => q.eq('clerkOrgId', args.clerkOrgId))
      .first();
  }
});

export const getQueriesByWorkspace = query({
  args: { workspaceId: v.id('workspaces') },
  handler: async (ctx, args) => {
    await assertTenant(ctx, args.workspaceId);
    
    return await ctx.db
      .query('queries')
      .withIndex('byWorkspace', (q) => q.eq('workspaceId', args.workspaceId))
      .order('desc')
      .take(50);
  }
});

export const getQuery = query({
  args: { queryId: v.id('queries') },
  handler: async (ctx, args) => {
    const query = await ctx.db.get(args.queryId);
    if (!query) return null;
    
    await assertTenant(ctx, query.workspaceId);
    return query;
  }
});

export const getNodesByQuery = query({
  args: { queryId: v.id('queries') },
  handler: async (ctx, args) => {
    const query = await ctx.db.get(args.queryId);
    if (!query) return [];
    
    await assertTenant(ctx, query.workspaceId);
    
    return await ctx.db
      .query('nodes')
      .withIndex('byQuery', (q) => q.eq('queryId', args.queryId))
      .collect();
  }
});

export const getEdgesByQuery = query({
  args: { queryId: v.id('queries') },
  handler: async (ctx, args) => {
    const query = await ctx.db.get(args.queryId);
    if (!query) return [];
    
    await assertTenant(ctx, query.workspaceId);
    
    return await ctx.db
      .query('edges')
      .withIndex('byQuery', (q) => q.eq('queryId', args.queryId))
      .collect();
  }
});

export const getSourcesByNode = query({
  args: { nodeId: v.id('nodes') },
  handler: async (ctx, args) => {
    const node = await ctx.db.get(args.nodeId);
    if (!node) return [];
    
    await assertTenant(ctx, node.workspaceId);
    
    return await ctx.db
      .query('sources')
      .withIndex('byNode', (q) => q.eq('nodeId', args.nodeId))
      .collect();
  }
});

export const getNotesByNode = query({
  args: { nodeId: v.id('nodes') },
  handler: async (ctx, args) => {
    const node = await ctx.db.get(args.nodeId);
    if (!node) return [];
    
    await assertTenant(ctx, node.workspaceId);
    
    return await ctx.db
      .query('notes')
      .withIndex('byNode', (q) => q.eq('nodeId', args.nodeId))
      .order('desc')
      .collect();
  }
});

export const getStarredNodes = query({
  args: { workspaceId: v.id('workspaces') },
  handler: async (ctx, args) => {
    const { identity } = await assertTenant(ctx, args.workspaceId);
    
    const stars = await ctx.db
      .query('stars')
      .filter((q) => q.eq(q.field('workspaceId'), args.workspaceId))
      .filter((q) => q.eq(q.field('userId'), identity.subject))
      .collect();
    
    const nodes = await Promise.all(
      stars.map(star => ctx.db.get(star.nodeId))
    );
    
    return nodes.filter(Boolean);
  }
});