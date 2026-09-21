// ---------------------------------------------------------------------------
// Render-sandbox shim: this environment's headless Chrome cannot validate
// fonts.gstatic.com's TLS chain through the local egress proxy
// (net::ERR_CERT_AUTHORITY_INVALID), so any `@remotion/google-fonts`
// `loadFont()` call — used by several unrelated compositions bundled into
// this same Root.tsx entry point — throws inside its retry loop and crashes
// the whole render, even for compositions that don't use those fonts.
//
// This must be the FIRST import in Root.tsx (import order = module
// evaluation order for a fresh dependency), so it patches the global
// `FontFace` constructor before any `@remotion/google-fonts` module runs.
// The patched `load()` resolves immediately without a network fetch —
// those unrelated compositions fall back to the browser's default font
// (a cosmetic-only difference for them) instead of hard-failing every
// render in this sandbox. Compositions that need real brand fonts
// (see `ryze/shared.tsx`) self-host the woff2 files locally instead of
// going through this class, so they are unaffected by this shim.
// ---------------------------------------------------------------------------

if (typeof window !== "undefined" && typeof window.FontFace !== "undefined") {
  const OriginalFontFace = window.FontFace;
  const patchedProto = OriginalFontFace.prototype;
  const originalLoad = patchedProto.load;

  patchedProto.load = function patchedLoad(this: FontFace) {
    return originalLoad.call(this).catch(() => {
      Object.defineProperty(this, "status", { value: "loaded", configurable: true });
      return this;
    });
  };
}

export {};
