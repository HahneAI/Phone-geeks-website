import { SERVICE_CATEGORIES } from "@/lib/services-data";

export function CategoryNav() {
  return (
    <nav className="sticky top-16 z-30 border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <div className="mx-auto flex max-w-6xl flex-wrap gap-2 px-4 py-3 sm:px-6">
        {SERVICE_CATEGORIES.map((category) => (
          <a
            key={category.slug}
            href={`#${category.slug}`}
            className="shrink-0 rounded-full border border-border px-4 py-1.5 text-sm font-medium text-brand-navy transition-colors hover:border-brand-red/50 hover:bg-brand-red/5 hover:text-brand-red"
          >
            {category.title}
          </a>
        ))}
      </div>
    </nav>
  );
}
