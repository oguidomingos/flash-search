import { QueryCtx, MutationCtx } from '../_generated/server';

export async function assertTenant(ctx: QueryCtx | MutationCtx, workspaceId: string) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error('Unauthenticated');
  
  // Check if user has access to this workspace
  const workspace = await ctx.db.get(workspaceId as any);
  if (!workspace) throw new Error('Workspace not found');
  
  // For now, allow access if user is authenticated
  // In production, you'd check membership properly
  return { identity, workspace };
}

export async function assertRole(ctx: QueryCtx | MutationCtx, minRole: 'viewer'|'member'|'admin'|'owner') {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error('Unauthenticated');
  
  const order = ['viewer','member','admin','owner'];
  // For now, give all authenticated users member access
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