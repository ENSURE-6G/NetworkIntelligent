const seasonalScenarios = {
  winter: {
    label: "Evidence",
    mapLabel: "THERMAL EVIDENCE",
    mapSub: `P99 ${evidenceP99.toFixed(1)}°C`,
    inputs: [
      ["🌡", "P99 temperature", `${evidenceP99.toFixed(1)}°C`],
      ["📈", "Thermal delta", `${evidenceDelta.toFixed(1)}°C`],
      ["🧪", "Samples analyzed", thermalSummary.sampleCount.toLocaleString()],
      ["📷", "Sensor source", "P2 Pro"]
    ],
    semantic: {
      task_id: "rail_heat_safety_monitoring",
      event_type: "thermal_hotspot",
      source: "actual_p2pro_thermal_evidence",
      receiver_goal: "issue safe railway track action",
      risk_label: evidenceRisk,
      semantic_label: "frost_heave_risk",
      p99_temperature_c: evidenceP99,
      thermal_delta_c: evidenceDelta,
      confidence: evidenceConfidence,
      freshness_s: evidenceFreshnessS,
      recommended_action: evidenceAction
    }
  },
  spring: {
    label: "Goal",
    mapLabel: "RECEIVER GOAL",
    mapSub: evidenceTaskGoal,
    inputs: [
      ["🎯", "Receiver goal", evidenceTaskGoal],
      ["🛤", "Asset", "rail / ballast"],
      ["📍", "Location", "Sundsvall railway track"],
      ["🧭", "Operational target", "TMS policy"]
    ],
    semantic: {
      task_id: "rail_heat_safety_monitoring",
      event_type: "goal_context",
      receiver_goal: "issue safe railway track action",
      asset: "rail_ballast",
      location: "Sundsvall railway track",
      operational_context: "remote railway track",
      operational_target: "tsr_policy_v2",
      risk_label: evidenceRisk,
      recommended_action: evidenceAction
    }
  },
  summer: {
    label: "Trust",
    mapLabel: "TRUST CHECK",
    mapSub: `confidence ${evidenceConfidence.toFixed(2)}`,
    inputs: [
      ["🛡", "Confidence", evidenceConfidence.toFixed(2)],
      ["⏱", "Freshness", `${evidenceFreshnessS}s`],
      ["🔒", "Integrity", evidenceIntegrity],
      ["📜", "Provenance", evidenceProvenance],
      ["✅", "Trust score", evidenceTrustScore.toFixed(2)]
    ],
    semantic: {
      event_type: "trusted_semantic_event",
      receiver_goal: "issue safe railway track action",
      risk_label: evidenceRisk,
      semantic_label: "rail_buckling_risk",
      confidence: evidenceConfidence,
      freshness_s: evidenceFreshnessS,
      integrity: evidenceIntegrity,
      provenance: evidenceProvenance,
      privacy_mode: evidencePrivacy,
      policy_target: "tsr_policy_v2",
      trust_score: evidenceTrustScore,
      recommended_action: evidenceAction
    }
  },
  autumn: {
    label: "Action",
    mapLabel: "TMS ACTION",
    mapSub: evidenceAction,
    inputs: [
      ["🚆", "Recommended action", evidenceAction],
      ["📡", "Semantic payload", evidencePayloads.semantic.label],
      ["⏱", "Adverse transfer", `${evidencePayloads.semantic.adverseTransferMs} ms`],
      ["🪂", "Fallback", evidenceFallback]
    ],
    semantic: {
      event_type: "tms_action_request",
      receiver_goal: "issue safe railway track action",
      risk_label: evidenceRisk,
      semantic_label: "snow_or_frost_warning",
      semantic_payload_bytes: evidencePayloads.semantic.bytes,
      adverse_transfer_ms: evidencePayloads.semantic.adverseTransferMs,
      delivery_pct: evidencePayloads.semantic.adverseReliabilityPct,
      confidence: evidenceConfidence,
      freshness_s: evidenceFreshnessS,
      fallback_mode: evidenceFallback,
      recommended_action: evidenceAction
    }
  }
};
