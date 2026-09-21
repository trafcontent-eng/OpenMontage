import React from "react";
import {
  AbsoluteFill,
  Freeze,
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
//   V3BOpen        0:00-0:03    her clip, original beat, "Ryze runs my ads..."
//   V3BSeriously   0:03-0:04    her clip, "Seriously?" beat (burned-in caption)
//   V3BGlitch      0:04-0:06    real slow-mo (0.35x) of her bullet-time footage,
//                               then RGB-split shock + coffee-wipe transition
//   V3BAudit       0:06-0:08.7  screencast 1 full-bleed, "Wasted spend..." pop
//   V3BHighlight   0:08.7-0:11.4 screencast 2 full-bleed, amber outline pop
//   V3BStats       0:11.4-0:14.4 screencast 2 tail, animated ROAS/Revenue counters
//   V3BWastedFound 0:14.4-0:16.4 her clip aftermath, bounce-in overlay card
//
// (Audit/Highlight trimmed 3.0->2.7s each to pay for the longer slow-mo
// beat, per client request, rather than cutting any block's content.)
//
// The final outro card is a separate HyperFrames scene
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

// Client asked for the top-left logo plaque bigger. Rather than touch
// shared.tsx's CornerLogo (used by the other variant/compositions too),
// wrap it and scale the whole thing up from its own top-left corner — the
// plaque is the only visible content in that AbsoluteFill, so scaling the
// container reads exactly as "the same plaque, just bigger."
const CornerLogoV3B: React.FC<{ appearAtFrame?: number }> = ({ appearAtFrame }) => (
  <div style={{ position: "absolute", inset: 0, transform: "scale(1.4)", transformOrigin: "top left" }}>
    <CornerLogo appearAtFrame={appearAtFrame ?? -30} />
  </div>
);

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
          border: `3px solid ${COLORS.accent}`,
          boxShadow: `0 10px 28px rgba(0,0,0,0.5), 0 0 0 1px rgba(41,126,138,0.5)`,
          backgroundColor: "#0b2a2e",
        }}
      >
        {/* NOTE: OffthreadVideo already advances one source frame per
            composition frame on its own — `startFrom` is only the fixed
            trim-in point, added ONCE. (An earlier pass here manually added
            `frame` on top of it too, which silently doubled playback speed —
            same bug fixed below in ZoomVideo/WastedFound.) */}
        <OffthreadVideo
          src={staticFile(PIP_SRC)}
          startFrom={Math.round(sourceStartSeconds * fps)}
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
          bottom={660}
        />
      </Sequence>
      <PIPInset appearAtFrame={6} sourceStartSeconds={0} />
      <CornerLogoV3B appearAtFrame={sec(0.4)} />
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
      <CornerLogoV3B appearAtFrame={-30} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// 0:04-... — REVISED twice per client feedback. Her source ~3.5-8.5s is not
// normal-speed footage that needs slowing down — it's already shot as a
// genuine slow-motion bullet-time passage (frame-to-frame motion is already
// tiny), cut internally into mini-scenes:
//   ~3.5-5.25s  wide shot, phone/glasses/cup hanging in the air
//   ~5.5-6.25s  macro close-up, coffee slowly dripping off the lid
//   ~6.5-7.5s   macro close-up of the phone screen ("BOSS" incoming call)
//   ~7.5-8.5s   wide shot again, things start actually falling
// Applying an extra playbackRate slowdown on top (an earlier pass here did
// 0.35x) looked broken — over-slowed. This plays the first two mini-scenes
// (wide hang + coffee-drip macro — a nice lead-in to the wipe below) at
// their own native 1x speed, real decoded frames, back to back. The client
// also said not to compress the runtime to pay for this — the video is
// allowed to run longer, so both mini-scenes are used at their full length,
// and the 0:05-0:14 screen blocks are left at their original durations.
//
// After that: the existing (unchanged) coffee-becomes-interface beat — a
// short RGB-split "impact" shock, then the spill's footprint on a freeze
// frame (grabbed at ~8.8s, where the coffee has actually hit the ground)
// grows into a wipe mask that pours the Account Audit screen in underneath.
//
// All per-frame `interpolate`, done in Remotion; ffmpeg never touches this
// transition, only the final concat afterward.
// ---------------------------------------------------------------------------

const WIDE_HANG_SRC_START = 3.5; // her.mp4 source seconds
const WIDE_HANG_FRAMES = 53; // ~1.77s (to ~5.27s)
const COFFEE_DRIP_SRC_START = 5.5;
const COFFEE_DRIP_FRAMES = 23; // ~0.77s (to ~6.27s)
const SLOWMO_FRAMES = WIDE_HANG_FRAMES + COFFEE_DRIP_FRAMES; // ~2.53s total, both at native 1x

export const V3B_GLITCH_DURATION = SLOWMO_FRAMES + sec(1.0); // ~3.53s total
const SHOCK_FRAMES = 6; // ~0.2s RGB-split impact (measured from the END of the slow-mo phase)
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

// A sub-clip that plays at real 1x speed starting partway through this
// composition's own timeline. `startFrom` is a CONSTANT (Remotion adds the
// composition's current frame automatically — see the ZoomVideo note below)
// so to have it read `srcStartSeconds` at the moment THIS sub-clip's local
// time is 0 (i.e. composition frame == `mountedAtFrame`), the constant has
// to be offset backward by `mountedAtFrame`.
const SlowmoSubclip: React.FC<{ srcStartSeconds: number; mountedAtFrame: number; fps: number }> = ({
  srcStartSeconds,
  mountedAtFrame,
  fps,
}) => (
  <OffthreadVideo
    src={staticFile("media/her.mp4")}
    startFrom={Math.round(srcStartSeconds * fps) - mountedAtFrame}
    muted
    style={{ width: "100%", height: "100%", objectFit: "cover" }}
  />
);

export const V3BGlitch: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phase 1: the two mini-scenes, real decoded frames, native 1x speed.
  if (frame < SLOWMO_FRAMES) {
    const inWideHang = frame < WIDE_HANG_FRAMES;
    return (
      <AbsoluteFill style={{ backgroundColor: "#000" }}>
        {inWideHang ? (
          <SlowmoSubclip srcStartSeconds={WIDE_HANG_SRC_START} mountedAtFrame={0} fps={fps} />
        ) : (
          <SlowmoSubclip srcStartSeconds={COFFEE_DRIP_SRC_START} mountedAtFrame={WIDE_HANG_FRAMES} fps={fps} />
        )}
        <PIPInset appearAtFrame={-30} sourceStartSeconds={4.0} />
        <CornerLogoV3B appearAtFrame={-30} />
      </AbsoluteFill>
    );
  }

  // Phase 2 (unchanged design, just re-timed): impact shock + coffee wipe,
  // measured from the moment this phase starts rather than from frame 0.
  const glitchFrame = frame - SLOWMO_FRAMES;

  const shockDecay = interpolate(glitchFrame, [0, SHOCK_FRAMES], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const pulse = glitchFrame < SHOCK_FRAMES ? Math.abs(Math.sin(glitchFrame * 1.9)) : 0;
  const amp = 16 * shockDecay * (0.5 + 0.5 * pulse);

  // Puddle-wipe: radius grows from 0 (exactly the spill footprint) to a size
  // that clears the whole 1080x1920 canvas from that off-centre origin, with
  // a slight per-frame wobble so the edge reads as liquid, not a mechanical
  // circle. A trailing "wet edge" ring (amber-tinted) rides just ahead of it.
  const wipeT = interpolate(glitchFrame, [WIPE_START, WIPE_END], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const wobble = Math.sin(glitchFrame * 1.3) * 10 * (1 - wipeT);
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
          mask shaped like the growing coffee puddle. Pinned to the footage's
          very first frame via <Freeze> (a plain constant `startFrom` still
          auto-advances in Remotion — Freeze is the real way to hold a single
          frame), so the handoff into the next composition, which begins that
          same footage fresh at frame 0, is seamless with no rewind hiccup. */}
      {revealed && (
        <AbsoluteFill style={{ clipPath: `circle(${radius}px at ${SPILL_CX}px ${SPILL_CY}px)` }}>
          <Freeze frame={0}>
            <OffthreadVideo
              src={staticFile(SCREEN_AUDIT)}
              startFrom={0}
              muted
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </Freeze>
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
      <CornerLogoV3B appearAtFrame={-30} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Shared: light programmatic Ken-Burns zoom for a full-bleed video layer.
//
// IMPORTANT Remotion gotcha (cost a debugging pass to find): <OffthreadVideo>
// already advances one source frame per composition frame on its own once
// mounted — `startFrom` is only the fixed trim-in point, not a running
// offset. Adding the current `frame` to it a second time (as an earlier
// version of this file did, to "clamp" a freeze) silently doubled playback
// speed instead. A real, glitch-free freeze needs Remotion's own <Freeze>,
// which pins children's useCurrentFrame() — used below once real playback
// exhausts `playSeconds` of source.
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
  const baseStart = Math.round(startFromSeconds * fps);

  const video = (
    <OffthreadVideo
      src={staticFile(src)}
      startFrom={baseStart}
      muted
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
    />
  );

  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "#0b2a2e" }}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${scale})`, transformOrigin: "center" }}>
        {frame <= playFrames ? video : <Freeze frame={playFrames}>{video}</Freeze>}
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// 0:05-0:08 — Account Audit screencast, full-bleed, light zoom.
// "RYZE AUDIT" small + "Wasted spend detection" big (Wasted = accent), pop-in.
// ---------------------------------------------------------------------------

// Trimmed 3.0 -> 2.7s (client's suggestion: shave ~0.3s off two of the three
// screen blocks to pay for the new slow-mo phase above, rather than cutting
// any one block's content outright). Only the tail hold shortens — the pop-in
// is unaffected since it starts at frame 6.
export const V3B_AUDIT_DURATION = sec(2.7);

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
      <CornerLogoV3B appearAtFrame={-30} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// 0:08-0:11 — screencast 2 (Audit/Report list), full-bleed. Amber outline
// highlight pops onto the on-screen "Wasted spend detection" row for
// 0.3-0.4s, positioned against the verified on-screen crop of that row.
// ---------------------------------------------------------------------------

// Trimmed 3.0 -> 2.7s, same reasoning as V3B_AUDIT_DURATION above. The amber
// highlight pop (frame 30 local) and its fade (done well before frame 81)
// are both unaffected.
export const V3B_HIGHLIGHT_DURATION = sec(2.7);
// screencast_report_v3b.mp4 plays at real 1x from this trim-in point (fixed
// after the ZoomVideo speed bug above), so local frame f shows trimmed
// source frame round(1.7*30)+f = 51+f. Verified frame-by-frame against the
// actual encoded file: source frame ~90 (local ~39) is where "Wasted spend
// detection" sits fully framed, mid-upper screen, scroll settling.
const HIGHLIGHT_SRC_OFFSET = 1.7;
const HIGHLIGHT_POP_AT = 30; // pop completes right as the row settles into frame

// Row crop verified against the actual trimmed source file at that frame
// (720x1280); canvas is 1080x1920 (uniform 1.5x cover scale, no crop).
const ROW_BOX = { left: 120, top: 505, width: 400, height: 185 };

const WastedRowHighlight: React.FC<{ atFrame: number }> = ({ atFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - atFrame;
  if (local < -2) return null;

  const pop = spring({ frame: local, fps, config: { damping: 12, stiffness: 220, mass: 0.7 } });
  // Short flash per brief (~0.3-0.4s pop, brief hold, quick fade) rather than
  // a long hold — the background keeps scrolling under it either way.
  const fadeOut = interpolate(frame, [atFrame + 16, atFrame + 24], [1, 0], {
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
      <CornerLogoV3B appearAtFrame={-30} />
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
          // Raised from 0.55 -> 0.93 opacity + stronger blur: at 0.55 the
          // screencast's own background numbers ("23.3M", stray "$" labels)
          // still showed through and visually fought our big ROAS/Revenue
          // figures. Near-opaque card + thin accent border reads as a clean
          // stat card instead of a translucent overlay.
          background: "rgba(6, 27, 30, 0.93)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(79, 195, 217, 0.28)",
          borderRadius: 26,
          boxShadow: "0 18px 40px rgba(0,0,0,0.4)",
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
      {/* Dim the busy background once the card is up, so the screencast's
          own (different, jittering) numbers don't compete with our card. */}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(4,20,22,0.72) 100%)" }} />
      <StatsCard atFrame={10} />
      <CornerLogoV3B appearAtFrame={-30} />
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

// Her source's own burned-in "Seriously?" caption is still on screen this
// late in the clip (verified frame-by-frame up to ~9.9s, right to the clip's
// 10.005s end) — it sits right over her dark skirt. Rather than re-cut to a
// "clean" later moment (there isn't one; the clip runs out), a dark patch
// tuned to the skirt's own near-black tone quietly covers just that
// footprint. First pass used a radial-gradient fill that was translucent
// enough at its own center to still let the bold white text ghost through —
// this one is a flat, fully OPAQUE core (solid color, not a gradient over
// the text) with the feathering pushed entirely to a soft outer box-shadow,
// so nothing inside the patch is see-through and only the outer few px
// blend into the fabric.
const REPEATED_CAPTION_BOX = { cx: 555, cy: 950, rx: 165, ry: 62 };

const CaptionMask: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <div
      style={{
        position: "absolute",
        left: REPEATED_CAPTION_BOX.cx - REPEATED_CAPTION_BOX.rx,
        top: REPEATED_CAPTION_BOX.cy - REPEATED_CAPTION_BOX.ry,
        width: REPEATED_CAPTION_BOX.rx * 2,
        height: REPEATED_CAPTION_BOX.ry * 2,
        borderRadius: 34,
        backgroundColor: "rgba(9, 9, 11, 1)",
        boxShadow: "0 0 26px 12px rgba(9, 9, 11, 0.9)",
      }}
    />
  </AbsoluteFill>
);

export const V3BWastedFound: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const playFrames = Math.round(WASTED_PLAY_SECONDS * fps);
  const baseStart = Math.round(WASTED_SRC_START * fps);

  const video = (
    <OffthreadVideo
      src={staticFile("media/her.mp4")}
      startFrom={baseStart}
      // Audio only plays through the real (unfrozen) portion — she has no
      // more dialogue here, avoids looping a stray audio frame on freeze.
      volume={frame <= playFrames ? 1 : 0}
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
    />
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {frame <= playFrames ? video : <Freeze frame={playFrames}>{video}</Freeze>}
      <CaptionMask />
      <WastedFoundCard atFrame={16} />
      <PIPInset appearAtFrame={4} sourceStartSeconds={0} />
      <CornerLogoV3B appearAtFrame={-30} />
    </AbsoluteFill>
  );
};
