import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../trpc";
import { db } from "@/lib/db";
import { users, sessions } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { isValidPhoneNumber, formatPhoneNumber } from "@/lib/phone-validator";

async function cleanupExpiredSessionsHelper(userId?: string | number) {
  const now = new Date().toISOString();
  if (userId) {
    await db
      .delete(sessions)
      .where(sql`${sessions.userId} = ${userId} AND ${sessions.expiresAt} <= ${now}`);
  } else {
    await db
      .delete(sessions)
      .where(sql`${sessions.expiresAt} <= ${now}`);
  }
}

function setSessionCookie(res: any, token?: string | null) {
  const cookie = token
    ? `session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800`
    : `session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`;

  if (res && "setHeader" in res) {
    res.setHeader("Set-Cookie", cookie);
  } else if (res) {
    (res as Headers).set("Set-Cookie", cookie);
  }
}

async function createSession(userId: number, res: any) {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET || "temporary-secret-for-interview", {
    expiresIn: "7d",
  });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await db.insert(sessions).values({
    userId,
    token,
    expiresAt: expiresAt.toISOString(),
  });

  setSessionCookie(res, token);

  return token;
}

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

      const hashedSSN = await bcrypt.hash(input.ssn, 10);

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

      const user = await db.select().from(users).where(eq(users.email, input.email)).get();

      if (!user) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create user",
        });
      }

      await cleanupExpiredSessionsHelper(user.id);

      const token = await createSession(user.id, ctx.res);

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

      await cleanupExpiredSessionsHelper(user.id);

      const token = await createSession(user.id, ctx.res);

      return { user: { ...user, password: undefined }, token };
    }),

  logout: publicProcedure.mutation(async ({ ctx }) => {
    let token: string | undefined;
    if (ctx.req && ctx.req.cookies && typeof ctx.req.cookies === 'object') {
      token = ctx.req.cookies.session;
    }
    if (!token) {
      let cookieHeader = '';
      if (ctx.req && ctx.req.headers) {
        if (typeof ctx.req.headers.get === 'function') {
          cookieHeader = ctx.req.headers.get('cookie') || '';
        } else if (ctx.req.headers.cookie) {
          cookieHeader = ctx.req.headers.cookie;
        }
      }
      if (cookieHeader) {
        const cookiesArr = cookieHeader.split(';');
        for (const c of cookiesArr) {
          const [key, ...val] = c.trim().split('=');
          if (key === 'session') {
            token = val.join('=');
            break;
          }
        }
      }
    }
    if (!token && ctx.req && ctx.req.body && ctx.req.body.session) {
      token = ctx.req.body.session;
    }

    if (!token) {
      console.log("Logout failed: No session token found");
      return {
        success: false,
        message: "No active session found"
      };
    }

    try {
      const existing = await db.select().from(sessions).where(eq(sessions.token, token)).get();
      if (!existing) {
        console.log("Logout failed: No session token found in DB for", token);
        return {
          success: false,
          message: "No active session found",
        };
      }

      await db.delete(sessions).where(eq(sessions.token, token));

      setSessionCookie(ctx.res, null);

      return {
        success: true,
        message: "Logged out successfully",
      };
    } catch (error) {
      console.error("Failed to delete session:", error);
      return {
        success: false,
        message: "Failed to logout",
      };
    }
  }),

  cleanupExpiredSessions: publicProcedure.mutation(async () => {
    await cleanupExpiredSessionsHelper();

    return {
      success: true,
      message: "Expired sessions cleaned up",
    };
  }),
});
