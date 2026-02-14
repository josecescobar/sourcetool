'use client';

import { useState } from 'react';
import { Users } from 'lucide-react';

export default function TeamPage() {
  const [showInvite, setShowInvite] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Team Management</h1>
        <button onClick={() => setShowInvite(true)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Invite Member
        </button>
      </div>

      <div className="rounded-xl border bg-white shadow-sm">
        <div className="p-6 border-b">
          <h2 className="font-medium">Team Members</h2>
        </div>
        <div className="p-6 text-center">
          <Users className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">You are the only team member. Invite others to collaborate.</p>
        </div>
      </div>
    </div>
  );
}
