export function Logo({
  withText = true,
  size = 28,
}: {
  withText?: boolean;
  size?: number;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        aria-hidden
        className="grid place-items-center rounded-[9px] font-extrabold text-white"
        style={{
          width: size,
          height: size,
          fontSize: size * 0.5,
          background: "linear-gradient(135deg, var(--brand), #8b5cf6)",
          boxShadow: "var(--shadow-brand)",
        }}
      >
        Z
      </span>
      {withText ? (
        <span className="text-[1.05rem] font-bold tracking-tight">ZER</span>
      ) : null}
    </span>
  );
}
