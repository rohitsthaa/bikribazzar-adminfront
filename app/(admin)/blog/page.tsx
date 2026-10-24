import { redirect } from 'next/navigation';
import { getAdmin } from '@/lib/auth';
import { getBlogPosts, getSettings } from '@/lib/api';
import BlogClient from './BlogClient';
import PageVisibilityCard from '@/components/PageVisibilityCard';

export const metadata = { title: 'Blog — Admin' };

export default async function BlogPage() {
  const admin = await getAdmin();
  if (!admin) redirect('/login');
  const [posts, settings] = await Promise.all([
    getBlogPosts().catch(() => []),
    getSettings().catch(() => ({} as Record<string, string>)),
  ]);
  return (
    <main className="p-6 md:p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-stone-900">Blog</h1>
        <p className="text-sm text-stone-400 mt-0.5">Create and manage blog posts for your store.</p>
      </div>
      <PageVisibilityCard
        page="blog"
        initialEnabled={settings.blog_enabled !== 'false'}
        title="Blog page visibility"
        description="Choose whether visitors can open the blog page on your storefront. Your posts are managed below."
      />
      <BlogClient initialPosts={posts} />
    </main>
  );
}
