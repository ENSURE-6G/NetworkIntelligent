function updatePresenterUI() {
  const index = demoStages.indexOf(demoState.stage);
  const progress = ((index + 1) / demoStages.length) * 100;
  if (ui.presenterProgressFill) ui.presenterProgressFill.style.width = progress + "%";
  if (ui.presenterProgressLabel) ui.presenterProgressLabel.textContent = `Stage ${index + 1} of ${demoStages.length} · ${stageCopy[demoState.stage].title}`;
  if (ui.playPauseButton) {
    ui.playPauseButton.textContent = demoState.autoplay ? "Pause" : "Autoplay";
    ui.playPauseButton.classList.toggle("active", demoState.autoplay);
  }
  if (ui.presenterBadge) ui.presenterBadge.textContent = demoState.autoplay ? "Presenter mode · Autoplay" : "Presenter mode · Manual";
  if (ui.presenterCueLabel) ui.presenterCueLabel.textContent = presenterCueFor(demoState.stage, demoState.season);
  document.body.classList.toggle("presenter-playing", demoState.autoplay);
  if (ui.presenterTimerLabel) ui.presenterTimerLabel.textContent = demoState.autoplay ? "Autoplay running" : "Manual mode";
  if (typeof syncPresentationWorkflowPanel === "function") syncPresentationWorkflowPanel();
}

function activePresentationWorkflowStep() {
  const index = demoState.presentationWorkflowIndex;
  return index >= 0 && index < PRESENTATION_WORKFLOW.length ? PRESENTATION_WORKFLOW[index] : null;
}

function syncPresentationWorkflowPanel() {
  const open = Boolean(demoState.presentationWorkflowOpen);
  if (ui.presentationWorkflowPanel) ui.presentationWorkflowPanel.hidden = !open;
  if (ui.presentationWorkflowButton) {
    ui.presentationWorkflowButton.classList.toggle("active", open);
    ui.presentationWorkflowButton.textContent = open ? "Hide Workflow" : "Presentation Workflow";
  }
  if (!open) return;

  const step = activePresentationWorkflowStep();
  const stepIndex = demoState.presentationWorkflowIndex;
  const started = Boolean(step);

  if (ui.presentationWorkflowTitle) {
    ui.presentationWorkflowTitle.textContent = step
      ? step.title
      : "Use one guided story instead of free navigation.";
  }
  if (ui.presentationWorkflowMeta) {
    ui.presentationWorkflowMeta.textContent = step
      ? step.meta
      : "Start the workflow to move the live app through the clearest non-technical narrative.";
  }
  if (ui.presentationWorkflowStep) {
    ui.presentationWorkflowStep.textContent = step
      ? `Step ${stepIndex + 1} of ${PRESENTATION_WORKFLOW.length}`
      : "Ready";
  }
  if (ui.presentationWorkflowStage) {
    ui.presentationWorkflowStage.textContent = step
      ? `${stageCopy[step.stage].title} · ${step.viewMode === "operations" ? "Operations wall" : "Guided demo"}`
      : "Operational challenge";
  }
  if (ui.presentationWorkflowCue) {
    ui.presentationWorkflowCue.textContent = step
      ? step.cue
      : "Open with the problem: remote railway tracks create more sensor payload than the uplink should carry, while operators need action quickly.";
  }
  if (ui.presentationWorkflowPrev) ui.presentationWorkflowPrev.disabled = !started || stepIndex <= 0;
  if (ui.presentationWorkflowNext) ui.presentationWorkflowNext.disabled = !started || stepIndex >= PRESENTATION_WORKFLOW.length - 1;
  if (ui.presentationWorkflowStart) ui.presentationWorkflowStart.textContent = started ? "Restart Flow" : "Start Flow";
  ui.presentationStoryButtons.forEach(button => {
    const stage = button.dataset.storyStage;
    const active = demoState.viewMode === "demo" && demoState.stage === stage;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

function applyPresentationWorkflowStep(step) {
  if (!step) return;
  if (step.season) setSeason(step.season);
  if (step.communicationMode && typeof setCommunicationMode === "function") setCommunicationMode(step.communicationMode);
  if (step.viewMode && typeof setViewMode === "function") setViewMode(step.viewMode);
  if (step.network) setNetwork(step.network);
  if (step.stage) setStage(step.stage, true);
}

function togglePresentationWorkflow(forceOpen) {
  const open = typeof forceOpen === "boolean" ? forceOpen : !demoState.presentationWorkflowOpen;
  demoState.presentationWorkflowOpen = open;
  if (!open) demoState.presentationWorkflowIndex = -1;
  syncPresentationWorkflowPanel();
  if (typeof persistDashboardState === "function") persistDashboardState();
}

function startPresentationWorkflow() {
  demoState.presentationWorkflowOpen = true;
  demoState.presentationWorkflowIndex = 0;
  applyPresentationWorkflowStep(PRESENTATION_WORKFLOW[0]);
  syncPresentationWorkflowPanel();
  if (typeof persistDashboardState === "function") persistDashboardState();
}

function stepPresentationWorkflow(delta = 1) {
  if (!demoState.presentationWorkflowOpen) demoState.presentationWorkflowOpen = true;
  const current = demoState.presentationWorkflowIndex < 0 ? 0 : demoState.presentationWorkflowIndex;
  const nextIndex = Math.max(0, Math.min(PRESENTATION_WORKFLOW.length - 1, current + delta));
  demoState.presentationWorkflowIndex = nextIndex;
  applyPresentationWorkflowStep(PRESENTATION_WORKFLOW[nextIndex]);
  syncPresentationWorkflowPanel();
  if (typeof persistDashboardState === "function") persistDashboardState();
}

function jumpPresentationView(stage) {
  if (!demoStages.includes(stage) || stage === "mission") return;
  demoState.presentationWorkflowOpen = true;
  const workflowIndex = PRESENTATION_WORKFLOW.findIndex(step => step.stage === stage);
  if (workflowIndex >= 0) demoState.presentationWorkflowIndex = workflowIndex;
  setSeason("summer");
  setCommunicationMode("semantic");
  setNetwork(stage === "constraint" || stage === "decision" ? ADVERSE_NETWORK : DEFAULT_NETWORK);
  setViewMode("demo");
  setStage(stage, true);
  syncPresentationWorkflowPanel();
  if (typeof persistDashboardState === "function") persistDashboardState();
}

function clearAutoplayTimer() {
  if (demoState.autoplayTimer) {
    clearTimeout(demoState.autoplayTimer);
    demoState.autoplayTimer = null;
  }
}

function scheduleAutoplay() {
  clearAutoplayTimer();
  if (!demoState.autoplay) return;
  const index = demoStages.indexOf(demoState.stage);
  if (index >= demoStages.length - 1) {
    demoState.autoplay = false;
    updatePresenterUI();
    return;
  }
  demoState.stageDurationMs = stageDurationsMs[demoState.stage] || DEMO_LIMITS.fallbackStageDurationMs;
  demoState.stageStartedAt = Date.now();
  demoState.autoplayTimer = setTimeout(() => stepStage(1, true), demoState.stageDurationMs);
}

function toggleAutoplay() {
  demoState.autoplay = !demoState.autoplay;
  updatePresenterUI();
  scheduleAutoplay();
}

function resetDemo() {
  demoState.autoplay = false;
  clearAutoplayTimer();
  setNetwork(DEFAULT_NETWORK);
  if (demoState.viewMode === "demo") {
    setStage("sensing", true);
  } else {
    restartIncidentCycle("Operator reset the live railway track demo");
    setStage("mission", true);
  }
}

function setStage(stage, keepAutoplayState = false) {
  if (!demoStages.includes(stage)) return;
  if (demoState.viewMode === "operations" && stage !== "mission") return;
  const overviewStage = stage === "mission";
  demoState.stage = stage;
  if (demoState.viewMode === "demo" && stage !== "mission") {
    demoState.lastDemoStage = stage;
  }
  demoState.stageEnteredAt = Date.now();
  document.body.dataset.stage = stage;
  if (demoState.mapSyncEnabled) {
    setNetwork(demoStages.indexOf(stage) >= demoStages.indexOf("constraint") ? ADVERSE_NETWORK : DEFAULT_NETWORK);
  }
  demoState.anomalyDetected = overviewStage || demoStages.indexOf(stage) >= demoStages.indexOf("sensing");
  demoState.sensorObservation = demoState.anomalyDetected ? sensorObservationFor(demoState.season) : null;
  demoState.semanticEvent = overviewStage || demoStages.indexOf(stage) >= demoStages.indexOf("fusion") ? buildSemanticPacket() : null;
  demoState.trustResult = overviewStage || demoStages.indexOf(stage) >= demoStages.indexOf("decision") ? evaluateTrust(demoState.semanticEvent) : null;
  demoState.tmsAction = overviewStage || demoStages.indexOf(stage) >= demoStages.indexOf("decision") ? decideAction(demoState.trustResult) : null;
  demoState.actionIssued = Boolean(demoState.tmsAction && demoState.tmsAction.status === "issued");

  ui.stagePanels.forEach(el => el.classList.toggle("active", el.dataset.stage === stage));
  ui.stageButtons.forEach(el => el.classList.toggle("active", el.dataset.stage === stage));
  if (ui.stageTitle) ui.stageTitle.textContent = stageCopy[stage].title;
  if (ui.stageMessage) ui.stageMessage.textContent = stageMessageFor(stage, demoState.season);
  refreshSemanticRuntime();

  if (!keepAutoplayState && !demoState.autoplay) clearAutoplayTimer();
  updatePresenterUI();
  scheduleAutoplay();
  if (typeof syncDashboardStateSurfaces === "function") {
    syncDashboardStateSurfaces();
  } else if (typeof syncCommandWallState === "function") {
    syncCommandWallState();
  }
  if (typeof persistDashboardState === "function") persistDashboardState();
  requestAnimationFrame(fitActiveStageToViewport);
}

function setNetwork(network) {
  if (![DEFAULT_NETWORK, ADVERSE_NETWORK].includes(network)) return;
  demoState.network = network;
  document.body.dataset.network = network;
  ui.networkButtons.forEach(btn => btn.classList.toggle("active", btn.dataset.network === network));
  const adverse = network === ADVERSE_NETWORK;
  if (ui.congestionLabel) ui.congestionLabel.textContent = adverse ? "High" : "Low";
  if (ui.lossLabel) ui.lossLabel.textContent = adverse ? "High" : "Low";
  if (ui.delayLabel) ui.delayLabel.textContent = adverse ? "High" : "Low";
  if (demoState.semanticEvent) {
    demoState.semanticEvent = buildSemanticPacket();
    demoState.trustResult = demoStages.indexOf(demoState.stage) >= demoStages.indexOf("decision")
      ? evaluateTrust(demoState.semanticEvent)
      : null;
    demoState.tmsAction = demoStages.indexOf(demoState.stage) >= demoStages.indexOf("decision")
      ? decideAction(demoState.trustResult)
      : null;
    demoState.actionIssued = Boolean(demoState.tmsAction && demoState.tmsAction.status === "issued");
  }
  refreshSemanticRuntime();
  if (typeof syncDashboardStateSurfaces === "function") {
    syncDashboardStateSurfaces();
  } else if (typeof syncCommandWallState === "function") {
    syncCommandWallState();
  }
  if (typeof persistDashboardState === "function") persistDashboardState();
}

function stepStage(delta, fromAutoplay = false) {
  const i = demoStages.indexOf(demoState.stage);
  const nextIndex = Math.max(0, Math.min(demoStages.length - 1, i + delta));
  const next = demoStages[nextIndex];
  if (!fromAutoplay && demoState.autoplay) demoState.autoplay = false;
  setStage(next, fromAutoplay);
}

window.togglePresentationWorkflow = togglePresentationWorkflow;
window.jumpPresentationView = jumpPresentationView;
window.setStage = setStage;
window.setNetwork = setNetwork;
