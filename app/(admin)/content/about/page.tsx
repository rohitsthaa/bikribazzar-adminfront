import { redirect } from "next/navigation";
import { getAdmin, can } from "@/lib/auth";
import { getSettings, getPlatformFeatures } from "@/lib/api";
import { currentStoreId } from "@/lib/store-context";
import AboutContentClient from "./AboutContentClient";

export const metadata = { title: "About page — Admin" };

export default async function AboutContentPage() {
  const admin = await getAdmin();
  if (!can(admin?.role, "settings")) redirect("/dashboard");

  const [settings, storeId, features] = await Promise.all([
    getSettings().catch(() => ({} as Record<string, string>)),
    currentStoreId(),
    getPlatformFeatures().catch(() => ({} as Record<string, boolean>)),
  ]);

  return (
    <main className="max-w-3xl p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-stone-900">About page</h1>
        <p className="mt-0.5 text-sm text-stone-400">Edit your story and control whether customers can see it.</p>
      </div>
      <AboutContentClient
        key={storeId}
        initialTitle={settings.about_title ?? ""}
        initialBody={settings.about_body ?? ""}
        initialImage={settings.about_image ?? ""}
        initialEnabled={settings.about_enabled !== "false"}
        globallyHidden={features.about === false}
      />
    </main>
  );
}
