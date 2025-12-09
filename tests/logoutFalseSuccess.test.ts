import jwt from 'jsonwebtoken';
import { db } from '@/lib/db';
import { sessions, users } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';
import { authRouter } from '@/server/routers/auth';

describe('PERF-402: Logout Always Reported Success', () => {
  const token = jwt.sign({ userId: 999999 }, process.env.JWT_SECRET || 'temporary-secret-for-interview');
  const TEST_EMAIL = 'logout-test@example.com';

  beforeEach(async () => {
    // Clean any sessions for this token and remove any test user
    await db.delete(sessions).where(sql`${sessions.token} = ${token}`);
    await db.delete(users).where(sql`${users.email} = ${TEST_EMAIL}`);
  });

  test('returns false when session not found and does not clear cookie', async () => {
    const setHeader = jest.fn();

    const ctx: any = {
      req: { headers: { cookie: `session=${token}` } },
      res: { setHeader },
    };

    const caller = authRouter.createCaller(ctx);
    const result = await caller.logout();

    expect(result).toEqual({ success: false, message: 'No active session found' });

    expect(setHeader).not.toHaveBeenCalled();
  });
    test('returns success when session exists and clears cookie', async () => {
    // Create a user to satisfy the foreign key constraint, then insert the session
    await db.insert(users).values({
      email: TEST_EMAIL,
      password: 'irrelevant',
      firstName: 'Logout',
      lastName: 'Tester',
      phoneNumber: '+11234567890',
      dateOfBirth: '1990-01-01',
      ssn: '000000000',
      address: '1 Test St',
      city: 'Testville',
      state: 'CA',
      zipCode: '12345',
    });

    const user = await db.select().from(users).where(sql`${users.email} = ${TEST_EMAIL}`).get();
    const userId = user!.id;

    await db.insert(sessions).values({
      userId,
      token: token,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60).toISOString(), // 1 hour in future
    });

    const setHeader = jest.fn();

    const ctx: any = {
      req: { headers: { cookie: `session=${token}` } },
      res: { setHeader },
    };

    const caller = authRouter.createCaller(ctx);
    const result = await caller.logout();

    expect(result).toEqual({ success: true, message: 'Logged out successfully' });

    expect(setHeader).toHaveBeenCalled();
    const headerArg = setHeader.mock.calls[0][1] as string;
    expect(headerArg).toMatch(/Max-Age=0/);
  });
});
