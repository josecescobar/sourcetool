'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

export default function BuyListPage() {
  const [lists, setLists] = useState<any[]>([]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Buy Lists</h1>
        <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          New List
        </button>
      </div>

      {lists.length === 0 ? (
        <div className="rounded-xl border bg-white p-12 text-center shadow-sm">
          <p className="text-muted-foreground">No buy lists yet. Create one to start saving products.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {lists.map((list) => (
            <div key={list.id} className="rounded-xl border bg-white p-4 shadow-sm">
              <h3 className="font-medium">{list.name}</h3>
              <p className="text-sm text-muted-foreground">{list.items?.length || 0} items</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
