function operatorAckMetaFor(mode) {
  const adverse = demoState.network === ADVERSE_NETWORK;
  const actionReady = Boolean(demoState.actionIssued);
  if (mode === "acknowledged") {
    return actionReady
      ? "Operator acknowledged ownership. Receiver path remains primary and TSR is active."
      : "Operator acknowledged the incident. Receiver is still validating before action release.";
  }
  if (mode === "escalated") {
    return adverse
      ? "Field escalation logged. Hybrid preview remains armed while constrained uplink is monitored."
      : "Field escalation logged. Semantic path remains primary and inspection support is preparing.";
  }
  return adverse
    ? "Critical railway track incident is waiting for operator ownership confirmation under constrained uplink."
    : "Critical railway track incident is waiting for operator ownership confirmation.";
}

function syncOperatorAckPanel() {
  const mode = demoState.operatorAck || "pending";
  if (ui.operatorAckState) {
    ui.operatorAckState.textContent = mode === "acknowledged"
      ? "Acknowledged by operator"
      : mode === "escalated"
        ? "Escalated to field response"
        : "Pending acknowledgment";
    ui.operatorAckState.className = `ack-state-chip ${mode}`;
  }
  if (ui.operatorAckMeta) {
    ui.operatorAckMeta.textContent = operatorAckMetaFor(mode);
  }
  ui.ackButtons.forEach(button => {
    button.classList.toggle("active", button.dataset.ack === mode);
  });
}

function setOperatorAck(mode) {
  if (mode === "pending") {
    restartIncidentCycle("Operator returned the wall to monitor mode");
  } else if (mode === "acknowledged") {
    setIncidentLifecycle("acknowledged");
  } else if (mode === "escalated") {
    setIncidentLifecycle("escalated");
  }
  if (typeof syncDashboardStateSurfaces === "function") {
    syncDashboardStateSurfaces();
  } else if (typeof syncCommandWallState === "function") {
    syncCommandWallState();
  } else {
    syncOperatorAckPanel();
  }
}

function syncCommandWallState() {
  const adverse = demoState.network === ADVERSE_NETWORK;
  const actionReady = Boolean(demoState.incident ? demoState.incident.actionReady : demoState.actionIssued);
  const lifecycle = demoState.incident ? demoState.incident.lifecycle : "new";

  if (ui.severityCritical) {
    ui.severityCritical.classList.toggle("live", lifecycle !== "closed");
    const title = ui.severityCritical.querySelector("b");
    const text = ui.severityCritical.querySelector("small");
    if (title) {
      title.textContent = lifecycle === "closed"
        ? "Sundsvall railway track back in watch mode"
        : lifecycle === "mitigated"
          ? "Sundsvall mitigation is holding"
          : "Sundsvall heat alarm active";
    }
    if (text) {
      text.textContent = lifecycle === "mitigated"
        ? "Semantic action has contained the live railway track risk."
        : lifecycle === "closed"
          ? "The railway track has returned to watch mode."
          : adverse
            ? "Rail buckling risk remains live while the uplink is constrained."
            : "Rail buckling risk remains the live operator priority.";
    }
  }

  if (ui.severityWarning) {
    ui.severityWarning.classList.toggle("live", adverse || !actionReady || lifecycle === "escalated");
    const title = ui.severityWarning.querySelector("b");
    const text = ui.severityWarning.querySelector("small");
    if (title) {
      title.textContent = lifecycle === "escalated"
        ? "Field and hybrid support are armed"
        : "Fallback hybrid preview armed";
    }
    if (text) {
      text.textContent = lifecycle === "escalated"
        ? "Hybrid fallback stays armed while field response is active."
        : adverse
          ? "Fallback hybrid preview is armed because link stress remains elevated."
          : "Fallback stays armed only if trust, integrity, or freshness degrade.";
    }
  }

  if (ui.severityNominal) {
    ui.severityNominal.classList.toggle("live", actionReady || lifecycle === "mitigated" || lifecycle === "closed");
    const title = ui.severityNominal.querySelector("b");
    const text = ui.severityNominal.querySelector("small");
    if (title) {
      title.textContent = lifecycle === "closed"
        ? "Receiver ready for the next incident"
        : "Receiver policy gate healthy";
    }
    if (text) {
      text.textContent = lifecycle === "closed"
        ? "Receiver remains healthy and ready for the next railway track incident."
        : actionReady
          ? "TSR policy remains approved and the receiver path is healthy."
          : "Receiver policy is healthy and waiting for final validation.";
    }
  }

  syncOperatorAckPanel();
}
