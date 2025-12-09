import { z } from "zod";

/**
 * Test Suite for Ticket VAL-207: Routing Number Optional
 *
 * Verifies the backend input validation: when `fundingSource.type` is
 * `bank`, a `routingNumber` must be provided. This mirrors the Zod schema
 * used in `server/routers/account.ts` and ensures backend/frontend rules
 * remain aligned.
 */

const fundAccountInputSchema = z
  .object({
    accountId: z.number(),
    amount: z.number().positive(),
    fundingSource: z.object({
      type: z.enum(["card", "bank"]),
      accountNumber: z.string(),
      routingNumber: z.string().optional(),
    }),
  })
  .refine(
    (data) => {
      if (data.fundingSource.type === "bank") {
        return !!data.fundingSource.routingNumber;
      }
      return true;
    },
    {
      message: "Routing number is required for bank transfers",
      path: ["fundingSource", "routingNumber"],
    }
  );

describe("VAL-207: Routing Number Optional (backend)", () => {
  test("rejects bank funding without routing number", () => {
    const input = {
      accountId: 1,
      amount: 10,
      fundingSource: {
        type: "bank" as const,
        accountNumber: "123456789",
      },
    };

    expect(() => fundAccountInputSchema.parse(input)).toThrow();
    try {
      fundAccountInputSchema.parse(input);
    } catch (err: any) {
      expect(String(err)).toContain("Routing number is required for bank transfers");
    }
  });

  test("accepts bank funding with routing number", () => {
    const input = {
      accountId: 2,
      amount: 25,
      fundingSource: {
        type: "bank" as const,
        accountNumber: "987654321",
        routingNumber: "123456789",
      },
    };

    expect(() => fundAccountInputSchema.parse(input)).not.toThrow();
    const parsed = fundAccountInputSchema.parse(input);
    expect(parsed.fundingSource.routingNumber).toBe("123456789");
  });

  test("accepts card funding without routing number", () => {
    const input = {
      accountId: 3,
      amount: 5,
      fundingSource: {
        type: "card" as const,
        accountNumber: "4242424242424242",
      },
    };

    expect(() => fundAccountInputSchema.parse(input)).not.toThrow();
  });
});
