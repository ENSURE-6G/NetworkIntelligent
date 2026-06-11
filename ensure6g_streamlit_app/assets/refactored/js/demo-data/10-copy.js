const SEASON_COPY = {
  winter: {
    missionContext: "Sweden's remote winter railway tracks",
    missionCue: "remote winter railway track",
    sensingMessage: `Edge flags a Sweden-relevant rail risk: possible frost-heave or snow-related obstruction, P99 ${evidenceP99.toFixed(1)}°C.`,
    sensingCue: "winter rail risk",
    sensingCondition: "evidence-derived winter rail risk",
    sensingMapTitle: "Winter rail risk located",
    sensingMapLine: "Edge flags frost-heave / snow risk",
    fusionSummary: `Frost-heave risk · freshness ${evidenceFreshnessS}s`
  },
  spring: {
    missionContext: "Sweden's remote railway tracks",
    missionCue: "remote railway track",
    sensingMessage: `Edge detects a railway track anomaly and frames it against the receiver goal, P99 ${evidenceP99.toFixed(1)}°C.`,
    sensingCue: "goal-relevant railway track anomaly",
    sensingCondition: "evidence-derived goal-relevant railway track anomaly",
    sensingMapTitle: "Goal-relevant anomaly located",
    sensingMapLine: "Edge ties the hotspot to the receiver goal",
    fusionSummary: `${evidenceTaskGoal} · railway track context retained`
  },
  summer: {
    missionContext: "Sweden's remote summer railway tracks",
    missionCue: "remote summer railway track",
    sensingMessage: `Edge flags a summer rail heat risk: high rail temperature can create rail buckling risk, P99 ${evidenceP99.toFixed(1)}°C.`,
    sensingCue: "summer rail buckling risk",
    sensingCondition: "evidence-derived summer rail buckling risk",
    sensingMapTitle: "Summer rail risk located",
    sensingMapLine: "High temperature can create rail buckling risk",
    fusionSummary: `Rail buckling risk · freshness ${evidenceFreshnessS}s`
  },
  autumn: {
    missionContext: "Sweden's remote railway tracks",
    missionCue: "remote railway track",
    sensingMessage: `Edge detects the anomaly and prepares an action-ready handoff, P99 ${evidenceP99.toFixed(1)}°C.`,
    sensingCue: "action-ready railway track anomaly",
    sensingCondition: "evidence-derived action-ready railway track anomaly",
    sensingMapTitle: "Action-ready anomaly located",
    sensingMapLine: `Edge prepares ${evidenceActionLabel} as the next step`,
    fusionSummary: `${evidenceActionLabel} ready · freshness ${evidenceFreshnessS}s`
  }
};

function seasonCopyFor(season = DEFAULT_SEASON) {
  return SEASON_COPY[season] || SEASON_COPY[DEFAULT_SEASON];
}

const stageCopy = {
  mission: {
    title: "Integrated Semantic Rail System",
    message: season => `Validated components form a control-center workflow for remote rail monitoring.`
  },
  sensing: {
    title: "Incident Detection",
    message: season => `Control center alert: ${seasonCopyFor(season).sensingMessage}`
  },
  fusion: {
    title: "Semantic Event",
    message: season => `Edge AI condenses the full thermal frame into one receiver-ready rail decision: ${evidenceRisk.toUpperCase()} risk, ${evidenceConfidence.toFixed(2)} confidence, ${evidenceActionLabel} action.`
  },
  constraint: {
    title: "Link Operations",
    message: season => `Constrained uplink state: semantic delivery stays action-ready at ${evidencePayloads.semantic.label}, ${evidencePayloads.semantic.adverseTransferMs} ms, ${evidencePayloads.semantic.adverseReliabilityPct}% delivery.`
  },
  decision: {
    title: "Receiver Decision",
    message: season => `Three receiver checks pass, so the control center issues a TSR instead of waiting for heavier evidence.`
  },
  outcome: {
    title: "Coverage and Outcome",
    message: season => `90%+ lower routine traffic while preserving safe rail action across Sweden and other Nordic remote operations.`
  }
};

function presenterCueFor(stage, season = DEFAULT_SEASON) {
  const seasonCopy = seasonCopyFor(season);
  const cues = {
    mission: `Open with the operational challenge: ${seasonCopy.missionCue}, limited uplink, heavy sensor data, operator needs action not pixels.`,
    sensing: `Point at Sundsvall and say the edge detects ${seasonCopy.sensingCue} early, before a dispatcher sees the raw image.`,
    fusion: "Say this plainly: full thermal pixels become a tiny trusted rail meaning packet.",
    constraint: "This is the proof slide: same event, RAW struggles to arrive, semantic arrives fast enough to act.",
    decision: "Keep it simple: three checks pass, so TSR is issued; if trust fails, raise remote inspection priority.",
    outcome: "Close with transferability: rail first, then forestry, ports, mining, and harsh Nordic infrastructure."
  };
  return cues[stage] || cues.mission;
}

function stageMessageFor(stage, season = DEFAULT_SEASON) {
  const entry = stageCopy[stage] || stageCopy.mission;
  return typeof entry.message === "function" ? entry.message(season) : entry.message;
}

function sensorObservationFor(season = DEFAULT_SEASON) {
  return {
    sensor: "TS-04",
    asset: "rail / ballast",
    location: "Sundsvall railway track",
    temperatureC: evidenceP99,
    condition: seasonCopyFor(season).sensingCondition,
    deltaTempC: evidenceDelta,
    confidence: evidenceConfidence,
    action: evidenceAction,
    receiverGoal: evidenceTaskGoal
  };
}

const PRESENTATION_WORKFLOW = [
  {
    title: "Operational challenge",
    meta: "Start on the control-center wall so non-technical viewers first understand the rail problem, not the implementation.",
    cue: "Say: remote railway tracks produce heavy sensor data, but the operator does not need every pixel. The operator needs trusted action fast.",
    viewMode: "operations",
    stage: "mission",
    communicationMode: "semantic",
    season: "summer",
    network: ADVERSE_NETWORK
  },
  {
    title: "What semantic communication is",
    meta: "Stay on the overview wall and point to the queue card, explainer, and validation strip.",
    cue: "Say: RAW sends everything, HYBRID sends reduced evidence plus metadata, and SEMANTIC sends only the task-ready meaning the receiver needs.",
    viewMode: "operations",
    stage: "mission",
    communicationMode: "semantic",
    season: "summer",
    network: ADVERSE_NETWORK
  },
  {
    title: "Incident detected at the edge",
    meta: "Move into the guided demo so the audience sees a real railway track event, not an abstract concept.",
    cue: "Say: here the edge detects the summer rail buckling risk at Sundsvall before the control center needs the raw frame.",
    viewMode: "demo",
    stage: "sensing",
    communicationMode: "semantic",
    season: "summer",
    network: DEFAULT_NETWORK
  },
  {
    title: "Pixels become meaning",
    meta: "Use the semantic screen to explain that the edge converts the full thermal matrix into one decision-ready packet.",
    cue: "Say: the edge AI extracts risk, trust, freshness, and recommended action, so 192 KB of pixels become one compact semantic event.",
    viewMode: "demo",
    stage: "fusion",
    communicationMode: "semantic",
    season: "summer",
    network: DEFAULT_NETWORK
  },
  {
    title: "Why semantic beats RAW",
    meta: "Use the link screen to contrast RAW, HYBRID, and SEMANTIC under constrained uplink.",
    cue: "Say: RAW is too heavy, HYBRID is better as fallback, and SEMANTIC is the only mode that keeps the meaning intact fast enough to act.",
    viewMode: "demo",
    stage: "constraint",
    communicationMode: "semantic",
    season: "summer",
    network: ADVERSE_NETWORK
  },
  {
    title: "Receiver validates and acts",
    meta: "End on the decision screen and close on operational effect rather than model internals.",
    cue: "Say: once link, trust, and policy checks pass, the control center issues the action immediately instead of waiting for heavier evidence.",
    viewMode: "demo",
    stage: "decision",
    communicationMode: "semantic",
    season: "summer",
    network: ADVERSE_NETWORK
  }
];
