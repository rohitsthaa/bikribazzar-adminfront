import { redirect } from "next/navigation";
import { getAdmin, can } from "@/lib/auth";
import { getSettings } from "@/lib/api";
import { currentStoreId } from "@/lib/store-context";
import { parseCustomPageConfig } from "@/lib/custom-page-config";
import CustomOrdersContentClient from "./CustomOrdersContentClient";

export const metadata = { title: "Custom orders — Admin" };

export default async function CustomOrdersContentPage() {
  const admin = await getAdmin();
  if (!can(admin?.role, "settings")) redirect("/dashboard");

  const [settings, storeId] = await Promise.all([
    getSettings().catch(() => ({} as Record<string, string>)),
    currentStoreId(),
  ]);

  return (
    <main className="max-w-3xl p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-stone-900">Custom orders</h1>
        <p className="mt-0.5 text-sm text-stone-400">Edit the bespoke enquiry page and its request form.</p>
      </div>
      <CustomOrdersContentClient
        key={storeId}
        initialTitle={settings.custom_title ?? ""}
        initialBody={settings.custom_body ?? ""}
        initialEnabled={settings.custom_enabled !== "false"}
        initialConfig={parseCustomPageConfig(settings.custom_page_config)}
      />
    </main>
  );
}
