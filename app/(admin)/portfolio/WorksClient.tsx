'use client';
import { useState } from 'react';
import type { PortfolioWork } from '@/lib/api';
import WorkEditor from './WorkEditor';
import { deleteWorkAction } from './actions';

export default function WorksClient({ initialWorks }: { initialWorks: PortfolioWork[] }) {
  const [works, setWorks] = useState(initialWorks);
  const [editing, setEditing] = useState<PortfolioWork | null | 'new'>(null);

  function handleSave(work: PortfolioWork) {
    setWorks(prev => {
      const idx = prev.findIndex(w => w.id === work.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = work; return next; }
      return [work, ...prev];
    });
    setEditing(null);
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this work?')) return;
    await deleteWorkAction(id);
    setWorks(prev => prev.filter(w => w.id !== id));
  }

  if (editing !== null) {
    return (
      <div>
        <h2 className="text-lg font-semibold text-stone-900 mb-6">
          {editing === 'new' ? 'New work' : `Edit — ${(editing as PortfolioWork).title}`}
        </h2>
        <WorkEditor
          work={editing === 'new' ? undefined : editing as PortfolioWork}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setEditing('new')}
          className="inline-flex items-center gap-2 rounded-xl bg-[#c96a3a] text-white px-4 py-2.5 text-sm font-medium hover:bg-[#b85f33] transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add work
        </button>
      </div>

      {works.length === 0 ? (
        <div className="rounded-2xl border border-stone-100 bg-stone-50 p-12 text-center">
          <p className="text-stone-400 text-sm">No works yet. Add your first portfolio piece above.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {works.map(work => (
            <div key={work.id} className="flex items-center gap-4 rounded-xl border border-stone-100 bg-white px-4 py-3.5">
              {work.images[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={work.images[0]} alt={work.title} className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${work.available ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-500'}`}>
                    {work.available ? 'visible' : 'hidden'}
                  </span>
                  <p className="font-medium text-stone-900 text-sm truncate">{work.title}</p>
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-stone-400">
                  {work.medium && <span>{work.medium}</span>}
                  {work.year && <span>{work.year}</span>}
                  {work.priceLabel && <span>{work.priceLabel}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => setEditing(work)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors">
                  Edit
                </button>
                <button onClick={() => handleDelete(work.id)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
