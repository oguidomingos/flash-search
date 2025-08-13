import { QueryCtx, MutationCtx } from 'convex/server';

export async function assertTenant(ctx: QueryCtx | MutationCtx, workspaceId: string) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error('Unauthenticated');
  
  // Check if user has access to this workspace
  const workspace = await ctx.db.get(workspaceId as any);
  if (!workspace) throw new Error('Workspace not found');
  
  // Check if user is a member of this workspace or is the owner
  const membership = await ctx.db
    .query('memberships')
    .withIndex('byWorkspaceUser', (q) => 
      q.eq('workspaceId', workspaceId).eq('userId', identity.subject)
    )
    .first();
    
  if (!membership && workspace.ownerId !== identity.subject) {
    throw new Error('Forbidden');
  }
  
  return { identity, workspace };
}

export async function assertRole(ctx: QueryCtx | MutationCtx, minRole: 'viewer'|'member'|'admin'|'owner') {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error('Unauthenticated');
  
  const order = ['viewer','member','admin','owner'];
  // For now, we'll give all authenticated users member access
  // In a production environment, you'd check the actual role
  const role = 'member';
  
  if (order.indexOf(role) < order.indexOf(minRole)) {
    throw new Error('Forbidden');
  }
  
  return { identity, role };
}

export async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error('Unauthenticated');
  return identity;
}