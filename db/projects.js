// convex/projects.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";

// Public — anyone visiting the site can read the project list.
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("projects").withIndex("by_id").order("asc").collect();
  },
});

// Admin-only — create or update a project.
export const upsert = mutation({
  args: {
    id: v.optional(v.id("projects")),
    title: v.string(),
    tag: v.string(),
    description: v.string(),
    meta: v.string(),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { id, ...fields } = args;
    if (id) {
      await ctx.db.patch(id, fields);
      return id;
    }
    return await ctx.db.insert("projects", fields);
  },
});

// Admin-only — remove a project.
export const remove = mutation({
  args: { id: v.id("projects") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    await ctx.db.delete(id);
  },
});