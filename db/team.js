// convex/team.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";

// Public — every term's officer list, grouped by year, for the Team page.
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const members = await ctx.db.query("teamMembers").collect();
    const byTerm: Record<string, typeof members> = {};
    for (const m of members) {
      (byTerm[m.termYear] ??= []).push(m);
    }
    return byTerm; // e.g. { "2026–2027": [...], "2025–2026": [...] }
  },
});

// Public — just the current term, for the Home page preview.
export const listCurrent = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("teamMembers")
      .withIndex("by_term")
      .filter((q) => q.eq(q.field("isCurrent"), true))
      .collect();
  },
});

// Admin-only — add or edit an officer for a given term.
export const upsert = mutation({
  args: {
    id: v.optional(v.id("teamMembers")),
    name: v.string(),
    role: v.string(),
    termYear: v.string(),
    isCurrent: v.boolean(),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { id, ...fields } = args;
    if (id) {
      await ctx.db.patch(id, fields);
      return id;
    }
    return await ctx.db.insert("teamMembers", fields);
  },
});

// Admin-only — remove an officer.
export const remove = mutation({
  args: { id: v.id("teamMembers") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    await ctx.db.delete(id);
  },
});

// Admin-only — mark all officers in one term as no longer current
// (call this when starting a new term, before adding the new officers).
export const closeTerm = mutation({
  args: { termYear: v.string() },
  handler: async (ctx, { termYear }) => {
    await requireAdmin(ctx);
    const members = await ctx.db
      .query("teamMembers")
      .withIndex("by_term", (q) => q.eq("termYear", termYear))
      .collect();
    for (const m of members) {
      await ctx.db.patch(m._id, { isCurrent: false });
    }
  },
});
