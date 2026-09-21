import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { HerClip, KineticCaption, CornerLogo, sec } from "./shared";

// ---------------------------------------------------------------------------
// Video 2 ("bookend" hybrid) — middle segment only.
//
// Her clip plays whole, untouched, with its original audio. One subtitle
// beat is overlaid at her own clip timing:
//   - "Ryze runs my ads for me" (0.00 - 1.96s, "Ryze" in teal accent)
// The clip's own footage already carries a burned-in "Seriously?" caption
// at 8.84-9.40s (matching the requested wording/timing pixel-for-pixel,
// white bold sans, no italic) — adding a second overlay on top of it would
// just double the text on screen, so segment 2 relies on the source's own
// caption there instead of stacking a duplicate.
// The corner logo plaque is present for the whole segment (this segment IS
// "after the intro" in the full bookend edit).
//
// This composition is rendered standalone via Remotion and concatenated
// after the HyperFrames intro and before the HyperFrames outro/CTA.
// ---------------------------------------------------------------------------

export const VIDEO2_HER_DURATION = sec(10.0); // 10.005s clip, rounded to whole frames

export const Video2Her: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <HerClip startFromSeconds={0} />

      <Sequence from={sec(0)} durationInFrames={sec(1.96) + 6}>
        <KineticCaption
          text="Ryze runs my ads for me"
          atFrame={2}
          accentWords={["Ryze"]}
          fontSize={52}
          bottom={170}
        />
      </Sequence>

      <CornerLogo appearAtFrame={0} />
    </AbsoluteFill>
  );
};
