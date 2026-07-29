export function Logo({ className }) {
  return (
    <span className={className}>
      <span className="flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/15 ring-1 ring-primary/30"
        >
          <svg viewBox="0 0 24 24" className="size-5 text-primary" fill="none">
            <path
              d="M4 20c0-8 6-14 16-14 0 10-6 14-12 14H4Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path d="M8 20c2-6 6-9 10-10" stroke="currentColor" strokeWidth="1.6" />
            <circle cx="17" cy="7" r="1.5" fill="currentColor" />
          </svg>
        </span>
        <span className="truncate font-display text-lg font-semibold tracking-tight">
          Biodora<span className="text-primary">IA</span>
        </span>
      </span>
    </span>
  );
}
