/** Store-owned custom-order content. Keep this pure contract in sync in admin/storefront. */
export const CUSTOM_TEXT_KEYS = [
  "eyebrow",
  "rightEyebrow",
  "formHeading",
  "formTitle",
  "formIntro",
  "submitLabel",
  "sendingLabel",
  "successHeading",
  "successTitle",
  "successMessage",
  "contactCtaLabel",
] as const;
export const CUSTOM_FIELD_KEYS = [
  "name",
  "phone",
  "email",
  "pieceType",
  "dimensions",
  "colour",
  "notes",
] as const;
export type CustomTextKey = (typeof CUSTOM_TEXT_KEYS)[number];
export type CustomFieldKey = (typeof CUSTOM_FIELD_KEYS)[number];
export type CustomFieldConfig = {
  label?: string;
  placeholder?: string;
  visible?: boolean;
  required?: boolean;
};
export type CustomPageConfig = Partial<Record<CustomTextKey, string>> & {
  showBadge?: boolean;
  showForm?: boolean;
  showFormHeading?: boolean;
  showIntro?: boolean;
  showSteps?: boolean;
  fields?: Partial<Record<CustomFieldKey, CustomFieldConfig>>;
  fieldOrder?: CustomFieldKey[];
  pieceTypeOptions?: string[];
  steps?: Array<[string, string]>;
};
export const CUSTOM_FIELD_LABELS: Record<CustomFieldKey, string> = {
  name: "Name",
  phone: "Phone",
  email: "Email",
  pieceType: "Order type",
  dimensions: "Size / dimensions",
  colour: "Colour / preference",
  notes: "Additional details",
};
const bools = [
  "showBadge",
  "showForm",
  "showFormHeading",
  "showIntro",
  "showSteps",
] as const;
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
export function validateCustomPageConfig(value: unknown): CustomPageConfig {
  if (!object(value))
    throw new Error("Custom page settings must be an object.");
  const out: CustomPageConfig = {};
  for (const key of CUSTOM_TEXT_KEYS)
    if (value[key] !== undefined) {
      if (
        typeof value[key] !== "string" ||
        value[key].length >
          (["formIntro", "successMessage"].includes(key) ? 2000 : 160)
      )
        throw new Error(`Check the length of ${key}.`);
      out[key] = (value[key] as string).trim();
    }
  for (const key of bools)
    if (value[key] !== undefined) {
      if (typeof value[key] !== "boolean") throw new Error(`Invalid ${key}.`);
      out[key] = value[key] as boolean;
    }
  if (value.fields !== undefined) {
    if (!object(value.fields)) throw new Error("Invalid fields.");
    out.fields = {};
    for (const key of CUSTOM_FIELD_KEYS) {
      const field = value.fields[key];
      if (field === undefined) continue;
      if (!object(field)) throw new Error("Invalid field settings.");
      const f: CustomFieldConfig = {};
      for (const k of ["label", "placeholder"] as const)
        if (field[k] !== undefined) {
          if (typeof field[k] !== "string" || field[k].length > 200)
            throw new Error(
              "Field labels and placeholders must be 200 characters or fewer.",
            );
          f[k] = (field[k] as string).trim();
        }
      for (const k of ["visible", "required"] as const)
        if (field[k] !== undefined) {
          if (typeof field[k] !== "boolean")
            throw new Error("Invalid field switch.");
          f[k] = field[k] as boolean;
        }
      if (
        (key === "name" || key === "phone") &&
        (f.visible === false || f.required === false)
      )
        throw new Error("Name and phone must remain visible and required.");
      if (f.visible === false && f.required === true)
        throw new Error("A hidden field cannot be required.");
      out.fields[key] = f;
    }
  }
  if (value.fieldOrder !== undefined) {
    if (
      !Array.isArray(value.fieldOrder) ||
      value.fieldOrder.length !== CUSTOM_FIELD_KEYS.length ||
      new Set(value.fieldOrder).size !== CUSTOM_FIELD_KEYS.length ||
      !value.fieldOrder.every((k) => CUSTOM_FIELD_KEYS.includes(k))
    )
      throw new Error("Field order must contain each field once.");
    out.fieldOrder = value.fieldOrder as CustomFieldKey[];
  }
  if (value.pieceTypeOptions !== undefined) {
    if (
      !Array.isArray(value.pieceTypeOptions) ||
      !value.pieceTypeOptions.length ||
      value.pieceTypeOptions.length > 30 ||
      value.pieceTypeOptions.some(
        (v) => typeof v !== "string" || !v.trim() || v.trim().length > 120,
      )
    )
      throw new Error("Add 1–30 order types, up to 120 characters each.");
    const options = value.pieceTypeOptions.map((v) => v.trim());
    if (new Set(options.map((v) => v.toLowerCase())).size !== options.length)
      throw new Error("Order types must be unique.");
    out.pieceTypeOptions = options;
  }
  if (value.steps !== undefined) {
    if (
      !Array.isArray(value.steps) ||
      value.steps.length > 6 ||
      value.steps.some(
        (v) =>
          !Array.isArray(v) ||
          v.length !== 2 ||
          typeof v[0] !== "string" ||
          typeof v[1] !== "string" ||
          !v[0].trim() ||
          v[0].length > 160 ||
          v[1].length > 1000,
      )
    )
      throw new Error(
        "Use up to six steps, each with a title and description.",
      );
    out.steps = value.steps.map((v) => [v[0].trim(), v[1].trim()]);
  }
  return out;
}
export function parseCustomPageConfig(
  raw: string | undefined,
): CustomPageConfig {
  if (!raw) return {};
  try {
    return validateCustomPageConfig(JSON.parse(raw));
  } catch {
    return {};
  }
}
export function customField(config: CustomPageConfig, key: CustomFieldKey) {
  const field = config.fields?.[key];
  return {
    label: field?.label || CUSTOM_FIELD_LABELS[key],
    placeholder: field?.placeholder,
    visible: key === "name" || key === "phone" || field?.visible !== false,
    required:
      key === "name" ||
      key === "phone" ||
      (field?.visible !== false && (field?.required ?? key === "pieceType")),
  };
}
/** Never trust client field labels/visibility: derive the brief from saved store settings. */
export function customRequestBody(body: unknown, config: CustomPageConfig) {
  if (!object(body)) throw new Error("Invalid request.");
  const values: Partial<Record<CustomFieldKey, string>> = {};
  for (const key of CUSTOM_FIELD_KEYS) {
    const field = customField(config, key);
    if (!field.visible) continue;
    const raw = body[key === "name" ? "customerName" : key];
    if (raw !== undefined && typeof raw !== "string")
      throw new Error(`Invalid ${field.label}.`);
    const value = (raw as string | undefined)?.trim() || "";
    if (field.required && !value)
      throw new Error(`${field.label} is required.`);
    if (value.length > (key === "notes" ? 4000 : key === "email" ? 254 : 500))
      throw new Error(`${field.label} is too long.`);
    values[key] = value;
  }
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))
    throw new Error("Enter a valid email address.");
  if (
    values.pieceType &&
    config.pieceTypeOptions &&
    !config.pieceTypeOptions.includes(values.pieceType)
  )
    throw new Error("Choose an available order type.");
  const notes = (config.fieldOrder || CUSTOM_FIELD_KEYS)
    .filter((k) => !["name", "phone", "email"].includes(k) && values[k])
    .map((k) => `${customField(config, k).label}: ${values[k]}`)
    .join("\n");
  return {
    customerName: values.name,
    phone: values.phone,
    email: values.email || "",
    notes,
  };
}
