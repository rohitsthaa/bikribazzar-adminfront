import { redirect } from "next/navigation";
import { getAdmin, can } from "@/lib/auth";
import ContentClient from "./ContentClient";

export const metadata = { title: "Content — Admin" };

export default async function ContentPage() {
  const admin = await getAdmin();
  if (!can(admin?.role, "settings")) redirect("/dashboard");

  return (
    <main className="p-6 md:p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-stone-900">Content</h1>
        <p className="text-sm text-stone-400 mt-0.5">Manage your storefront pages and visibility</p>
      </div>
      <ContentClient />
    </main>
  );
}
