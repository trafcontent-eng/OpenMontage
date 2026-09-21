import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { HerClip, KineticCaption, CornerLogo, sec } from "./shared";

// ---------------------------------------------------------------------------
// Video 2 ("bookend" hybrid) — middle segment only.
//
// Her clip plays whole, untouched, with its original audio. Two subtitle
// beats are overlaid at her own clip timing:
//   - "Ryze runs my ads for me" (0.00 - 1.96s, "Ryze" in teal accent)
//   - "Seriously?" (8.84 - 9.40s)
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

      <Sequence from={sec(8.84)} durationInFrames={sec(9.4 - 8.84) + 10}>
        <KineticCaption text="Seriously?" atFrame={0} fontSize={58} bottom={170} />
      </Sequence>

      <CornerLogo appearAtFrame={0} />
    </AbsoluteFill>
  );
};
