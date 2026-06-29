import { ImageResponse } from "next/og";

export const alt =
  "Budget Friendly — split any amount into your own named splits";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: "#f2f2f2",
          color: "#101014",
          padding: "72px",
          justifyContent: "space-between",
          fontFamily: "sans-serif",
          border: "16px solid #101014",
        }}
      >
        {/* Brand row */}
        <div style={{ display: "flex", alignItems: "center", gap: "22px" }}>
          <div
            style={{
              display: "flex",
              width: "68px",
              height: "68px",
              borderRadius: "16px",
              background: "#101014",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ display: "flex", width: "38px", height: "38px", borderRadius: "50%", border: "6px solid #ffffff" }} />
          </div>
          <div style={{ display: "flex", fontSize: "32px", fontWeight: 700, letterSpacing: "3px" }}>
            BUDGET FRIENDLY
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "flex", fontSize: "84px", fontWeight: 800, lineHeight: 1.04, maxWidth: "960px" }}>
            Split any amount — your way.
          </div>
          <div style={{ display: "flex", fontSize: "34px", color: "#3a3a3a", maxWidth: "880px" }}>
            Carve 100% into the splits that fit your life. The 50/30/20 rule is a starting line, not a cage.
          </div>
        </div>

        {/* Allocation bar */}
        <div style={{ display: "flex", width: "100%", height: "66px", border: "5px solid #101014", overflow: "hidden" }}>
          <div style={{ display: "flex", width: "40%", background: "#ec4899" }} />
          <div style={{ display: "flex", width: "25%", background: "#3b82f6" }} />
          <div style={{ display: "flex", width: "20%", background: "#22c55e" }} />
          <div style={{ display: "flex", width: "15%", background: "#dcdcdc" }} />
        </div>
      </div>
    ),
    { ...size },
  );
}
