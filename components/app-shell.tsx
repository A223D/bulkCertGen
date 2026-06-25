import Link from "next/link";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "15px clamp(16px, 4vw, 32px)",
          backdropFilter: "blur(10px)",
          background: "rgba(250,248,243,0.82)",
          borderBottom: "1px solid rgba(231,226,214,0.7)",
          height: 62,
          boxSizing: "border-box",
        }}
      >
        <Link
          href="/"
          style={{ display: "flex", alignItems: "center", gap: 11, textDecoration: "none" }}
        >
          <span
            style={{
              position: "relative",
              width: 32,
              height: 32,
              display: "inline-block",
            }}
            aria-hidden="true"
          >
            <span
              style={{
                position: "absolute",
                inset: 0,
                background: "#F2B01E",
                borderRadius: 9,
                transform: "rotate(-6deg)",
              }}
            />
            <span
              style={{
                position: "absolute",
                left: 7,
                top: 6,
                width: 16,
                height: 20,
                background: "#FFFFFF",
                borderRadius: 3,
                boxShadow: "4px 4px 0 #1A1916",
              }}
            />
          </span>
          <span
            className="hidden sm:inline"
            style={{
              fontWeight: 800,
              fontSize: 16,
              letterSpacing: "-0.02em",
              color: "#1A1916",
            }}
          >
            Batch, <span style={{ color: "#F2B01E", fontStyle: "italic" }}>Please</span>
          </span>
        </Link>

        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          <Link
            href="/legal/privacy"
            className="hidden sm:inline-flex"
            style={{
              color: "#4A463E",
              padding: "8px 12px",
              borderRadius: 8,
              textDecoration: "none",
            }}
          >
            Privacy
          </Link>
          <Link
            href="/#faq"
            className="hidden sm:inline-flex"
            style={{
              color: "#4A463E",
              padding: "8px 12px",
              borderRadius: 8,
              textDecoration: "none",
            }}
          >
            FAQ
          </Link>
          <Link
            href="/"
            style={{
              marginLeft: 6,
              background: "#1A1916",
              color: "#fff",
              padding: "9px 17px",
              borderRadius: 10,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Home
          </Link>
        </nav>
      </header>

      <main>{children}</main>
    </div>
  );
}
