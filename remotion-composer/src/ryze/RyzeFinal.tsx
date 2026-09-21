import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import {
  HerClip,
  CornerLogo,
  KineticCaption,
  PipOverlay,
  sec,
} from "./shared";

// ---------------------------------------------------------------------------
// Ryze — final hybrid cut, Remotion half.
//
// This project renders as two independent Remotion compositions, each one
// sub-segment of the final concat:
//
//   RyzeSeg1  — 0.000s -> 8.505s  (her clip, clean, subtitle + logo + PIP tail)
//   RyzeSeg3  — 8.505s -> 10.005s of her clip (1.5s), resumed after the
//               HyperFrames "wasted spend" cutaway, PIP head + logo
//
// The HyperFrames engine renders the cutaway (8.5-9.5s), the freeze-frame
// bridge caption (11-12s), the outro counter (12-18s) and the CTA (18-20s).
// ffmpeg concatenates all rendered pieces into the final mp4.
// ---------------------------------------------------------------------------

const SEG1_END = 8.505; // her clip source seconds
const SEG3_START = 8.505; // her clip source seconds (continues exactly where seg1 left off)
const SEG3_END = 10.005; // end of her clip source

export const SEG1_DURATION = sec(SEG1_END); // 255 frames @30fps
export const SEG3_DURATION = sec(SEG3_END - SEG3_START); // 45 frames @30fps

export const RyzeSeg1: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <HerClip startFromSeconds={0} />

      {/* Opening subtitle, 0-1.96s, "Ryze" in teal accent */}
      <Sequence from={0} durationInFrames={sec(1.96)}>
        <KineticCaption
          text="Ryze runs my ads for me"
          atFrame={2}
          accentWords={["ryze"]}
          fontSize={58}
          bottom={230}
        />
      </Sequence>

      {/* Circular PIP overlay: her clip's own source-time 6.0s -> end of this
          segment (8.505s), popping in the first time it appears. */}
      <PipOverlay herSourceTimeAtFrame0={0} withEntrance />

      <CornerLogo appearAtFrame={sec(0.5)} />
    </AbsoluteFill>
  );
};

export const RyzeSeg3: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <HerClip startFromSeconds={SEG3_START} />

      {/* Same circular PIP, continuing seamlessly from seg1 (her source-time
          domain), fading out at 9.5s her-time -> local frame ~30. */}
      <PipOverlay herSourceTimeAtFrame0={SEG3_START} />

      {/* Corner logo has been on screen since 0.5s of the whole video —
          this whole segment starts well past that, so show it from frame 0. */}
      <CornerLogo appearAtFrame={0} />
    </AbsoluteFill>
  );
};
