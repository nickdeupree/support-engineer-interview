import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../trpc";
import { db } from "@/lib/db";
import { users, sessions } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { isValidPhoneNumber, formatPhoneNumber } from "@/lib/phone-validator";

export const authRouter = router({
  signup: publicProcedure
    .input(
      z.object({
        email: z.string().email().toLowerCase(),
        password: z.string().min(8),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        phoneNumber: z.string().refine(
          (value) => isValidPhoneNumber(value),
          "Invalid phone number format. Accepted formats: US 10-digit (1234567890), +1 (123) 456-7890, or international (+44 20 7946 0958)"
        ),
        dateOfBirth: z.string(),
        ssn: z.string().regex(/^\d{9}$/),
        address: z.string().min(1),
        city: z.string().min(1),
        state: z.string().length(2).toUpperCase(),
        zipCode: z.string().regex(/^\d{5}$/),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const existingUser = await db.select().from(users).where(eq(users.email, input.email)).get();

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User already exists",
        });
      }

      const hashedPassword = await bcrypt.hash(input.password, 10);

      // Hash SSN before storing in database
      const hashedSSN = await bcrypt.hash(input.ssn, 10);

      // Normalize phone number to E.164 format for consistent storage
      const formattedPhoneNumber = formatPhoneNumber(input.phoneNumber);
      if (!formattedPhoneNumber) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Failed to format phone number",
        });
      }

      await db.insert(users).values({
        ...input,
        phoneNumber: formattedPhoneNumber,
        password: hashedPassword,
        ssn: hashedSSN,
      });

      // Fetch the created user
      const user = await db.select().from(users).where(eq(users.email, input.email)).get();

      if (!user) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create user",
        });
      }

      // Clean up expired sessions for this user before creating new one
      const now = new Date().toISOString();
      await db
        .delete(sessions)
        .where(sql`${sessions.userId} = ${user.id} AND ${sessions.expiresAt} <= ${now}`);

      // Create session
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || "temporary-secret-for-interview", {
        expiresIn: "7d",
      });

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await db.insert(sessions).values({
        userId: user.id,
        token,
        expiresAt: expiresAt.toISOString(),
      });

      // Set cookie
      if ("setHeader" in ctx.res) {
        ctx.res.setHeader("Set-Cookie", `session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800`);
      } else {
        (ctx.res as Headers).set("Set-Cookie", `session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800`);
      }

      return { user: { ...user, password: undefined }, token };
    }),

  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = await db.select().from(users).where(eq(users.email, input.email)).get();

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid credentials",
        });
      }

      const validPassword = await bcrypt.compare(input.password, user.password);

      if (!validPassword) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid credentials",
        });
      }

      // Clean up expired sessions for this user before creating new one
      const now = new Date().toISOString();
      await db
        .delete(sessions)
        .where(sql`${sessions.userId} = ${user.id} AND ${sessions.expiresAt} <= ${now}`);

      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || "temporary-secret-for-interview", {
        expiresIn: "7d",
      });

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await db.insert(sessions).values({
        userId: user.id,
        token,
        expiresAt: expiresAt.toISOString(),
      });

      if ("setHeader" in ctx.res) {
        ctx.res.setHeader("Set-Cookie", `session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800`);
      } else {
        (ctx.res as Headers).set("Set-Cookie", `session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800`);
      }

      return { user: { ...user, password: undefined }, token };
    }),

  logout: publicProcedure.mutation(async ({ ctx }) => {
    // Delete session from database
    let token: string | undefined;
    if ("cookies" in ctx.req) {
      token = (ctx.req as any).cookies.session;
    } else {
      const cookieHeader = ctx.req.headers.get?.("cookie") || (ctx.req.headers as any).cookie;
      token = cookieHeader
        ?.split("; ")
        .find((c: string) => c.startsWith("session="))
        ?.split("=")[1];
    }
    
    let sessionDeleted = false;
    if (token) {
      await db.delete(sessions).where(eq(sessions.token, token));
      console.log("Session with token", token, "deleted");
      sessionDeleted = true;
    }

    // Clear cookie regardless of whether session was found
    if ("setHeader" in ctx.res) {
      ctx.res.setHeader("Set-Cookie", `session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`);
    } else {
      (ctx.res as Headers).set("Set-Cookie", `session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`);
    }

    return { 
      success: true, 
      message: sessionDeleted ? "Logged out successfully" : "Session cleared" 
    };
  }),

  // Logout from all devices except current session
  logoutAllOtherSessions: publicProcedure.mutation(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Must be logged in to logout other sessions",
      });
    }

    // Get current session token
    let currentToken: string | undefined;
    if ("cookies" in ctx.req) {
      currentToken = (ctx.req as any).cookies.session;
    } else {
      const cookieHeader = ctx.req.headers.get?.("cookie") || (ctx.req.headers as any).cookie;
      currentToken = cookieHeader
        ?.split("; ")
        .find((c: string) => c.startsWith("session="))
        ?.split("=")[1];
    }

    // Delete all sessions for this user except the current one
    if (currentToken) {
      await db
        .delete(sessions)
        .where(
          sql`${sessions.userId} = ${ctx.user.id} AND ${sessions.token} != ${currentToken}`
        );
    } else {
      // If no current token, delete all sessions
      await db.delete(sessions).where(eq(sessions.userId, ctx.user.id));
    }

    return {
      success: true,
      message: "All other sessions have been logged out",
    };
  }),

  // Cleanup expired sessions (can be called periodically or on demand)
  cleanupExpiredSessions: publicProcedure.mutation(async () => {
    const now = new Date().toISOString();
    await db
      .delete(sessions)
      .where(sql`${sessions.expiresAt} <= ${now}`);

    return {
      success: true,
      message: "Expired sessions cleaned up",
    };
  }),
});
