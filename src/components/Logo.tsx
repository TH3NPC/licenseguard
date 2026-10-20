export function Logo({
  withText = true,
  size = 30,
}: {
  withText?: boolean;
  size?: number;
}) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        aria-hidden
        className="grid place-items-center font-serif font-bold"
        style={{
          width: size,
          height: size,
          fontSize: size * 0.62,
          lineHeight: 1,
          border: "1.5px solid var(--ink)",
          borderRadius: 4,
          color: "var(--ink)",
        }}
      >
        Z
      </span>
      {withText ? (
        <span className="font-serif text-[1.35rem] font-bold tracking-[0.18em] leading-none">
          ZER
        </span>
      ) : null}
    </span>
  );
}
