const dividerDragState = {
  active: false,
  pointerId: null,
  startX: 0,
  startWidth: 0
};

function dividerHandleEnabled() {
  const layout = document.body.dataset.layout || "";
  return ["cinematic", "wide", "laptop"].includes(layout) && window.innerWidth >= 960;
}

function currentRailWidth() {
  if (ui.stagePanel) {
    const rect = ui.stagePanel.getBoundingClientRect();
    if (rect.width > 0) return rect.width;
  }
  const header = document.querySelector(".story-header");
  if (header) {
    const rect = header.getBoundingClientRect();
    if (rect.width > 0) return rect.width;
  }
  return 0;
}

function dividerWidthBounds() {
  const style = getComputedStyle(document.body);
  const dashboardRoot = document.querySelector(".dashboard-ui");
  const dashboardStyle = dashboardRoot ? getComputedStyle(dashboardRoot) : null;
  const layout = document.body.dataset.layout || "";
  const left =
    parseFloat(dashboardStyle?.getPropertyValue("--dashboard-edge"))
    || parseFloat(style.getPropertyValue("--ux-left"))
    || 24;
  const mapGap =
    parseFloat(dashboardStyle?.getPropertyValue("--dashboard-gap"))
    || parseFloat(style.getPropertyValue("--ux-map-gap"))
    || 24;
  const mapMinWidth =
    parseFloat(dashboardStyle?.getPropertyValue("--dashboard-map-min"))
    || (layout === "laptop" ? 320 : 420);
  const minWidth = layout === "laptop" ? 380 : 420;
  const maxWidth = Math.min(
    layout === "laptop" ? window.innerWidth * 0.52 : window.innerWidth * 0.58,
    window.innerWidth - (left * 2) - mapGap - mapMinWidth
  );
  return {
    min: minWidth,
    max: Math.max(minWidth, maxWidth)
  };
}

function clampRailWidth(width) {
  const bounds = dividerWidthBounds();
  return Math.max(bounds.min, Math.min(bounds.max, width));
}

function applyRailWidth(width) {
  const clamped = clampRailWidth(width);
  const dashboardRoot = document.querySelector(".dashboard-ui");
  const dashboardStyle = dashboardRoot ? getComputedStyle(dashboardRoot) : null;
  const edge =
    parseFloat(dashboardStyle?.getPropertyValue("--dashboard-edge"))
    || parseFloat(getComputedStyle(document.body).getPropertyValue("--ux-left"))
    || 24;
  const gap =
    parseFloat(dashboardStyle?.getPropertyValue("--dashboard-gap"))
    || parseFloat(getComputedStyle(document.body).getPropertyValue("--ux-map-gap"))
    || 24;
  document.body.style.setProperty("--ux-rail-width", `${clamped}px`);
  document.body.style.setProperty("--ux-left", `${edge}px`);
  document.body.style.setProperty("--ux-map-gap", `${gap}px`);
  document.body.style.setProperty("--ux-divider-x", `${edge + clamped + (gap / 2)}px`);
  demoState.persistedRailWidth = clamped;
  if (ui.dividerHandle) {
    const bounds = dividerWidthBounds();
    ui.dividerHandle.setAttribute("aria-valuemin", String(Math.round(bounds.min)));
    ui.dividerHandle.setAttribute("aria-valuemax", String(Math.round(bounds.max)));
    ui.dividerHandle.setAttribute("aria-valuenow", String(Math.round(clamped)));
  }
  if (typeof syncFluidTypography === "function") syncFluidTypography();
  if (typeof persistDashboardState === "function") persistDashboardState();
  requestAnimationFrame(fitActiveStageToViewport);
}

function syncDividerHandle() {
  if (!ui.dividerHandle) return;
  const enabled = dividerHandleEnabled();
  ui.dividerHandle.hidden = !enabled;
  if (!enabled) {
    if (dividerDragState.active) stopDividerDrag();
    document.body.style.removeProperty("--ux-rail-width");
    ui.dividerHandle.removeAttribute("aria-valuemin");
    ui.dividerHandle.removeAttribute("aria-valuemax");
    ui.dividerHandle.removeAttribute("aria-valuenow");
    if (typeof syncFluidTypography === "function") syncFluidTypography();
    return;
  }
  const width = clampRailWidth(demoState.persistedRailWidth || currentRailWidth() || dividerWidthBounds().min);
  applyRailWidth(width);
}

function onDividerDragMove(event) {
  if (!dividerDragState.active || event.pointerId !== dividerDragState.pointerId) return;
  const deltaX = event.clientX - dividerDragState.startX;
  applyRailWidth(dividerDragState.startWidth + deltaX);
}

function stopDividerDrag() {
  if (!dividerDragState.active) return;
  dividerDragState.active = false;
  dividerDragState.pointerId = null;
  document.body.classList.remove("resizing-ux-divider");
  window.removeEventListener("pointermove", onDividerDragMove);
  window.removeEventListener("pointerup", stopDividerDrag);
  window.removeEventListener("pointercancel", stopDividerDrag);
}

function startDividerDrag(event) {
  if (!ui.dividerHandle || !dividerHandleEnabled()) return;
  dividerDragState.active = true;
  dividerDragState.pointerId = event.pointerId;
  dividerDragState.startX = event.clientX;
  dividerDragState.startWidth = currentRailWidth() || dividerWidthBounds().min;
  document.body.classList.add("resizing-ux-divider");
  if (ui.dividerHandle.setPointerCapture) {
    ui.dividerHandle.setPointerCapture(event.pointerId);
  }
  window.addEventListener("pointermove", onDividerDragMove);
  window.addEventListener("pointerup", stopDividerDrag);
  window.addEventListener("pointercancel", stopDividerDrag);
}

function onDividerHandleKeydown(event) {
  if (!dividerHandleEnabled()) return;
  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
  event.preventDefault();
  const step = event.shiftKey ? 40 : 20;
  const width = currentRailWidth() || dividerWidthBounds().min;
  if (event.key === "ArrowLeft") applyRailWidth(width - step);
  if (event.key === "ArrowRight") applyRailWidth(width + step);
  if (event.key === "Home") applyRailWidth(dividerWidthBounds().min);
  if (event.key === "End") applyRailWidth(dividerWidthBounds().max);
}

function initResizableDivider() {
  if (!ui.dividerHandle) return;
  ui.dividerHandle.setAttribute("role", "separator");
  ui.dividerHandle.setAttribute("aria-orientation", "vertical");
  ui.dividerHandle.addEventListener("pointerdown", startDividerDrag);
  ui.dividerHandle.addEventListener("keydown", onDividerHandleKeydown);
  window.addEventListener("resize", () => requestAnimationFrame(syncDividerHandle));
  requestAnimationFrame(syncDividerHandle);
}
