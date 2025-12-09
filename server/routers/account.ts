import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc";
import { db } from "@/lib/db";
import { accounts, transactions } from "@/lib/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";

function generateAccountNumber(): string {
  const buffer = new Uint8Array(5);
  crypto.getRandomValues(buffer);
  return Array.from(buffer)
    .map(b => b.toString().padStart(3, "0"))
    .join("")
    .substring(0, 10);
}

export const accountRouter = router({
  createAccount: protectedProcedure
    .input(
      z.object({
        accountType: z.enum(["checking", "savings"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Check if user already has an account of this type
      const existingAccount = await db
        .select()
        .from(accounts)
        .where(and(eq(accounts.userId, ctx.user.id), eq(accounts.accountType, input.accountType)))
        .get();

      if (existingAccount) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `You already have a ${input.accountType} account`,
        });
      }

      let accountNumber;
      let isUnique = false;

      // Generate unique account number
      while (!isUnique) {
        accountNumber = generateAccountNumber();
        const existing = await db.select().from(accounts).where(eq(accounts.accountNumber, accountNumber)).get();
        isUnique = !existing;
      }

      await db.insert(accounts).values({
        userId: ctx.user.id,
        accountNumber: accountNumber!,
        accountType: input.accountType,
        balance: 0,
        status: "active",
      });

      // Fetch the created account
      const account = await db.select().from(accounts).where(eq(accounts.accountNumber, accountNumber!)).get();

      if (account){
        return account;
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create account",
      });
      
    }),

  getAccounts: protectedProcedure.query(async ({ ctx }) => {
    const userAccounts = await db.select().from(accounts).where(eq(accounts.userId, ctx.user.id));

    return userAccounts;
  }),

  fundAccount: protectedProcedure
    .input(
      z.object({
        accountId: z.number(),
        amount: z.number().positive(),
        fundingSource: z.object({
          type: z.enum(["card", "bank"]),
          accountNumber: z.string(),
          routingNumber: z.string().optional(),
        }),
      }).refine(
        (data) => {
          // Routing number is required for bank transfers
          if (data.fundingSource.type === "bank") {
            return !!data.fundingSource.routingNumber;
          }
          return true;
        },
        {
          message: "Routing number is required for bank transfers",
          path: ["fundingSource", "routingNumber"],
        }
      )
    )
    .mutation(async ({ input, ctx }) => {
      const amount = parseFloat(input.amount.toString());

      // Verify account belongs to user
      const account = await db
        .select()
        .from(accounts)
        .where(and(eq(accounts.id, input.accountId), eq(accounts.userId, ctx.user.id)))
        .get();

      if (!account) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Account not found",
        });
      }

      if (account.status !== "active") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Account is not active",
        });
      }

      const result = db.transaction((tx) => {
        const transaction = tx
          .insert(transactions)
          .values({
            accountId: input.accountId,
            type: "deposit",
            amount,
            description: `Funding from ${input.fundingSource.type}`,
            status: "completed",
            processedAt: new Date().toISOString(),
          })
          .returning()
          .get();

        const updatedAccount = tx
          .update(accounts)
          .set({
            balance: sql`${accounts.balance} + ${amount}`,
          })
          .where(eq(accounts.id, input.accountId))
          .returning()
          .get();

        return {
          transaction,
          updatedAccount,
        };
      });

      return {
        transaction: result.transaction,
        newBalance: result.updatedAccount?.balance ?? null,
      };
    }),

  getTransactions: protectedProcedure
    .input(
      z.object({
        accountId: z.number(),
        limit: z.number().int().positive().optional(),
        offset: z.number().int().min(0).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const account = await db
        .select()
        .from(accounts)
        .where(and(eq(accounts.id, input.accountId), eq(accounts.userId, ctx.user.id)))
        .get();

      if (!account) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Account not found",
        });
      }

      const limit = input.limit ?? 10;
      const offset = input.offset ?? 0;

      // Query transactions and use ordering + limit/offset for pagination
      const accountTransactions = await db
        .select()
        .from(transactions)
        .where(eq(transactions.accountId, input.accountId))
        .orderBy(desc(transactions.createdAt))
        .limit(limit)
        .offset(offset);

      // Since we already fetched the account above, reuse it to avoid per-transaction lookups
      const enrichedTransactions = accountTransactions.map((transaction) => ({
        ...transaction,
        accountType: account.accountType,
      }));

      return enrichedTransactions;
    }),
});
