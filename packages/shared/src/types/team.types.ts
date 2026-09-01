export type TeamRole = 'OWNER' | 'ADMIN' | 'VA' | 'VIEWER';

export interface Team {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Date;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: TeamRole;
  invitedAt: Date;
  joinedAt?: Date;
  user?: {
    id: string;
    email: string;
    name?: string;
    avatarUrl?: string;
  };
}

export interface TeamInvite {
  id: string;
  teamId: string;
  email: string;
  role: TeamRole;
  expiresAt: Date;
  createdAt: Date;
  inviteLink?: string;
}
