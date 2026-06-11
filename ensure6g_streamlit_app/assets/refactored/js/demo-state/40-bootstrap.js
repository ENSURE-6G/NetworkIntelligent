window.addEventListener("DOMContentLoaded", () => {
  cacheUi();
  if (typeof initializeDashboardState === "function") initializeDashboardState();
  applyThermalEvidence();
  initResizableDivider();
  if (typeof syncFluidTypography === "function") syncFluidTypography();
  ui.stageButtons.forEach(btn => btn.addEventListener("click", () => { demoState.autoplay = false; setStage(btn.dataset.stage); }));
  ui.networkButtons.forEach(btn => btn.addEventListener("click", () => setNetwork(btn.dataset.network)));
  ui.modeButtons.forEach(btn => btn.addEventListener("click", () => setViewMode(btn.dataset.viewMode)));
  ui.communicationModeButtons.forEach(btn => btn.addEventListener("click", () => setCommunicationMode(btn.dataset.commMode)));
  ui.seasonButtons.forEach(btn => btn.addEventListener("click", () => setSeason(btn.dataset.season)));
  ui.ackButtons.forEach(btn => btn.addEventListener("click", () => setOperatorAck(btn.dataset.ack)));
  if (typeof bindDashboardDrawerTriggers === "function") bindDashboardDrawerTriggers();
  if (ui.prevStageButton) ui.prevStageButton.addEventListener("click", () => stepStage(-1));
  if (ui.nextStageButton) ui.nextStageButton.addEventListener("click", () => stepStage(1));
  if (ui.playPauseButton) ui.playPauseButton.addEventListener("click", toggleAutoplay);
  if (ui.resetButton) ui.resetButton.addEventListener("click", resetDemo);
  if (ui.presentationWorkflowButton) ui.presentationWorkflowButton.addEventListener("click", () => togglePresentationWorkflow());
  if (ui.presentationWorkflowStart) ui.presentationWorkflowStart.addEventListener("click", startPresentationWorkflow);
  if (ui.presentationWorkflowPrev) ui.presentationWorkflowPrev.addEventListener("click", () => stepPresentationWorkflow(-1));
  if (ui.presentationWorkflowNext) ui.presentationWorkflowNext.addEventListener("click", () => stepPresentationWorkflow(1));
  if (ui.presentationWorkflowClose) ui.presentationWorkflowClose.addEventListener("click", () => togglePresentationWorkflow(false));
  ui.presentationStoryButtons.forEach(btn => btn.addEventListener("click", () => {
    if (typeof jumpPresentationView === "function") jumpPresentationView(btn.dataset.storyStage);
  }));
  window.addEventListener("keydown", event => {
    if (event.key === "ArrowRight" || event.key === " ") stepStage(1);
    if (event.key === "ArrowLeft") stepStage(-1);
    if (event.key.toLowerCase() === "a") toggleAutoplay();
    if (event.key === "Home") resetDemo();
    if (event.key === "Escape" && typeof closeDrawer === "function") closeDrawer();
  });
  setNetwork(demoState.network || DEFAULT_NETWORK);
  setSeason(demoState.season || DEFAULT_SEASON);
  if (typeof applyViewModeUi === "function") applyViewModeUi();
  setStage(demoState.viewMode === "demo" ? (demoState.lastDemoStage || "sensing") : "mission");
  if (typeof syncCommandWallState === "function") syncCommandWallState();
  if (typeof syncOperationsWall === "function") syncOperationsWall();
  if (typeof syncLifecycleStrip === "function") syncLifecycleStrip();
  if (typeof syncDashboardDrawer === "function") syncDashboardDrawer();
  if (typeof syncPresentationWorkflowPanel === "function") syncPresentationWorkflowPanel();
  if (typeof startIncidentSimulator === "function") startIncidentSimulator();
  window.addEventListener("resize", () => requestAnimationFrame(() => {
    if (typeof syncFluidTypography === "function") syncFluidTypography();
    fitActiveStageToViewport();
    if (typeof syncMapDrawerHotspot === "function") syncMapDrawerHotspot();
  }));
  setInterval(() => {
    if (!demoState.autoplay) return;
    if (!ui.presenterTimerLabel) return;
    const elapsed = Date.now() - demoState.stageStartedAt;
    const remaining = Math.max(0, Math.ceil((demoState.stageDurationMs - elapsed) / 1000));
    ui.presenterTimerLabel.textContent = `Next stage in ${remaining}s`;
  }, DEMO_LIMITS.presenterTimerIntervalMs);
});
