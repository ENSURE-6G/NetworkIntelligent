function semanticFreshnessFor(network) {
  return network === ADVERSE_NETWORK ? evidenceFreshnessS : Math.max(6, evidenceFreshnessS - 4);
}

function semanticPayloadFor(network) {
  return network === ADVERSE_NETWORK
    ? {
        transferMs: evidencePayloads.semantic.adverseTransferMs,
        deliveryPct: evidencePayloads.semantic.adverseReliabilityPct
      }
    : {
        transferMs: evidencePayloads.semantic.normalTransferMs || 2,
        deliveryPct: 100
      };
}

function buildSemanticPacket(season) {
  const selectedSeason = season || demoState.season || DEFAULT_SEASON;
  const selectedScenario = seasonalScenarios[selectedSeason] || seasonalScenarios[DEFAULT_SEASON];
  const payloadState = semanticPayloadFor(demoState.network || DEFAULT_NETWORK);

  return {
    ...selectedScenario.semantic,
    task_id: "rail_heat_safety_monitoring",
    receiver_goal: "issue safe railway track action",
    source: "actual_p2pro_thermal_evidence",
    sensor_id: "TS-04",
    frame_id: evidenceFrameId,
    frame_name: evidenceFrameName,
    asset: "rail_ballast",
    location: "Sundsvall railway track",
    event_type: "thermal_hotspot",
    semantic_label: "rail_buckling_risk",
    hotspot_x: evidenceHotspotX,
    hotspot_y: evidenceHotspotY,
    p95_temp_c: Number(evidenceP95.toFixed(1)),
    p99_temp_c: Number(evidenceP99.toFixed(1)),
    max_temp_c: Number(evidenceMax.toFixed(1)),
    delta_temp_c: Number(evidenceDelta.toFixed(1)),
    risk_label: evidenceRisk,
    confidence: evidenceConfidence,
    freshness_s: semanticFreshnessFor(demoState.network || DEFAULT_NETWORK),
    integrity: evidenceIntegrity,
    provenance: evidenceProvenance,
    privacy_mode: evidencePrivacy,
    policy_target: "tsr_policy_v2",
    delivery_pct: payloadState.deliveryPct,
    transfer_ms: payloadState.transferMs,
    fallback_mode: evidenceFallback,
    recommended_action: evidenceAction
  };
}

function baseEvidenceValues() {
  const payloads = evidencePayloads;
  const semanticSpeedup = Math.round(payloads.raw.adverseTransferMs / Math.max(payloads.semantic.adverseTransferMs, 1));
  return {
    sampleCount: thermalSummary.sampleCount.toLocaleString(),
    shape: thermalSummary.shape,
    p99Temp: evidenceP99.toFixed(1),
    p95Temp: evidenceP95.toFixed(1),
    maxTemp: evidenceMax.toFixed(1),
    deltaTemp: evidenceDelta.toFixed(1),
    frameId: String(evidenceFrameId),
    frameName: evidenceFrameName,
    hotspotX: String(evidenceHotspotX),
    hotspotY: String(evidenceHotspotY),
    hotspot: `x${evidenceHotspotX} / y${evidenceHotspotY}`,
    risk: String(evidenceRisk).toUpperCase(),
    confidence: evidenceConfidence.toFixed(2),
    trustScore: evidenceTrustScore.toFixed(2),
    action: evidenceAction,
    actionShort: actionShortLabel(evidenceAction),
    actionLabel: actionDisplayLabel(evidenceAction),
    meanTemp: Number(evidenceEvent.meanTempC || 0).toFixed(1),
    maxTemp: Number(evidenceEvent.maxTempC || 0).toFixed(1),
    highRiskCount: String((thermalSummary.riskDistribution && thermalSummary.riskDistribution.high) || 0),
    mediumRiskCount: String((thermalSummary.riskDistribution && thermalSummary.riskDistribution.medium) || 0),
    lowRiskCount: String((thermalSummary.riskDistribution && thermalSummary.riskDistribution.low) || 0),
    rawPayload: payloads.raw.label,
    hybridPayload: payloads.hybrid.label,
    semanticPayload: payloads.semantic.label,
    rawTransfer: `${payloads.raw.adverseTransferMs} ms`,
    hybridTransfer: `${payloads.hybrid.adverseTransferMs} ms`,
    semanticTransfer: `${payloads.semantic.adverseTransferMs} ms`,
    rawReliability: String(payloads.raw.adverseReliabilityPct),
    hybridReliability: String(payloads.hybrid.adverseReliabilityPct),
    semanticReliability: String(payloads.semantic.adverseReliabilityPct),
    semanticReduction: "90%+",
    semanticWinSummary: `90%+ lower routine traffic. ${payloads.semantic.adverseTransferMs} ms instead of ${payloads.raw.adverseTransferMs} ms. Receiver can act.`,
    semanticSpeedup: `${semanticSpeedup}x faster`,
    freshness: `${evidenceFreshnessS} s`,
    provenance: evidenceProvenance,
    integrity: evidenceIntegrity.toUpperCase(),
    taskGoal: evidenceTaskGoal,
    swedenRisk: "Rail buckling risk",
    trustGate: `${evidenceConfidence.toFixed(2)} confidence · ${evidenceFreshnessS} s freshness`,
    fallback: evidenceFallback.replace(/_/g, " "),
    privacy: evidencePrivacy
  };
}

function currentCommunicationMode() {
  return COMMUNICATION_MODES.includes(demoState.communicationMode) ? demoState.communicationMode : "semantic";
}

function communicationModeProfile(mode = currentCommunicationMode()) {
  const selectedMode = COMMUNICATION_MODES.includes(mode) ? mode : "semantic";
  const isAdverse = (demoState.network || DEFAULT_NETWORK) === ADVERSE_NETWORK;
  const semanticFreshness = semanticFreshnessFor(demoState.network || DEFAULT_NETWORK);
  const transferNote = isAdverse ? "under constrained uplink" : "under nominal uplink";

  return {
    raw: {
      label: "RAW",
      payload: evidencePayloads.raw.label,
      transfer: `${evidencePayloads.raw.adverseTransferMs} ms`,
      reliability: `${evidencePayloads.raw.adverseReliabilityPct}% delivery`,
      queueTitle: "RAW rail image sequence",
      queueMeta: `${evidencePayloads.raw.label} full image and sensor payload · best when gateway and wireless signal are healthy`,
      dispatchRecommendation: "Use RAW when the control center can carry full visual evidence",
      dispatchState: "Image stream visible",
      dispatchMeta: "The receiver can inspect normal and thermal frames plus sensor data, then interpret the anomaly manually.",
      mapTitle: "RAW image stream available",
      mapLines: [
        `Gateway sends full rail images and sensor data over the available wireless link`,
        "Control center can see the detection image, but bandwidth cost is highest"
      ],
      pathTone: "red",
      routeTone: "amber",
      routeAlpha: 0.52,
      commandPathVisible: false,
      validationSteps: [
        { tone: "warn", label: "Payload", title: "Full frame received", meta: `${evidencePayloads.raw.label} must travel first.` },
        { tone: "hold", label: "Meaning", title: "Not distilled", meta: "Receiver still sees pixels, not a task packet." },
        { tone: "hold", label: "Policy", title: "No direct policy match", meta: "TSR cannot be released from RAW alone." },
        { tone: "off", label: "Action", title: "Operator review first", meta: "Action waits for manual interpretation." }
      ]
    },
    hybrid: {
      label: "HYBRID",
      payload: evidencePayloads.hybrid.label,
      transfer: `${evidencePayloads.hybrid.adverseTransferMs} ms`,
      reliability: `${evidencePayloads.hybrid.adverseReliabilityPct}% delivery`,
      queueTitle: "Hybrid encoder / decoder packet",
      queueMeta: `${evidencePayloads.hybrid.label} compressed image preview plus semantic text · good for limited links`,
      dispatchRecommendation: "Use HYBRID to save bandwidth while preserving visual context",
      dispatchState: "Compressed preview visible",
      dispatchMeta: "The edge encoder compresses rail imagery and metadata; the receiver decoder reconstructs a small preview for the operator.",
      mapTitle: "Hybrid semantic compression",
      mapLines: [
        "Encoder sends reduced visual evidence plus sensor text through the gateway",
        "Decoder gives the control center a preview and metadata for triage"
      ],
      pathTone: "amber",
      routeTone: "amber",
      routeAlpha: 0.6,
      commandPathVisible: false,
      validationSteps: [
        { tone: "pass", label: "Payload", title: "Preview received", meta: "Reduced evidence arrives much faster than RAW." },
        { tone: "warn", label: "Meaning", title: "Partially narrowed", meta: "Metadata helps triage, but does not finish the task." },
        { tone: "warn", label: "Policy", title: "Review-backed match", meta: "Good fallback posture when trust or freshness degrade." },
        { tone: "hold", label: "Action", title: "Response still reviewed", meta: "Useful resilience mode, not the best primary path." }
      ]
    },
    semantic: {
      label: "SEMANTIC",
      payload: evidencePayloads.semantic.label,
      transfer: `${evidencePayloads.semantic.adverseTransferMs} ms`,
      reliability: `${evidencePayloads.semantic.adverseReliabilityPct}% delivery`,
      queueTitle: "Text-only semantic JSON",
      queueMeta: `${evidenceTaskGoal} · no image payload · risk + trust + action arrive as JSON`,
      dispatchRecommendation: "Use SEMANTIC when the link is poor or bandwidth must be protected",
      dispatchState: "JSON meaning only",
      dispatchMeta: "No normal or thermal image is transmitted; the control center receives structured meaning for validation and action.",
      mapTitle: "Semantic JSON-only mode",
      mapLines: [
        `${evidencePayloads.semantic.label} text packet carries risk, trust, freshness, and recommended action`,
        "No detection image is visible in this mode"
      ],
      pathTone: "green",
      routeTone: "green",
      routeAlpha: 0.68,
      commandPathVisible: true,
      validationSteps: [
        { tone: "pass", label: "Payload", title: "Meaning received", meta: `${evidencePayloads.semantic.label} arrives task-ready.` },
        { tone: "pass", label: "Trust", title: "Trust checked", meta: `${evidenceConfidence.toFixed(2)} confidence · ${semanticFreshness} s freshness.` },
        { tone: "pass", label: "Policy", title: "Policy matched", meta: `${actionShortLabel(evidenceAction)} rule is approved.` },
        { tone: "pass", label: "Action", title: "Action released", meta: "Receiver can act immediately." }
      ]
    }
  }[selectedMode];
}

function applyEvidenceValues(values) {
  document.querySelectorAll("[data-evidence]").forEach(el => {
    const key = el.dataset.evidence;
    if (Object.prototype.hasOwnProperty.call(values, key)) {
      el.textContent = values[key];
    }
  });
}

function applyThermalEvidence() {
  const values = baseEvidenceValues();
  applyEvidenceValues(values);

  if (ui.semanticReceived) {
    ui.semanticReceived.textContent = JSON.stringify(buildSemanticPacket(), null, 2);
  }
}
