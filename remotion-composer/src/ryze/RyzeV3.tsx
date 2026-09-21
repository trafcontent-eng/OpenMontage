import React from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
} from "remotion";
import {
  HerClip,
  TopLeftLogo,
  SitePipInset,
  KineticCaption,
  FullBleedZoomVideo,
  CoffeeToScreenWipe,
  AuditTitleOverlay,
  AmberRowHighlight,
  BounceCallout,
  CountUp,
  COLORS,
  HEADLINE_FONT,
  BODY_FONT,
  SCREENCAST1_AUDIT,
  SCREENCAST2_REPORT,
  SPRING_BOUNCE,
  sec,
} from "./shared";

// ---------------------------------------------------------------------------
// Ryze v3 — "no manual ffmpeg edit" rebuild.
//
// Every animated beat below is a real Remotion composition driven by
// interpolate()/spring() per frame. The 0:16-0:19 outro card is a separate
// HyperFrames (GSAP) render (projects/ryze-hyperframes-v3). ffmpeg is used
// ONLY afterwards, to concat these six already-rendered clips back-to-back
// and mix the ducked music bed — never to draw text or cut her footage.
//
//   RyzeV3Opening  0:00-0:05  (150f)  her clip 0-3s -> her clip "Seriously?"
//                                     8.6-9.6s -> coffee-puddle iris wipe
//   RyzeV3Audit    0:05-0:08  ( 90f)  screencast 1, Account Audit, full-bleed
//   RyzeV3Report   0:08-0:11  ( 90f)  screencast 2, Audit/Report list,
//                                     amber highlight on "Wasted spend..."
//   RyzeV3Results  0:11-0:14  ( 90f)  screencast 2, live results, ROAS/Revenue
//                                     counters
//   RyzeV3Gesture  0:14-0:16  ( 60f)  her clip, post-"Seriously?" slow-mo
//                                     gesture + bounce callout
// ---------------------------------------------------------------------------

export const OPENING_DURATION = sec(5);
export const AUDIT_DURATION = sec(3);
export const REPORT_DURATION = sec(3);
export const RESULTS_DURATION = sec(3);
export const GESTURE_DURATION = sec(2);

// ---------------------------------------------------------------------------
// 0:00 - 0:05
// ---------------------------------------------------------------------------

export const RyzeV3Opening: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Sequence from={0} durationInFrames={sec(3)}>
        <HerClip startFromSeconds={0} />
      </Sequence>

      <Sequence from={sec(3)} durationInFrames={sec(1)}>
        <HerClip startFromSeconds={8.6} />
      </Sequence>

      {/* Coffee-puddle iris wipe -> Account Audit screen, 4-5s */}
      <Sequence from={sec(4)} durationInFrames={sec(1)}>
        <CoffeeToScreenWipe durationInFrames={sec(1)} />
      </Sequence>

      {/* Opening line, "Ryze" in accent. The source clip's own burned-in
          "Seriously?" caption (8.84-9.40s) is reused as-is at 3-4s, same
          approach as the proven Video2Her cut — no duplicate overlay. */}
      <Sequence from={0} durationInFrames={sec(1.96) + 6}>
        <KineticCaption
          text="Ryze runs my ads for me"
          atFrame={2}
          accentWords={["Ryze"]}
          fontSize={54}
          bottom={430}
        />
      </Sequence>

      {/* Small "what's happening at the same time" site inset, bottom-right,
          white ring — only while her clip is the foreground layer. */}
      <SitePipInset src={SCREENCAST2_REPORT} sourceInSeconds={2.0} appearAtFrame={sec(0.7)} />

      <TopLeftLogo appearAtFrame={sec(0.4)} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// 0:05 - 0:08 — Account Audit, full-bleed + kinetic title
// ---------------------------------------------------------------------------

export const RyzeV3Audit: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <FullBleedZoomVideo
        src={SCREENCAST1_AUDIT}
        sourceInSeconds={0}
        normX={0.5}
        normY={0.4746}
        zoomFrom={1.02}
        zoomTo={1.18}
        durationInFrames={AUDIT_DURATION}
      />

      {/* Scrim so the kinetic title reads cleanly over the light UI. */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(11,42,46,0.55) 0%, rgba(11,42,46,0.05) 32%, rgba(11,42,46,0.0) 60%)",
        }}
      />

      <AuditTitleOverlay atFrame={5} />

      <TopLeftLogo appearAtFrame={-30} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// 0:08 - 0:11 — Audit/Report list, amber highlight on "Wasted spend detection"
// ---------------------------------------------------------------------------

export const RyzeV3Report: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <FullBleedZoomVideo
        src={SCREENCAST2_REPORT}
        sourceInSeconds={9.6}
        normX={0.5}
        normY={0.62}
        zoomFrom={1.15}
        zoomTo={1.35}
        durationInFrames={REPORT_DURATION}
      />

      <AmberRowHighlight atFrame={15} spanFrames={11} top={1190} left={24} width={540} height={260} />

      <TopLeftLogo appearAtFrame={-30} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// 0:11 - 0:14 — Live results, ROAS / Revenue animated counters
// ---------------------------------------------------------------------------

const StatRow: React.FC<{
  label: string;
  startFrame: number;
  to: number;
  format: (n: number) => string;
}> = ({ label, startFrame, to, format }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - startFrame;
  const labelSpring = spring({ frame: local, fps, config: SPRING_BOUNCE });
  if (local < -2) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <div
        style={{
          fontFamily: BODY_FONT,
          fontWeight: 700,
          fontSize: 30,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.82)",
          opacity: labelSpring,
          transform: `translateY(${interpolate(labelSpring, [0, 1], [10, 0])}px)`,
        }}
      >
        {label}
      </div>
      <CountUp to={to} startFrame={startFrame + 4} durationFrames={26} format={format} fontSize={104} />
    </div>
  );
};

export const RyzeV3Results: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <FullBleedZoomVideo
        src={SCREENCAST2_REPORT}
        sourceInSeconds={14.0}
        playbackRate={0.35}
        normX={0.5}
        normY={0.4}
        zoomFrom={1.05}
        zoomTo={1.22}
        durationInFrames={RESULTS_DURATION}
      />

      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(11,42,46,0) 42%, rgba(11,42,46,0.55) 66%, rgba(11,42,46,0.86) 100%)",
        }}
      />

      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 210, gap: 56, flexDirection: "row" }}>
        <StatRow label="ROAS" startFrame={8} to={44} format={(n) => `${(n / 10).toFixed(1)}×`} />
        <StatRow
          label="Revenue"
          startFrame={26}
          to={32}
          format={(n) => `$${(n / 10).toFixed(1)}M`}
        />
      </AbsoluteFill>

      <TopLeftLogo appearAtFrame={-30} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// 0:14 - 0:16 — her clip, after "Seriously?", slow-mo gesture + bounce callout
// ---------------------------------------------------------------------------

const HER_CLIP_PATH = "media/her.mp4";

export const RyzeV3Gesture: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <AbsoluteFill>
        <OffthreadVideo
          src={staticFile(HER_CLIP_PATH)}
          startFrom={Math.round(9.4 * fps)}
          playbackRate={0.3}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>

      <BounceCallout text="WASTED SPEND: FOUND" atFrame={6} holdFrames={50} />

      <SitePipInset src={SCREENCAST1_AUDIT} sourceInSeconds={5.0} appearAtFrame={4} />

      <TopLeftLogo appearAtFrame={-30} />
    </AbsoluteFill>
  );
};
