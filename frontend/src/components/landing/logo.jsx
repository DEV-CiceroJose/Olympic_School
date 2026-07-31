export function Logo({ className }) {
  return (
    <span className={className}>
      <span className="flex items-center gap-2.5">
        <img
          src="/brand/olympic-school-mark.png"
          width="40"
          height="40"
          alt=""
          aria-hidden="true"
          className="size-10 shrink-0 object-contain"
        />
        <span className="truncate font-display text-lg font-semibold tracking-tight">
          Olympic <span className="text-primary">School</span>
        </span>
      </span>
    </span>
  );
}
