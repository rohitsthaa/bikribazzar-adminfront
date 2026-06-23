'use client';
import { useState, useTransition } from 'react';
import type { Lead } from '@/lib/api';
import { markLeadReadAction } from './actions';

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const SOURCE_LABELS: Record<string, string> = {
  contact: 'Contact form',
  custom: 'Custom order',
  commission: 'Commission',
};

function LeadCard({ lead }: { lead: Lead }) {
  const [expanded, setExpanded] = useState(false);
  const [read, setRead] = useState(!!lead.readAt);
  const [, start] = useTransition();

  function handleExpand() {
    setExpanded(v => !v);
    if (!read) {
      setRead(true);
      start(async () => { await markLeadReadAction(lead.id); });
    }
  }

  return (
    <div className={`rounded-xl border transition-colors ${read ? 'border-stone-100 bg-white' : 'border-[#c96a3a]/20 bg-orange-50/30'}`}>
      <button type="button" onClick={handleExpand} className="w-full text-left px-4 py-3.5 flex items-start gap-3">
        {!read && <span className="mt-1.5 flex-shrink-0 w-2 h-2 rounded-full bg-[#c96a3a]" />}
        {read && <span className="mt-1.5 flex-shrink-0 w-2 h-2 rounded-full bg-stone-200" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-stone-900 text-sm">{lead.name}</span>
            {lead.email && <span className="text-xs text-stone-500">{lead.email}</span>}
            {lead.phone && <span className="text-xs text-stone-500">{lead.phone}</span>}
          </div>
          <p className="text-sm text-stone-600 mt-0.5 truncate">{lead.message}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-500">
            {SOURCE_LABELS[lead.source] ?? lead.source}
          </span>
          <span className="text-xs text-stone-400">{timeAgo(lead.createdAt)}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-stone-400 transition-transform ${expanded ? 'rotate-180' : ''}`}><path d="M6 9l6 6 6-6"/></svg>
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-stone-100">
          <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line mt-3">{lead.message}</p>
          <div className="flex gap-4 mt-3 text-xs text-stone-400">
            {lead.email && <a href={`mailto:${lead.email}`} className="hover:text-[#c96a3a] transition-colors underline">{lead.email}</a>}
            {lead.phone && <span>{lead.phone}</span>}
            <span>{new Date(lead.createdAt).toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EnquiriesClient({ leads }: { leads: Lead[] }) {
  if (leads.length === 0) {
    return (
      <div className="rounded-2xl border border-stone-100 bg-stone-50 p-12 text-center">
        <p className="text-stone-400 text-sm">No enquiries yet. They&apos;ll appear here when visitors submit the contact form.</p>
      </div>
    );
  }

  const unread = leads.filter(l => !l.readAt).length;
  return (
    <div className="space-y-2">
      {unread > 0 && (
        <p className="text-sm text-stone-500 mb-4">{unread} unread</p>
      )}
      {leads.map(lead => <LeadCard key={lead.id} lead={lead} />)}
    </div>
  );
}
