const canvas = document.getElementById("map");
let ctx = canvas.getContext("2d", { alpha: false });
let W = 0, H = 0, DPR = 1;
const view = { x: 0, y: 0, scale: 1 };

const VIEWPORT_LIMITS = {
  maxDpr: 2,
  smallWidth: 760,
  shortHeight: 640,
  laptopWidth: 960,
  wideWidth: 1480,
  cinemaRatio: 1.7,
  smallReservedX: 40,
  smallReservedYShort: 170,
  smallReservedY: 235,
  smallScaleShort: 0.86,
  smallScale: 0.92
};

const NOISE_CONFIG = {
  seedX: 127.1,
  seedY: 311.7,
  seedScale: 43758.5453123,
  octaves: 6,
  baseAmplitude: 0.55,
  baseFrequency: 0.008,
  amplitudeDecay: 0.52,
  frequencyGrowth: 2.05
};

const PATHING = {
  routeTangentStep: 0.002,
  pointIntersectEpsilon: 0.00001
};

const PRESENTATION_PROFILES = {
  cinematic: {
    reservedX: 1040,
    reservedY: 120,
    scale: 0.69,
    offsetX: 372,
    offsetY: 12,
    layout: "cinematic"
  },
  wide: {
    reservedX: 920,
    reservedY: 105,
    scale: 0.74,
    offsetX: 332,
    offsetY: 10,
    layout: "wide"
  },
  laptop: {
    reservedX: 860,
    reservedY: 94,
    scale: 0.74,
    offsetX: 320,
    offsetY: 8,
    layout: "laptop"
  },
  compact: {
    reservedX: 420,
    reservedY: 88,
    scale: 0.91,
    offsetX: 135,
    offsetY: 6,
    layout: "compact"
  }
};

function getPresentationProfile(width, height) {
  const aspect = width / Math.max(height, 1);
  if (width >= VIEWPORT_LIMITS.wideWidth && aspect >= VIEWPORT_LIMITS.cinemaRatio) {
    return PRESENTATION_PROFILES.cinematic;
  }
  if (width >= VIEWPORT_LIMITS.wideWidth) return PRESENTATION_PROFILES.wide;
  if (width >= VIEWPORT_LIMITS.laptopWidth) return PRESENTATION_PROFILES.laptop;
  return PRESENTATION_PROFILES.compact;
}
