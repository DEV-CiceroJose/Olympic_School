export function Logo({ className, variant = "default" }) {
  return (
    <span className={className} data-logo-variant={variant}>
      <img
        src="/brand/olympic-school-pdf-logo.png"
        width="786"
        height="258"
        alt="Olympic School"
        className="pdf-logo"
      />
    </span>
  );
}
