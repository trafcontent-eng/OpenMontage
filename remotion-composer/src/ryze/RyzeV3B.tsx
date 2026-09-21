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
  staticFile,
} from "remotion";
import {
  HerClip,
  KineticCaption,
  CornerLogo,
  COLORS,
  HEADLINE_FONT,
  BODY_FONT,
  SPRING_BOUNCE,
  SPRING_SNAP,
  SPRING_SOFT,
  CountUp,
  sec,
} from "./shared";

// ---------------------------------------------------------------------------
// Ryze — "second independent variant" (V3B), parallel to whatever the other
// agent is building. Everything below is its OWN set of compositions, kept
// out of shared.tsx / RyzeFinal.tsx / Video2Her.tsx so the two variants
// cannot clobber each other's files. Only pure, already-shipped pieces of
// shared.tsx are imported (HerClip, KineticCaption, CountUp, brand tokens) —
// nothing in shared.tsx is modified.
//
// Seven Remotion compositions, concatenated back-to-back by ffmpeg after
// render (ffmpeg here does ONLY the final stitch of pre-rendered segments +
// the music mix — never text/drawtext, never the animation itself):
//
//   V3BOpen        0:00-0:03  her clip, original beat, "Ryze runs my ads..."
//   V3BSeriously   0:03-0:04  her clip, "Seriously?" beat (burned-in caption)
//   V3BGlitch      0:04-0:05  freeze frame + RGB-split glitch transition
//   V3BAudit       0:05-0:08  screencast 1 full-bleed, "Wasted spend..." pop
//   V3BHighlight   0:08-0:11  screencast 2 full-bleed, amber outline pop
//   V3BStats       0:11-0:14  screencast 2 tail, animated ROAS/Revenue counters
//   V3BWastedFound 0:14-0:16  her clip aftermath, bounce-in overlay card
//
// The 0:16-0:19 outro card is a separate HyperFrames scene
// (projects/ryze-hyperframes-3/) — deliberately NOT Remotion, per brief.
// ---------------------------------------------------------------------------

const SCREEN_AUDIT = "media/screencast_audit_v3b.mp4"; // trimmed 0-4.2s of file3
const SCREEN_REPORT = "media/screencast_report_v3b.mp4"; // trimmed 8.0-15.867s of file2 (offset 8.0s)
const HER_FREEZE = "media/her_glitch_freeze_v3b.png"; // still grabbed at her.mp4 t=8.8s
const AMBER = "#F5A623"; // brand amber accent — not in shared.tsx's COLORS token set

// ---------------------------------------------------------------------------
// CORRECTION from the coordinator mid-build: the brand logo belongs top-left
// (compact plaque, dark translucent backing) — same spot/size as the
// existing `CornerLogo` in shared.tsx, so every V3B segment below just
// reuses that component directly instead of a bespoke bottom-right one.
//
// The bottom-right corner instead gets a small PIP inset (~28% frame width,
// thin white ring) playing a live screencast "meanwhile, on her screen"
// window — only while her clip is the foreground layer (0:00-0:05 and
// 0:14-0:16). It is NOT shown 0:05-0:14, where the screencast is already
// full-bleed.
// ---------------------------------------------------------------------------

const PIP_SRC = SCREEN_AUDIT;

export const PIPInset: React.FC<{ appearAtFrame?: number; sourceStartSeconds?: number }> = ({
  appearAtFrame = 0,
  sourceStartSeconds = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const local = frame - appearAtFrame;
  if (local < -2) return null;

  const enter = spring({ frame: local, fps, config: SPRING_SNAP });
  const pipWidth = width * 0.28;
  const pipHeight = pipWidth * (1280 / 720);

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          bottom: 40,
          right: 40,
          width: pipWidth,
          height: pipHeight,
          borderRadius: 22,
          overflow: "hidden",
          opacity: enter,
          transform: `scale(${interpolate(enter, [0, 1], [0.6, 1])})`,
          transformOrigin: "bottom right",
          border: "3px solid rgba(255,255,255,0.9)",
          boxShadow: "0 10px 28px rgba(0,0,0,0.5)",
          backgroundColor: "#0b2a2e",
        }}
      >
        <OffthreadVideo
          src={staticFile(PIP_SRC)}
          startFrom={Math.round(sourceStartSeconds * fps) + Math.max(0, frame)}
          muted
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// 0:00-0:03 — her clip, opening beat, as-is (original audio kept).
// ---------------------------------------------------------------------------

export const V3B_OPEN_DURATION = sec(3.0);

export const V3BOpen: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <HerClip startFromSeconds={0} />
      <Sequence from={0} durationInFrames={sec(1.96) + 8}>
        {/* Caption kept well clear of the bottom 20% (384px of 1920) per brief. */}
        <KineticCaption
          text="Ryze runs my ads for me"
          atFrame={2}
          accentWords={["Ryze"]}
          fontSize={54}
          bottom={460}
        />
      </Sequence>
      <PIPInset appearAtFrame={6} sourceStartSeconds={0} />
      <CornerLogo appearAtFrame={sec(0.4)} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// 0:03-0:04 — the "Seriously?" beat. Source already carries its own burned-in
// caption (verified well above the bottom-20% line), so no overlay added —
// stacking a duplicate caption on top of the source's own would double text.
// ---------------------------------------------------------------------------

export const V3B_SERIOUSLY_DURATION = sec(1.0);
const SERIOUSLY_SRC_START = 8.5; // her.mp4 source seconds

export const V3BSeriously: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <HerClip startFromSeconds={SERIOUSLY_SRC_START} />
      <PIPInset appearAtFrame={-30} sourceStartSeconds={3.0} />
      <CornerLogo appearAtFrame={-30} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// 0:04-0:05 — freeze frame (coffee/phone/glasses caught mid-air). REVISED per
// coordinator's creative note: rather than a generic glitch cut, the spilled
// coffee itself becomes the transition — a short RGB-split "impact" shock
// (~0.2s, real interpolate-driven channel split, kept from the first pass),
// then the puddle's own footprint on the freeze frame grows into a wipe mask
// (animated clip-path circle, frame-driven radius + organic wobble, anchored
// at the coffee's on-screen position) that reveals the Account Audit screen
// pouring in underneath — the interface is a continuation of the spill, not
// a cut after it. All mask/channel math is per-frame `interpolate`, done in
// Remotion; ffmpeg never touches this transition.
// ---------------------------------------------------------------------------

export const V3B_GLITCH_DURATION = sec(1.0);
const SHOCK_FRAMES = 6; // ~0.2s RGB-split impact
const WIPE_START = 6;
const WIPE_END = 27; // ~0.7s pour/reveal
// Coffee splash centre on the freeze frame, measured on the 720x1280 source
// (splash mass under the falling lid/cup) and scaled to the 1080x1920 canvas
// (uniform 1.5x, same aspect ratio as the source — no crop).
const SPILL_CX = 645;
const SPILL_CY = 1600;

const GlitchChannel: React.FC<{ filterId: string; shift: number }> = ({ filterId, shift }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      transform: `translateX(${shift}px)`,
      mixBlendMode: "screen",
      filter: `url(#${filterId})`,
    }}
  >
    <Img src={staticFile(HER_FREEZE)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
  </div>
);

export const V3BGlitch: React.FC = () => {
  const frame = useCurrentFrame();

  const shockDecay = interpolate(frame, [0, SHOCK_FRAMES], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const pulse = frame < SHOCK_FRAMES ? Math.abs(Math.sin(frame * 1.9)) : 0;
  const amp = 16 * shockDecay * (0.5 + 0.5 * pulse);

  // Puddle-wipe: radius grows from 0 (exactly the spill footprint) to a size
  // that clears the whole 1080x1920 canvas from that off-centre origin, with
  // a slight per-frame wobble so the edge reads as liquid, not a mechanical
  // circle. A trailing "wet edge" ring (amber-tinted) rides just ahead of it.
  const wipeT = interpolate(frame, [WIPE_START, WIPE_END], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const wobble = Math.sin(frame * 1.3) * 10 * (1 - wipeT);
  const radius = wipeT * 2500 + wobble;
  const edgeRadius = Math.min(2500, radius + 46);
  const revealed = wipeT > 0.001;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <defs>
          <filter id="chanR">
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" />
          </filter>
          <filter id="chanG">
            <feColorMatrix type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" />
          </filter>
          <filter id="chanB">
            <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" />
          </filter>
        </defs>
      </svg>

      {/* Layer 1 — the freeze frame, always the base. */}
      <Img src={staticFile(HER_FREEZE)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />

      {shockDecay > 0.01 && (
        <>
          <GlitchChannel filterId="chanR" shift={amp} />
          <GlitchChannel filterId="chanG" shift={-amp * 0.6} />
          <GlitchChannel filterId="chanB" shift={-amp} />
          <AbsoluteFill
            style={{
              background:
                "repeating-linear-gradient(0deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 2px, transparent 2px, transparent 5px)",
              opacity: shockDecay * 0.5,
              mixBlendMode: "overlay",
            }}
          />
        </>
      )}

      {/* Layer 2 — the Account Audit screen, poured in through a clip-path
          mask shaped like the growing coffee puddle. Frozen on its own first
          frame (startFrom is frame-independent) so the handoff into the next
          composition, which begins that same footage fresh, is seamless. */}
      {revealed && (
        <AbsoluteFill style={{ clipPath: `circle(${radius}px at ${SPILL_CX}px ${SPILL_CY}px)` }}>
          <OffthreadVideo
            src={staticFile(SCREEN_AUDIT)}
            startFrom={0}
            muted
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </AbsoluteFill>
      )}

      {/* Wet leading edge — a thin amber-tinted ring riding just ahead of the
          reveal radius, selling "liquid" rather than a hard-edged wipe. */}
      {revealed && wipeT < 0.94 && (
        <AbsoluteFill
          style={{
            clipPath: `circle(${edgeRadius}px at ${SPILL_CX}px ${SPILL_CY}px)`,
            WebkitClipPath: `circle(${edgeRadius}px at ${SPILL_CX}px ${SPILL_CY}px)`,
          }}
        >
          <AbsoluteFill
            style={{
              background: `radial-gradient(circle at ${SPILL_CX}px ${SPILL_CY}px, transparent ${Math.max(
                0,
                radius - 4
              )}px, rgba(120,72,28,0.55) ${radius}px, rgba(245,166,35,0.35) ${radius + 22}px, transparent ${
                radius + 60
              }px)`,
            }}
          />
        </AbsoluteFill>
      )}

      <PIPInset appearAtFrame={-30} sourceStartSeconds={4.0} />
      <CornerLogo appearAtFrame={-30} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Shared: light programmatic Ken-Burns zoom for a full-bleed video layer.
// ---------------------------------------------------------------------------

const ZoomVideo: React.FC<{
  src: string;
  startFromSeconds: number;
  playSeconds: number; // real-time seconds to actually play before freezing
  zoomFrom?: number;
  zoomTo?: number;
  totalFrames: number;
}> = ({ src, startFromSeconds, playSeconds, zoomFrom = 1.0, zoomTo = 1.08, totalFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = interpolate(frame, [0, totalFrames], [zoomFrom, zoomTo], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const playFrames = Math.round(playSeconds * fps);
  const clampedFrame = Math.min(frame, playFrames);

  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "#0b2a2e" }}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${scale})`, transformOrigin: "center" }}>
        <OffthreadVideo
          src={staticFile(src)}
          startFrom={Math.round(startFromSeconds * fps) + clampedFrame}
          muted
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// 0:05-0:08 — Account Audit screencast, full-bleed, light zoom.
// "RYZE AUDIT" small + "Wasted spend detection" big (Wasted = accent), pop-in.
// ---------------------------------------------------------------------------

export const V3B_AUDIT_DURATION = sec(3.0);

const AuditHeadline: React.FC<{ atFrame: number }> = ({ atFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - atFrame;
  if (local < -2) return null;

  const label = spring({ frame: local, fps, config: SPRING_SNAP });
  const headline = spring({ frame: local - 8, fps, config: SPRING_BOUNCE });

  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: 1120, pointerEvents: "none" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
          padding: "22px 40px",
          background: "rgba(9, 38, 42, 0.55)",
          backdropFilter: "blur(4px)",
          borderRadius: 22,
          maxWidth: "88%",
        }}
      >
        <div
          style={{
            fontFamily: BODY_FONT,
            fontWeight: 700,
            fontSize: 30,
            letterSpacing: 6,
            color: "rgba(255,255,255,0.82)",
            opacity: label,
            transform: `translateY(${interpolate(label, [0, 1], [16, 0])}px)`,
          }}
        >
          RYZE AUDIT
        </div>
        <div
          style={{
            fontFamily: HEADLINE_FONT,
            fontWeight: 800,
            fontSize: 62,
            lineHeight: 1.15,
            textAlign: "center",
            color: COLORS.white,
            opacity: headline,
            transform: `translateY(${interpolate(headline, [0, 1], [26, 0])}px) scale(${interpolate(
              headline,
              [0, 1],
              [0.85, 1]
            )})`,
            textShadow: "0 6px 22px rgba(0,0,0,0.5)",
          }}
        >
          <span style={{ color: COLORS.accent }}>Wasted</span> spend detection
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const V3BAudit: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <ZoomVideo
        src={SCREEN_AUDIT}
        startFromSeconds={0}
        playSeconds={3.0}
        totalFrames={V3B_AUDIT_DURATION}
        zoomTo={1.07}
      />
      <AuditHeadline atFrame={6} />
      <CornerLogo appearAtFrame={-30} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// 0:08-0:11 — screencast 2 (Audit/Report list), full-bleed. Amber outline
// highlight pops onto the on-screen "Wasted spend detection" row for
// 0.3-0.4s, positioned against the verified on-screen crop of that row.
// ---------------------------------------------------------------------------

export const V3B_HIGHLIGHT_DURATION = sec(3.0);
// screencast_report_v3b.mp4 is trimmed starting at absolute file2 t=8.0s.
const HIGHLIGHT_SRC_OFFSET = 1.7; // -> absolute 9.7s
const HIGHLIGHT_POP_AT = 18; // local frame the amber box pops in (0.6s in)

// Row crop verified against extracted frames at absolute ~10.0-11.0s:
// source is 720x1280, canvas is 1080x1920 (uniform 1.5x cover scale).
const ROW_BOX = { left: 118, top: 655, width: 410, height: 150 };

const WastedRowHighlight: React.FC<{ atFrame: number }> = ({ atFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - atFrame;
  if (local < -2) return null;

  const pop = spring({ frame: local, fps, config: { damping: 12, stiffness: 220, mass: 0.7 } });
  const fadeOut = interpolate(frame, [atFrame + 46, atFrame + 58], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = Math.min(pop, fadeOut);
  const glow = 0.4 + 0.3 * Math.sin(Math.max(0, local - 10) / 4);

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: ROW_BOX.left,
          top: ROW_BOX.top,
          width: ROW_BOX.width,
          height: ROW_BOX.height,
          opacity,
          transform: `scale(${interpolate(pop, [0, 1], [0.9, 1])})`,
          border: `5px solid ${AMBER}`,
          borderRadius: 18,
          boxShadow: `0 0 ${18 + glow * 20}px rgba(245,166,35,${0.55 + glow * 0.2})`,
        }}
      />
    </AbsoluteFill>
  );
};

export const V3BHighlight: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <ZoomVideo
        src={SCREEN_REPORT}
        startFromSeconds={HIGHLIGHT_SRC_OFFSET}
        playSeconds={3.0}
        totalFrames={V3B_HIGHLIGHT_DURATION}
        zoomTo={1.05}
      />
      <WastedRowHighlight atFrame={HIGHLIGHT_POP_AT} />
      <CornerLogo appearAtFrame={-30} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// 0:11-0:14 — screencast 2 tail ("Live results..."), full-bleed, slow
// zoom-in toward the stat rows, plus a real Remotion CountUp overlay for
// ROAS 4.4x / Revenue $3.2M (independent of the source's own live-jittering
// counters — this is the deliberate, settled takeaway number).
// ---------------------------------------------------------------------------

export const V3B_STATS_DURATION = sec(3.0);
const STATS_SRC_OFFSET = 5.6; // -> absolute file2 t=13.6s
const STATS_PLAY_SECONDS = 2.2; // remaining source runs out just after this; rest holds on last frame

const StatsCard: React.FC<{ atFrame: number }> = ({ atFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - atFrame;
  if (local < -2) return null;

  const cardIn = spring({ frame: local, fps, config: SPRING_SOFT });
  const label1 = spring({ frame: local - 6, fps, config: SPRING_SNAP });
  const label2 = spring({ frame: local - 14, fps, config: SPRING_SNAP });

  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: 1080, pointerEvents: "none" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 30,
          padding: "36px 46px",
          background: "rgba(9, 38, 42, 0.55)",
          backdropFilter: "blur(4px)",
          borderRadius: 26,
          opacity: cardIn,
          transform: `translateY(${interpolate(cardIn, [0, 1], [24, 0])}px)`,
          minWidth: 640,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 24, opacity: label1 }}>
          <span style={{ fontFamily: BODY_FONT, fontWeight: 600, fontSize: 34, color: "rgba(255,255,255,0.88)" }}>
            Avg. ROAS
          </span>
          <CountUp
            from={0}
            to={44}
            startFrame={atFrame + 4}
            durationFrames={34}
            format={(n) => `${(n / 10).toFixed(1)}x`}
            fontSize={92}
            color={COLORS.accent}
          />
        </div>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 24, opacity: label2 }}>
          <span style={{ fontFamily: BODY_FONT, fontWeight: 600, fontSize: 34, color: "rgba(255,255,255,0.88)" }}>
            Revenue driven
          </span>
          <CountUp
            from={0}
            to={32}
            startFrame={atFrame + 12}
            durationFrames={34}
            format={(n) => `$${(n / 10).toFixed(1)}M`}
            fontSize={92}
            color={COLORS.white}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const V3BStats: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <ZoomVideo
        src={SCREEN_REPORT}
        startFromSeconds={STATS_SRC_OFFSET}
        playSeconds={STATS_PLAY_SECONDS}
        totalFrames={V3B_STATS_DURATION}
        zoomFrom={1.02}
        zoomTo={1.16}
      />
      {/* Dim the busy background slightly once the card is up, so the numbers read clean. */}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(4,20,22,0.55) 100%)" }} />
      <StatsCard atFrame={10} />
      <CornerLogo appearAtFrame={-30} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// 0:14-0:16 — her clip aftermath (post "Seriously?", hands open). Source runs
// out at 10.005s, so ~0.6s of real footage is played, then held on its last
// frame for the remainder while the "WASTED SPEND: FOUND" card bounces in
// for ~0.5s via spring().
// ---------------------------------------------------------------------------

export const V3B_WASTED_DURATION = sec(2.0);
const WASTED_SRC_START = 9.4; // her.mp4 source seconds
const WASTED_PLAY_SECONDS = 0.6; // -> runs to 10.0s, just before clip end

const WastedFoundCard: React.FC<{ atFrame: number }> = ({ atFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - atFrame;
  if (local < -2 || local > 20) return null;

  const bounce = spring({ frame: local, fps, config: { damping: 9, stiffness: 200, mass: 0.8 } });
  const fadeOut = interpolate(frame, [atFrame + 14, atFrame + 20], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = Math.min(bounce, fadeOut);

  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: 560, pointerEvents: "none" }}>
      <div
        style={{
          opacity,
          transform: `scale(${interpolate(bounce, [0, 1], [0.55, 1])})`,
          background: `linear-gradient(160deg, ${COLORS.gradTop} 0%, ${COLORS.gradBottom} 100%)`,
          border: `3px solid ${AMBER}`,
          borderRadius: 20,
          padding: "26px 40px",
          boxShadow: "0 14px 40px rgba(0,0,0,0.45)",
        }}
      >
        <div
          style={{
            fontFamily: HEADLINE_FONT,
            fontWeight: 900,
            fontSize: 52,
            letterSpacing: 1,
            color: COLORS.white,
            textAlign: "center",
            lineHeight: 1.2,
          }}
        >
          WASTED SPEND:{" "}
          <span style={{ color: AMBER }}>FOUND</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const V3BWastedFound: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const playFrames = Math.round(WASTED_PLAY_SECONDS * fps);
  const clampedFrame = Math.min(frame, playFrames);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <OffthreadVideo
        src={staticFile("media/her.mp4")}
        startFrom={Math.round(WASTED_SRC_START * fps) + clampedFrame}
        // Audio only plays through the real (unfrozen) portion — she has no
        // more dialogue here, avoids looping a stray audio frame on freeze.
        volume={frame <= playFrames ? 1 : 0}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      <WastedFoundCard atFrame={16} />
      <PIPInset appearAtFrame={4} sourceStartSeconds={0} />
      <CornerLogo appearAtFrame={-30} />
    </AbsoluteFill>
  );
};
