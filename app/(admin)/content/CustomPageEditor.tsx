"use client";
import { useState, useEffect } from "react";
import {
  CUSTOM_FIELD_KEYS,
  CUSTOM_FIELD_LABELS,
  customField,
  type CustomFieldKey,
  type CustomPageConfig,
  type CustomTextKey,
} from "@/lib/custom-page-config";
const input =
  "w-full rounded-xl border border-stone-200 px-3 py-2 text-sm text-stone-900";
const titles: Record<CustomTextKey, string> = {
  eyebrow: "Page badge text",
  rightEyebrow: "Form-side badge (two-column templates)",
  formHeading: "Small form heading",
  formTitle: "Form title",
  formIntro: "Form introduction",
  submitLabel: "Submit button text",
  sendingLabel: "Sending button text",
  successHeading: "Confirmation badge",
  successTitle: "Confirmation title",
  successMessage: "Confirmation message",
  contactCtaLabel: "Contact button text (contact-only templates)",
};
export default function CustomPageEditor({
  value,
  onChange,
  disabled,
}: {
  value: CustomPageConfig;
  onChange: (v: CustomPageConfig) => void;
  disabled?: boolean;
}) {
  const [optionsText, setOptionsText] = useState(
    value.pieceTypeOptions?.join("\n") ?? "",
  );
  useEffect(() => {
    if (!value.pieceTypeOptions) setOptionsText("");
  }, [value.pieceTypeOptions]);
  function text(key: CustomTextKey, raw: string) {
    const next = { ...value };
    if (raw.trim()) next[key] = raw;
    else delete next[key];
    onChange(next);
  }
  function field(key: CustomFieldKey, patch: Record<string, unknown>) {
    onChange({
      ...value,
      fields: { ...value.fields, [key]: { ...value.fields?.[key], ...patch } },
    });
  }
  const order = value.fieldOrder ?? [...CUSTOM_FIELD_KEYS];
  function move(index: number, direction: number) {
    const next = [...order];
    [next[index], next[index + direction]] = [
      next[index + direction],
      next[index],
    ];
    onChange({ ...value, fieldOrder: next });
  }
  const textInput = (key: CustomTextKey) => (
    <label key={key} className="block text-sm text-stone-600">
      <span className="block mb-1">{titles[key]}</span>
      {["formIntro", "successMessage"].includes(key) ? (
        <textarea
          className={input}
          rows={3}
          maxLength={2000}
          value={value[key] ?? ""}
          onChange={(e) => text(key, e.target.value)}
          placeholder="Use template wording"
        />
      ) : (
        <input
          className={input}
          maxLength={160}
          value={value[key] ?? ""}
          onChange={(e) => text(key, e.target.value)}
          placeholder="Use template wording"
        />
      )}
    </label>
  );
  return (
    <fieldset
      disabled={disabled}
      className="space-y-5 border-t border-stone-100 pt-5"
    >
      <legend className="font-medium text-stone-900">
        Page & form customization
      </legend>
      <p className="text-xs text-stone-500">
        Blank text uses your template’s wording. Colors and fonts follow Design.
        Name and phone stay required so you can contact the customer.
      </p>
      <label className="block text-sm">
        Request form display
        <select
          className={input + " mt-1"}
          value={
            value.showForm === undefined ? "default" : String(value.showForm)
          }
          onChange={(e) => {
            const next = { ...value };
            if (e.target.value === "default") delete next.showForm;
            else next.showForm = e.target.value === "true";
            onChange(next);
          }}
        >
          <option value="default">Use template default</option>
          <option value="true">Show request form</option>
          <option value="false">Hide request form</option>
        </select>
      </label>
      <div className="flex flex-wrap gap-4">
        {(
          [
            ["showBadge", "Show page badge"],
            ["showFormHeading", "Show small form heading"],
            ["showIntro", "Show form introduction"],
            ["showSteps", "Show process steps"],
          ] as const
        ).map(([key, label]) => (
          <label className="flex items-center gap-2 text-sm" key={key}>
            <input
              type="checkbox"
              checked={value[key] !== false}
              onChange={(e) => onChange({ ...value, [key]: e.target.checked })}
            />
            {label}
          </label>
        ))}
      </div>
      <details open className="rounded-xl border border-stone-200 p-4">
        <summary className="cursor-pointer text-sm font-medium">
          Headings & button text
        </summary>
        <div className="grid gap-4 mt-4 md:grid-cols-2">
          {(
            [
              "eyebrow",
              "rightEyebrow",
              "formHeading",
              "formTitle",
              "formIntro",
              "submitLabel",
              "sendingLabel",
              "contactCtaLabel",
            ] as CustomTextKey[]
          ).map(textInput)}
        </div>
      </details>
      <details className="rounded-xl border border-stone-200 p-4">
        <summary className="cursor-pointer text-sm font-medium">
          Fields, visibility & order
        </summary>
        <p className="text-xs text-stone-500 mt-3">
          Rename labels and hints, choose which optional details to collect, and
          move fields up or down. Hidden answers are excluded from requests.
        </p>
        <div className="mt-4 space-y-4">
          {order.map((key, index) => {
            const f = customField(value, key),
              locked = key === "name" || key === "phone";
            return (
              <div className="rounded-xl bg-stone-50 p-4 space-y-3" key={key}>
                <div className="flex justify-between gap-3">
                  <h4 className="font-medium text-sm">
                    {CUSTOM_FIELD_LABELS[key]}
                  </h4>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="text-xs underline disabled:opacity-30"
                      disabled={index === 0}
                      aria-label={`Move ${CUSTOM_FIELD_LABELS[key]} up`}
                      onClick={() => move(index, -1)}
                    >
                      Move up
                    </button>
                    <button
                      type="button"
                      className="text-xs underline disabled:opacity-30"
                      disabled={index === order.length - 1}
                      aria-label={`Move ${CUSTOM_FIELD_LABELS[key]} down`}
                      onClick={() => move(index, 1)}
                    >
                      Move down
                    </button>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="text-xs">
                    Label
                    <input
                      className={input}
                      maxLength={200}
                      value={value.fields?.[key]?.label ?? ""}
                      placeholder={CUSTOM_FIELD_LABELS[key]}
                      onChange={(e) =>
                        field(key, { label: e.target.value || undefined })
                      }
                    />
                  </label>
                  <label className="text-xs">
                    Placeholder / hint
                    <input
                      className={input}
                      maxLength={200}
                      value={value.fields?.[key]?.placeholder ?? ""}
                      placeholder="Use template hint"
                      onChange={(e) =>
                        field(key, { placeholder: e.target.value || undefined })
                      }
                    />
                  </label>
                </div>
                <div className="flex gap-4 text-xs">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={f.visible}
                      disabled={locked}
                      onChange={(e) =>
                        field(key, {
                          visible: e.target.checked,
                          ...(!e.target.checked ? { required: false } : {}),
                        })
                      }
                    />
                    Visible{locked ? " (required contact field)" : ""}
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={f.required}
                      disabled={locked || !f.visible}
                      onChange={(e) =>
                        field(key, { required: e.target.checked })
                      }
                    />
                    Required
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </details>
      <details className="rounded-xl border border-stone-200 p-4">
        <summary className="cursor-pointer text-sm font-medium">
          Order-type options
        </summary>
        <label className="block mt-4 text-sm">
          One option per line (maximum 30)
          <textarea
            className={input + " mt-2"}
            rows={6}
            value={optionsText}
            onChange={(e) => {
              setOptionsText(e.target.value);
              const next = { ...value };
              if (!e.target.value.trim()) delete next.pieceTypeOptions;
              else
                next.pieceTypeOptions = e.target.value
                  .split("\n")
                  .map((x) => x.trim())
                  .filter(Boolean);
              onChange(next);
            }}
            placeholder={"Custom dress\nCustom top\nAlterations"}
          />
        </label>
        <p className="text-xs text-stone-500 mt-2">
          Leave blank to use the template’s choices.
        </p>
      </details>
      <details className="rounded-xl border border-stone-200 p-4">
        <summary className="cursor-pointer text-sm font-medium">
          Process steps
        </summary>
        <p className="text-xs text-stone-500 mt-3">
          Optional explanation of how requests work. Keep template defaults or
          add up to six steps.
        </p>
        <div className="space-y-3 mt-3">
          {value.steps?.map(([title, description], i) => (
            <div className="space-y-2 rounded-xl bg-stone-50 p-3" key={i}>
              <input
                className={input}
                aria-label={`Step ${i + 1} title`}
                placeholder="Step title"
                maxLength={160}
                value={title}
                onChange={(e) =>
                  onChange({
                    ...value,
                    steps: value.steps!.map((step, j) =>
                      j === i ? [e.target.value, step[1]] : step,
                    ),
                  })
                }
              />
              <textarea
                className={input}
                aria-label={`Step ${i + 1} description`}
                placeholder="Step description"
                maxLength={1000}
                value={description}
                onChange={(e) =>
                  onChange({
                    ...value,
                    steps: value.steps!.map((step, j) =>
                      j === i ? [step[0], e.target.value] : step,
                    ),
                  })
                }
              />
              <button
                className="text-xs underline"
                type="button"
                onClick={() =>
                  onChange({
                    ...value,
                    steps: value.steps!.filter((_, j) => j !== i),
                  })
                }
              >
                Remove step
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-3">
          <button
            className="text-sm underline disabled:opacity-30"
            type="button"
            disabled={(value.steps?.length ?? 0) >= 6}
            onClick={() =>
              onChange({ ...value, steps: [...(value.steps ?? []), ["", ""]] })
            }
          >
            Add step
          </button>
          <button
            className="text-sm underline"
            type="button"
            onClick={() => {
              const next = { ...value };
              delete next.steps;
              onChange(next);
            }}
          >
            Use template steps
          </button>
        </div>
      </details>
      <details className="rounded-xl border border-stone-200 p-4">
        <summary className="cursor-pointer text-sm font-medium">
          Confirmation after submission
        </summary>
        <div className="grid gap-4 mt-4">
          {(
            [
              "successHeading",
              "successTitle",
              "successMessage",
            ] as CustomTextKey[]
          ).map(textInput)}
        </div>
      </details>
      <details className="rounded-xl border border-stone-200 p-4">
        <summary className="cursor-pointer text-sm font-medium">
          Preview your form content
        </summary>
        <div className="mt-4 rounded-xl bg-stone-50 p-5 space-y-3">
          <p className="text-xs text-stone-500">
            Content preview — final styling and default wording come from the
            active storefront template.
          </p>
          {value.showForm === false ? (
            <p>The request form is hidden.</p>
          ) : (
            <>
              <small>
                {value.showFormHeading === false
                  ? ""
                  : (value.formHeading ?? "Template form heading")}
              </small>
              <h3 className="text-xl font-semibold">
                {value.formTitle ?? "Template form title"}
              </h3>
              {value.showIntro !== false && (
                <p className="text-sm">
                  {value.formIntro ?? "Template introduction"}
                </p>
              )}
              {order
                .filter((key) => customField(value, key).visible)
                .map((key) => {
                  const f = customField(value, key);
                  return (
                    <label key={key} className="block text-sm">
                      {f.label}
                      {f.required ? " *" : ""}
                      {key === "pieceType" ? (
                        <select disabled className={input}>
                          <option>
                            {f.placeholder ?? "Choose an order type"}
                          </option>
                          {value.pieceTypeOptions?.map((option) => (
                            <option key={option}>{option}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          disabled
                          className={input}
                          placeholder={f.placeholder ?? "Template hint"}
                        />
                      )}
                    </label>
                  );
                })}
              <button
                type="button"
                disabled
                className="rounded-full bg-stone-800 px-6 py-2 text-sm text-white"
              >
                {value.submitLabel ?? "Send request"}
              </button>
            </>
          )}
        </div>
      </details>
      <button
        type="button"
        className="text-xs text-stone-500 underline"
        onClick={() => onChange({})}
      >
        Reset page customization to template defaults (save to apply)
      </button>
    </fieldset>
  );
}
