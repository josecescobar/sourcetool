import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Regression test: an invite is addressed to one email address. Holding the
 * link used to be enough for any signed-in user to join the team.
 */

const teamInvite = { findFirst: vi.fn(), delete: vi.fn() };
const teamMember = { findUnique: vi.fn(), create: vi.fn() };
const user = { findUnique: vi.fn() };

vi.mock('@sourcetool/db', () => ({
  prisma: {
    teamInvite,
    teamMember,
    user,
    $transaction: (ops: unknown[]) => Promise.all(ops),
  },
}));

vi.mock('../auth/utils/token.util', () => ({
  generateToken: () => 'raw-token',
  hashToken: (t: string) => `hashed:${t}`,
}));

const { TeamsService } = await import('./teams.service');

const TEAM = 'team-1';
const INVITED_EMAIL = 'invited@example.com';

function makeService() {
  return new TeamsService({ sendTeamInvite: vi.fn() } as never);
}

beforeEach(() => {
  vi.clearAllMocks();
  teamInvite.findFirst.mockResolvedValue({
    id: 'invite-1',
    teamId: TEAM,
    email: INVITED_EMAIL,
    role: 'ADMIN',
    team: { id: TEAM, name: 'Acme' },
  });
  teamMember.findUnique.mockResolvedValue(null);
  teamMember.create.mockResolvedValue({ id: 'member-1', teamId: TEAM, role: 'ADMIN' });
  teamInvite.delete.mockResolvedValue({});
});

describe('TeamsService.acceptInvite', () => {
  it('lets the invited address accept', async () => {
    user.findUnique.mockResolvedValue({ id: 'user-1', email: INVITED_EMAIL });

    await expect(makeService().acceptInvite('raw-token', 'user-1')).resolves.toMatchObject({
      team: { id: TEAM },
    });
    expect(teamMember.create).toHaveBeenCalled();
  });

  it('accepts regardless of email casing', async () => {
    user.findUnique.mockResolvedValue({ id: 'user-1', email: 'Invited@Example.COM' });

    await expect(makeService().acceptInvite('raw-token', 'user-1')).resolves.toBeDefined();
  });

  it('rejects a different signed-in user holding the link', async () => {
    user.findUnique.mockResolvedValue({ id: 'user-2', email: 'attacker@example.com' });

    await expect(makeService().acceptInvite('raw-token', 'user-2')).rejects.toThrow(
      /different email address/,
    );
    expect(teamMember.create).not.toHaveBeenCalled();
  });

  it('rejects when the user record is missing', async () => {
    user.findUnique.mockResolvedValue(null);

    await expect(makeService().acceptInvite('raw-token', 'ghost')).rejects.toThrow(
      /Invalid or expired invite/,
    );
    expect(teamMember.create).not.toHaveBeenCalled();
  });

  it('rejects an expired or unknown token before checking identity', async () => {
    teamInvite.findFirst.mockResolvedValue(null);

    await expect(makeService().acceptInvite('bad-token', 'user-1')).rejects.toThrow(
      /Invalid or expired invite/,
    );
    expect(user.findUnique).not.toHaveBeenCalled();
  });
});
