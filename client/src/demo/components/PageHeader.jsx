export function PageHeader({ category, title, description, action }) {
  return (
    <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        {category && <div className="eyebrow mb-2">{category}</div>}
        <h1 className="text-[28px] md:text-[36px] font-bold tracking-tight text-cream leading-tight">{title}</h1>
        {description && (
          <p className="mt-3 text-cream/70 max-w-2xl text-[16px] leading-[1.7]">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
