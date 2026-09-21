import React from "react";
import { AbsoluteFill, Img, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { resolveAsset } from "../lib/resolveAsset";
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
  TEAL_GRADIENT,
  HEADLINE_FONT,
  BODY_FONT,
  LOGO_LOCKUP_WHITE,
  SPRING_BOUNCE,
  sec,
} from "./shared";

// ---------------------------------------------------------------------------
// Variant B — "Обрамление" (bookend)
//
// Logo bounces in on brand gradient, a quick b-roll flash teases the product,
// then her clip plays whole and untouched, then an expanded, calmer b-roll
// block (with a hand-drawn revenue counter, not a screenshot) before the CTA.
// ---------------------------------------------------------------------------

const F_INTRO_LOGO = sec(1.2); // 36
const F_INTRO_FLASH = sec(0.8); // 24
const F_INTRO = F_INTRO_LOGO + F_INTRO_FLASH; // 60

const F_HER = sec(10.005); // full clip, untouched

const F_BROLL_WIDE = sec(2.0);
const F_COUNTER = sec(2.5);
const F_BROLL_AUDIT = sec(2.0);
const F_BROLL = F_BROLL_WIDE + F_COUNTER + F_BROLL_AUDIT;

const F_CTA = sec(3.0);

const INTRO_START_F = 0;
const HER_START_F = F_INTRO;
const BROLL_START_F = HER_START_F + F_HER;
const CTA_START_F = BROLL_START_F + F_BROLL;

export const VARIANT_B_DURATION = CTA_START_F + F_CTA;

export const VariantB: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Sequence from={INTRO_START_F} durationInFrames={F_INTRO}>
        <IntroBookend />
      </Sequence>

      <Sequence from={HER_START_F} durationInFrames={F_HER}>
        <HerClip startFromSeconds={0} />
      </Sequence>

      <Sequence from={BROLL_START_F} durationInFrames={F_BROLL}>
        <AbsoluteFill>
          <Sequence from={0} durationInFrames={F_BROLL_WIDE}>
            <AbsoluteFill>
              <BrollFrame shot={SHOTS.shopifyWide} />
              <AbsoluteFill
                style={{ background: "linear-gradient(180deg, rgba(11,42,46,0) 55%, rgba(11,42,46,0.7) 100%)" }}
              />
              <KineticCaption text="Behind the scenes, it never stops" atFrame={4} fontSize={46} bottom={190} />
            </AbsoluteFill>
          </Sequence>
          <Sequence from={F_BROLL_WIDE} durationInFrames={F_COUNTER}>
            <DrawnRevenueCounter />
          </Sequence>
          <Sequence from={F_BROLL_WIDE + F_COUNTER} durationInFrames={F_BROLL_AUDIT}>
            <AbsoluteFill>
              <BrollFrame shot={SHOTS.auditWastedSpend} />
              <AbsoluteFill
                style={{ background: "linear-gradient(180deg, rgba(11,42,46,0) 55%, rgba(11,42,46,0.75) 100%)" }}
              />
              <KineticCaption
                text="It audits every dollar, automatically"
                atFrame={4}
                accentWords={["automatically"]}
                fontSize={44}
                bottom={190}
              />
            </AbsoluteFill>
          </Sequence>
        </AbsoluteFill>
      </Sequence>

      <Sequence from={CTA_START_F} durationInFrames={F_CTA}>
        <CTACard />
      </Sequence>

      <CutFlash atFrame={HER_START_F} strength={0.6} />
      <CutFlash atFrame={BROLL_START_F} strength={0.5} />

      <CornerLogo appearAtFrame={HER_START_F} hideAtFrame={CTA_START_F} />
    </AbsoluteFill>
  );
};

const IntroBookend: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const showFlash = frame >= F_INTRO_LOGO;
  const logoOpacityOut = interpolate(frame, [F_INTRO_LOGO - 6, F_INTRO_LOGO], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const logoScale = spring({ frame, fps, config: SPRING_BOUNCE });
  const wordmarkFade = spring({ frame: frame - 8, fps, config: { damping: 18 } });

  return (
    <AbsoluteFill style={{ background: TEAL_GRADIENT }}>
      {!showFlash && (
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            opacity: logoOpacityOut,
          }}
        >
          <div
            style={{
              transform: `scale(${interpolate(logoScale, [0, 1], [0.5, 1])})`,
              opacity: logoScale,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 18,
            }}
          >
            <Img src={resolveAsset(LOGO_LOCKUP_WHITE)} style={{ height: 96 }} />
            <div
              style={{
                fontFamily: BODY_FONT,
                fontWeight: 600,
                fontSize: 28,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.85)",
                opacity: wordmarkFade,
              }}
            >
              AI ad management
            </div>
          </div>
        </AbsoluteFill>
      )}

      {showFlash && (
        <Sequence from={F_INTRO_LOGO} durationInFrames={F_INTRO_FLASH}>
          <AbsoluteFill>
            <BrollFrame shot={SHOTS.revenueWidget} />
            <AbsoluteFill
              style={{ background: "linear-gradient(180deg, rgba(11,42,46,0) 45%, rgba(11,42,46,0.8) 100%)" }}
            />
            <KineticCaption text="Meet the AI running everything" atFrame={2} fontSize={48} bottom={200} />
          </AbsoluteFill>
        </Sequence>
      )}
    </AbsoluteFill>
  );
};

const DrawnRevenueCounter: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const labelIn = spring({ frame: frame - 4, fps, config: { damping: 20 } });
  const badgeIn = spring({ frame: frame - 40, fps, config: SPRING_BOUNCE });
  const subIn = spring({ frame: frame - 55, fps, config: { damping: 20 } });

  return (
    <AbsoluteFill style={{ background: TEAL_GRADIENT, justifyContent: "center", alignItems: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <div
          style={{
            opacity: labelIn,
            fontFamily: BODY_FONT,
            fontWeight: 700,
            fontSize: 30,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.85)",
            marginBottom: 4,
          }}
        >
          Revenue &middot; last 30 days
        </div>
        <CountUp to={78420} prefix="$" startFrame={8} durationFrames={45} fontSize={150} color={COLORS.white} />
        <div
          style={{
            marginTop: 18,
            opacity: badgeIn,
            transform: `scale(${interpolate(badgeIn, [0, 1], [0.6, 1])})`,
            background: "rgba(255,255,255,0.16)",
            border: `2px solid ${COLORS.accent}`,
            borderRadius: 999,
            padding: "10px 30px",
            fontFamily: HEADLINE_FONT,
            fontWeight: 800,
            fontSize: 40,
            color: COLORS.accent,
          }}
        >
          +86% vs prior 30 days
        </div>
        <div
          style={{
            marginTop: 22,
            opacity: subIn,
            transform: `translateY(${interpolate(subIn, [0, 1], [12, 0])}px)`,
            fontFamily: BODY_FONT,
            fontWeight: 500,
            fontSize: 30,
            color: "rgba(255,255,255,0.9)",
          }}
        >
          on autopilot, while she wasn&apos;t looking
        </div>
      </div>
    </AbsoluteFill>
  );
};
