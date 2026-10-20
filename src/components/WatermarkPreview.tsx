/**
 * Renders what the ZER SDK will draw — same theme/ink rules as
 * public/sdk/v1/licenseguard.js — over a mock client site, so owners can see
 * the result before deploying. Pure/presentational: safe in server or client.
 */

const SIZE: Record<string, number> = { sm: 18, md: 28, lg: 42 };

function inkFor(theme: "light" | "dark") {
  return theme === "dark"
    ? { ink: "255,255,255", halo: "0,0,0", barBg: "rgba(250,248,243,.96)", barText: "#141311" }
    : { ink: "20,19,17", halo: "255,255,255", barBg: "rgba(20,19,17,.94)", barText: "#ffffff" };
}

function esc(s: string) {
  return s.replace(/[<>&"]/g, (ch) =>
    ch === "<" ? "&lt;" : ch === ">" ? "&gt;" : ch === "&" ? "&amp;" : "&quot;",
  );
}

function tiledSvg(
  text: string,
  fontSize: number,
  opacity: number,
  style: string,
  c: ReturnType<typeof inkFor>,
  scale: number,
) {
  const tile = (style === "layer" ? 360 : 300) * scale;
  const rot = style === "layer" ? 0 : -30;
  const halo = Math.min(opacity, 0.35) / 2;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${tile}" height="${tile / 2}">` +
    `<text x="50%" y="50%" fill="rgba(${c.ink},${opacity})" stroke="rgba(${c.halo},${halo})" ` +
    `stroke-width="1" paint-order="stroke" font-family="sans-serif" font-size="${fontSize}" ` +
    `font-weight="800" letter-spacing="2" text-anchor="middle" dominant-baseline="middle" ` +
    `transform="rotate(${rot} ${tile / 2} ${tile / 4})">${esc(text)}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export interface WatermarkPreviewProps {
  style: string;
  theme: string;
  siteTone: "light" | "dark";
  text: string;
  opacity: number;
  size: string;
  placement?: string;
  showContactLink?: boolean;
  contactUrl?: string;
  scale?: number;
  height?: number;
}

export function WatermarkPreview({
  style,
  theme,
  siteTone,
  text,
  opacity,
  size,
  placement = "full",
  showContactLink = true,
  contactUrl,
  scale = 0.6,
  height = 240,
}: WatermarkPreviewProps) {
  const effective: "light" | "dark" =
    theme === "light" || theme === "dark" ? theme : siteTone;
  const c = inkFor(effective);
  const op = Number.isFinite(opacity) ? opacity : 0.2;
  const fs = (SIZE[size] ?? 28) * scale;
  const label = text || "UNPAID PREVIEW";

  const dark = siteTone === "dark";
  const site = {
    bg: dark ? "#14161c" : "#ffffff",
    block: dark ? "#262a33" : "#ece8e0",
    strong: dark ? "#3a3f4b" : "#d8d2c6",
  };

  return (
    <div
      role="img"
      aria-label={`Watermark preview on a ${siteTone} website`}
      style={{
        position: "relative",
        height,
        overflow: "hidden",
        borderRadius: 8,
        border: "1px solid var(--line)",
        background: site.bg,
      }}
    >
      {/* Mock client site */}
      <div style={{ padding: 16, display: "grid", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ width: 22, height: 22, borderRadius: 5, background: site.strong }} />
          <div style={{ display: "flex", gap: 8 }}>
            {[34, 30, 38].map((w) => (
              <div key={w} style={{ width: w, height: 7, borderRadius: 4, background: site.block }} />
            ))}
          </div>
        </div>
        <div style={{ width: "72%", height: 16, borderRadius: 4, background: site.strong, marginTop: 10 }} />
        <div style={{ width: "54%", height: 16, borderRadius: 4, background: site.strong }} />
        <div style={{ width: "80%", height: 7, borderRadius: 4, background: site.block }} />
        <div style={{ width: "64%", height: 7, borderRadius: 4, background: site.block }} />
        <div style={{ width: 84, height: 24, borderRadius: 6, background: site.strong, marginTop: 4 }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 6 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ height: 46, borderRadius: 6, background: site.block }} />
          ))}
        </div>
      </div>

      {/* Watermark overlay — mirrors the SDK */}
      {style === "banner" ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            [placement === "top" ? "top" : "bottom"]: 0,
            background: c.barBg,
            color: c.barText,
            padding: "7px 10px",
            fontSize: 10.5,
            fontWeight: 600,
            letterSpacing: ".02em",
            display: "flex",
            gap: 8,
            justifyContent: "center",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <span>{label}</span>
          {showContactLink && contactUrl ? (
            <span style={{ textDecoration: "underline", fontWeight: 700 }}>Contact to purchase</span>
          ) : null}
        </div>
      ) : style === "center" ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              color: `rgba(${c.ink},${op})`,
              textShadow: `0 0 2px rgba(${c.halo},${Math.min(op, 0.35)})`,
              fontWeight: 800,
              letterSpacing: ".04em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              fontSize: fs * 1.8,
              transform: "rotate(-18deg)",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            {label}
          </div>
        </div>
      ) : (
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            backgroundImage: `url("${tiledSvg(label, fs, op, style, c, scale)}")`,
            backgroundRepeat: "repeat",
            backgroundColor: style === "layer" ? `rgba(${c.halo},.04)` : undefined,
          }}
        />
      )}
    </div>
  );
}
