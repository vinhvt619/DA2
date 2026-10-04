export default function ResumeTemplateSource({ source }) {
  if (!source) return null;
  return <div className="mt-1 text-[10px] leading-4 text-slate-600">
    <a href={source.previewUrl} target="_blank" rel="noopener noreferrer"
      aria-label={`Tham khảo mẫu ${source.name}`} title={`${source.author} · ${source.license} · Bản chuyển thể React/A4`}
      className="inline-flex min-h-11 items-center gap-1 text-violet-700 underline underline-offset-2 hover:text-violet-900 focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">
      Tham khảo mẫu gốc ↗
    </a>
    <p>{source.author} · <a href={source.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">{source.license}</a></p>
  </div>;
}
