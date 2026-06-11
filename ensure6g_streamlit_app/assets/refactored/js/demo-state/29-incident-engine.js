function nowMs() {
  return Date.now();
}

function formatClockTime(timestamp) {
  if (!timestamp) return "--:--:--";
  return new Date(timestamp).toLocaleTimeString("en-GB", { hour12: false });
}

function formatCountdown(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function lifecycleLabel(status) {
  return {
    new: "New incident",
    acknowledged: "Acknowledged",
    escalated: "Escalated",
    mitigated: "Mitigated",
    closed: "Closed"
  }[status] || "Incident";
}

function incidentHeadline(incident) {
  if (!incident) return "Awaiting incident";
  if (incident.lifecycle === "closed") return "Incident closed and ready to recycle";
  if (incident.lifecycle === "mitigated") return incident.responseMode === "field"
    ? "Field response has contained the railway track risk"
    : "Validated semantic action has contained the railway track risk";
  if (incident.lifecycle === "escalated") return "Field crew has been mobilized from the control center";
  if (incident.lifecycle === "acknowledged") return "Operator owns the live incident and semantic dispatch remains primary";
  if (!incident.semanticReady) return "Awaiting semantic packet from the edge";
  if (!incident.validated) return "Receiver is validating the semantic packet";
  return "Incident is action-ready and waiting for operator ownership";
}

function incidentSlaMeta(incident) {
  if (!incident) return "to action SLA";
  if (incident.lifecycle === "closed") return "until a fresh railway track cycle begins";
  if (incident.lifecycle === "mitigated") return "since mitigation began";
  if (incident.lifecycle === "escalated") return "since field escalation";
  if (incident.lifecycle === "acknowledged") return "since operator acknowledgment";
  return "to action SLA";
}

function createIncidentState(overrides = {}) {
  const createdAt = overrides.createdAt || nowMs();
  return {
    id: overrides.id || `INC-${String(createdAt).slice(-6)}`,
    corridor: "Sundsvall railway track",
    lifecycle: overrides.lifecycle || "new",
    responseMode: overrides.responseMode || "semantic",
    createdAt,
    updatedAt: overrides.updatedAt || createdAt,
    semanticReady: Boolean(overrides.semanticReady),
    semanticReadyAt: overrides.semanticReadyAt || null,
    validated: Boolean(overrides.validated),
    validatedAt: overrides.validatedAt || null,
    actionReady: Boolean(overrides.actionReady),
    actionIssuedAt: overrides.actionIssuedAt || null,
    acknowledgePrompted: Boolean(overrides.acknowledgePrompted),
    acknowledgedAt: overrides.acknowledgedAt || null,
    escalatedAt: overrides.escalatedAt || null,
    mitigatedAt: overrides.mitigatedAt || null,
    closedAt: overrides.closedAt || null,
    fieldCrewStatus: overrides.fieldCrewStatus || "Standby",
    fieldCrewEtaMin: overrides.fieldCrewEtaMin ?? null,
    slaTargetAt: overrides.slaTargetAt || (createdAt + INCIDENT_SIMULATION.slaTargetMs)
  };
}

function incidentHistoryEntry(title, detail, tone = "blue", timestamp = nowMs()) {
  return { title, detail, tone, timestamp };
}

function ensureIncidentHistorySeed() {
  if (demoState.incidentHistory.length) return;
  demoState.incidentHistory = [
    incidentHistoryEntry(
      "Thermal anomaly opened at Sundsvall railway track",
      `P99 ${evidenceP99.toFixed(1)}°C exceeds normal railway track profile.`,
      "red",
      demoState.incident?.createdAt || nowMs()
    )
  ];
}

function appendIncidentHistory(title, detail, tone = "blue", timestamp = nowMs()) {
  const last = demoState.incidentHistory[demoState.incidentHistory.length - 1];
  if (last && last.title === title && last.detail === detail) return;
  demoState.incidentHistory.push(incidentHistoryEntry(title, detail, tone, timestamp));
  demoState.incidentHistory = demoState.incidentHistory.slice(-14);
}

function incidentRuntimeOverrides() {
  if (demoState.viewMode !== "operations" || !demoState.incident) return null;
  const incident = demoState.incident;
  const semanticTransfer = incident.semanticReady
    ? `${evidencePayloads.semantic.adverseTransferMs} ms`
    : "--";
  const semanticReliability = incident.validated
    ? String(evidencePayloads.semantic.adverseReliabilityPct)
    : "--";
  const trustScore = incident.validated
    ? evidenceTrustScore.toFixed(2)
    : incident.semanticReady
      ? DEMO_LIMITS.trustThreshold.toFixed(2)
      : "--";
  const actionLabel = incident.lifecycle === "closed"
    ? "Incident Closed"
    : incident.lifecycle === "mitigated"
      ? (incident.responseMode === "field" ? "Mitigation Active" : "TSR Active")
      : incident.actionReady
        ? actionDisplayLabel(evidenceAction)
        : incident.semanticReady
          ? "Awaiting Validation"
          : "Packet Building";

  return {
    actionLabel,
    trustScore,
    semanticTransfer,
    semanticReliability,
    actionShort: incident.actionReady ? actionShortLabel(evidenceAction) : "WAIT",
    swedenRisk: incident.lifecycle === "closed" ? "Risk cleared" : "Rail buckling risk"
  };
}

function persistDashboardState() {
  try {
    localStorage.setItem(
      DASHBOARD_STORAGE_KEY,
      JSON.stringify({
        season: demoState.season,
        network: demoState.network,
        viewMode: demoState.viewMode,
        lastDemoStage: demoState.lastDemoStage,
        communicationMode: demoState.communicationMode,
        presentationWorkflowOpen: demoState.presentationWorkflowOpen,
        presentationWorkflowIndex: demoState.presentationWorkflowIndex,
        operatorAck: demoState.operatorAck,
        incident: demoState.incident,
        incidentHistory: demoState.incidentHistory,
        railWidth: demoState.persistedRailWidth
      })
    );
  } catch (error) {
    console.warn("Dashboard persistence unavailable", error);
  }
}

function loadPersistedDashboardState() {
  try {
    const raw = localStorage.getItem(DASHBOARD_STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (data.season && seasonalScenarios[data.season]) demoState.season = data.season;
    if ([DEFAULT_NETWORK, ADVERSE_NETWORK].includes(data.network)) demoState.network = data.network;
    if (["operations", "demo"].includes(data.viewMode)) demoState.viewMode = data.viewMode;
    if (demoStages.includes(data.lastDemoStage)) demoState.lastDemoStage = data.lastDemoStage;
    if (COMMUNICATION_MODES.includes(data.communicationMode)) demoState.communicationMode = data.communicationMode;
    if (typeof data.presentationWorkflowOpen === "boolean") demoState.presentationWorkflowOpen = data.presentationWorkflowOpen;
    if (typeof data.presentationWorkflowIndex === "number") demoState.presentationWorkflowIndex = data.presentationWorkflowIndex;
    if (["pending", "acknowledged", "escalated"].includes(data.operatorAck)) demoState.operatorAck = data.operatorAck;
    if (typeof data.railWidth === "number") demoState.persistedRailWidth = data.railWidth;
    if (data.incident) demoState.incident = createIncidentState(data.incident);
    if (Array.isArray(data.incidentHistory)) {
      demoState.incidentHistory = data.incidentHistory.slice(-14);
    }
  } catch (error) {
    console.warn("Failed to restore dashboard state", error);
  }
}

function restartIncidentCycle(reason = "New railway track incident replayed") {
  const incident = createIncidentState();
  demoState.incident = incident;
  demoState.operatorAck = "pending";
  demoState.incidentHistory = [
    incidentHistoryEntry(
      "Thermal anomaly opened at Sundsvall railway track",
      `P99 ${evidenceP99.toFixed(1)}°C exceeds normal railway track profile.`,
      "red",
      incident.createdAt
    )
  ];
  if (reason) {
    appendIncidentHistory(reason, "System restarted the live railway track sequence.", "blue", incident.createdAt + 300);
  }
  if (demoState.selectedDrawer === "corridor" || demoState.selectedDrawer === "incident" || demoState.selectedDrawer === "semantic") {
    demoState.selectedDrawer = demoState.selectedDrawer;
  }
  persistDashboardState();
}

function setIncidentLifecycle(status, options = {}) {
  if (!INCIDENT_LIFECYCLE.includes(status)) return;
  if (!demoState.incident) restartIncidentCycle("");
  const incident = demoState.incident;
  const timestamp = options.timestamp || nowMs();
  if (incident.lifecycle === status && !options.force) return;

  incident.lifecycle = status;
  incident.updatedAt = timestamp;

  if (status === "acknowledged") {
    incident.acknowledgedAt = incident.acknowledgedAt || timestamp;
    incident.responseMode = "semantic";
    incident.fieldCrewStatus = "Prepared";
    incident.fieldCrewEtaMin = null;
    demoState.operatorAck = "acknowledged";
    appendIncidentHistory(
      "Operator acknowledged the live incident",
      "Validated semantic dispatch remains the primary control-center path.",
      "green",
      timestamp
    );
  }

  if (status === "escalated") {
    incident.escalatedAt = incident.escalatedAt || timestamp;
    incident.responseMode = "field";
    incident.fieldCrewStatus = "Dispatching";
    incident.fieldCrewEtaMin = 12;
    demoState.operatorAck = "escalated";
    appendIncidentHistory(
      "Field response requested from the control center",
      "Hybrid support remains armed while crew deployment is prepared.",
      "amber",
      timestamp
    );
  }

  if (status === "mitigated") {
    incident.mitigatedAt = incident.mitigatedAt || timestamp;
    incident.fieldCrewStatus = incident.responseMode === "field" ? "On site" : "Standby";
    appendIncidentHistory(
      incident.responseMode === "field"
        ? "Field crew reports railway track risk contained"
        : "Validated TSR has contained the railway track risk",
      incident.responseMode === "field"
        ? "Crew confirms operational mitigation and keeps semantic updates live."
        : "Control center keeps the semantic path active while the railway track stabilizes.",
      "green",
      timestamp
    );
  }

  if (status === "closed") {
    incident.closedAt = incident.closedAt || timestamp;
    incident.fieldCrewStatus = "Clear";
    incident.fieldCrewEtaMin = null;
    demoState.operatorAck = "pending";
    appendIncidentHistory(
      "Incident closed and archived",
      "The railway track returns to watch mode until the next live incident is created.",
      "blue",
      timestamp
    );
  }

  persistDashboardState();
}

function syncLifecycleStrip() {
  if (!demoState.incident) return;
  const incident = demoState.incident;
  const activeIndex = INCIDENT_LIFECYCLE.indexOf(incident.lifecycle);

  ui.lifecycleItems.forEach(item => {
    const step = item.dataset.lifecycle;
    const index = INCIDENT_LIFECYCLE.indexOf(step);
    const reachedAt = {
      new: incident.createdAt,
      acknowledged: incident.acknowledgedAt,
      escalated: incident.escalatedAt,
      mitigated: incident.mitigatedAt,
      closed: incident.closedAt
    }[step];
    item.classList.toggle("complete", index < activeIndex || (incident.lifecycle === "closed" && step === "closed"));
    item.classList.toggle("active", step === incident.lifecycle);
    item.classList.toggle("pending", index > activeIndex);
    const detail = item.querySelector("b");
    if (detail) {
      detail.textContent = reachedAt ? formatClockTime(reachedAt) : (index === 0 ? formatClockTime(incident.createdAt) : "Waiting");
    }
  });

  if (ui.incidentLifecycleHeadline) {
    ui.incidentLifecycleHeadline.textContent = incidentHeadline(incident);
  }

  if (ui.incidentSlaClock) {
    const baseTime = incident.lifecycle === "closed"
      ? (incident.closedAt + INCIDENT_SIMULATION.recycleAfterClosedMs - nowMs())
      : (incident.slaTargetAt - nowMs());
    ui.incidentSlaClock.textContent = formatCountdown(baseTime);
  }

  if (ui.incidentSlaMeta) {
    ui.incidentSlaMeta.textContent = incidentSlaMeta(incident);
  }
}

function drawerMetricMarkup(items) {
  return items.map(item => `
    <article>
      <span>${item.label}</span>
      <strong>${item.value}</strong>
      <p>${item.detail}</p>
    </article>
  `).join("");
}

function transferModeKey(target) {
  if (target === "transfer-raw") return "raw";
  if (target === "transfer-hybrid") return "hybrid";
  if (target === "transfer-semantic") return "semantic";
  return null;
}

function transferModeTitle(mode) {
  return {
    raw: "RAW transfer detail",
    hybrid: "HYBRID encoder / decoder detail",
    semantic: "SEMANTIC JSON transfer detail"
  }[mode] || "Transfer detail";
}

function datasetEvidenceSummary() {
  return {
    frame: `#${evidenceFrameId}`,
    frameName: evidenceFrameName,
    source: thermalSummary.source || "Actual P2 Pro thermal evidence",
    shape: thermalSummary.shape,
    sampleCount: thermalSummary.sampleCount.toLocaleString(),
    hotspot: `x${evidenceHotspotX}, y${evidenceHotspotY}`,
    p95: `${evidenceP95.toFixed(1)}°C`,
    p99: `${evidenceP99.toFixed(1)}°C`,
    max: `${evidenceMax.toFixed(1)}°C`,
    delta: `${evidenceDelta.toFixed(1)}°C`,
    risk: String(evidenceRisk).toUpperCase(),
    confidence: evidenceConfidence.toFixed(2),
    action: actionDisplayLabel(evidenceAction)
  };
}

function transferModeEvidence(mode) {
  const data = datasetEvidenceSummary();
  return {
    raw: [
      { label: "Raw matrix", value: `${data.shape}`, detail: `${data.frameName} · full P2 Pro array` },
      { label: "Payload", value: evidencePayloads.raw.label, detail: "Full thermal frame plus image preview can travel." },
      { label: "Visible evidence", value: "Normal + heat image", detail: `Hotspot remains visible at ${data.hotspot}.` },
      { label: "Receiver work", value: "Interpret pixels", detail: `Operator or cloud logic still derives ${data.risk} risk from the image.` }
    ],
    hybrid: [
      { label: "Compressed preview", value: evidencePayloads.hybrid.label, detail: "Reduced image evidence is still available at the receiver." },
      { label: "Measurements", value: `${data.p99} P99`, detail: `P95 ${data.p95} · max ${data.max} · delta ${data.delta}.` },
      { label: "Localization", value: data.hotspot, detail: `Frame ${data.frame} keeps the hotspot coordinate for review.` },
      { label: "Receiver work", value: "Decode + validate", detail: `Preview plus metadata supports ${data.action}.` }
    ],
    semantic: [
      { label: "JSON payload", value: evidencePayloads.semantic.label, detail: "Only task-ready meaning travels over the constrained link." },
      { label: "Risk fields", value: `${data.risk} · ${data.confidence}`, detail: `P99 ${data.p99}, delta ${data.delta}, hotspot ${data.hotspot}.` },
      { label: "Action field", value: data.action, detail: "The receiver gets the command recommendation, not the image." },
      { label: "Visual evidence", value: "Not sent", detail: "No normal frame or thermal image is transmitted in semantic-only mode." }
    ]
  }[mode] || [];
}

function transferModePipeline(mode) {
  const data = datasetEvidenceSummary();
  return {
    raw: [
      { label: "Sensor", value: "Full thermal frame", detail: `${data.shape} P2 Pro matrix from ${data.source}.` },
      { label: "Encoder", value: "Pass-through", detail: "No reduction." },
      { label: "Network", value: evidencePayloads.raw.label, detail: "Full payload travels through the gateway path." },
      { label: "Receiver", value: "Image review", detail: "Meaning is inferred after the payload arrives." }
    ],
    hybrid: [
      { label: "Sensor", value: "Image + measurements", detail: `Frame ${data.frame}: P95, P99, max, delta, and hotspot coordinate.` },
      { label: "Encoder", value: "Compress + extract", detail: "Keep a preview and the useful numeric fields." },
      { label: "Network", value: evidencePayloads.hybrid.label, detail: "Reduced evidence travels over the wireless link." },
      { label: "Decoder", value: "Preview + metadata", detail: "The control center can still see a compact detection view." }
    ],
    semantic: [
      { label: "Sensor", value: "Thermal features", detail: `P99 ${data.p99} + delta ${data.delta} at ${data.hotspot}.` },
      { label: "Encoder", value: "Meaning only", detail: "Risk + trust + action." },
      { label: "Network", value: evidencePayloads.semantic.label, detail: "Only the JSON meaning travels." },
      { label: "Receiver", value: "Validate + act", detail: "No image rebuild." }
    ]
  }[mode] || [];
}

function transferModeRecommendation(mode) {
  return {
    raw: "Use RAW for healthy links and full inspection.",
    hybrid: "Use HYBRID when visual context still matters.",
    semantic: "Use SEMANTIC when the link is poor and action is urgent."
  }[mode] || "";
}

function transferDrawerVisualMarkup(activeMode) {
  const data = datasetEvidenceSummary();
  const semanticSnippet = {
    frame_id: evidenceFrameId,
    hotspot: { x: evidenceHotspotX, y: evidenceHotspotY },
    p99_temp_c: Number(evidenceP99.toFixed(1)),
    max_temp_c: Number(evidenceMax.toFixed(1)),
    risk_label: evidenceRisk,
    confidence: evidenceConfidence,
    recommended_action: evidenceAction
  };
  const modeCards = [
    {
      mode: "raw",
      icon: "IMG",
      title: "RAW",
      payload: evidencePayloads.raw.label,
      time: `${evidencePayloads.raw.adverseTransferMs} ms`,
      output: "Full frames",
      copy: "image stream"
    },
    {
      mode: "hybrid",
      icon: "ENC",
      title: "HYBRID",
      payload: evidencePayloads.hybrid.label,
      time: `${evidencePayloads.hybrid.adverseTransferMs} ms`,
      output: "Rebuilt preview",
      copy: "codec + metadata"
    },
    {
      mode: "semantic",
      icon: "JSON",
      title: "SEMANTIC",
      payload: evidencePayloads.semantic.label,
      time: `${evidencePayloads.semantic.adverseTransferMs} ms`,
      output: "Action fields",
      copy: "meaning only"
    }
  ];

  const cards = modeCards.map(card => `
    <button class="drawer-mode-visual-card ${card.mode}${card.mode === activeMode ? " active" : ""}" type="button" onclick="window.openTransferMode && window.openTransferMode('${card.mode}')">
      <span class="drawer-mode-icon">${card.icon}</span>
      <strong>${card.title}</strong>
      <small>${card.copy}</small>
      <i><b>${card.payload}</b><em>${card.time}</em></i>
      <span class="drawer-mode-bar"><u></u></span>
      <mark>${card.output}</mark>
    </button>
  `).join("");

  return `
    <div class="drawer-transfer-hero ${activeMode}" aria-label="RAW HYBRID SEMANTIC transfer comparison">
      <div class="drawer-dataset-strip">
        <span>Real evidence</span>
        <b>${data.source}</b>
        <i>${data.sampleCount} samples · frame ${data.frame} · ${data.shape} · hotspot ${data.hotspot}</i>
      </div>
      <div class="drawer-transfer-flow">
        <article class="drawer-flow-node sensor">
          <span class="drawer-mode-icon">SEN</span>
          <b>Sensor</b>
          <small>${data.frameName}</small>
          <div class="drawer-flow-images">
            <img src="evidence/p2pro_representative.png" alt="Normal rail sensor frame" />
            <img src="evidence/p2pro_thermal_heatmap.png" alt="Thermal rail anomaly frame" />
          </div>
          <div class="drawer-measure-grid">
            <span><b>P95</b><i>${data.p95}</i></span>
            <span><b>P99</b><i>${data.p99}</i></span>
            <span><b>MAX</b><i>${data.max}</i></span>
            <span><b>Δ</b><i>${data.delta}</i></span>
          </div>
        </article>
        <article class="drawer-flow-node encoder">
          <span class="drawer-mode-icon">ENC</span>
          <b>${activeMode === "raw" ? "Pass-through" : activeMode === "hybrid" ? "Encode features" : "Extract meaning"}</b>
          <small>${activeMode === "semantic" ? "frame + hotspot + risk + action" : activeMode === "hybrid" ? "preview + p95/p99/max/hotspot" : "all pixels and metadata"}</small>
          <div class="drawer-encoder-stack">
            <span class="${activeMode === "raw" ? "active" : ""}">Full matrix</span>
            <span class="${activeMode === "hybrid" ? "active" : ""}">Compressed preview</span>
            <span class="${activeMode === "semantic" ? "active" : ""}">JSON meaning</span>
          </div>
        </article>
        <article class="drawer-flow-network ${activeMode}">
          <span>Wireless link</span>
          <i></i>
          <b>${activeMode === "raw" ? evidencePayloads.raw.label : activeMode === "hybrid" ? evidencePayloads.hybrid.label : evidencePayloads.semantic.label}</b>
        </article>
        <article class="drawer-flow-node receiver">
          <span class="drawer-mode-icon">${activeMode === "semantic" ? "VAL" : "DEC"}</span>
          <b>${activeMode === "raw" ? "View images" : activeMode === "hybrid" ? "Decode preview" : "Validate JSON"}</b>
          <small>${activeMode === "semantic" ? "no image transfer" : "visual context available"}</small>
          <pre ${activeMode === "semantic" ? "" : "hidden"}>${JSON.stringify(semanticSnippet, null, 2)}</pre>
          <div class="drawer-receiver-result" ${activeMode === "semantic" ? "hidden" : ""}>
            <span>${activeMode === "raw" ? "Manual interpretation" : "Decoded preview"}</span>
            <b>${data.risk} · ${data.action}</b>
          </div>
        </article>
      </div>
      <div class="drawer-mode-comparison">${cards}</div>
    </div>
  `;
}

function syncDashboardDrawer() {
  if (!ui.dashboardDrawer || !ui.drawerScrim) return;
  const target = demoState.selectedDrawer;
  const transferMode = transferModeKey(target);
  const isSemanticExplainer = target === "semantic-explainer";
  const isTransferDetail = Boolean(transferMode);
  const incident = demoState.incident || (
    (isSemanticExplainer || isTransferDetail)
      ? createIncidentState({ semanticReady: true, validated: true, actionReady: true })
      : null
  );
  const open = Boolean(target && incident);
  document.body.classList.toggle("drawer-open", open);
  document.body.classList.toggle("transfer-drawer-open", open && isTransferDetail);
  ui.drawerScrim.hidden = !open;
  ui.dashboardDrawer.setAttribute("aria-hidden", open ? "false" : "true");
  ui.dashboardDrawer.dataset.transferMode = open && isTransferDetail ? transferMode : "";
  if (ui.drawerVisualSection) {
    ui.drawerVisualSection.hidden = !(open && isTransferDetail);
    ui.drawerVisualSection.innerHTML = open && isTransferDetail ? transferDrawerVisualMarkup(transferMode) : "";
  }
  if (!open || !incident) return;

  const subtitleByTarget = {
    incident: "Primary alarm evidence, current lifecycle state, and control-room recommendation.",
    semantic: "Receiver-ready semantic packet, trust gate status, and fallback posture.",
    corridor: "Railway track state, link conditions, and field-response posture.",
    "semantic-explainer": "Short control-room framing for RAW, HYBRID, and SEMANTIC communication.",
    "transfer-raw": "Exactly what travels when the control center receives the full image and sensor stream.",
    "transfer-hybrid": "Exactly what travels when the edge encoder compresses evidence and the receiver decoder restores a preview.",
    "transfer-semantic": "Exactly what travels when the receiver gets text-only semantic meaning."
  };

  const evidenceByTarget = {
    incident: [
      { label: "Incident ID", value: incident.id, detail: incident.corridor },
      { label: "P99 temperature", value: `${evidenceP99.toFixed(1)}°C`, detail: `Delta ${evidenceDelta.toFixed(1)}°C from baseline` },
      { label: "Lifecycle", value: lifecycleLabel(incident.lifecycle), detail: `Opened ${formatClockTime(incident.createdAt)}` },
      { label: "Action state", value: incident.actionReady ? actionDisplayLabel(evidenceAction) : "Awaiting validation", detail: incident.responseMode === "field" ? "Field support remains armed" : "Semantic path remains primary" }
    ],
    semantic: [
      { label: "Payload", value: evidencePayloads.semantic.label, detail: `${evidencePayloads.semantic.adverseTransferMs} ms under constrained uplink` },
      { label: "Freshness", value: `${semanticFreshnessFor(demoState.network || DEFAULT_NETWORK)} s`, detail: "Receiver goal: TSR decision" },
      { label: "Integrity", value: evidenceIntegrity.toUpperCase(), detail: evidenceProvenance },
      { label: "Fallback", value: evidenceFallback.replace(/_/g, " "), detail: "Only used if trust, integrity, or freshness fail" }
    ],
    corridor: [
      { label: "Railway track", value: incident.corridor, detail: "Remote summer rail monitoring zone" },
      { label: "Link mode", value: demoState.network === ADVERSE_NETWORK ? "Constrained uplink" : "Nominal uplink", detail: "Sweden rail control center receiver path" },
      { label: "Field crew", value: incident.fieldCrewStatus, detail: incident.fieldCrewEtaMin ? `ETA ${incident.fieldCrewEtaMin} min` : "No dispatch in progress" },
      { label: "Operator mode", value: demoState.operatorAck === "escalated" ? "Escalated" : demoState.operatorAck === "acknowledged" ? "Acknowledged" : "Monitoring", detail: "Command wall and map remain synchronized" }
    ],
    "semantic-explainer": [
      {
        label: "Definition",
        value: "Adaptive communication",
        detail: "The control center chooses RAW, HYBRID, or SEMANTIC depending on wireless link quality and bandwidth policy."
      },
      {
        label: "Receiver need",
        value: "Evidence when possible, meaning when needed",
        detail: "Good links carry images; limited links use encoder and decoder; poor links send text-only JSON."
      }
    ]
  };

  const trustItems = [
    { label: "Confidence", value: incident.validated ? evidenceConfidence.toFixed(2) : "--", detail: "Semantic receiver confidence gate" },
    { label: "Trust score", value: incident.validated ? evidenceTrustScore.toFixed(2) : (incident.semanticReady ? DEMO_LIMITS.trustThreshold.toFixed(2) : "--"), detail: "Delivery, freshness, integrity, provenance, policy" },
    { label: "Delivery", value: incident.validated ? `${evidencePayloads.semantic.adverseReliabilityPct}%` : "--", detail: "Constrained semantic success rate" },
    { label: "Policy target", value: incident.actionReady ? "TSR policy v2" : "Awaiting validation", detail: "Approved action path before operator release" }
  ];

  const explainModes = [
    {
      label: "RAW",
      value: "Full image + sensor stream",
      detail: `${evidencePayloads.raw.label} of normal image, thermal image, and sensor sequence. Best when 5G, 6G, LoRa, or IoT link capacity is healthy.`
    },
    {
      label: "HYBRID",
      value: "Encoder / decoder mode",
      detail: `${evidencePayloads.hybrid.label} compressed visual evidence plus semantic metadata. The receiver can still see a preview.`
    },
    {
      label: "SEMANTIC",
      value: "Text-only JSON",
      detail: `${evidencePayloads.semantic.label} with risk, confidence, freshness, and recommended action. No detection image is transmitted.`
    }
  ];

  const trustListItems = isSemanticExplainer ? explainModes : trustItems;
  const recommendationCopy = isTransferDetail
    ? transferModeRecommendation(transferMode)
    : isSemanticExplainer
    ? "Use RAW when the link can carry full evidence, HYBRID when visual context is still useful but bandwidth is limited, and SEMANTIC JSON when the connection is too poor for images."
    : incident.lifecycle === "closed"
      ? "Cycle complete. Keep the railway track under watch and let the system seed the next incident."
      : incident.lifecycle === "mitigated"
        ? "Hold the validated command path until the railway track remains stable, then return to watch mode."
        : incident.lifecycle === "escalated"
          ? "Keep semantic dispatch primary, preserve hybrid fallback, and prioritize crew arrival coordination."
          : incident.lifecycle === "acknowledged"
            ? "Keep the semantic path primary and avoid sending RAW evidence unless trust or freshness degrade."
            : incident.validated
              ? "The incident is action-ready. Operator should acknowledge ownership or escalate to field support."
              : "Allow the edge and receiver to finish semantic validation before widening the payload.";

  if (ui.drawerKicker) ui.drawerKicker.textContent = isTransferDetail ? "Transfer mode" : isSemanticExplainer ? "Semantic explainer" : target === "semantic" ? "Semantic packet" : target === "corridor" ? "Railway track drill-down" : "Incident drill-down";
  if (ui.drawerTitle) ui.drawerTitle.textContent = isTransferDetail ? transferModeTitle(transferMode) : isSemanticExplainer ? "What is Semantic Communication?" : target === "semantic" ? "TS-04 semantic incident packet" : target === "corridor" ? "Sundsvall railway track status" : "Primary alarm evidence";
  if (ui.drawerSubtitle) ui.drawerSubtitle.textContent = subtitleByTarget[target] || subtitleByTarget.incident;
  if (ui.drawerStatusChip) {
    ui.drawerStatusChip.textContent = isTransferDetail ? transferMode.toUpperCase() : isSemanticExplainer ? "Control concept" : lifecycleLabel(incident.lifecycle);
    ui.drawerStatusChip.className = isTransferDetail ? `dashboard-drawer-status info transfer-${transferMode}` : isSemanticExplainer ? "dashboard-drawer-status info" : `dashboard-drawer-status ${incident.lifecycle}`;
  }
  if (ui.drawerEvidenceSection) ui.drawerEvidenceSection.hidden = false;
  if (ui.drawerTrustSection) ui.drawerTrustSection.hidden = false;
  if (ui.drawerRecommendationSection) ui.drawerRecommendationSection.hidden = false;
  if (ui.drawerTimelineSection) ui.drawerTimelineSection.hidden = isSemanticExplainer || isTransferDetail;
  if (ui.drawerEvidenceLabel) ui.drawerEvidenceLabel.textContent = isTransferDetail ? "Transmitted data" : isSemanticExplainer ? "Definition" : "Evidence";
  if (ui.drawerTrustLabel) ui.drawerTrustLabel.textContent = isTransferDetail ? "Pipeline" : isSemanticExplainer ? "Modes" : "Trust checks";
  if (ui.drawerRecommendationLabel) ui.drawerRecommendationLabel.textContent = isTransferDetail ? "Mode selection" : isSemanticExplainer ? "Why it matters" : "Recommendation";
  if (ui.drawerTimelineLabel) ui.drawerTimelineLabel.textContent = "Timeline";
  if (ui.drawerEvidenceList) ui.drawerEvidenceList.innerHTML = drawerMetricMarkup(isTransferDetail ? transferModeEvidence(transferMode) : (evidenceByTarget[target] || evidenceByTarget.incident));
  if (ui.drawerTrustList) ui.drawerTrustList.innerHTML = drawerMetricMarkup(isTransferDetail ? transferModePipeline(transferMode) : trustListItems);
  if (ui.drawerRecommendation) ui.drawerRecommendation.textContent = recommendationCopy;
  if (ui.drawerTimeline && !isSemanticExplainer && !isTransferDetail) {
    ui.drawerTimeline.innerHTML = demoState.incidentHistory.slice(-6).reverse().map(entry => `
      <article>
        <span>${formatClockTime(entry.timestamp)}</span>
        <strong>${entry.title}</strong>
        <p>${entry.detail}</p>
      </article>
    `).join("");
  }
}

function openTransferMode(mode) {
  if (!COMMUNICATION_MODES.includes(mode)) return;
  if (typeof setCommunicationMode === "function") setCommunicationMode(mode);
  openDrawer(`transfer-${mode}`);
}

function openDrawer(target) {
  demoState.selectedDrawer = target;
  syncDashboardDrawer();
  persistDashboardState();
}

function closeDrawer() {
  demoState.selectedDrawer = null;
  syncDashboardDrawer();
  persistDashboardState();
}

function syncMapDrawerHotspot() {
  if (!ui.mapDrawerHotspot || typeof toScreen !== "function" || !cities || !cities.Sundsvall) return;
  const hotspot = toScreen(cities.Sundsvall);
  ui.mapDrawerHotspot.style.left = `${hotspot.x + 18}px`;
  ui.mapDrawerHotspot.style.top = `${hotspot.y - 18}px`;
  ui.mapDrawerHotspot.hidden = demoState.viewMode !== "operations";
}

function initializeDashboardState() {
  const bootstrap = window.DASHBOARD_BOOTSTRAP || {};
  if (bootstrap.season && seasonalScenarios[bootstrap.season]) demoState.season = bootstrap.season;
  if ([DEFAULT_NETWORK, ADVERSE_NETWORK].includes(bootstrap.network)) demoState.network = bootstrap.network;
  if (["operations", "demo"].includes(bootstrap.viewMode)) demoState.viewMode = bootstrap.viewMode;
  if (demoStages.includes(bootstrap.lastDemoStage)) demoState.lastDemoStage = bootstrap.lastDemoStage;
  loadPersistedDashboardState();
  if (!demoState.incident) {
    restartIncidentCycle("");
  } else {
    ensureIncidentHistorySeed();
    if (demoState.incident.closedAt && nowMs() - demoState.incident.closedAt > INCIDENT_SIMULATION.recycleAfterClosedMs) {
      restartIncidentCycle("Fresh railway track incident seeded");
    }
  }
  demoState.selectedDrawer = null;
}

function syncDashboardStateSurfaces() {
  if (typeof refreshSemanticRuntime === "function") refreshSemanticRuntime();
  if (typeof syncCommandWallState === "function") syncCommandWallState();
  if (typeof syncOperationsWall === "function") syncOperationsWall();
  syncLifecycleStrip();
  syncDashboardDrawer();
  syncMapDrawerHotspot();
}

function runIncidentSimulatorTick() {
  if (!demoState.incident) restartIncidentCycle("");
  const incident = demoState.incident;
  const current = nowMs();
  demoState.lastSimulatorTickAt = current;
  let dirty = false;

  if (!incident.semanticReady && current - incident.createdAt >= INCIDENT_SIMULATION.semanticReadyDelayMs) {
    incident.semanticReady = true;
    incident.semanticReadyAt = current;
    incident.updatedAt = current;
    appendIncidentHistory(
      "Semantic packet generated at edge",
      `Risk, trust, freshness, and action compressed to ${evidencePayloads.semantic.label}.`,
      "violet",
      current
    );
    dirty = true;
  }

  if (!incident.validated && current - incident.createdAt >= INCIDENT_SIMULATION.receiverValidatedDelayMs) {
    incident.validated = true;
    incident.validatedAt = current;
    incident.actionReady = true;
    incident.actionIssuedAt = current;
    incident.updatedAt = current;
    appendIncidentHistory(
      "Receiver validates the packet",
      `Confidence ${evidenceConfidence.toFixed(2)} · trust score ${evidenceTrustScore.toFixed(2)} · signed integrity passes.`,
      "green",
      current
    );
    dirty = true;
  }

  if (incident.validated && !incident.acknowledgePrompted && incident.lifecycle === "new" && current - incident.createdAt >= INCIDENT_SIMULATION.acknowledgePromptDelayMs) {
    incident.acknowledgePrompted = true;
    appendIncidentHistory(
      "Operator ownership still pending",
      "The receiver is ready, but the incident is waiting for acknowledgment or escalation.",
      "amber",
      current
    );
    dirty = true;
  }

  if (incident.lifecycle === "acknowledged" && !incident.mitigatedAt && incident.acknowledgedAt && current - incident.acknowledgedAt >= INCIDENT_SIMULATION.mitigateAfterAcknowledgedMs) {
    setIncidentLifecycle("mitigated", { timestamp: current });
    dirty = true;
  }

  if (incident.lifecycle === "escalated" && !incident.mitigatedAt && incident.escalatedAt && current - incident.escalatedAt >= INCIDENT_SIMULATION.mitigateAfterEscalatedMs) {
    setIncidentLifecycle("mitigated", { timestamp: current });
    dirty = true;
  }

  if (incident.lifecycle === "mitigated") {
    const baseline = incident.responseMode === "field" ? incident.escalatedAt || incident.mitigatedAt : incident.acknowledgedAt || incident.mitigatedAt;
    if (!incident.closedAt && baseline && current - baseline >= (incident.responseMode === "field" ? INCIDENT_SIMULATION.closeAfterEscalatedMs : INCIDENT_SIMULATION.closeAfterAcknowledgedMs)) {
      setIncidentLifecycle("closed", { timestamp: current });
      dirty = true;
    }
  }

  if (incident.lifecycle === "closed" && incident.closedAt && current - incident.closedAt >= INCIDENT_SIMULATION.recycleAfterClosedMs) {
    restartIncidentCycle("Fresh railway track incident seeded");
    syncDashboardStateSurfaces();
    return;
  }

  if (dirty) persistDashboardState();
  syncDashboardStateSurfaces();
}

function startIncidentSimulator() {
  if (demoState.simulatorTimer) clearInterval(demoState.simulatorTimer);
  runIncidentSimulatorTick();
  demoState.simulatorTimer = setInterval(runIncidentSimulatorTick, DEMO_LIMITS.simulatorIntervalMs);
}

function bindDashboardDrawerTriggers() {
  ui.drawerTriggers.forEach(trigger => {
    const target = trigger.dataset.drawerTarget;
    if (!target) return;
    trigger.addEventListener("click", () => {
      const transferMode = transferModeKey(target);
      if (transferMode) openTransferMode(transferMode);
      else openDrawer(target);
    });
    trigger.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        const transferMode = transferModeKey(target);
        if (transferMode) openTransferMode(transferMode);
        else openDrawer(target);
      }
    });
  });
  if (ui.drawerClose) ui.drawerClose.addEventListener("click", closeDrawer);
  if (ui.drawerScrim) ui.drawerScrim.addEventListener("click", closeDrawer);
}

window.openDrawer = openDrawer;
window.closeDrawer = closeDrawer;
window.openTransferMode = openTransferMode;
