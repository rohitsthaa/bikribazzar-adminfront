'use client';
import { useState, useTransition } from 'react';
import type { BlogPost } from '@/lib/api';
import { createPostAction, updatePostAction } from './actions';
import MarkdownEditor from '@/components/MarkdownEditor';
import MarkdownContent from '@/components/MarkdownContent';
import ImageUploader from '@/components/ImageUploader';

const inputCls = 'w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-[#c96a3a]/30';

interface Props {
  post?: BlogPost;
  onSave: (post: BlogPost) => void;
  onCancel: () => void;
}

export default function PostEditor({ post, onSave, onCancel }: Props) {
  const isNew = !post;
  const [title, setTitle] = useState(post?.title ?? '');
  const [slug, setSlug] = useState(post?.slug ?? '');
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? '');
  const [body, setBody] = useState(post?.body ?? '');
  const [coverImage, setCoverImage] = useState(post?.coverImage ?? '');
  const [status, setStatus] = useState<'draft' | 'published'>(post?.status ?? 'draft');
  const [tags, setTags] = useState((post?.tags ?? []).join(', '));
  const [error, setError] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [isPending, start] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const data: Partial<BlogPost> = {
      title, slug: slug || undefined, excerpt, coverImage, status,
      body,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
    };
    start(async () => {
      const res = isNew
        ? await createPostAction(data)
        : await updatePostAction(post!.id, data);
      if (res.error) { setError(res.error); return; }
      if (res.post) onSave(res.post);
    });
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1.5">Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} required placeholder="Post title" className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5">Slug <span className="text-stone-400 font-normal">(auto-generated if blank)</span></label>
            <input value={slug} onChange={e => setSlug(e.target.value)} placeholder="my-post-title" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value as 'draft' | 'published')}
              className={`${inputCls} bg-white`}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1.5">Excerpt <span className="text-stone-400 font-normal">(shown in listing)</span></label>
          <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} rows={2} placeholder="A short summary..." className={`${inputCls} resize-none`} />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-medium text-stone-500">Body</label>
            <button
              type="button"
              onClick={() => setPreviewing(true)}
              className="text-xs font-medium text-[#c96a3a] hover:underline"
            >
              Preview full post →
            </button>
          </div>
          <MarkdownEditor name="body" defaultValue={post?.body} onChange={setBody} placeholder="Write your post here…" rows={14} />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1.5">Cover image</label>
          <ImageUploader value={coverImage} onChange={setCoverImage} />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1.5">Tags <span className="text-stone-400 font-normal">(comma-separated)</span></label>
          <input value={tags} onChange={e => setTags(e.target.value)} placeholder="news, update, tips" className={inputCls} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex items-center gap-3 pt-2 border-t border-stone-100">
          <button type="submit" disabled={isPending}
            className="px-6 py-2.5 rounded-xl bg-[#c96a3a] text-white text-sm font-medium hover:bg-[#b85f33] disabled:opacity-50 transition-colors">
            {isPending ? 'Saving…' : isNew ? 'Publish / Save draft' : 'Save changes'}
          </button>
          <button type="button" onClick={onCancel}
            className="px-4 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-600 hover:bg-stone-50 transition-colors">
            Cancel
          </button>
        </div>
      </form>

      {previewing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 md:p-10">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
              <div>
                <p className="text-sm font-semibold text-stone-900">Preview</p>
                <p className="text-xs text-stone-400">This is a temporary preview — nothing has been saved or published.</p>
              </div>
              <button
                onClick={() => setPreviewing(false)}
                className="text-stone-400 hover:text-stone-700 transition-colors"
                aria-label="Close preview"
              >
                ✕
              </button>
            </div>
            <article className="px-6 py-8 md:px-10">
              {coverImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverImage} alt="" className="mb-6 w-full rounded-xl object-cover" style={{ maxHeight: '360px' }} />
              )}
              {tags && (
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {tags.split(',').map(t => t.trim()).filter(Boolean).map(t => (
                    <span key={t} className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs text-stone-500">{t}</span>
                  ))}
                </div>
              )}
              <h1 className="text-3xl font-bold text-stone-900 mb-3">{title || 'Untitled post'}</h1>
              {excerpt && <p className="text-lg text-stone-500 mb-6 leading-relaxed">{excerpt}</p>}
              {body.trim() ? (
                <MarkdownContent content={body} />
              ) : (
                <p className="text-sm italic text-stone-300">No body content yet.</p>
              )}
            </article>
          </div>
        </div>
      )}
    </>
  );
}
