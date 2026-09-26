// convex/schema.ts
// Database schema for the Rotaract Club of East Rizal site.
// Run `npx convex dev` after `npm install convex` to push this schema
// to the project at https://dashboard.convex.dev/t/diosa-oliver/rac-east-rizal

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ---- Public content ----
  projects: defineTable({
    title: v.string(),
    tag: v.string(),          // e.g. "Health", "Education"
    description: v.string(),
    meta: v.string(),         // e.g. "Annual · Community Service"
    imageStorageId: v.optional(v.id("_storage")),
    order: v.number(),        // controls display order
  }),

  awards: defineTable({
    title: v.string(),
    description: v.string(),
    year: v.optional(v.string()),
    order: v.number(),
  }),

  teamMembers: defineTable({
    name: v.string(),
    role: v.string(),
    termYear: v.string(),     // e.g. "2026–2027" — groups officers by term
    isCurrent: v.boolean(),
    photoStorageId: v.optional(v.id("_storage")),
    order: v.number(),
  }).index("by_term", ["termYear"]),

  appointments: defineTable({
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    preferredDate: v.string(),
    preferredTime: v.string(),
    purpose: v.string(),
    message: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("declined")
    ),
    createdAt: v.number(),
  }).index("by_status", ["status"]),

  // ---- Admin & access control ----
  admins: defineTable({
    // Populated via your auth provider (e.g. Convex Auth) — this table
    // maps an authenticated user's identity to an admin role.
    userId: v.string(),       // subject/id from the auth provider
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("superadmin")),
  }).index("by_userId", ["userId"]),

  // ---- Admin-only: club finances ----
  // Metadata only. The actual Excel files live in Convex file storage
  // (v.id("_storage")) and are NEVER exposed through a public query —
  // every function that touches this table must call requireAdmin()
  // (see convex/lib/auth.ts) before returning anything.
  financeFiles: defineTable({
    fileName: v.string(),
    storageId: v.id("_storage"),
    uploadedBy: v.string(),   // admin userId
    uploadedAt: v.number(),
    fiscalPeriod: v.optional(v.string()), // e.g. "Q3 2026"
    notes: v.optional(v.string()),
  }),
});