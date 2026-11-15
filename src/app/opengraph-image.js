import { ImageResponse } from "next/og";

export const alt =
  "Klyvora Studio · Custom websites and connected business software";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Default share image for every page: dark ground, blue glow, the headline.
export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px",
        background:
          "radial-gradient(60% 70% at 25% 30%, rgba(78,133,191,.45), transparent 70%), radial-gradient(50% 60% at 80% 75%, rgba(137,170,204,.25), transparent 70%), #0a0a0a",
        color: "#f5f5f5",
        fontFamily: "serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
          fontSize: 28,
          letterSpacing: 6,
          textTransform: "uppercase",
          color: "#b5b5b5",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 999,
            background: "linear-gradient(135deg,#89AACC,#4E85BF)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#0a0a0a",
            fontSize: 30,
            fontStyle: "italic",
          }}
        >
          K
        </div>
        Klyvora · Charlotte, NC
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 104,
          lineHeight: 1,
          fontStyle: "italic",
          letterSpacing: -2,
          maxWidth: 980,
        }}
      >
        A custom website. One connected business.
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 30,
          color: "#b5b5b5",
          fontFamily: "sans-serif",
        }}
      >
        Custom websites · Industry solutions · AI & software · Charlotte, NC
      </div>
    </div>,
    { ...size },
  );
}
