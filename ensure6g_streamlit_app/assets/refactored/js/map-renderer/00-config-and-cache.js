const MAP_BREAKPOINTS = {
  lakeLabels: 900,
  stationLabels: 760,
  stationHierarchy: 900,
  weatherLabels: 760,
  mapLabels: 850,
  transferPanel: 900,
  trainCallout: 820,
  controlCenter: 760
};

const TRAIN_RENDER = {
  minScale: 0.64,
  maxScale: 1.16,
  scaleMultiplier: 1.48,
  carX: -20,
  carY: -6,
  carWidth: 40,
  carHeight: 12,
  carRadius: 4,
  headlightX: 15,
  headlightRadius: 2.3,
  normalShadow: 12,
  warningShadow: 16,
  safeShadow: 18,
  labelOffsetY: 44
};

const MAP_ANIMATION = {
  weatherPulseRate: 0.0025,
  weatherPulseAmount: 0.08,
  sensorPulseRate: 0.003,
  focusPulseRate: 0.004,
  hotspotPulseRate: 0.006,
  semanticPacketRate: 0.0018,
  heroMarkerRate: 0.0012,
  scanlineRate: 0.035
};

const RENDER_BUDGET = {
  targetFrameMs: 1000 / 30
};

const MAP_STAGE_PROFILES = {
  mission: {
    railway: true,
    heroCorridor: true,
    telecom: "primary",
    communicationChain: true,
    train: true,
    focus: true
  },
  sensing: {
    railway: true,
    heroCorridor: false,
    telecom: "sensor",
    communicationChain: false,
    train: true,
    focus: true
  },
  fusion: {
    railway: false,
    heroCorridor: false,
    telecom: "primary",
    communicationChain: true,
    train: false,
    focus: true
  },
  constraint: {
    railway: false,
    heroCorridor: false,
    telecom: "primary",
    communicationChain: true,
    train: true,
    focus: false
  },
  decision: {
    railway: false,
    heroCorridor: false,
    telecom: "primary",
    communicationChain: true,
    train: true,
    focus: true
  },
  outcome: {
    railway: true,
    heroCorridor: true,
    telecom: false,
    communicationChain: false,
    train: true,
    focus: true
  }
};

const gatewayById = Object.fromEntries(edgeGateways.map(gateway => [gateway.id, gateway]));
const baseStationById = Object.fromEntries(baseStations.map(station => [station.id, station]));
const majorCityEntries = Object.entries(cities).filter(([name]) => majorStationsOnly.has(name));
const renderLayers = {
  base: { key: "", canvas: null, ctx: null },
  stage: { key: "", canvas: null, ctx: null },
  overlay: { key: "", canvas: null, ctx: null }
};
let frameNow = performance.now();
let lastRenderAt = -Infinity;

function useLayerContext(layer, drawFn) {
  const previousCtx = ctx;
  ctx = layer.ctx;
  try {
    drawFn();
  } finally {
    ctx = previousCtx;
  }
}

function ensureLayerCanvas(layer) {
  const resized = !layer.canvas || layer.canvas.width !== canvas.width || layer.canvas.height !== canvas.height;
  if (!resized) return;
  layer.canvas = document.createElement("canvas");
  layer.canvas.width = canvas.width;
  layer.canvas.height = canvas.height;
  layer.ctx = layer.canvas.getContext("2d", { alpha: true });
  layer.ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  layer.key = "";
}

function drawCachedLayer(layer) {
  if (!layer.canvas) return;
  ctx.drawImage(layer.canvas, 0, 0, W, H);
}

function baseLayerKey() {
  return [
    W,
    H,
    DPR,
    document.body.dataset.layout || "",
    view.scale.toFixed(4),
    view.x.toFixed(2),
    view.y.toFixed(2)
  ].join(":");
}

function stageLayerKey(profile) {
  return `${baseLayerKey()}:${demoState.stage}:${profile.railway ? "rail" : "plain"}`;
}

function overlayLayerKey() {
  const dividerX = parseFloat(getComputedStyle(document.body).getPropertyValue("--ux-divider-x")) || 0;
  return `${baseLayerKey()}:${demoState.stage}:${demoState.season || "winter"}:${demoState.network || "default"}:${dividerX.toFixed(1)}`;
}

function rebuildBaseLayerIfNeeded() {
  ensureLayerCanvas(renderLayers.base);
  const key = baseLayerKey();
  if (renderLayers.base.key === key) return;
  renderLayers.base.key = key;
  useLayerContext(renderLayers.base, () => {
    ctx.clearRect(0, 0, W, H);
    drawSea();
    drawNeighbors();
    drawSweden();
    lakes.forEach(drawLake);
    drawMapLabels();
  });
}

function rebuildStageLayerIfNeeded(profile) {
  ensureLayerCanvas(renderLayers.stage);
  const key = stageLayerKey(profile);
  if (renderLayers.stage.key === key) return;
  renderLayers.stage.key = key;
  useLayerContext(renderLayers.stage, () => {
    ctx.clearRect(0, 0, W, H);
    if (profile.railway) drawRailwayTopology();
  });
}

function rebuildOverlayLayerIfNeeded() {
  ensureLayerCanvas(renderLayers.overlay);
  const key = overlayLayerKey();
  if (renderLayers.overlay.key === key) return;
  renderLayers.overlay.key = key;
  useLayerContext(renderLayers.overlay, () => {
    ctx.clearRect(0, 0, W, H);
    majorCityEntries.forEach(([name, city]) => drawCity(name, city));
    drawMapStoryPanel();
    drawCommunicationPathPanel();
  });
}
