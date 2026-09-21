import React from "react";
import { AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import {
  HerClip,
  BrollFrame,
  KineticCaption,
  CutFlash,
  CornerLogo,
  CountUp,
  CTACard,
  SHOTS,
  COLORS,
  HEADLINE_FONT,
  BODY_FONT,
  sec,
} from "./shared";

// ---------------------------------------------------------------------------
// Variant C — "Параллельный ритм" (cross-cut / split rhythm)
//
// Her clip and b-roll trade places in quick, accelerating bursts through the
// first ~9 seconds (rhythm tightens toward the coffee-drop climax, which gets
// the longest insert with a graphic), then the cutting settles into a calm,
// unhurried b-roll outro before the CTA.
// ---------------------------------------------------------------------------

type Beat =
  | { kind: "her"; startFromSeconds: number; durationFrames: number }
  | { kind: "broll"; shot: keyof typeof SHOTS; durationFrames: number; caption: string; accent?: string[] }
  | { kind: "climax"; durationFrames: number };

const BEATS: Beat[] = [
  { kind: "her", startFromSeconds: 0, durationFrames: sec(1.8) },
  { kind: "broll", shot: "revenueWidget", durationFrames: sec(0.8), caption: "Meet Ryze" },
  { kind: "her", startFromSeconds: 1.8, durationFrames: sec(1.8) },
  { kind: "broll", shot: "wallOfLoveRoas", durationFrames: sec(0.7), caption: "+63% ROAS", accent: ["+63%"] },
  { kind: "her", startFromSeconds: 3.6, durationFrames: sec(1.8) },
  { kind: "broll", shot: "auditWastedSpend", durationFrames: sec(0.6), caption: "Non-stop optimization" },
  { kind: "her", startFromSeconds: 5.4, durationFrames: sec(1.4) },
  { kind: "broll", shot: "creativeCarousel", durationFrames: sec(0.5), caption: "It even makes the ads" },
  { kind: "her", startFromSeconds: 6.8, durationFrames: sec(1.8) },
  { kind: "climax", durationFrames: sec(1.5) },
  { kind: "her", startFromSeconds: 8.6, durationFrames: sec(1.4) },
];

const F_OUTRO = sec(5.0);
const F_CTA = sec(3.0);

// Compute cumulative frame offsets
const offsets: number[] = [];
{
  let acc = 0;
  for (const b of BEATS) {
    offsets.push(acc);
    acc += b.durationFrames;
  }
}
const F_CROSSCUT = offsets[offsets.length - 1] + BEATS[BEATS.length - 1].durationFrames;
const OUTRO_START_F = F_CROSSCUT;
const CTA_START_F = OUTRO_START_F + F_OUTRO;
export const VARIANT_C_DURATION = CTA_START_F + F_CTA;

// First broll beat's start frame — corner logo appears once the rhythm has
// introduced the product for the first time.
const FIRST_BROLL_END_F = offsets[1] + BEATS[1].durationFrames;

export const VariantC: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {BEATS.map((beat, i) => {
        const from = offsets[i];
        if (beat.kind === "her") {
          return (
            <Sequence key={i} from={from} durationInFrames={beat.durationFrames}>
              <HerClip startFromSeconds={beat.startFromSeconds} />
            </Sequence>
          );
        }
        if (beat.kind === "broll") {
          return (
            <Sequence key={i} from={from} durationInFrames={beat.durationFrames}>
              <AbsoluteFill>
                <BrollFrame shot={SHOTS[beat.shot]} />
                <AbsoluteFill
                  style={{ background: "linear-gradient(180deg, rgba(11,42,46,0) 50%, rgba(11,42,46,0.72) 100%)" }}
                />
                <KineticCaption text={beat.caption} atFrame={2} accentWords={beat.accent} fontSize={46} bottom={180} />
              </AbsoluteFill>
            </Sequence>
          );
        }
        return (
          <Sequence key={i} from={from} durationInFrames={beat.durationFrames}>
            <ClimaxBeat />
          </Sequence>
        );
      })}

      {/* A flash on every single cut — the pace itself is the story */}
      {offsets.map((f, i) => (
        <CutFlash key={`cut-${i}`} atFrame={f} strength={i === 9 ? 0.95 : 0.45} spanFrames={i === 9 ? 8 : 4} />
      ))}

      <Sequence from={OUTRO_START_F} durationInFrames={F_OUTRO}>
        <CalmOutro />
      </Sequence>

      <Sequence from={CTA_START_F} durationInFrames={F_CTA}>
        <CTACard />
      </Sequence>

      <CornerLogo appearAtFrame={FIRST_BROLL_END_F} hideAtFrame={CTA_START_F} />
    </AbsoluteFill>
  );
};

const ClimaxBeat: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const punch = spring({ frame, fps, config: { damping: 14, stiffness: 260, mass: 0.7 } });
  const zoomExtra = interpolate(punch, [0, 1], [1.3, 1]);
  const badgeIn = spring({ frame: frame - 8, fps, config: { damping: 12, stiffness: 180 } });

  return (
    <AbsoluteFill style={{ transform: `scale(${zoomExtra})` }}>
      <BrollFrame shot={SHOTS.audienceIssues} punch={false} />
      <AbsoluteFill
        style={{ background: "linear-gradient(180deg, rgba(11,42,46,0.1) 30%, rgba(11,42,46,0.85) 100%)" }}
      />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            opacity: badgeIn,
            transform: `scale(${interpolate(badgeIn, [0, 1], [0.6, 1])})`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}
        >
          <CountUp to={1840} prefix="$" startFrame={8} durationFrames={22} fontSize={110} color={COLORS.accent} />
          <div
            style={{
              fontFamily: BODY_FONT,
              fontWeight: 700,
              fontSize: 30,
              letterSpacing: "0.04em",
              color: COLORS.white,
              textTransform: "uppercase",
            }}
          >
            saved &middot; auto-fixed
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const CalmOutro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const captionIn = spring({ frame: frame - 20, fps, config: { damping: 22 } });

  return (
    <AbsoluteFill>
      <BrollFrame shot={SHOTS.shopifyWide} punch={false} slowDrift />
      <AbsoluteFill
        style={{ background: "linear-gradient(180deg, rgba(11,42,46,0.25) 0%, rgba(11,42,46,0.35) 55%, rgba(11,42,46,0.82) 100%)" }}
      />
      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 220 }}>
        <div
          style={{
            opacity: captionIn,
            transform: `translateY(${interpolate(captionIn, [0, 1], [20, 0])}px)`,
            textAlign: "center",
            fontFamily: HEADLINE_FONT,
            fontWeight: 800,
            fontSize: 52,
            color: COLORS.white,
            maxWidth: "82%",
            lineHeight: 1.3,
          }}
        >
          Now it just runs. <span style={{ color: COLORS.accent }}>Quietly.</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
