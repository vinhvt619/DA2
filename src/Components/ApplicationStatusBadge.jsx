import { getApplicationStatusMeta } from "../utils/applicationStatus.js";

export default function ApplicationStatusBadge({
  status,
  size = "sm",
  showDot = true,
  className = "",
}) {
  const meta = getApplicationStatusMeta(status);
  const sizeClassName =
    size === "xs"
      ? "px-2 py-0.5 text-[10px]"
      : "px-2.5 py-0.5 text-[11px]";

  return (
    <span
      className={`inline-flex max-w-full shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border font-bold leading-tight ${sizeClassName} ${meta.badgeClassName} ${className}`.trim()}
    >
      {showDot && (
        <span
          aria-hidden="true"
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${meta.dotClassName}`}
        />
      )}
      <span className="truncate">{meta.label}</span>
    </span>
  );
}
