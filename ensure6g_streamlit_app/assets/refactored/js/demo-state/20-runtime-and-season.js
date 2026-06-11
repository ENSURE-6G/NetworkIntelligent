function fitActiveStageToViewport() {
  const activeStage = ui.stagePanels.find(panel => panel.classList.contains("active"));
  if (!activeStage || !ui.stagePanel) return;

  activeStage.classList.add("fit-stage");
  activeStage.style.zoom = "1";
  activeStage.style.width = "";

  const panelHeight = ui.stagePanel.clientHeight;
  const naturalHeight = activeStage.scrollHeight;
  if (!panelHeight || !naturalHeight) return;

  const isOperationsMission = demoState.viewMode === "operations" && activeStage.dataset.stage === "mission";
  const availableHeight = Math.max(0, panelHeight - (isOperationsMission ? 8 : 0));
  const rawScale = Math.min(1, availableHeight / naturalHeight);
  const minScale = isOperationsMission ? 0.74 : 0.74;
  const scale = Math.max(minScale, rawScale);

  if (scale >= 0.995) return;

  activeStage.style.zoom = String(scale);
  activeStage.style.width = `${(100 / scale).toFixed(2)}%`;
}

function setSeason(season) {
  if (!seasonalScenarios[season]) return;
  demoState.season = season;
  document.body.dataset.season = season;
  ui.seasonButtons.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.season === season);
  });

  const scenario = seasonalScenarios[season];
  scenario.inputs.forEach((item, index) => {
    const field = ui.seasonFields[index];
    if (!field) return;
    if (field.icon) field.icon.textContent = item[0];
    if (field.label) field.label.textContent = item[1];
    if (field.value) field.value.textContent = item[2];
  });

  if (ui.seasonSemanticJson) ui.seasonSemanticJson.textContent = JSON.stringify(scenario.semantic, null, 2);

  if (ui.stageMessage) ui.stageMessage.textContent = stageMessageFor(demoState.stage, season);
  if (demoStages.indexOf(demoState.stage) >= demoStages.indexOf("sensing")) {
    demoState.sensorObservation = sensorObservationFor(season);
  }

  if (demoState.semanticEvent) {
    demoState.semanticEvent = buildSemanticPacket(season);
    demoState.trustResult = demoStages.indexOf(demoState.stage) >= demoStages.indexOf("decision")
      ? evaluateTrust(demoState.semanticEvent)
      : null;
  }
  refreshSemanticRuntime();
  updatePresenterUI();
  if (typeof syncCommandWallState === "function") syncCommandWallState();
  if (typeof syncLifecycleStrip === "function") syncLifecycleStrip();
  if (typeof syncDashboardDrawer === "function") syncDashboardDrawer();
  if (typeof persistDashboardState === "function") persistDashboardState();
}

function evaluateTrust(event) {
  if (!event) return null;
  const delivered = (event.delivery_pct || 0) >= DEMO_LIMITS.semanticDeliveryThresholdPct;
  const freshnessAccepted = (event.freshness_s || Infinity) <= DEMO_LIMITS.freshnessThresholdS;
  const confidenceAccepted = (event.confidence || evidenceConfidence) >= DEMO_LIMITS.trustThreshold;
  const integrityValid = /signed|valid/i.test(String(event.integrity || ""));
  const provenanceAccepted = Boolean(event.provenance);
  const policyAllowsAction = APPROVED_ACTIONS.includes(event.recommended_action);
  const trustScoreRaw =
    (delivered ? 0.22 : 0) +
    (freshnessAccepted ? 0.18 : 0) +
    (confidenceAccepted ? 0.22 : 0) +
    (integrityValid ? 0.16 : 0) +
    (provenanceAccepted ? 0.10 : 0) +
    (policyAllowsAction ? 0.12 : 0);
  const trustScore = Number(
    Math.max(DEMO_LIMITS.trustScoreFail, Math.min(0.99, trustScoreRaw)).toFixed(2)
  );
  return {
    delivered,
    freshnessAccepted,
    confidenceAccepted,
    integrityValid,
    provenanceAccepted,
    policyAllowsAction,
    trustScore,
    usable: trustScore >= DEMO_LIMITS.trustThreshold,
    action: event.recommended_action,
    fallbackMode: event.fallback_mode || evidenceFallback
  };
}

function decideAction(trustResult) {
  if (!trustResult || !trustResult.usable) {
    return {
      action: trustResult && trustResult.fallbackMode ? trustResult.fallbackMode : evidenceFallback,
      status: "fallback",
      label: "Request hybrid preview"
    };
  }
  return {
    action: trustResult.action || "approved_action",
    status: "issued",
    label: "Operational Safety Action"
  };
}

function setTrustCheckState(element, passed, valueText) {
  if (!element) return;
  element.classList.toggle("pass", Boolean(passed));
  element.classList.toggle("fail", !passed);
  const icon = element.querySelector("i");
  const value = element.querySelector("b");
  if (icon) icon.textContent = passed ? "✓" : "!";
  if (value && valueText) value.textContent = valueText;
}

function refreshSemanticRuntime() {
  const packet = demoState.semanticEvent || buildSemanticPacket();
  const trust = demoState.trustResult || evaluateTrust(packet);
  const decision = demoState.tmsAction || decideAction(trust);
  const semanticTransferLabel = `${packet.transfer_ms || evidencePayloads.semantic.adverseTransferMs} ms`;
  const semanticReliabilityLabel = String(packet.delivery_pct || evidencePayloads.semantic.adverseReliabilityPct);
  const values = {
    ...baseEvidenceValues(),
    confidence: Number(packet.confidence || evidenceConfidence).toFixed(2),
    trustScore: Number(trust.trustScore || evidenceTrustScore).toFixed(2),
    action: packet.recommended_action || evidenceAction,
    actionShort: actionShortLabel(packet.recommended_action || evidenceAction),
    actionLabel: trust.usable ? actionDisplayLabel(packet.recommended_action || evidenceAction) : "Hybrid Preview Requested",
    semanticTransfer: semanticTransferLabel,
    semanticReliability: semanticReliabilityLabel,
    freshness: `${packet.freshness_s || evidenceFreshnessS} s`,
    provenance: packet.provenance || evidenceProvenance,
    integrity: String(packet.integrity || evidenceIntegrity).toUpperCase(),
    taskGoal: evidenceTaskGoal,
    swedenRisk:
      packet.semantic_label === "rail_buckling_risk"
        ? "Rail buckling risk"
        : (packet.semantic_label === "remote_inspection_priority"
            ? "Remote inspection priority"
            : (packet.semantic_label === "snow_or_frost_warning"
                ? "Snow / frost warning"
                : "Frost-heave risk")),
    trustGate: `${Number(packet.confidence || evidenceConfidence).toFixed(2)} confidence · ${packet.freshness_s || evidenceFreshnessS} s freshness`,
    fallback: String(decision.action || evidenceFallback).replace(/_/g, " ")
  };
  const incidentOverrides = typeof incidentRuntimeOverrides === "function" ? incidentRuntimeOverrides() : null;
  if (incidentOverrides) Object.assign(values, incidentOverrides);
  applyEvidenceValues(values);

  if (ui.semanticArrivalPacket) {
    ui.semanticArrivalPacket.textContent = JSON.stringify(packet, null, 2);
  }
  if (ui.semanticReceived) {
    ui.semanticReceived.textContent = JSON.stringify(packet, null, 2);
  }
  if (ui.receiverPolicyNote) {
    ui.receiverPolicyNote.textContent = trust.usable
      ? "Fallback remains armed: if the next packet becomes stale or unverifiable, raise remote inspection priority before acting."
      : "Fallback active: trust is insufficient, so request hybrid evidence and raise remote inspection priority.";
  }

  setTrustCheckState(ui.trustCheckDelivery, trust.delivered, `${semanticReliabilityLabel}% link success`);
  setTrustCheckState(
    ui.trustCheckTrust,
    trust.freshnessAccepted && trust.confidenceAccepted && trust.integrityValid && trust.provenanceAccepted,
    `${Number(packet.confidence || evidenceConfidence).toFixed(2)} confidence · ${packet.freshness_s || evidenceFreshnessS} s freshness`
  );
  setTrustCheckState(ui.trustCheckPolicy, trust.policyAllowsAction, actionShortLabel(packet.recommended_action || evidenceAction));
  if (typeof syncCommandWallState === "function") syncCommandWallState();
  if (typeof syncOperationsWall === "function") syncOperationsWall();
}

window.setSeason = setSeason;
