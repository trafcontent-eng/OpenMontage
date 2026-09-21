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
//   V3BOpen        her clip, original beat: phone call, guy+dog bump her,
//                  coffee/phone/glasses start flying (0-3s of source)
//   V3BHang        real 1x playback of her genuine slow-mo footage: wide
//                  shot of objects hanging in the air, then a macro
//                  close-up of the coffee dripping (source ~3.5-6.3s) —
//                  already shot slow, nothing falls in this stretch
//   V3BReaction    ONE continuous, uncut piece of source (~8.3-10.0s): the
//                  objects land, she looks down, says "Seriously?" (burned
//                  into the source) and throws up her hands — in that real
//                  order, used exactly once (so the caption never
//                  duplicates). "At least ONE thing runs itself." bounces in
//                  near the end — the real "Wasted spend detection" phrase
//                  is reserved for its one appearance later, on-screen.
//   V3BTransition  RGB-split shock + coffee-wipe into the Account Audit
//                  screen, picking up from the exact last frame V3BReaction
//                  ended on
//   V3BAudit       screencast 1 full-bleed, "Wasted spend..." pop
//   V3BHighlight   screencast 2 full-bleed, amber outline pop
//   V3BStats       screencast 2 tail, animated ROAS/Revenue counters
//
// CONFIRMED CHRONOLOGY (client checked the source video's real timestamps,
// not just the text draft of the scenario): bump -> hang/drift in the air
// (already slow-motion footage) -> land -> "Seriously?". This order was
// flipped back and forth a few times mid-build before landing here — the
// one thing that held throughout every version: the ~8.3-10.0s "Seriously?"
// stretch of source is used exactly once, in exactly one composition, so the
// caption never appears twice regardless of where the beat sits.
//
// The final outro card is a separate HyperFrames scene
// (projects/ryze-hyperframes-3/) — deliberately NOT Remotion, per brief.
// ---------------------------------------------------------------------------

const SCREEN_AUDIT = "media/screencast_audit_v3b.mp4"; // trimmed 0-4.2s of file3
const SCREEN_REPORT = "media/screencast_report_v3b.mp4"; // trimmed 8.0-15.867s of file2 (offset 8.0s)
// Freeze base for the coffee-wipe transition — grabbed at her.mp4 t=9.95s,
// the very end of the clip, right where V3BReaction's real playback ends
// (puddle fully landed and spread). (A brief intermediate pass tried the
// original t=8.8s mid-air grab instead, for a structure where the hang
// cutaway came right before this transition — reverted along with that
// ordering change.)
// for a structure where the hang/fall came after "Seriously?" — that order
const HER_FREEZE = "media/her_freeze_end_v3b.png";
const AMBER = "#F5A623"; // brand amber accent — not in shared.tsx's COLORS token set

// ---------------------------------------------------------------------------
// CORRECTION from the coordinator mid-build: the brand logo belongs top-left
// (compact plaque, dark translucent backing) — same spot/size as the
// existing `CornerLogo` in shared.tsx, so every V3B segment below just
// reuses that component directly instead of a bespoke bottom-right one.
//
// The bottom-right corner instead gets a small PIP inset (~28% frame width,
// thin teal ring) playing a live screencast "meanwhile, on her screen"
// window — only while her clip is the foreground layer (Open, Hang,
// Reaction). It is not shown once the screencast itself goes full-bleed.
// ---------------------------------------------------------------------------

// FIX: the PIP previously pulled from SCREEN_AUDIT (screencast_audit_v3b.mp4,
// i.e. file 8a87c3ce-3.mp4). That file's own footage has a two-column layout
// once it scrolls past its first ~1s — the right column is a Slack-style
// "#ryze-ai" thread panel ("Budget Allocation — $82.4K/mo" with a donut
// chart), verified by pulling the frame straight from the original upload,
// not from any separate Slack-demo file (nothing in this project ever
// referenced 6687f874-slack-demo.mp4 — it was this split-column content in
// the approved audit screencast itself). Since the PIP has to stay clean for
// several continuous seconds, it's switched to a fresh trim of file2
// (4a558a58-2.mp4)'s own opening 0-7s, which is a single-column site-builder
// demo with no thread/chat panel anywhere in that range (checked frame by
// frame). The full-bleed Audit segment is untouched — that split-column
// content is fine full-screen where it's clearly the account/audit page;
// it just isn't right for a tiny decorative "meanwhile" inset.
// FIX (round 2): this file's own frames carry a real, physically-recorded
// black bezel — confirmed with `ffmpeg cropdetect`, which reported the exact
// same crop=612:1252:54:22 on every single sampled frame across the whole
// clip. That's a baked-in border from the screencast/phone-mockup capture
// itself, not something a CSS layer can hide — the teal ring drawn in
// PIPInset below was always going to look like it sat on top of a second,
// darker border because that darker border is real pixels in the video.
// FIX (round 3): that first crop only removed the side/bottom bezel margin
// — it left the phone's own status bar (signal/wifi/battery/clock icons, a
// dark-but-not-pure-black strip `cropdetect`'s default threshold didn't
// flag) sitting right above the "Ryze" header, plus a matching dark nav bar
// at the very bottom. Measured both directly (row-by-row average brightness
// scan): status bar ends at source y≈53, nav bar starts at source y≈1202
// (in the original 720x1280 frame). The source file referenced here is now
// cropped with `crop=612:1142:54:56` — combining the side-bezel and status-
// /nav-bar trims into one crop, applied BEFORE anything else touches the
// file — so the whole thing (side bezel + status bar + nav bar) is
// physically gone from the frame; PIPInset's teal border below is the only
// ring anywhere near this footage.
const PIP_SRC = "media/pip_clean_v3b.mp4";

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
  // pip_clean_v3b.mp4 is pre-cropped (see its own comment above) to 612x1142
  // — side bezel AND status/nav bars all physically gone from the file now,
  // not just covered by a CSS layer, so the aspect ratio here matches the
  // CROPPED source, not the original 720x1280.
  const pipHeight = pipWidth * (1142 / 612);

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
          // FIX: the previous pass added `0 0 0 1px rgba(41,126,138,0.5)` as a
          // second box-shadow ring alongside the border, meant as a subtle
          // outer glow — but at small size and video compression, that dark,
          // half-opaque teal ring read as a separate BLACK border sitting
          // just outside the bright teal one ("double border", per client).
          // A single clean border + a plain drop shadow (no colored ring).
          border: `3px solid ${COLORS.accent}`,
          boxShadow: "0 10px 28px rgba(0,0,0,0.5)",
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
// V3BHang — FINAL CONFIRMED ORDER, matching the real footage's own timeline
// (the client confirmed the source video's actual timestamps over the
// earlier text draft of the scenario, which didn't match frame-for-frame).
// Her source, in real chronological order: bump begins (V3BOpen, 0-3s) ->
// things hang/drift in the air, already shot in slow motion (~3.5-8.5s) ->
// they land (~8.5s) -> she reacts, "Seriously?" (~8.84-9.4s). This
// composition is that middle "hang" stretch — two mini-scenes, native 1x
// speed, real decoded frames, back to back, nothing falling in either:
//   ~3.5-5.27s  wide shot, phone/glasses/cup hanging in the air
//   ~5.5-6.27s  macro close-up, coffee slowly dripping off the lid
// Native ambient sound plays (not muted); music stays audible/accented under
// it in the final ffmpeg mix (handled there, not here). V3BReaction below is
// the landing + "Seriously?" that follows it — in that order, once.
// ---------------------------------------------------------------------------

const WIDE_HANG_SRC_START = 3.5; // her.mp4 source seconds
const WIDE_HANG_FRAMES = 53; // ~1.77s (to ~5.27s)
const COFFEE_DRIP_SRC_START = 5.5;
const COFFEE_DRIP_FRAMES = 23; // ~0.77s (to ~6.27s)
export const V3B_HANG_DURATION = WIDE_HANG_FRAMES + COFFEE_DRIP_FRAMES; // ~2.53s, both at native 1x

// A sub-clip that plays at real 1x speed starting partway through this
// composition's own timeline. `startFrom` is a CONSTANT (Remotion adds the
// composition's current frame automatically — see the ZoomVideo note below)
// so to have it read `srcStartSeconds` at the moment THIS sub-clip's local
// time is 0 (i.e. composition frame == `mountedAtFrame`), the constant has
// to be offset backward by `mountedAtFrame`.
const HangSubclip: React.FC<{ srcStartSeconds: number; mountedAtFrame: number; fps: number }> = ({
  srcStartSeconds,
  mountedAtFrame,
  fps,
}) => (
  <OffthreadVideo
    src={staticFile("media/her.mp4")}
    startFrom={Math.round(srcStartSeconds * fps) - mountedAtFrame}
    style={{ width: "100%", height: "100%", objectFit: "cover" }}
  />
);

export const V3BHang: React.FC = () => {
  const frame = useCurrentFrame();
  const inWideHang = frame < WIDE_HANG_FRAMES;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {inWideHang ? (
        <HangSubclip srcStartSeconds={WIDE_HANG_SRC_START} mountedAtFrame={0} fps={30} />
      ) : (
        <HangSubclip srcStartSeconds={COFFEE_DRIP_SRC_START} mountedAtFrame={WIDE_HANG_FRAMES} fps={30} />
      )}
      <PIPInset appearAtFrame={-30} sourceStartSeconds={3.0} />
      <CornerLogoV3B appearAtFrame={-30} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// V3BReaction — the landing + reaction, ONE continuous uncut piece of her
// source (8.3s to the clip's own end, ~10.0s): things actually hit the
// ground, she looks down, says "Seriously?" (burned into the source, no
// overlay added on top of it) and throws up her hands — in that real order,
// used exactly once in the whole video, so the caption never duplicates.
// "At least ONE thing runs itself." bounces in near the end of this clip.
// ---------------------------------------------------------------------------

const REACTION_SRC_START = 8.3; // her.mp4 source seconds
const REACTION_REAL_FRAMES = 52; // ~1.73s of real playback, ends exactly at her.mp4's 10.0s (its last usable frame)
// FIX (round 4): client feedback — "Seriously?" (burned into the source)
// and "At least ONE thing runs itself." were both on/off screen too fast to
// read before the cut into the transition. Real footage runs out at 10.0s,
// so the extra time is a genuine <Freeze> hold on that last frame (not more
// playback — there isn't any left) — the text card's own hold/fade timing
// is stretched to match. +27 frames (~0.9s) — was 52 frames (1.733s), now
// 79 frames (2.633s).
const REACTION_FREEZE_HOLD_FRAMES = 27; // ~0.9s
export const V3B_REACTION_DURATION = REACTION_REAL_FRAMES + REACTION_FREEZE_HOLD_FRAMES; // 79 frames, 2.633s

// FIX (round 2): "WASTED SPEND: FOUND" removed entirely — the client wants
// the real "Wasted spend detection" phrase to appear exactly once, later,
// burned into the actual product screen (V3BAudit's headline), not echoed
// here first. This beat is now a dry, sarcastic punchline instead: "At
// least ONE thing runs itself" — landing right after "Seriously?", playing
// off the chaos she's just been through. "ONE" is the accent word (brand
// teal, bigger), same pop-in mechanic as before (spring bounce + fade).
// FIX (round 4): hold/fade timing now takes an explicit `fadeOutAtFrame`
// (rather than a fixed +14/+20 from atFrame) so it can be stretched to match
// the longer freeze hold in V3BReaction below — both this card and her
// source's own "Seriously?" caption need real time on screen to read.
const OneThingCard: React.FC<{ atFrame: number; fadeOutAtFrame: number }> = ({ atFrame, fadeOutAtFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - atFrame;
  if (local < -2) return null;

  const bounce = spring({ frame: local, fps, config: { damping: 9, stiffness: 200, mass: 0.8 } });
  const fadeOut = interpolate(frame, [fadeOutAtFrame, fadeOutAtFrame + 8], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = Math.min(bounce, fadeOut);

  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: 540, pointerEvents: "none" }}>
      <div
        style={{
          opacity,
          transform: `scale(${interpolate(bounce, [0, 1], [0.55, 1])})`,
          background: `linear-gradient(160deg, ${COLORS.gradTop} 0%, ${COLORS.gradBottom} 100%)`,
          border: `3px solid ${COLORS.accent}`,
          borderRadius: 20,
          padding: "28px 40px",
          maxWidth: 860,
          boxShadow: "0 14px 40px rgba(0,0,0,0.45)",
        }}
      >
        <div
          style={{
            fontFamily: HEADLINE_FONT,
            fontWeight: 800,
            fontSize: 44,
            letterSpacing: 0.5,
            color: COLORS.white,
            textAlign: "center",
            lineHeight: 1.3,
          }}
        >
          At least{" "}
          <span style={{ color: COLORS.accent, fontWeight: 900, fontSize: 60 }}>ONE</span>{" "}
          thing runs itself.
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const V3BReaction: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const video = (
    <OffthreadVideo
      src={staticFile("media/her.mp4")}
      startFrom={Math.round(REACTION_SRC_START * fps)}
      // Audio only plays through the real portion — once <Freeze> holds the
      // last frame (source is out, there's no more footage), muting avoids
      // looping that one audio frame for the extra hold time.
      volume={frame <= REACTION_REAL_FRAMES ? 1 : 0}
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
    />
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {frame <= REACTION_REAL_FRAMES ? video : <Freeze frame={REACTION_REAL_FRAMES}>{video}</Freeze>}
      <OneThingCard atFrame={32} fadeOutAtFrame={REACTION_REAL_FRAMES + REACTION_FREEZE_HOLD_FRAMES - 11} />
      <PIPInset appearAtFrame={-30} sourceStartSeconds={3.0 + V3B_HANG_DURATION / fps} />
      <CornerLogoV3B appearAtFrame={-30} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// V3BTransition — unchanged design throughout all of this (per the
// coordinator: "already works well, don't touch"): a short RGB-split
// "impact" shock, then the spill's footprint on a freeze frame grows into a
// wipe mask that pours the Account Audit screen in underneath. Freeze base
// picks up from the literal last frame V3BReaction ended on (her.mp4 at
// ~10.0s, puddle fully landed and spread), so the cut into this transition
// has no jump backward or forward in time.
// ---------------------------------------------------------------------------

export const V3B_TRANSITION_DURATION = sec(1.0);
const SHOCK_FRAMES = 6; // ~0.2s RGB-split impact
const WIPE_START = 6;
const WIPE_END = 27; // ~0.7s pour/reveal
// Coffee splash centre on the freeze frame — puddle fully landed and spread
// by this point — measured on the 720x1280 source and scaled to the
// 1080x1920 canvas (uniform 1.5x, same aspect ratio as the source — no crop).
const SPILL_CX = 520;
const SPILL_CY = 1620;

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

export const V3BTransition: React.FC = () => {
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

// Client later said not to compress runtime for this — kept at its original
// 3.0s (an earlier pass briefly trimmed this to 2.7s; reverted).
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
      <CornerLogoV3B appearAtFrame={-30} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// 0:08-0:11 — screencast 2 (Audit/Report list), full-bleed. Amber outline
// highlight pops onto the on-screen "Wasted spend detection" row for
// 0.3-0.4s, positioned against the verified on-screen crop of that row.
// ---------------------------------------------------------------------------

// Reverted to its original 3.0s, same reasoning as V3B_AUDIT_DURATION above.
export const V3B_HIGHLIGHT_DURATION = sec(3.0);
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

// (The old separate "return to live video" aftermath beat at the end of the
// timeline is gone — her reaction now plays once, as part of V3BReaction
// above, right after the hang/fall. See the chronology-fix note near the
// top of this file for why.)
