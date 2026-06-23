'use client';
import { useState } from 'react';
import type { BlogPost } from '@/lib/api';
import PostEditor from './PostEditor';
import { deletePostAction } from './actions';

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

export default function BlogClient({ initialPosts }: { initialPosts: BlogPost[] }) {
  const [posts, setPosts] = useState(initialPosts);
  const [editing, setEditing] = useState<BlogPost | null | 'new'>(null);

  function handleSave(post: BlogPost) {
    setPosts(prev => {
      const idx = prev.findIndex(p => p.id === post.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = post; return next; }
      return [post, ...prev];
    });
    setEditing(null);
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this post?')) return;
    await deletePostAction(id);
    setPosts(prev => prev.filter(p => p.id !== id));
  }

  if (editing !== null) {
    return (
      <div>
        <h2 className="text-lg font-semibold text-stone-900 mb-6">
          {editing === 'new' ? 'New post' : `Edit — ${(editing as BlogPost).title}`}
        </h2>
        <PostEditor
          post={editing === 'new' ? undefined : editing as BlogPost}
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
          New post
        </button>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-2xl border border-stone-100 bg-stone-50 p-12 text-center">
          <p className="text-stone-400 text-sm">No posts yet. Create your first post above.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {posts.map(post => (
            <div key={post.id} className="flex items-center gap-4 rounded-xl border border-stone-100 bg-white px-4 py-3.5">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${post.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-500'}`}>
                    {post.status}
                  </span>
                  <p className="font-medium text-stone-900 text-sm truncate">{post.title}</p>
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-stone-400">
                  <span>/{post.slug}</span>
                  {post.tags.length > 0 && <span>{post.tags.join(', ')}</span>}
                  <span>{timeAgo(post.updatedAt)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => setEditing(post)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors">
                  Edit
                </button>
                <button onClick={() => handleDelete(post.id)}
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
