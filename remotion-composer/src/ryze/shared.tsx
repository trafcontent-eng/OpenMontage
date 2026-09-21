import React from "react";
import {
  AbsoluteFill,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import { continueRender, delayRender, staticFile } from "remotion";

// ---------------------------------------------------------------------------
// Fonts — self-hosted locally (public/fonts) instead of @remotion/google-fonts.
// The render sandbox's headless Chrome cannot validate fonts.gstatic.com's
// TLS chain through the local egress proxy (ERR_CERT_AUTHORITY_INVALID),
// so fonts fetched at render time fail. Self-hosted @font-face avoids any
// network fetch during render while keeping the same brand typefaces, and
// delayRender/continueRender makes sure the frame isn't captured before the
// local woff2 files are actually decoded (avoids a fallback-font flash).
// ---------------------------------------------------------------------------

// Unique family names (not the bare Google Font names) — several unrelated
// components elsewhere in this bundle also register "Poppins"/"Inter" via
// @remotion/google-fonts pointing at fonts.gstatic.com, which fails to load
// in this sandbox (see fontFaceShim.ts) and was observed to make the browser
// fall back to a default serif for our text too when the family name
// collided. A distinct local family name sidesteps that entirely.
const POPPINS_SRC_FAMILY = "Poppins";
const INTER_SRC_FAMILY = "Inter";
export const HEADLINE_FONT = "RyzeHeadline";
export const BODY_FONT = "RyzeBody";

let fontsInjected = false;
export const ensureRyzeFonts = () => {
  if (fontsInjected || typeof document === "undefined") return;
  fontsInjected = true;

  const weights: Array<[string, string, string]> = [
    [HEADLINE_FONT, POPPINS_SRC_FAMILY, "600"],
    [HEADLINE_FONT, POPPINS_SRC_FAMILY, "700"],
    [HEADLINE_FONT, POPPINS_SRC_FAMILY, "800"],
    [HEADLINE_FONT, POPPINS_SRC_FAMILY, "900"],
    [BODY_FONT, INTER_SRC_FAMILY, "400"],
    [BODY_FONT, INTER_SRC_FAMILY, "500"],
    [BODY_FONT, INTER_SRC_FAMILY, "600"],
    [BODY_FONT, INTER_SRC_FAMILY, "700"],
  ];

  const style = document.createElement("style");
  style.textContent = weights
    .map(
      ([localFam, srcFam, weight]) => `
    @font-face {
      font-family: "${localFam}";
      font-style: normal;
      font-weight: ${weight};
      src: url("${staticFile(`fonts/${srcFam}-${weight}.woff2`)}") format("woff2");
      font-display: block;
    }`
    )
    .join("\n");
  document.head.appendChild(style);

  const handle = delayRender("Loading self-hosted Ryze brand fonts");
  Promise.all(
    weights.map(([localFam, , weight]) =>
      document.fonts
        .load(`${weight} 40px "${localFam}"`)
        .then((res) => {
          // eslint-disable-next-line no-console
          console.log("RYZE_FONT_LOAD_OK", localFam, weight, res.length);
          return res;
        })
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.log("RYZE_FONT_LOAD_FAIL", localFam, weight, String(err));
        })
    )
  )
    .then(() => document.fonts.ready)
    .then(() => {
      // eslint-disable-next-line no-console
      console.log(
        "RYZE_FONTS_READY_SIZE",
        document.fonts.size,
        Array.from(document.fonts as unknown as Iterable<{ family: string; weight: string; status: string }>)
          .map((f) => `${f.family}:${f.weight}:${f.status}`)
          .join(",")
      );
      continueRender(handle);
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.log("RYZE_FONTS_READY_FAIL", String(err));
      continueRender(handle);
    });
};

ensureRyzeFonts();

// ---------------------------------------------------------------------------
// Source assets
// ---------------------------------------------------------------------------

// NOTE: these upload/scratchpad paths live outside this Remotion project, and
// OffthreadVideo's frame-extraction proxy in this installed Remotion version
// can only fetch http(s) URLs (not file://) — see the /proxy download path in
// @remotion/renderer's assets/read-file.js. So instead of resolving them to
// file:// URLs, they are symlinked into public/media/ (see that folder) and
// referenced here as ordinary staticFile()-servable paths.
export const HER_CLIP = "media/her.mp4";
export const MOBILE_SCREENCAST = "media/ryze_mobile_fixed.mp4";
export const SHOPIFY_SCREENCAST = "media/shopify_scroll.mp4";
export const LOGO_MARK = "media/ryze_logo.png";
export const LOGO_LOCKUP_WHITE = "media/lockup_white.png";

// ---------------------------------------------------------------------------
// Brand
// ---------------------------------------------------------------------------

export const COLORS = {
  gradTop: "#297E8A",
  gradBottom: "#3C939D",
  accent: "#4FC3D9",
  white: "#FFFFFF",
  ink: "#0B2A2E",
};

export const TEAL_GRADIENT = `linear-gradient(160deg, ${COLORS.gradTop} 0%, ${COLORS.gradBottom} 100%)`;

export const SPRING_BOUNCE = { damping: 11, stiffness: 140, mass: 0.9 };
export const SPRING_SNAP = { damping: 14, stiffness: 260, mass: 0.7 };
export const SPRING_SOFT = { damping: 20, stiffness: 90, mass: 1 };

// ---------------------------------------------------------------------------
// Persistent corner logo — small plaque with a dark pill so it reads on any
// background, present through the whole video after the intro.
// ---------------------------------------------------------------------------

export const CornerLogo: React.FC<{
  appearAtFrame: number;
  hideAtFrame?: number;
}> = ({ appearAtFrame, hideAtFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - appearAtFrame;
  if (local < -1) return null;
  if (hideAtFrame !== undefined && frame > hideAtFrame) return null;

  const enter = spring({ frame: local, fps, config: SPRING_SNAP });
  const fadeOut =
    hideAtFrame !== undefined
      ? interpolate(frame, [hideAtFrame - 10, hideAtFrame], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 1;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          top: 56,
          left: 44,
          opacity: enter * fadeOut,
          transform: `scale(${interpolate(enter, [0, 1], [0.7, 1])})`,
          transformOrigin: "top left",
          background: "rgba(11, 42, 46, 0.42)",
          backdropFilter: "blur(6px)",
          borderRadius: 14,
          padding: "12px 20px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
        }}
      >
        <Img
          src={staticFile(LOGO_LOCKUP_WHITE)}
          style={{ height: 34, display: "block" }}
        />
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Kinetic caption — words snap in from below with a spring + slight overshoot,
// sitting on a soft dark scrim so it reads over any b-roll footage.
// ---------------------------------------------------------------------------

export const KineticCaption: React.FC<{
  text: string;
  atFrame: number;
  accentWords?: string[];
  fontSize?: number;
  align?: "center" | "left";
  bottom?: number;
}> = ({ text, atFrame, accentWords = [], fontSize = 54, align = "center", bottom = 210 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - atFrame;
  // eslint-disable-next-line no-console
  console.log("RYZE_KINETIC_RENDER", frame, atFrame, local, text, HEADLINE_FONT);
  if (local < -2) return null;

  const words = text.split(" ");

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: align === "center" ? "center" : "flex-start",
        paddingBottom: bottom,
        paddingLeft: align === "left" ? 64 : 0,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: align === "center" ? "center" : "flex-start",
          gap: "0 14px",
          maxWidth: "88%",
          textShadow: "0 4px 18px rgba(0,0,0,0.55)",
        }}
      >
        {words.map((w, i) => {
          const delay = i * 2.5;
          const s = spring({ frame: local - delay, fps, config: SPRING_SNAP });
          const isAccent = accentWords.some(
            (a) => w.toLowerCase().replace(/[^a-z0-9%$]/g, "") === a.toLowerCase()
          );
          return (
            <span
              key={i}
              ref={(el) => {
                if (el && typeof window !== "undefined" && !(window as any).__ryzeFontDebugDone) {
                  (window as any).__ryzeFontDebugDone = true;
                  const cs = window.getComputedStyle(el);
                  // eslint-disable-next-line no-console
                  console.log(
                    "RYZE_COMPUTED_FONT",
                    cs.fontFamily,
                    cs.fontWeight,
                    "check800:",
                    document.fonts.check(`800 40px "${HEADLINE_FONT}"`)
                  );
                }
              }}
              style={{
                display: "inline-block",
                opacity: s,
                transform: `translateY(${interpolate(s, [0, 1], [34, 0])}px) scale(${interpolate(
                  s,
                  [0, 1],
                  [0.85, 1]
                )})`,
                fontFamily: HEADLINE_FONT,
                fontWeight: 800,
                fontSize,
                lineHeight: 1.15,
                color: isAccent ? COLORS.accent : COLORS.white,
              }}
            >
              {w}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// White flash — a quick punch at a cut point.
// ---------------------------------------------------------------------------

export const CutFlash: React.FC<{ atFrame: number; strength?: number; spanFrames?: number }> = ({
  atFrame,
  strength = 0.85,
  spanFrames = 5,
}) => {
  const frame = useCurrentFrame();
  const rel = frame - atFrame;
  if (rel < -1 || rel > spanFrames + 2) return null;
  const t = Math.max(0, Math.min(1, rel / spanFrames));
  const opacity = strength * (1 - t) * (1 - t);
  return (
    <AbsoluteFill
      style={{ backgroundColor: "#fff", opacity, pointerEvents: "none", mixBlendMode: "screen" }}
    />
  );
};

// ---------------------------------------------------------------------------
// B-roll shot — cropped/zoomed still-frame of one of the screencasts, punched
// in on a specific region so the relevant UI reads clearly on a vertical
// canvas. Renders as a zoom-punch entrance (fast scale-settle) by default.
// ---------------------------------------------------------------------------

export type BrollShot = {
  src: string;
  sourceInSeconds: number;
  normX: number; // 0..1 focal point, horizontal
  normY: number; // 0..1 focal point, vertical
  zoom: number; // scale factor applied to the 1080x1920 source
};

export const BrollFrame: React.FC<{
  shot: BrollShot;
  punch?: boolean;
  slowDrift?: boolean;
}> = ({ shot, punch = true, slowDrift = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const punchIn = punch
    ? spring({ frame, fps, config: { damping: 16, stiffness: 220, mass: 0.8 } })
    : 1;
  const extraZoom = punch ? interpolate(punchIn, [0, 1], [1.18, 1]) : 1;
  const drift = slowDrift ? 1 + frame / 6000 : 1;

  const effectiveZoom = shot.zoom * extraZoom * drift;
  const videoW = 1080 * effectiveZoom;
  const videoH = 1920 * effectiveZoom;
  const left = -(shot.normX * 1080 * effectiveZoom - 540);
  const top = -(shot.normY * 1920 * effectiveZoom - 960);

  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "#0b2a2e" }}>
      <OffthreadVideo
        src={staticFile(shot.src)}
        startFrom={Math.round(shot.sourceInSeconds * fps)}
        muted
        style={{
          position: "absolute",
          width: videoW,
          height: videoH,
          left,
          top,
        }}
      />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Named b-roll shots, reused across variants (approximate crops verified
// against extracted reference frames).
// ---------------------------------------------------------------------------

export const SHOTS = {
  wallOfLoveRoas: {
    src: MOBILE_SCREENCAST,
    sourceInSeconds: 20.6,
    normX: 0.42,
    normY: 0.425,
    zoom: 2.1,
  },
  auditWastedSpend: {
    src: MOBILE_SCREENCAST,
    sourceInSeconds: 35.2,
    normX: 0.68,
    normY: 0.565,
    zoom: 2.0,
  },
  revenueWidget: {
    src: SHOPIFY_SCREENCAST,
    sourceInSeconds: 8.7,
    normX: 0.685,
    normY: 0.5,
    zoom: 1.95,
  },
  creativeCarousel: {
    src: SHOPIFY_SCREENCAST,
    sourceInSeconds: 8.7,
    normX: 0.68,
    normY: 0.435,
    zoom: 2.15,
  },
  audienceIssues: {
    src: SHOPIFY_SCREENCAST,
    sourceInSeconds: 15.6,
    normX: 0.68,
    normY: 0.365,
    zoom: 1.95,
  },
  shopifyWide: {
    src: SHOPIFY_SCREENCAST,
    sourceInSeconds: 8.2,
    normX: 0.5,
    normY: 0.5,
    zoom: 1.05,
  },
} satisfies Record<string, BrollShot>;

// ---------------------------------------------------------------------------
// Her clip, at native 720x1280 (9:16, same aspect as the 1080x1920 canvas) —
// scales cleanly to fill with no crop. Audio is preserved (never muted).
// ---------------------------------------------------------------------------

export const HerClip: React.FC<{ startFromSeconds: number }> = ({ startFromSeconds }) => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <OffthreadVideo
        src={staticFile(HER_CLIP)}
        startFrom={Math.round(startFromSeconds * fps)}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Circular picture-in-picture overlay — a small round window (teal ring)
// showing a live Ryze screencast, laid over her clip while it keeps playing
// (not a cutaway). Keyed to her clip's OWN source-time (`herSourceTimeAtFrame0`
// + local frame), so the same window reads as one continuous, uninterrupted
// window across the hard cut into the "wasted spend" cutaway and back.
// ---------------------------------------------------------------------------

export const PIP_HER_START = 6.0; // her clip's own timeline, seconds
export const PIP_HER_END = 9.5;
const PIP_SOURCE_BASE = 2.0; // where in the site-scroll screencast the PIP starts

export const PipOverlay: React.FC<{
  herSourceTimeAtFrame0: number;
  withEntrance?: boolean;
}> = ({ herSourceTimeAtFrame0, withEntrance = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const herTime = herSourceTimeAtFrame0 + frame / fps;
  if (herTime < PIP_HER_START - 0.001 || herTime > PIP_HER_END) return null;

  const sinceStart = herTime - PIP_HER_START;
  const untilEnd = PIP_HER_END - herTime;

  const entrance = withEntrance
    ? spring({ frame: Math.round(sinceStart * fps), fps, config: SPRING_SNAP })
    : 1;
  const edgeFade = Math.min(1, sinceStart / 0.18, untilEnd / 0.18);
  const opacity = Math.max(0, Math.min(entrance, edgeFade));
  const scale = interpolate(entrance, [0, 1], [0.6, 1]);
  const pipVideoTime = PIP_SOURCE_BASE + sinceStart;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          top: 130,
          right: 46,
          width: 300,
          height: 300,
          borderRadius: "50%",
          overflow: "hidden",
          opacity,
          transform: `scale(${scale})`,
          border: `5px solid ${COLORS.accent}`,
          boxShadow: "0 10px 30px rgba(0,0,0,0.5), 0 0 0 2px rgba(11,42,46,0.4)",
          backgroundColor: "#062024",
        }}
      >
        <OffthreadVideo
          src={staticFile(SHOPIFY_SCREENCAST)}
          startFrom={Math.round(pipVideoTime * fps)}
          muted
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Animated count-up — a real motion-graphics counter, not a static number.
// ---------------------------------------------------------------------------

export const CountUp: React.FC<{
  from?: number;
  to: number;
  startFrame: number;
  durationFrames: number;
  prefix?: string;
  suffix?: string;
  format?: (n: number) => string;
  fontSize?: number;
  color?: string;
}> = ({
  from = 0,
  to,
  startFrame,
  durationFrames,
  prefix = "",
  suffix = "",
  format,
  fontSize = 160,
  color = COLORS.white,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = Math.max(0, frame - startFrame);
  const progress = interpolate(local, [0, durationFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const value = from + (to - from) * progress;
  const rounded = Math.round(value);
  const label = format ? format(rounded) : `${prefix}${rounded.toLocaleString("en-US")}${suffix}`;

  const pop = spring({ frame: frame - startFrame, fps, config: SPRING_BOUNCE });

  return (
    <div
      style={{
        fontFamily: HEADLINE_FONT,
        fontWeight: 900,
        fontSize,
        color,
        transform: `scale(${interpolate(pop, [0, 1], [0.9, 1])})`,
        fontVariantNumeric: "tabular-nums",
        textShadow: "0 8px 30px rgba(0,0,0,0.25)",
      }}
    >
      {label}
    </div>
  );
};

// ---------------------------------------------------------------------------
// CTA card — final beat, identical structure across all three variants.
// ---------------------------------------------------------------------------

export const CTACard: React.FC<{ startFrame?: number }> = ({ startFrame = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - startFrame;

  const bgIn = interpolate(local, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const logoSpring = spring({ frame: local, fps, config: SPRING_BOUNCE });
  const line1 = spring({ frame: local - 10, fps, config: SPRING_SNAP });
  const wordAudit = spring({ frame: local - 18, fps, config: SPRING_BOUNCE });
  const line2 = spring({ frame: local - 30, fps, config: SPRING_SOFT });
  const pulse = 1 + Math.sin(Math.max(0, local - 40) / 8) * 0.03;

  return (
    <AbsoluteFill
      style={{
        background: TEAL_GRADIENT,
        opacity: bgIn,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 34, padding: "0 80px" }}>
        <Img
          src={staticFile(LOGO_LOCKUP_WHITE)}
          style={{
            height: 64,
            opacity: logoSpring,
            transform: `translateY(${interpolate(logoSpring, [0, 1], [-18, 0])}px)`,
          }}
        />
        <div
          style={{
            fontFamily: HEADLINE_FONT,
            fontWeight: 800,
            fontSize: 68,
            color: COLORS.white,
            textAlign: "center",
            lineHeight: 1.25,
            opacity: line1,
            transform: `translateY(${interpolate(line1, [0, 1], [24, 0])}px) scale(${pulse})`,
          }}
        >
          Comment{" "}
          <span
            style={{
              color: COLORS.accent,
              opacity: wordAudit,
              display: "inline-block",
              transform: `scale(${interpolate(wordAudit, [0, 1], [0.6, 1])})`,
            }}
          >
            &quot;AUDIT&quot;
          </span>
        </div>
        <div
          style={{
            fontFamily: BODY_FONT,
            fontWeight: 500,
            fontSize: 34,
            color: "rgba(255,255,255,0.92)",
            textAlign: "center",
            lineHeight: 1.5,
            opacity: line2,
            transform: `translateY(${interpolate(line2, [0, 1], [16, 0])}px)`,
            maxWidth: 780,
          }}
        >
          and I&apos;ll find where you&apos;re wasting ad spend.
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const sec = (s: number, fps = 30) => Math.round(s * fps);
