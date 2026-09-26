// convex/appointments.ts
import { query, mutation, action, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";
import { internal } from "./_generated/api";

// Internal — used only by sendNotification below, not exposed to clients.
export const getInternal = internalQuery({
  args: { id: v.id("appointments") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

// Public — anyone can submit an appointment request from the Contact page.
export const submit = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    preferredDate: v.string(),
    preferredTime: v.string(),
    purpose: v.string(),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("appointments", {
      ...args,
      status: "pending",
      createdAt: Date.now(),
    });
    // Kick off the email notification as a separate action (actions can
    // call external services; mutations cannot).
    await ctx.scheduler.runAfter(0, internal.appointments.sendNotification, { id });
    return id;
  },
});

// Internal action — sends the appointment details to the club's inbox.
// Plug in a real email API (e.g. Resend) here; this is the piece that
// replaces the current mailto: workaround in the front end.
export const sendNotification = action({
  args: { id: v.id("appointments") },
  handler: async (ctx, { id }) => {
    const appt = await ctx.runQuery(internal.appointments.getInternal, { id });
    if (!appt) return;

    // Example using Resend's HTTP API — set RESEND_API_KEY in the
    // Convex dashboard's environment variables before deploying.
    // await fetch("https://api.resend.com/emails", {
    //   method: "POST",
    //   headers: {
    //     Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify({
    //     from: "RAC East Rizal Site <noreply@yourdomain.org>",
    //     to: "rotaractclubeastrizal@gmail.com",
    //     subject: `Appointment Request — ${appt.name}`,
    //     text: `Name: ${appt.name}\nEmail: ${appt.email}\nPhone: ${appt.phone ?? "—"}\nDate: ${appt.preferredDate} ${appt.preferredTime}\nPurpose: ${appt.purpose}\n\n${appt.message ?? ""}`,
    //   }),
    // });
  },
});

// Admin-only — full list, for the dashboard.
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("appointments").order("desc").collect();
  },
});

// Admin-only — update status (confirm / decline).
export const setStatus = mutation({
  args: {
    id: v.id("appointments"),
    status: v.union(v.literal("pending"), v.literal("confirmed"), v.literal("declined")),
  },
  handler: async (ctx, { id, status }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(id, { status });
  },
});