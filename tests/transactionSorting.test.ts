/**
 * PERF-404: Transaction Sorting (integration)
 *
 * Inserts a user, account, and several transactions with explicit
 * `createdAt` timestamps, then calls the `getTransactions` procedure
 * and asserts the results are returned newest-first (createdAt desc).
 */

import { db } from '@/lib/db';
import { users, accounts, transactions } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';
import { accountRouter } from '@/server/routers/account';

describe('PERF-404: Transaction Sorting', () => {
  const TEST_EMAIL = 'txn-sort@test.example';

  beforeEach(async () => {
    // Clean up any leftover test data
    await db.delete(transactions).where(sql`${transactions.accountId} IN (SELECT id FROM accounts WHERE user_id IN (SELECT id FROM users WHERE email = ${TEST_EMAIL}))` as any);
    await db.delete(accounts).where(sql`${accounts.userId} IN (SELECT id FROM users WHERE email = ${TEST_EMAIL})` as any);
    await db.delete(users).where(sql`${users.email} = ${TEST_EMAIL}` as any);
  });

  test('inserting transactions then calling getTransactions returns newest-first', async () => {
    // Create user
    await db.insert(users).values({
      email: TEST_EMAIL,
      password: 'irrelevant',
      firstName: 'Txn',
      lastName: 'Sorter',
      phoneNumber: '+11234567890',
      dateOfBirth: '1990-01-01',
      ssn: '000000000',
      address: '1 Test St',
      city: 'Testville',
      state: 'CA',
      zipCode: '12345',
    });

    const user = await db.select().from(users).where(sql`${users.email} = ${TEST_EMAIL}`).get();
    expect(user).toBeDefined();
    const userId = user!.id;

    // Create active account
    await db.insert(accounts).values({
      userId,
      accountNumber: `ACCT${Date.now()}`,
      accountType: 'checking',
      balance: 0,
      status: 'active',
    });

    const account = await db.select().from(accounts).where(sql`${accounts.userId} = ${userId}`).get();
    expect(account).toBeDefined();
    const accountId = account!.id;

    // Insert transactions with explicit createdAt timestamps (different dates)
    const t1 = '2023-01-01T12:00:00.000Z';
    const t2 = '2025-12-01T12:00:00.000Z'; // newest
    const t3 = '2024-06-01T12:00:00.000Z';

    await db.insert(transactions).values([
      { accountId, type: 'deposit', amount: 10, description: 't1', status: 'completed', createdAt: t1 },
      { accountId, type: 'deposit', amount: 25, description: 't2', status: 'completed', createdAt: t2 },
      { accountId, type: 'deposit', amount: 5, description: 't3', status: 'completed', createdAt: t3 },
    ]);

    // Create a minimal context with user for protected procedures
    const ctx: any = { user: { id: userId }, req: { headers: {} }, res: {} };

    const caller = accountRouter.createCaller(ctx);
    const result = await caller.getTransactions({ accountId, limit: 10, offset: 0 });

    expect(Array.isArray(result)).toBe(true);
    // Ensure returned order is newest-first: expect descriptions in order t2, t3, t1
    const descriptions = result.map((r: any) => r.description);
    expect(descriptions).toEqual(['t2', 't3', 't1']);

    // Also assert the createdAt values are descending
    for (let i = 1; i < result.length; i++) {
      const prev = new Date(String(result[i - 1].createdAt)).getTime();
      const curr = new Date(String(result[i].createdAt)).getTime();
      expect(prev).toBeGreaterThanOrEqual(curr);
    }
  });
});
