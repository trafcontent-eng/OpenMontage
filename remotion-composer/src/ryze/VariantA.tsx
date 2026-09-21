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
  sec,
} from "./shared";

// ---------------------------------------------------------------------------
// Variant A — "Кульминационный разрыв" (insert on climax)
//
// Her clip plays clean to the coffee-drop, a hard zoom-punch cut throws us
// into a fast b-roll burst (4 proof beats), then we snap back to her clip for
// the "Seriously?" punchline, and close on an animated revenue counter + CTA.
// ---------------------------------------------------------------------------

const HER_1_END = 8.6; // seconds into her source clip — right before the coffee hits
const HER_2_START = 8.84; // "Seriously?" line
const HER_2_END = 10.005;

const F_HER1 = sec(HER_1_END); // 258
const BROLL_SHOT_FRAMES = sec(1.1); // 33
const F_BROLL = BROLL_SHOT_FRAMES * 4; // 132
const F_HER2 = sec(HER_2_END - HER_2_START); // ~35
const F_OUTRO = sec(5.5); // 165
const F_CTA = sec(3.0); // 90

const HER1_START_F = 0;
const BROLL_START_F = F_HER1;
const HER2_START_F = BROLL_START_F + F_BROLL;
const OUTRO_START_F = HER2_START_F + F_HER2;
const CTA_START_F = OUTRO_START_F + F_OUTRO;

export const VARIANT_A_DURATION = CTA_START_F + F_CTA;

const BROLL_BEATS = [
  { shot: SHOTS.wallOfLoveRoas, caption: "Real clients. +63% ROAS.", accent: ["+63%", "roas."] },
  { shot: SHOTS.auditWastedSpend, caption: "AI finds the leaks", accent: ["ai"] },
  { shot: SHOTS.revenueWidget, caption: "+86% revenue growth", accent: ["+86%"] },
  { shot: SHOTS.audienceIssues, caption: "$1,840 saved. Automatically.", accent: ["$1,840"] },
];

export const VariantA: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* Beat 1 — her clip, clean, untouched, up to the coffee drop */}
      <Sequence from={HER1_START_F} durationInFrames={F_HER1}>
        <HerClip startFromSeconds={0} />
      </Sequence>

      {/* Beat 2 — b-roll burst, four fast proof beats */}
      <Sequence from={BROLL_START_F} durationInFrames={F_BROLL}>
        <AbsoluteFill>
          {BROLL_BEATS.map((beat, i) => (
            <Sequence key={i} from={i * BROLL_SHOT_FRAMES} durationInFrames={BROLL_SHOT_FRAMES}>
              <AbsoluteFill>
                <BrollFrame shot={beat.shot} />
                <AbsoluteFill
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(11,42,46,0) 55%, rgba(11,42,46,0.75) 100%)",
                  }}
                />
                <KineticCaption text={beat.caption} atFrame={4} accentWords={beat.accent} fontSize={50} bottom={190} />
              </AbsoluteFill>
            </Sequence>
          ))}
        </AbsoluteFill>
      </Sequence>

      {/* Beat 3 — snap back to her for the punchline */}
      <Sequence from={HER2_START_F} durationInFrames={F_HER2}>
        <HerClip startFromSeconds={HER_2_START} />
      </Sequence>

      {/* Beat 4 — outro: b-roll + real motion-graphics revenue counter */}
      <Sequence from={OUTRO_START_F} durationInFrames={F_OUTRO}>
        <OutroCounter />
      </Sequence>

      {/* Beat 5 — CTA */}
      <Sequence from={CTA_START_F} durationInFrames={F_CTA}>
        <CTACard />
      </Sequence>

      {/* Cut punctuation */}
      <CutFlash atFrame={BROLL_START_F} strength={0.9} />
      <CutFlash atFrame={HER2_START_F} strength={0.7} />

      <CornerLogo appearAtFrame={BROLL_START_F} hideAtFrame={OUTRO_START_F + F_OUTRO} />
    </AbsoluteFill>
  );
};

const OutroCounter: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const captionIn = spring({ frame: frame - 8, fps, config: { damping: 20 } });
  const subIn = spring({ frame: frame - 70, fps, config: { damping: 20 } });

  return (
    <AbsoluteFill>
      <BrollFrame shot={SHOTS.revenueWidget} slowDrift />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(11,42,46,0.55) 0%, rgba(11,42,46,0.35) 40%, rgba(11,42,46,0.82) 100%)",
        }}
      />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <div
            style={{
              opacity: captionIn,
              fontFamily: "Inter, system-ui, sans-serif",
              fontWeight: 700,
              fontSize: 32,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: COLORS.white,
              marginBottom: 6,
            }}
          >
            Revenue, last 30 days
          </div>
          <CountUp
            to={86}
            prefix="+"
            suffix="%"
            startFrame={20}
            durationFrames={55}
            fontSize={190}
            color={COLORS.accent}
          />
          <div
            style={{
              opacity: subIn,
              transform: `translateY(${interpolate(subIn, [0, 1], [14, 0])}px)`,
              fontFamily: "Inter, system-ui, sans-serif",
              fontWeight: 500,
              fontSize: 34,
              color: "rgba(255,255,255,0.92)",
              marginTop: 6,
            }}
          >
            while she was on the phone
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
