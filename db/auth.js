// convex/lib/auth.ts
// Shared helper that every admin-only function must call FIRST.
// This is the actual security boundary — the client-side password
// screens in admin.html are just UI; they enforce nothing by themselves.
//
// Wire this up to a real auth provider (Convex Auth, Clerk, etc.) before
// launch. Until real auth is connected, treat every mutation/query that
// calls requireAdmin() as NOT production-ready.

import { QueryCtx, MutationCtx } from "../_generated/server";

export async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }

  const admin = await ctx.db
    .query("admins")
    .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
    .unique();

  if (!admin) {
    throw new Error("Not authorized: admin role required");
  }

  return admin;
}