function tickerItemsForState() {
  const incident = demoState.incident;
  const ack = demoState.operatorAck || "pending";
  const ackLabel = ack === "acknowledged" ? "OPERATOR ACK" : ack === "escalated" ? "FIELD ESCALATION" : "ACK PENDING";
  const linkLabel = demoState.network === ADVERSE_NETWORK ? "CONSTRAINED UPLINK" : "NOMINAL UPLINK";
  const actionLabel = incident && incident.actionReady ? actionDisplayLabel(evidenceAction) : "Action Pending";
  const historyItems = demoState.incidentHistory.slice(-3).map(entry => `${formatClockTime(entry.timestamp)} ${entry.title}`);
  return [
    ...historyItems,
    linkLabel,
    ackLabel,
    incident ? lifecycleLabel(incident.lifecycle).toUpperCase() : "NO INCIDENT",
    actionLabel
  ];
}

function syncIncidentTicker() {
  if (!ui.incidentTickerTrack) return;
  const content = tickerItemsForState()
    .map(item => `<span>${item}</span>`)
    .join("");
  ui.incidentTickerTrack.innerHTML = `${content}${content}`;
}

function syncModeButtons() {
  ui.modeButtons.forEach(button => {
    button.classList.toggle("active", button.dataset.viewMode === demoState.viewMode);
  });
}

function applyViewModeUi() {
  document.body.dataset.viewMode = demoState.viewMode || "operations";
  syncModeButtons();
}

function syncCommunicationModeButtons() {
  const mode = currentCommunicationMode();
  document.body.dataset.communicationMode = mode;
  ui.communicationModeButtons.forEach(button => {
    const active = button.dataset.commMode === mode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

function setCommunicationMode(mode) {
  if (!COMMUNICATION_MODES.includes(mode)) return;
  if (demoState.communicationMode === mode) return;
  demoState.communicationMode = mode;
  document.body.classList.remove("mode-switching");
  void document.body.offsetWidth;
  document.body.classList.add("mode-switching");
  window.clearTimeout(demoState.modeSwitchTimer);
  demoState.modeSwitchTimer = window.setTimeout(() => {
    document.body.classList.remove("mode-switching");
  }, 900);
  if (typeof persistDashboardState === "function") persistDashboardState();
  if (typeof syncDashboardStateSurfaces === "function") syncDashboardStateSurfaces();
  else {
    syncCommunicationModeButtons();
    syncOperationsWall();
  }
  syncMapPresentationFrame();
}

function syncReceiverValidationStrip(steps) {
  const labelRefs = [
    ui.receiverValidationLabel1,
    ui.receiverValidationLabel2,
    ui.receiverValidationLabel3,
    ui.receiverValidationLabel4
  ];
  const titleRefs = [
    ui.receiverValidationTitle1,
    ui.receiverValidationTitle2,
    ui.receiverValidationTitle3,
    ui.receiverValidationTitle4
  ];
  const metaRefs = [
    ui.receiverValidationMeta1,
    ui.receiverValidationMeta2,
    ui.receiverValidationMeta3,
    ui.receiverValidationMeta4
  ];

  ui.receiverValidationSteps.forEach((stepEl, index) => {
    const step = steps[index];
    if (!stepEl || !step) return;
    stepEl.className = `receiver-validation-step ${step.tone}`;
    if (labelRefs[index]) labelRefs[index].textContent = step.label;
    if (titleRefs[index]) titleRefs[index].textContent = step.title;
    if (metaRefs[index]) metaRefs[index].textContent = step.meta;
  });
}

function syncMapPresentationFrame() {
  const modeProfile = communicationModeProfile();
  const mode = currentCommunicationMode();
  const lifecycle = demoState.incident ? demoState.incident.lifecycle : "new";

  if (ui.mapFrameTitle) {
    ui.mapFrameTitle.textContent = demoState.stage === "mission"
      ? "Sweden rail digital twin scenario"
      : stageCopy[demoState.stage].title;
  }

  if (ui.mapFrameMeta) {
    ui.mapFrameMeta.textContent = demoState.stage === "mission"
      ? `Current mode: ${modeProfile.label}. The digital twin mirrors railway track state, gateway routing, and ${modeProfile.payload} receiver evidence before action is released.`
      : stageMessageFor(demoState.stage, demoState.season);
  }

  if (ui.mapFrameMode) {
    ui.mapFrameMode.textContent = mode.toUpperCase();
  }
  if (ui.mapFrameModeMirror) {
    ui.mapFrameModeMirror.textContent = modeProfile.label;
  }

  if (ui.mapFrameReceiver) {
    const receiverLabel = lifecycle === "closed"
      ? "Watch mode"
      : mode === "raw"
        ? "Manual review"
        : mode === "hybrid"
          ? "Fallback ready"
          : demoState.incident && demoState.incident.validated
            ? "Action-ready"
            : "Validating";
    ui.mapFrameReceiver.textContent = receiverLabel;
    if (ui.mapFrameReceiverMirror) ui.mapFrameReceiverMirror.textContent = receiverLabel;
  }
}

function setViewMode(mode) {
  if (!["operations", "demo"].includes(mode)) return;
  if (demoState.viewMode === mode) return;
  if (mode === "demo") {
    demoState.lastDemoStage = demoState.stage === "mission"
      ? (demoState.lastDemoStage || "sensing")
      : demoState.stage;
    demoState.viewMode = "demo";
    demoState.mapSyncEnabled = true;
    if (typeof closeDrawer === "function") closeDrawer();
    applyViewModeUi();
    setStage(demoState.lastDemoStage || "sensing", true);
    if (typeof persistDashboardState === "function") persistDashboardState();
    return;
  }
  demoState.lastDemoStage = demoState.stage;
  demoState.viewMode = "operations";
  demoState.mapSyncEnabled = false;
  demoState.autoplay = false;
  applyViewModeUi();
  setStage("mission", true);
  if (typeof syncMapDrawerHotspot === "function") syncMapDrawerHotspot();
  if (typeof persistDashboardState === "function") persistDashboardState();
}

function operationsWallIncidentFallback() {
  const createdAt = Date.now();
  return {
    id: `INC-${String(createdAt).slice(-6)}`,
    corridor: "Sundsvall railway track",
    lifecycle: "new",
    responseMode: currentCommunicationMode(),
    createdAt,
    updatedAt: createdAt,
    semanticReady: true,
    semanticReadyAt: createdAt,
    validated: true,
    validatedAt: createdAt,
    actionReady: true,
    actionIssuedAt: createdAt,
    fieldCrewStatus: "Standby",
    fieldCrewEtaMin: null,
    slaTargetAt: createdAt + (INCIDENT_SIMULATION?.slaTargetMs || 20 * 60 * 1000)
  };
}

function syncOperationsWall() {
  const incident = demoState.incident || (
    typeof createIncidentState === "function"
      ? createIncidentState()
      : operationsWallIncidentFallback()
  );
  const ack = demoState.operatorAck || "pending";
  const lifecycle = incident.lifecycle || "new";
  const adverse = demoState.network === ADVERSE_NETWORK;
  const actionReady = Boolean(incident.actionReady || demoState.actionIssued);
  const communication = communicationModeProfile();
  const communicationMode = currentCommunicationMode();

  syncCommunicationModeButtons();

  if (ui.alarmPrimaryItem) {
    ui.alarmPrimaryItem.classList.toggle("acknowledged", ack === "acknowledged");
    ui.alarmPrimaryItem.classList.toggle("escalated", ack === "escalated");
    ui.alarmPrimaryItem.classList.toggle("mitigated", lifecycle === "mitigated");
    ui.alarmPrimaryItem.classList.toggle("closed", lifecycle === "closed");
  }
  if (ui.alarmPrimaryTitle) {
    ui.alarmPrimaryTitle.textContent = lifecycle === "closed"
      ? "Sundsvall · railway track returned to watch mode"
      : lifecycle === "mitigated"
        ? "Sundsvall · mitigation holding"
        : ack === "escalated"
          ? "Sundsvall · field escalation active"
          : ack === "acknowledged"
            ? "Sundsvall · incident acknowledged"
            : "Sundsvall · rail buckling risk";
  }
  if (ui.alarmPrimaryMeta) {
    ui.alarmPrimaryMeta.textContent = lifecycle === "closed"
      ? "The railway track remains under watch while the system prepares the next incident cycle."
      : lifecycle === "mitigated"
        ? `P99 ${evidenceP99.toFixed(1)}°C · mitigation holds · keep semantic updates visible for verification.`
        : ack === "escalated"
          ? `P99 ${evidenceP99.toFixed(1)}°C · field response requested · hybrid fallback armed.`
          : ack === "acknowledged"
            ? `P99 ${evidenceP99.toFixed(1)}°C · operator owns incident · semantic action path remains primary.`
            : incident.semanticReady
              ? `P99 ${evidenceP99.toFixed(1)}°C · delta ${evidenceDelta.toFixed(1)}°C · semantic action target ${actionShortLabel(evidenceAction)}.`
              : "Thermal anomaly is open and the edge is still building the first semantic packet.";
  }

  if (ui.queuePrimaryTitle) {
    ui.queuePrimaryTitle.textContent = communication.queueTitle;
  }
  if (ui.queuePrimaryMeta) {
    ui.queuePrimaryMeta.textContent = communicationMode === "semantic"
      ? (!incident.semanticReady
          ? `${evidenceTaskGoal} · waiting for first semantic packet`
          : ack === "escalated"
            ? `${evidenceTaskGoal} · freshness ${evidenceFreshnessS} s · field escalation mirrored to queue`
            : `${evidenceTaskGoal} · freshness ${evidenceFreshnessS} s · ${incident.validated ? (adverse ? "link constrained" : "receiver-ready") : "receiver validating"}`)
      : communication.queueMeta;
  }
  if (ui.queuePrimaryItem) {
    ui.queuePrimaryItem.classList.toggle("active", incident.semanticReady);
    ui.queuePrimaryItem.dataset.commMode = communicationMode;
  }
  syncReceiverValidationStrip(communication.validationSteps);

  if (ui.dispatchRecommendation) {
    ui.dispatchRecommendation.textContent = communicationMode === "semantic"
      ? (lifecycle === "closed"
          ? "Return the wall to watch mode and await the next railway track cycle"
          : lifecycle === "mitigated"
            ? "Hold mitigation and verify railway track stability"
            : ack === "escalated"
              ? "Escalate field response and keep semantic path live"
              : ack === "acknowledged"
                ? "Hold semantic path as primary dispatch channel"
                : incident.validated
                  ? "Keep semantic path primary"
                  : "Allow the receiver to finish validating the semantic packet")
      : communication.dispatchRecommendation;
  }
  if (ui.dispatchState) {
    ui.dispatchState.textContent = communicationMode === "semantic"
      ? (lifecycle === "closed"
          ? "Watch mode"
          : lifecycle === "mitigated"
            ? "Risk contained"
            : ack === "escalated"
              ? "Field support mobilizing"
              : ack === "acknowledged"
                ? "Operator-owned incident"
                : incident.validated
                  ? "Ready for acknowledgment"
                  : "Receiver validating")
      : communication.dispatchState;
  }
  if (ui.dispatchStateDetail) {
    ui.dispatchStateDetail.textContent = ui.dispatchState ? ui.dispatchState.textContent : communication.dispatchState;
  }
  if (ui.dispatchStateMeta) {
    ui.dispatchStateMeta.textContent = communicationMode === "semantic"
      ? (lifecycle === "closed"
          ? "The control center has archived the current alarm and remains ready for a fresh packet."
          : lifecycle === "mitigated"
            ? "Keep the railway track under observation until the closure window completes."
            : ack === "escalated"
              ? "Hybrid preview and inspection advisory remain available while crew response is prepared."
              : ack === "acknowledged"
                ? "Receiver keeps semantic dispatch active while the operator manages the railway track response."
                : incident.validated
                  ? "Control center can accept the semantic packet and hold hybrid as fallback."
                  : "Semantic payload is still being validated against trust and policy gates.")
      : communication.dispatchMeta;
  }
  if (ui.fieldCrewStatus) {
    ui.fieldCrewStatus.textContent = incident.fieldCrewStatus || (ack === "acknowledged" ? "Prepared" : "Standby");
  }
  if (ui.fieldCrewEta) {
    ui.fieldCrewEta.textContent = lifecycle === "closed"
      ? "No active dispatch. Railway track has returned to watch mode."
      : incident.fieldCrewEtaMin
        ? `Crew ETA ${incident.fieldCrewEtaMin} min · remote inspection priority raised.`
        : ack === "acknowledged"
          ? "Crew remains on standby while operator manages the semantic response path."
          : "No dispatch yet. Awaiting operator ownership or escalation.";
  }

  const recent = demoState.incidentHistory.slice(-4);
  const logPairs = [
    [ui.logEntry1Time, ui.logEntry1Title, ui.logEntry1Meta, recent[0]],
    [ui.logEntry2Time, ui.logEntry2Title, ui.logEntry2Meta, recent[1]],
    [ui.logEntry3Time, ui.logEntry3Title, ui.logEntry3Meta, recent[2]],
    [ui.logEntry4Time, ui.logEntry4Title, ui.logEntry4Meta, recent[3]]
  ];
  logPairs.forEach(([timeEl, titleEl, metaEl, entry]) => {
    if (timeEl) timeEl.textContent = entry ? formatClockTime(entry.timestamp) : "--:--:--";
    if (titleEl) titleEl.textContent = entry ? entry.title : "Awaiting incident update";
    if (metaEl) metaEl.textContent = entry ? entry.detail : "The simulator will populate this timeline as the incident evolves.";
  });

  if (ui.operatorNoteText) {
    ui.operatorNoteText.textContent = lifecycle === "closed"
      ? "Incident archived. The wall will recycle to a fresh railway track event automatically."
      : lifecycle === "mitigated"
        ? "Mitigation is holding. Keep the validated command path visible until the closure window completes."
        : ack === "escalated"
          ? "Field escalation confirmed. Semantic path remains primary while hybrid evidence and crew response are active."
          : ack === "acknowledged"
            ? "Operator acknowledgment confirmed. Validated command path stays highlighted for dispatch."
            : adverse
              ? "Constrained uplink confirmed. Semantic path remains primary; hybrid stays armed as fallback."
              : "Receiver healthy. Semantic path remains primary and ready for operator ownership.";
  }

  syncMapPresentationFrame();
  syncIncidentTicker();
}

window.setViewMode = setViewMode;
window.setCommunicationMode = setCommunicationMode;
