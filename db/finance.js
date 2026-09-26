// convex/finance.ts
//
// EVERY function in this file calls requireAdmin() before touching data.
// There is intentionally no public query here — financial records must
// never be reachable by an unauthenticated request, so don't add one
// without a very good reason and another engineer's review.

import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";
import { internal } from "./_generated/api";

// Admin-only — generates a short-lived upload URL. The client uploads
// the file bytes directly to Convex storage using this URL, then calls
// `recordUpload` below with the returned storage ID.
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

// Admin-only — save metadata once the file itself is in storage.
export const recordUpload = mutation({
  args: {
    fileName: v.string(),
    storageId: v.id("_storage"),
    fiscalPeriod: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    return await ctx.db.insert("financeFiles", {
      ...args,
      uploadedBy: admin.userId,
      uploadedAt: Date.now(),
    });
  },
});

// Admin-only — list files (metadata only; no raw file contents here).
export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("financeFiles").order("desc").collect();
  },
});

// Admin-only — get a temporary download URL for one file.
export const getDownloadUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    await requireAdmin(ctx);
    return await ctx.storage.getUrl(storageId);
  },
});

// Admin-only — delete a file and its metadata.
export const remove = mutation({
  args: { id: v.id("financeFiles") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    const record = await ctx.db.get(id);
    if (!record) return;
    await ctx.storage.delete(record.storageId);
    await ctx.db.delete(id);
  },
});