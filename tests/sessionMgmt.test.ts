/**
 * Tests for Ticket SEC-304: Session Management Gaps
 *
 * - Expired sessions are removed at login/signup
 * - Logout deletes the session record and clears the cookie
 * - Invalid tokens block data access
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { users, sessions } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';
import { authRouter } from '@/server/routers/auth';
import { createContext } from '@/server/trpc';

describe('SEC-304: Session Management Gaps', () => {
  const TEST_EMAIL = 'session-test@example.com';
  const TEST_PASSWORD = 'StrongPassw0rd!';

  beforeEach(async () => {
    await db.delete(sessions).where(sql`${sessions.userId} > 0`);
    await db.delete(users).where(sql`${users.email} = ${TEST_EMAIL}`);
  });

  test('expired sessions are removed when user logs in', async () => {
    const hashed = await bcrypt.hash(TEST_PASSWORD, 10);
    await db.insert(users).values({
      email: TEST_EMAIL,
      password: hashed,
      firstName: 'Test',
      lastName: 'User',
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

    const expiredToken = jwt.sign({ userId: userId }, process.env.JWT_SECRET || 'temporary-secret-for-interview');
    const past = new Date(Date.now() - 1000 * 60 * 60).toISOString(); // 1 hour ago

    await db.insert(sessions).values({
      userId: userId,
      token: expiredToken,
      expiresAt: past,
    });

    const before = await db.select().from(sessions).where(sql`${sessions.userId} = ${userId}`).all();
    expect(before.length).toBeGreaterThanOrEqual(1);

    const ctx: any = {
      req: { cookies: {} },
      res: { setHeader: jest.fn() },
    };

    const caller = authRouter.createCaller(ctx);
    const result = await caller.login({ email: TEST_EMAIL, password: TEST_PASSWORD });
    expect(result).toBeDefined();
    expect(result.token).toBeDefined();

    const after = await db.select().from(sessions).where(sql`${sessions.userId} = ${userId}`).all();
    expect(after.length).toBe(1);
    expect(after[0].token).toBe(result.token);
  });

  test('logout deletes the session and clears the cookie', async () => {
    const hashed = await bcrypt.hash(TEST_PASSWORD, 10);
    await db.insert(users).values({
      email: TEST_EMAIL,
      password: hashed,
      firstName: 'Test',
      lastName: 'User',
      phoneNumber: '+11234567890',
      dateOfBirth: '1990-01-01',
      ssn: '000000000',
      address: '1 Test St',
      city: 'Testville',
      state: 'CA',
      zipCode: '12345',
    });

    const user = await db.select().from(users).where(sql`${users.email} = ${TEST_EMAIL}`).get();
    const userId2 = user!.id;

    const token = jwt.sign({ userId: userId2 }, process.env.JWT_SECRET || 'temporary-secret-for-interview');
    const future = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(); // 1 day ahead

    await db.insert(sessions).values({ userId: userId2, token, expiresAt: future });

    const existing = await db.select().from(sessions).where(sql`${sessions.token} = ${token}`).get();
    expect(existing).toBeDefined();

    const setHeader = jest.fn();
    const ctx: any = {
      req: { headers: { cookie: `session=${token}` } },
      res: { setHeader },
    };

    const caller = authRouter.createCaller(ctx);
    const result = await caller.logout();
    expect(result).toEqual({ success: true, message: 'Logged out successfully' });

    const gone = await db.select().from(sessions).where(sql`${sessions.token} = ${token}`).get();
    expect(gone).toBeUndefined();

    expect(setHeader).toHaveBeenCalled();
    const headerArg = setHeader.mock.calls[0][1] as string;
    expect(headerArg).toMatch(/Max-Age=0/);
  });

  test('invalid token does not provide a user in createContext', async () => {
    const ctx = await createContext({ req: { headers: { cookie: 'session=invalid.token.here' }, }, res: {} } as any);
    expect(ctx.user).toBeNull();
  });
});
