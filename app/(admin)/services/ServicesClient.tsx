'use client';
import { useState } from 'react';
import type { Service } from '@/lib/api';
import ServiceEditor from './ServiceEditor';
import { deleteServiceAction } from './actions';

export default function ServicesClient({ initialServices }: { initialServices: Service[] }) {
  const [services, setServices] = useState(initialServices);
  const [editing, setEditing] = useState<Service | null | 'new'>(null);

  function handleSave(service: Service) {
    setServices(prev => {
      const idx = prev.findIndex(s => s.id === service.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = service; return next; }
      return [service, ...prev];
    });
    setEditing(null);
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this service?')) return;
    await deleteServiceAction(id);
    setServices(prev => prev.filter(s => s.id !== id));
  }

  if (editing !== null) {
    return (
      <div>
        <h2 className="text-lg font-semibold text-stone-900 mb-6">
          {editing === 'new' ? 'New service' : `Edit — ${(editing as Service).title}`}
        </h2>
        <ServiceEditor
          service={editing === 'new' ? undefined : editing as Service}
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
          Add service
        </button>
      </div>

      {services.length === 0 ? (
        <div className="rounded-2xl border border-stone-100 bg-stone-50 p-12 text-center">
          <p className="text-stone-400 text-sm">No services yet. Add your first service above.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {services.map(service => (
            <div key={service.id} className="flex items-center gap-4 rounded-xl border border-stone-100 bg-white px-4 py-3.5">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${service.available ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-500'}`}>
                    {service.available ? 'visible' : 'hidden'}
                  </span>
                  <p className="font-medium text-stone-900 text-sm truncate">{service.title}</p>
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-stone-400">
                  {service.priceLabel && <span>{service.priceLabel}</span>}
                  {service.tags.length > 0 && <span>{service.tags.join(', ')}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => setEditing(service)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors">
                  Edit
                </button>
                <button onClick={() => handleDelete(service.id)}
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
