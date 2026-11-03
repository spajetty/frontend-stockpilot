export default function PagePlaceholder({ title }: { title: string }) {
  return (
    <div>
      <p className="text-sm text-slate-500">
        Workspace <span className="mx-1.5 text-slate-300">&rsaquo;</span>
        <span className="text-slate-900">{title}</span>
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
    </div>
  );
}