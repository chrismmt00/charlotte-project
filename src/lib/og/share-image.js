import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { cacheLife } from "next/cache";
import { PHOTOS } from "@/lib/marketing/photos";

// Link-preview images (Open Graph / X cards) for the public pages.
// Light theme to match the site default: headline on the left, a page photo on the right.
// Fonts live in src/assets/og (SIL Open Font License); photos come from the Unsplash
// registry in src/lib/marketing/photos.js and are fetched once, then cached.

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const C = {
  bg: "#fafafa",
  fg: "#0a0a0a",
  muted: "#525252",
  line: "#e5e5e5",
  accent: "#4e85bf",
  accentText: "#37679c",
  accentLight: "#89aacc",
  success: "#2f9e6b",
};

const font = (file) => readFile(join(process.cwd(), "src/assets/og", file));
const FONTS = Promise.all([
  font("InstrumentSerif-Regular.ttf"),
  font("InstrumentSerif-Italic.ttf"),
  font("Inter-Regular.ttf"),
  font("Inter-SemiBold.ttf"),
]).then(([serif, serifItalic, sans, sansBold]) => [
  { name: "Serif", data: serif, style: "normal", weight: 400 },
  { name: "Serif", data: serifItalic, style: "italic", weight: 400 },
  { name: "Sans", data: sans, style: "normal", weight: 400 },
  { name: "Sans", data: sansBold, style: "normal", weight: 600 },
]);

// JPEG data URL for a registry photo, cropped to the slot it fills.
async function photoData(key, width, height) {
  "use cache";
  cacheLife("max");
  const p = PHOTOS[key];
  const url = `https://images.unsplash.com/photo-${p.id}?fm=jpg&fit=crop&crop=faces,entropy&w=${width}&h=${height}&q=70`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Share image photo ${key}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}

function Mark({ px = 52 }) {
  return (
    <div
      style={{
        width: px,
        height: px,
        borderRadius: 999,
        padding: 3,
        display: "flex",
        background: `linear-gradient(135deg, ${C.accentLight}, ${C.accent})`,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 999,
          background: C.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Serif",
          fontStyle: "italic",
          fontSize: px * 0.56,
          color: C.fg,
        }}
      >
        K
      </div>
    </div>
  );
}

// Each word is its own flex item so the headline wraps; words in `em` are italic and blue.
function Headline({ text, em, fontSize }) {
  const bare = (w) => w.replace(/[.,]/g, "").toLowerCase();
  const emWords = new Set((em || "").split(" ").filter(Boolean).map(bare));
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        columnGap: Math.round(fontSize * 0.24),
        fontFamily: "Serif",
        fontSize,
        lineHeight: 1.04,
        letterSpacing: -1.5,
        color: C.fg,
      }}
    >
      {text.split(" ").map((w, i) => {
        const isEm = emWords.has(bare(w));
        return (
          <span
            key={i}
            style={
              isEm ? { fontStyle: "italic", color: C.accentText } : undefined
            }
          >
            {w}
          </span>
        );
      })}
    </div>
  );
}

function headlineSize(text) {
  if (text.length <= 34) return 82;
  if (text.length <= 52) return 72;
  if (text.length <= 66) return 64;
  return 56;
}

/**
 * The K brand mark as a square PNG (browser tab and home-screen icons).
 * `background` fills the square for Apple, which rounds the corners itself.
 */
export async function markIcon(px, background) {
  const fonts = await FONTS;
  const ring = Math.max(2, Math.round(px * 0.075));
  const mark = Math.round(background ? px * 0.72 : px);
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: background || "transparent",
      }}
    >
      <div
        style={{
          width: mark,
          height: mark,
          borderRadius: 999,
          padding: ring,
          display: "flex",
          background: `linear-gradient(135deg, ${C.accentLight}, ${C.accent})`,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 999,
            background: C.bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "Serif",
            fontStyle: "italic",
            fontSize: mark * 0.62,
            lineHeight: 1,
            paddingBottom: mark * 0.04,
            color: C.fg,
          }}
        >
          K
        </div>
      </div>
    </div>,
    { width: px, height: px, fonts },
  );
}

/**
 * @param {object} o
 * @param {string} o.eyebrow  small label above the headline
 * @param {string} o.title    headline, taken from the page
 * @param {string} [o.em]     words of the title to set in italic blue
 * @param {string[]} [o.chips] short facts shown as pills (prices, location)
 * @param {string} [o.photo]  photos.js key for the right-hand photo
 * @param {string[]} [o.mosaic] four photos.js keys, shown as a 2x2 grid instead
 * @param {{label: string, text: string}} [o.float] card laid over the photo
 */
export async function shareImage({
  eyebrow,
  title,
  em,
  chips = [],
  photo,
  mosaic,
  float,
}) {
  const fonts = await FONTS;
  const PHOTO_W = 470;
  const PHOTO_H = 558;
  let media;
  if (mosaic) {
    const tiles = await Promise.all(mosaic.map((k) => photoData(k, 229, 273)));
    media = (
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          width: PHOTO_W,
          height: PHOTO_H,
        }}
      >
        {tiles.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
          <img
            key={i}
            src={src}
            width={229}
            height={273}
            style={{ borderRadius: 24, objectFit: "cover" }}
          />
        ))}
      </div>
    );
  } else {
    const src = await photoData(photo, PHOTO_W, PHOTO_H);
    media = (
      // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
      <img
        src={src}
        width={PHOTO_W}
        height={PHOTO_H}
        style={{ borderRadius: 32, objectFit: "cover" }}
      />
    );
  }

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        background: `radial-gradient(55% 60% at 12% 8%, rgba(137,170,204,.30), transparent 70%), radial-gradient(40% 50% at 60% 100%, rgba(78,133,191,.12), transparent 70%), ${C.bg}`,
        fontFamily: "Sans",
        color: C.fg,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: 694,
          padding: "52px 40px 52px 64px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Mark />
          <div
            style={{
              display: "flex",
              fontSize: 26,
              fontWeight: 600,
              letterSpacing: -0.3,
            }}
          >
            Klyvora Studio
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              fontSize: 17,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: C.accentText,
            }}
          >
            <div style={{ width: 28, height: 2, background: C.accentText }} />
            {eyebrow}
          </div>
          <Headline text={title} em={em} fontSize={headlineSize(title)} />
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {chips.map((c) => (
            <div
              key={c}
              style={{
                display: "flex",
                padding: "10px 18px",
                borderRadius: 999,
                background: "#ffffff",
                border: `1.5px solid ${C.line}`,
                fontSize: 19,
                fontWeight: 600,
                color: C.fg,
              }}
            >
              {c}
            </div>
          ))}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 36,
          right: 36,
          boxShadow: "0 30px 60px -20px rgba(10,10,10,.35)",
          borderRadius: 32,
        }}
      >
        {media}
      </div>
      {float ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            position: "absolute",
            left: 660,
            bottom: 70,
            maxWidth: 510,
            padding: "16px 22px 16px 18px",
            borderRadius: 20,
            background: "#ffffff",
            boxShadow: "0 18px 40px -12px rgba(10,10,10,.30)",
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: 999,
              background: C.success,
              flexShrink: 0,
            }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div
              style={{
                display: "flex",
                fontSize: 13,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: C.muted,
              }}
            >
              {float.label}
            </div>
            <div style={{ display: "flex", fontSize: 21, fontWeight: 600 }}>
              {float.text}
            </div>
          </div>
        </div>
      ) : null}
    </div>,
    { ...size, fonts },
  );
}
