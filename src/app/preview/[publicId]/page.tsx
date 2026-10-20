import Script from "next/script";
import { getAppBaseUrl } from "@/lib/app-url";

export const metadata = {
  title: "Live preview",
  robots: { index: false, follow: false },
};

/**
 * Hosted live preview — a sample "client website" that embeds the ZER SDK for a
 * given public project id. Because it's served from the app's own origin (which
 * the license API auto-allows), you can SEE a project's watermark online
 * without deploying a separate site. While the project is unpaid, the watermark
 * shows; activate the license and it lifts.
 */
export default async function PreviewPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  const base = await getAppBaseUrl();

  return (
    <div style={{ background: "#fafaf9", color: "#1c1917", minHeight: "100dvh" }}>
      <div
        style={{
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          maxWidth: 820,
          margin: "0 auto",
          padding: "0 24px",
        }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 0",
            borderBottom: "1px solid #e7e5e4",
          }}
        >
          <strong style={{ fontSize: 18 }}>Acme Studio</strong>
          <nav style={{ display: "flex", gap: 20, fontSize: 14, color: "#57534e" }}>
            <a href="#work">Work</a>
            <a href="#about">About</a>
            <a href="#contact" className="buy">Hire us</a>
          </nav>
        </header>

        <section style={{ padding: "72px 0 32px" }}>
          <h1 style={{ fontSize: 44, lineHeight: 1.1, margin: 0, letterSpacing: "-0.02em" }}>
            Beautiful websites, built fast.
          </h1>
          <p style={{ fontSize: 18, color: "#57534e", maxWidth: "46ch", marginTop: 16 }}>
            This is a sample client website rendered by ZER so you can see the
            unpaid-preview watermark live. Activate this project&apos;s license in
            your dashboard and reload — the watermark lifts.
          </p>
          <div style={{ marginTop: 28, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a
              href="#contact"
              style={{
                padding: "12px 20px",
                borderRadius: 10,
                background: "#1c1917",
                color: "#fff",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Start a project
            </a>
            <a
              href="#work"
              data-lg-allow="1"
              style={{
                padding: "12px 20px",
                borderRadius: 10,
                border: "1px solid #d6d3d1",
                color: "#1c1917",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              View work
            </a>
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            paddingBottom: 80,
          }}
        >
          {["Branding", "Web design", "Development"].map((t) => (
            <div
              key={t}
              style={{
                border: "1px solid #e7e5e4",
                borderRadius: 12,
                padding: 20,
                background: "#fff",
              }}
            >
              <h3 style={{ margin: 0 }}>{t}</h3>
              <p style={{ color: "#57534e", marginTop: 8, fontSize: 14 }}>
                Crafted work that converts, delivered on time.
              </p>
            </div>
          ))}
        </section>
      </div>

      {/* The ZER SDK — the only line a real client site needs. */}
      <Script
        src={`${base}/sdk/v1/licenseguard.js`}
        strategy="afterInteractive"
        data-project-id={publicId}
        data-api={base}
      />
    </div>
  );
}
