// convex/awards.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("awards").withIndex("by_id").order("asc").collect();
  },
});

export const upsert = mutation({
  args: {
    id: v.optional(v.id("awards")),
    title: v.string(),
    description: v.string(),
    year: v.optional(v.string()),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { id, ...fields } = args;
    if (id) {
      await ctx.db.patch(id, fields);
      return id;
    }
    return await ctx.db.insert("awards", fields);
  },
});

export const remove = mutation({
  args: { id: v.id("awards") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    await ctx.db.delete(id);
  },
});