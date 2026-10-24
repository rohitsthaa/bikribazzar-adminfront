"use server";
import { validateCustomPageConfig } from "@/lib/custom-page-config";
import { revalidatePath } from "next/cache";
import { updateSetting, revalidateStorefront } from "@/lib/api";
import { getAdmin, can } from "@/lib/auth";
import { assertFeatureOn } from "@/lib/features";

async function assertCanSettings() {
  const me = await getAdmin();
  if (!can(me?.role, "settings")) throw new Error("Forbidden");
  await assertFeatureOn("content");
}

export async function saveAboutContent(
  title: string,
  body: string,
  image = "",
): Promise<{ error?: string }> {
  try {
    await assertCanSettings();
    if (
      typeof title !== "string" ||
      typeof body !== "string" ||
      typeof image !== "string" ||
      title.length > 120 ||
      body.length > 3000 ||
      image.length > 2000
    )
      throw new Error("Check the page title, description, and image URL.");
    await Promise.all([
      updateSetting("about_title", title.trim()),
      updateSetting("about_body", body.trim()),
      updateSetting("about_image", image.trim()),
    ]);
    revalidatePath("/content");
    await revalidateStorefront();
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to save." };
  }
  return {};
}

export async function saveCustomContent(
  title: string,
  body: string,
  config: unknown = {},
): Promise<{ error?: string }> {
  try {
    await assertCanSettings();
    if (
      typeof title !== "string" ||
      typeof body !== "string" ||
      title.length > 120 ||
      body.length > 3000
    )
      throw new Error("Check the page title and description length.");
    const customization = validateCustomPageConfig(config);
    await Promise.all([
      updateSetting("custom_title", title.trim()),
      updateSetting("custom_body", body.trim()),
      updateSetting("custom_page_config", JSON.stringify(customization)),
    ]);
    revalidatePath("/content");
    await revalidateStorefront();
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to save." };
  }
  return {};
}

export async function savePageVisibility(
  page: "about" | "gallery" | "custom" | "blog",
  enabled: boolean,
): Promise<{ error?: string }> {
  try {
    await assertCanSettings();
    await updateSetting(`${page}_enabled`, enabled ? "true" : "false");
    revalidatePath("/content");
    if (page === "gallery" || page === "blog") revalidatePath(`/${page}`);
    await revalidateStorefront();
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to save." };
  }
  return {};
}
