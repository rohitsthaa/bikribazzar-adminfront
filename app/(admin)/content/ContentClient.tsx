import Link from "next/link";

const pages = [
  {
    href: "/content/about",
    title: "About page",
    description: "Tell customers about your store and share your story.",
  },
  {
    href: "/content/custom-orders",
    title: "Custom orders",
    description: "Edit the bespoke enquiry page and its request form.",
  },
];

export default function ContentClient() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {pages.map((page) => (
        <Link
          key={page.href}
          href={page.href}
          className="group rounded-2xl border border-stone-200 bg-white p-5 transition-colors hover:border-[#c96a3a]/50 hover:bg-stone-50"
        >
          <h2 className="font-semibold text-stone-900 group-hover:text-[#c96a3a]">
            {page.title}
          </h2>
          <p className="mt-1 text-sm text-stone-500">{page.description}</p>
          <span className="mt-4 inline-block text-sm font-medium text-[#c96a3a]">
            Manage page →
          </span>
        </Link>
      ))}
    </div>
  );
}
