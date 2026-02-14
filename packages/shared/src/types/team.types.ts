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
}

export interface TeamInvite {
  email: string;
  role: TeamRole;
}
