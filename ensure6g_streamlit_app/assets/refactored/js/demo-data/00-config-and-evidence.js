// Phase 9: decision engine added after trust validation. The map highlights the affected railway track when TSR is issued.
const DEMO_LIMITS = {
  trustThreshold: 0.80,
  trustScorePass: 0.91,
  trustScoreFail: 0.42,
  freshnessThresholdS: 18,
  semanticDeliveryThresholdPct: 95,
  fallbackStageDurationMs: 18000,
  presenterTimerIntervalMs: 250,
  simulatorIntervalMs: 1000
};

const INCIDENT_SIMULATION = {
  semanticReadyDelayMs: 3000,
  receiverValidatedDelayMs: 6000,
  acknowledgePromptDelayMs: 12000,
  mitigateAfterAcknowledgedMs: 18000,
  closeAfterAcknowledgedMs: 30000,
  mitigateAfterEscalatedMs: 16000,
  closeAfterEscalatedMs: 30000,
  recycleAfterClosedMs: 12000,
  slaTargetMs: 20 * 60 * 1000
};

const DASHBOARD_STORAGE_KEY = "ensure6g-control-center:v2";
const INCIDENT_LIFECYCLE = ["new", "acknowledged", "escalated", "mitigated", "closed"];
const COMMUNICATION_MODES = ["raw", "hybrid", "semantic"];

const APPROVED_ACTIONS = [
  "TSR",
  "issue_tsr",
  "winter_speed_check",
  "heat_patrol",
  "drainage_inspection",
  "adhesion_warning"
];

const thermalSummary = typeof THERMAL_SUMMARY !== "undefined" ? THERMAL_SUMMARY : {
  source: "Thermal evidence summary unavailable",
  sampleCount: 0,
  shape: "unknown",
  riskDistribution: { low: 0, medium: 0, high: 0 },
  ranges: {
    p99TempC: { min: 0, median: 0, max: 0 },
    deltaTempC: { min: 0, median: 0, max: 0 }
  },
  representativeEvent: {
    frameId: 325,
    frameName: "p2img00325.npy",
    hotspotX: 185,
    hotspotY: 161,
    p95TempC: 41.6,
    p99TempC: 42.9,
    meanTempC: 38.5,
    maxTempC: 45.9,
    deltaTempC: 4.5,
    risk: "high",
    confidence: 0.96,
    recommendedAction: "issue_tsr",
    semanticEvent: {
      event_type: "thermal_hotspot",
      frame_id: 325,
      hotspot_x: 185,
      hotspot_y: 161,
      p95_temp_c: 41.6,
      p99_temp_c: 42.9,
      max_temp_c: 45.9,
      delta_temp_c: 4.5,
      risk_label: "high",
      confidence: 0.96,
      recommended_action: "issue_tsr"
    }
  },
  payloads: {
    raw: { label: "192.0 KB", bytes: 196608, adverseTransferMs: 3146, adverseReliabilityPct: 52 },
    hybrid: { label: "23.2 KB", bytes: 23762, adverseTransferMs: 380, adverseReliabilityPct: 82, reductionPct: 87.9 },
    semantic: { label: "169 B", bytes: 169, adverseTransferMs: 3, adverseReliabilityPct: 99, reductionPct: 99.9 }
  }
};

const evidenceEvent = thermalSummary.representativeEvent;
const evidenceSemanticEvent = evidenceEvent.semanticEvent || {};
const evidencePayloads = thermalSummary.payloads;
const evidenceConfidence = Number(evidenceEvent.confidence || 0.96);
const evidenceTrustScore = Math.max(evidenceConfidence, DEMO_LIMITS.trustScorePass);
const evidenceP99 = Number(evidenceEvent.p99TempC || 42.9);
const evidenceP95 = Number(evidenceEvent.p95TempC || evidenceSemanticEvent.p95_temp_c || 41.6);
const evidenceMax = Number(evidenceEvent.maxTempC || evidenceSemanticEvent.max_temp_c || 45.9);
const evidenceDelta = Number(evidenceEvent.deltaTempC || 4.5);
const evidenceFrameId = Number(evidenceEvent.frameId || evidenceSemanticEvent.frame_id || 325);
const evidenceFrameName = evidenceEvent.frameName || `p2img${String(evidenceFrameId).padStart(5, "0")}.npy`;
const evidenceHotspotX = Number(evidenceEvent.hotspotX || evidenceSemanticEvent.hotspot_x || 185);
const evidenceHotspotY = Number(evidenceEvent.hotspotY || evidenceSemanticEvent.hotspot_y || 161);
const evidenceAction = evidenceEvent.recommendedAction || "issue_tsr";
const evidenceActionLabel = evidenceAction === "issue_tsr"
  ? "TSR"
  : String(evidenceAction).replace(/_/g, " ").toUpperCase();
const evidenceRisk = evidenceEvent.risk || "high";
const evidenceFreshnessS = 12;
const evidenceIntegrity = "signed";
const evidenceProvenance = "P2 Pro / TS-04";
const evidenceTaskGoal = "TSR decision";
const evidenceFallback = "request_hybrid_preview";
const evidencePrivacy = "task-only fields";

const demoStages = ["mission", "sensing", "fusion", "constraint", "decision", "outcome"];
const stageDurationsMs = {
  mission: 8000,
  sensing: 8000,
  fusion: 10000,
  constraint: 12000,
  decision: 8000,
  outcome: 8000
};

const demoState = {
  stage: "mission",
  network: "normal",
  viewMode: "operations",
  lastDemoStage: "sensing",
  communicationMode: "semantic",
  presentationWorkflowOpen: false,
  presentationWorkflowIndex: -1,
  operatorAck: "pending",
  selectedDrawer: null,
  anomalyDetected: false,
  sensorObservation: null,
  semanticEvent: null,
  trustResult: null,
  actionIssued: false,
  tmsAction: null,
  autoplay: false,
  stageStartedAt: Date.now(),
  stageDurationMs: 0,
  autoplayTimer: null,
  stageEnteredAt: Date.now(),
  mapSyncEnabled: false,
  simulatorTimer: null,
  lastSimulatorTickAt: 0,
  incident: null,
  incidentHistory: [],
  persistedRailWidth: null
};

const DEFAULT_SEASON = "summer";
const DEFAULT_NETWORK = "normal";
const ADVERSE_NETWORK = "adverse";
demoState.season = DEFAULT_SEASON;
