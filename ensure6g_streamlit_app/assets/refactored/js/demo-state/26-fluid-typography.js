const FLUID_TYPE_LIMITS = {
  minScale: 0.88,
  maxScale: 1.26,
  minMapScale: 0.9,
  maxMapScale: 1.18
};

function clampNumber(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function currentStageRailBounds() {
  const width = currentRailWidth()
    || parseFloat(getComputedStyle(document.body).getPropertyValue("--ux-rail-width"))
    || 0;
  return clampNumber(width, 380, 880);
}

function currentMapBounds() {
  const dividerX = parseFloat(getComputedStyle(document.body).getPropertyValue("--ux-divider-x")) || 0;
  const fallbackRail = currentStageRailBounds();
  const occupiedLeft = dividerX || fallbackRail + 48;
  return clampNumber(window.innerWidth - occupiedLeft - 32, 360, 980);
}

function computeFluidTypeScale() {
  const railWidth = currentStageRailBounds();
  const widthProgress = clampNumber((railWidth - 420) / 340, 0, 1);
  const viewportProgress = clampNumber((window.innerWidth - 1180) / 860, 0, 1);
  const shortPenalty = window.innerHeight < 820 ? -0.11 : window.innerHeight < 900 ? -0.07 : window.innerHeight < 980 ? -0.03 : 0;
  return clampNumber(
    0.94 + widthProgress * 0.24 + viewportProgress * 0.08 + shortPenalty,
    FLUID_TYPE_LIMITS.minScale,
    FLUID_TYPE_LIMITS.maxScale
  );
}

function computeMapTypeScale() {
  const mapWidth = currentMapBounds();
  const mapProgress = clampNumber((mapWidth - 460) / 420, 0, 1);
  return clampNumber(
    0.94 + mapProgress * 0.2,
    FLUID_TYPE_LIMITS.minMapScale,
    FLUID_TYPE_LIMITS.maxMapScale
  );
}

function syncFluidTypography() {
  const root = document.documentElement;
  root.style.setProperty("--font-scale", computeFluidTypeScale().toFixed(3));
  root.style.setProperty("--map-font-scale", computeMapTypeScale().toFixed(3));
}
