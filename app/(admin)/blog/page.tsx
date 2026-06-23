import { redirect } from 'next/navigation';
import { getAdmin } from '@/lib/auth';
import { getBlogPosts } from '@/lib/api';
import BlogClient from './BlogClient';

export const metadata = { title: 'Blog — Admin' };

export default async function BlogPage() {
  const admin = await getAdmin();
  if (!admin) redirect('/login');
  const posts = await getBlogPosts().catch(() => []);
  return (
    <main className="p-6 md:p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-stone-900">Blog</h1>
        <p className="text-sm text-stone-400 mt-0.5">Create and manage blog posts for your store.</p>
      </div>
      <BlogClient initialPosts={posts} />
    </main>
  );
}
