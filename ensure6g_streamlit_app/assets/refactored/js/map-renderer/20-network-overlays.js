function commandWallDockOffset() {
  const dock = document.querySelector(".command-wall-dock");
  if (!dock) return 0;
  const style = getComputedStyle(dock);
  if (style.display === "none" || style.visibility === "hidden") return 0;
  return dock.getBoundingClientRect().width + 30;
}

function mapOverlayTextScale(dividerX = 0, laptopLayout = false) {
  const mapWidth = Math.max(320, W - dividerX - commandWallDockOffset() - (laptopLayout ? 24 : 32));
  const scale = mapWidth / (laptopLayout ? 780 : 920);
  return Math.max(0.84, Math.min(1.18, scale));
}

function drawMapStoryPanel() {
  if (W < 980 || document.querySelector(".map-presentation-frame")) return;
  const laptopLayout = document.body.dataset.layout === "laptop";
  const dividerX = parseFloat(getComputedStyle(document.body).getPropertyValue("--ux-divider-x")) || 0;
  const textScale = mapOverlayTextScale(dividerX, laptopLayout);
  const seasonCopy = seasonCopyFor(demoState.season || DEFAULT_SEASON);
  const summerSensing = demoState.stage === "sensing" && (demoState.season || DEFAULT_SEASON) === "summer";
  const missionAck = demoState.operatorAck || "pending";
  const missionLifecycle = demoState.incident ? demoState.incident.lifecycle : "new";
  const modeProfile = communicationModeProfile();

  const content = {
    mission: {
      tag: "Control center",
      title: missionLifecycle === "closed"
        ? "Railway track back to watch mode"
        : missionLifecycle === "mitigated"
          ? "Risk is being contained"
          : missionAck === "escalated"
            ? "Field response active"
            : modeProfile.mapTitle,
      lines: missionLifecycle === "closed"
        ? ["Incident cycle complete", "Control center is ready for the next semantic alarm"]
        : missionLifecycle === "mitigated"
          ? ["Validated action is holding the railway track", "Command path stays visible until closure"]
          : missionAck === "escalated"
            ? ["Crew mobilizing while semantic path stays live", "Hybrid support is armed only for resilience"]
            : modeProfile.mapLines,
      tone: missionLifecycle === "closed"
        ? "blue"
        : missionLifecycle === "mitigated"
          ? "green"
          : missionAck === "escalated"
            ? "amber"
            : missionAck === "acknowledged"
              ? "green"
              : modeProfile.pathTone
    },
    sensing: {
      tag: "Incident",
      title: seasonCopy.sensingMapTitle,
      lines: [`P99 ${evidenceP99.toFixed(1)}°C at Sundsvall`, seasonCopy.sensingMapLine],
      tone: summerSensing ? "amber" : "red"
    },
    fusion: {
      tag: "Semantic event",
      title: "Edge packet ready",
      lines: ["Pixels become one receiver decision", seasonCopy.fusionSummary],
      tone: "violet"
    },
    constraint: {
      tag: "Link operations",
      title: "Semantic survives the link",
      lines: [`${evidencePayloads.semantic.label} arrives in ${evidencePayloads.semantic.adverseTransferMs} ms`, "RAW is too heavy for this stressed uplink"],
      tone: "green"
    },
    decision: {
      tag: "Receiver decision",
      title: "TSR issued",
      lines: ["3 checks pass", "Link survives · trust valid · policy match"],
      tone: "green"
    },
    outcome: {
      tag: "Coverage",
      title: "Safer operation delivered",
      lines: [`90%+ lower routine traffic · ${evidencePayloads.semantic.adverseTransferMs} ms`, "Task-ready meaning delivered under stress"],
      tone: "green"
    }
  }[demoState.stage];
  if (!content) return;

  const palette = {
    blue: ["rgba(6,17,28,.70)", "rgba(95,220,255,.28)", "#9edfff"],
    amber: ["rgba(40,22,8,.74)", "rgba(255,176,64,.34)", "#ffd089"],
    red: ["rgba(32,12,12,.72)", "rgba(255,95,80,.35)", "#ff9b91"],
    violet: ["rgba(20,14,42,.72)", "rgba(178,140,255,.35)", "#c9b4ff"],
    green: ["rgba(8,34,24,.72)", "rgba(87,222,131,.32)", "#b9ffd0"]
  }[content.tone];
  const w = laptopLayout ? 228 : 252;
  const h = laptopLayout ? 88 : 96;
  const x = Math.max(dividerX + (laptopLayout ? 28 : 40), W - w - commandWallDockOffset() - (laptopLayout ? 18 : 32));
  const y = laptopLayout ? 40 : 54;

  ctx.save();
  ctx.strokeStyle = palette[1];
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 2, y + 18);
  ctx.lineTo(x + (laptopLayout ? 52 : 58), y + 18);
  ctx.stroke();

  ctx.shadowColor = "rgba(3,10,16,.62)";
  ctx.shadowBlur = 16;
  ctx.fillStyle = palette[2];
  ctx.font = `900 ${((laptopLayout ? 8 : 8.5) * textScale).toFixed(2)}px Inter, system-ui`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(content.tag.toUpperCase(), x, y + 16);

  ctx.fillStyle = "#fff";
  ctx.font = `1000 ${((laptopLayout ? 12 : 13.5) * textScale).toFixed(2)}px Inter, system-ui`;
  ctx.fillText(content.title, x, y + (laptopLayout ? 34 : 38));

  ctx.font = `800 ${((laptopLayout ? 8.4 : 9.2) * textScale).toFixed(2)}px Inter, system-ui`;
  ctx.fillStyle = "rgba(255,255,255,.76)";
  content.lines.forEach((line, i) => {
    ctx.fillText(line, x, y + (laptopLayout ? 52 : 58) + i * (laptopLayout ? 14 : 16));
  });
  ctx.restore();
}

function drawCommunicationPathPanel() {
  if (demoState.stage !== "constraint" || W < 980) return;
  const laptopLayout = document.body.dataset.layout === "laptop";
  const dividerX = parseFloat(getComputedStyle(document.body).getPropertyValue("--ux-divider-x")) || 0;
  const textScale = mapOverlayTextScale(dividerX, laptopLayout);
  const w = laptopLayout ? 228 : 252;
  const h = laptopLayout ? 136 : 146;
  const x = Math.max(dividerX + (laptopLayout ? 28 : 40), W - w - commandWallDockOffset() - (laptopLayout ? 18 : 32));
  const y = laptopLayout ? 148 : 168;
  const rows = [
    ["1", "Evidence", "rail-side sensor observation", "#ffe082"],
    ["2", "Task encoder", "goal + risk + freshness + action", "#57de83"],
    ["3", "Channel", "priority semantic packet", "#5fdcff"],
    ["4", "Policy gate", "receiver validates before acting", "#ffffff"]
  ];

  ctx.save();
  roundRect(x, y, w, h, 16);
  ctx.fillStyle = "rgba(6,17,28,.66)";
  ctx.fill();
  ctx.strokeStyle = "rgba(129,209,255,.22)";
  ctx.stroke();

  ctx.fillStyle = "#9edfff";
  ctx.font = `900 ${(9 * textScale).toFixed(2)}px Inter, system-ui`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
    ctx.fillText("PPT PIPELINE ON MAP", x + 16, y + 18);

  rows.forEach((row, i) => {
    const yy = y + 42 + i * 27;
    ctx.fillStyle = row[3];
    ctx.beginPath();
    ctx.arc(x + 22, yy, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(6,17,28,.92)";
    ctx.font = `1000 ${(8 * textScale).toFixed(2)}px Inter, system-ui`;
    ctx.textAlign = "center";
    ctx.fillText(row[0], x + 22, yy + .5);
    ctx.textAlign = "left";
    ctx.fillStyle = "#fff";
    ctx.font = `1000 ${(10 * textScale).toFixed(2)}px Inter, system-ui`;
    ctx.fillText(row[1], x + 40, yy - 4);
    ctx.fillStyle = "rgba(255,255,255,.58)";
    ctx.font = `800 ${(8.5 * textScale).toFixed(2)}px Inter, system-ui`;
    ctx.fillText(row[2], x + 40, yy + 8);
  });
  ctx.restore();
}

function drawPrimaryCommunicationChain() {
  const activeStages = ["mission", "fusion", "constraint", "decision"];
  if (!activeStages.includes(demoState.stage)) return;
  const hotspot = sensorNodes.find(node => node.primary);
  const gateway = edgeGateways.find(node => node.primary);
  const base = baseStations.find(node => node.primary);
  const control = {x: cities.Stockholm.x - 92, y: cities.Stockholm.y - 20};
  if (!hotspot || !gateway || !base) return;
  const missionLifecycle = demoState.incident ? demoState.incident.lifecycle : "new";
  const modeProfile = communicationModeProfile();
  const selectedMode = currentCommunicationMode();
  const showCommandPath = demoState.stage === "constraint"
    || demoState.stage === "decision"
    || (demoState.stage === "mission" && (
      selectedMode === "semantic"
        ? (modeProfile.commandPathVisible && (demoState.incident?.validated || ["acknowledged", "escalated", "mitigated"].includes(missionLifecycle)))
        : selectedMode === "hybrid"
          ? ["acknowledged", "escalated", "mitigated"].includes(missionLifecycle)
          : false
    ));

  const linkProfile = demoState.stage === "mission"
    ? {
        raw: {
          sensor: { color: "rgba(255,224,130,.72)", glow: "#ffd089", width: 2.4, dash: [8, 5], packetColor: "#ffd089", packetSize: 4.7, packetRate: 0.00034 },
          gateway: { color: "rgba(255,95,80,.76)", glow: "#ff7b70", width: 2.8, dash: [10, 6], packetColor: "#ff7b70", packetSize: 4.9, packetRate: 0.00024 },
          uplink: { color: "rgba(255,95,80,.72)", glow: "#ff7b70", width: 3.1, dash: [10, 7], packetColor: "#ff7b70", packetSize: 5.2, packetRate: 0.00018 }
        },
        hybrid: {
          sensor: { color: "rgba(255,224,130,.84)", glow: "#ffe082", width: 2.6, dash: [8, 4], packetColor: "#ffe082", packetSize: 4.9, packetRate: 0.00048 },
          gateway: { color: "rgba(255,176,64,.86)", glow: "#ffb040", width: 2.9, dash: [9, 4], packetColor: "#ffb040", packetSize: 5, packetRate: 0.00044 },
          uplink: { color: "rgba(95,220,255,.66)", glow: "#5fdcff", width: 2.4, dash: [8, 6], packetColor: "#5fdcff", packetSize: 4.4, packetRate: 0.00034 }
        },
        semantic: {
          sensor: { color: "rgba(255,224,130,.92)", glow: "#ffe082", width: 2.8, dash: [8, 4], packetColor: "#ffe082", packetSize: 5, packetRate: 0.00055 },
          gateway: { color: "rgba(87,222,131,.88)", glow: "#57de83", width: 3, dash: [9, 4], packetColor: "#57de83", packetSize: 5, packetRate: 0.00062 },
          uplink: { color: "rgba(95,220,255,.72)", glow: "#5fdcff", width: 2.5, dash: [8, 6], packetColor: "#5fdcff", packetSize: 4.7, packetRate: 0.00048 }
        }
      }[selectedMode]
    : null;

  drawDataLink(hotspot, gateway, {
    color: linkProfile?.sensor.color || "rgba(255,224,130,.92)",
    glow: linkProfile?.sensor.glow || "#ffe082",
    width: linkProfile?.sensor.width || 2.8,
    dash: linkProfile?.sensor.dash || [8, 4],
    packetColor: linkProfile?.sensor.packetColor || "#ffe082",
    packetSize: linkProfile?.sensor.packetSize || 5,
    packetRate: linkProfile?.sensor.packetRate || 0.00055,
    lift: 8,
    arrow: true
  });
  drawDataLink(gateway, base, {
    color: linkProfile?.gateway.color || "rgba(87,222,131,.88)",
    glow: linkProfile?.gateway.glow || "#57de83",
    width: linkProfile?.gateway.width || 3,
    dash: linkProfile?.gateway.dash || [9, 4],
    packetColor: linkProfile?.gateway.packetColor || "#57de83",
    packetSize: linkProfile?.gateway.packetSize || 5,
    packetRate: linkProfile?.gateway.packetRate || 0.00062,
    lift: 10,
    phase: .2,
    arrow: true
  });
  drawDataLink(base, control, {
    color: linkProfile?.uplink.color || "rgba(95,220,255,.72)",
    glow: linkProfile?.uplink.glow || "#5fdcff",
    width: linkProfile?.uplink.width || 2.5,
    dash: linkProfile?.uplink.dash || [8, 6],
    packetColor: linkProfile?.uplink.packetColor || "#5fdcff",
    packetSize: linkProfile?.uplink.packetSize || 4.7,
    packetRate: linkProfile?.uplink.packetRate || 0.00048,
    bend: 26,
    phase: .38,
    arrow: true
  });

  if (showCommandPath) {
    const train = trainFleet[0];
    const trainState = syncedTrainState();
    const trainPoint = routePoint(train.route, trainState.p);

    // The return path is the TMS command delivery, not raw sensor evidence.
    drawDataLink(control, base, {
      color: "rgba(255,224,130,.36)",
      glow: "#ffe082",
      width: 1.5,
      dash: [3, 9],
      packetColor: "#ffe082",
      packetSize: 3.7,
      packetRate: 0.00034,
      bend: -40,
      phase: .56,
      arrow: true
    });
    drawDataLink(base, trainPoint, {
      color: "rgba(255,224,130,.58)",
      glow: "#ffe082",
      width: 1.7,
      dash: [4, 7],
      packetColor: "#ffe082",
      packetSize: 3.8,
      packetRate: 0.00046,
      lift: 7,
      phase: .72,
      arrow: true
    });

    if (demoState.stage === "constraint" && W > 980) {
      const ts = toScreen(trainPoint);
      drawMapCallout(ts.x - 72 * view.scale, ts.y + 58 * view.scale, "BS → TRAIN", "TSR command", "amber");
    }
  }

}

function drawDataLink(from, to, options = {}) {
  const a = toScreen(from);
  const b = toScreen(to);
  const bend = (options.bend || 0) * view.scale;
  const mx = (a.x + b.x) / 2 + bend;
  const my = (a.y + b.y) / 2 - (options.lift || 18) * view.scale;
  const dash = options.dash || [5, 7];
  const phase = (frameNow * 0.018 + (options.phase || 0) * 60) % ((dash[0] + dash[1]) * view.scale);
  const packetT = (frameNow * (options.packetRate || 0.00042) + (options.phase || 0)) % 1;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.quadraticCurveTo(mx, my, b.x, b.y);
  ctx.setLineDash(dash.map(v => v * view.scale));
  ctx.lineDashOffset = -phase;
  ctx.strokeStyle = options.color || "rgba(95,220,255,.32)";
  ctx.lineWidth = (options.width || 1.2) * view.scale;
  ctx.shadowColor = options.glow || "#5fdcff";
  ctx.shadowBlur = 8;
  ctx.stroke();

  if (options.packet !== false) {
    const px = (1 - packetT) * (1 - packetT) * a.x + 2 * (1 - packetT) * packetT * mx + packetT * packetT * b.x;
    const py = (1 - packetT) * (1 - packetT) * a.y + 2 * (1 - packetT) * packetT * my + packetT * packetT * b.y;
    ctx.setLineDash([]);
    ctx.shadowBlur = 14;
    ctx.fillStyle = options.packetColor || options.glow || "#5fdcff";
    ctx.beginPath();
    ctx.arc(px, py, (options.packetSize || 3.3) * view.scale, 0, Math.PI * 2);
    ctx.fill();
  }

  if (options.arrow) {
    const arrowT = .78;
    const x = (1 - arrowT) * (1 - arrowT) * a.x + 2 * (1 - arrowT) * arrowT * mx + arrowT * arrowT * b.x;
    const y = (1 - arrowT) * (1 - arrowT) * a.y + 2 * (1 - arrowT) * arrowT * my + arrowT * arrowT * b.y;
    const dx = 2 * (1 - arrowT) * (mx - a.x) + 2 * arrowT * (b.x - mx);
    const dy = 2 * (1 - arrowT) * (my - a.y) + 2 * arrowT * (b.y - my);
    const angle = Math.atan2(dy, dx);
    const size = (options.arrowSize || 8) * view.scale;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.setLineDash([]);
    ctx.shadowColor = options.glow || "#5fdcff";
    ctx.shadowBlur = 10;
    ctx.fillStyle = options.packetColor || options.glow || "#5fdcff";
    ctx.beginPath();
    ctx.moveTo(size, 0);
    ctx.lineTo(-size * .58, -size * .52);
    ctx.lineTo(-size * .30, 0);
    ctx.lineTo(-size * .58, size * .52);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

function drawBaseStations(mode = "all") {
  if (mode === "sensor") return;
  const showLabels = W > 980 || demoState.stage === "constraint";
  baseStations.forEach((station, i) => {
    if (mode === "primary" && !station.primary) return;
    const s = toScreen(station);
    const pulse = 1 + Math.sin(frameNow * MAP_ANIMATION.sensorPulseRate + i * .7) * .06;
    const coverage = station.coverage * view.scale * pulse;

    ctx.save();
    ctx.setLineDash([]);

    const coverageGradient = ctx.createRadialGradient(s.x, s.y, 4, s.x, s.y, coverage);
    coverageGradient.addColorStop(0, station.primary ? "rgba(87,222,131,.13)" : "rgba(95,220,255,.11)");
    coverageGradient.addColorStop(1, "rgba(95,220,255,0)");
    ctx.fillStyle = coverageGradient;
    ctx.beginPath();
    ctx.arc(s.x, s.y, coverage, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = station.primary ? "rgba(87,222,131,.34)" : "rgba(95,220,255,.24)";
    ctx.lineWidth = station.primary ? 1.3 : 1;
    ctx.setLineDash([6 * view.scale, 7 * view.scale]);
    ctx.beginPath();
    ctx.arc(s.x, s.y, coverage * .56, 0, Math.PI * 2);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.shadowColor = station.primary ? "#57de83" : "#5fdcff";
    ctx.shadowBlur = station.primary ? 18 : 14;
    ctx.strokeStyle = station.primary ? "#57de83" : "#5fdcff";
    ctx.fillStyle = "rgba(6,22,34,.88)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(s.x, s.y, 9.5 * view.scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(s.x, s.y - 15 * view.scale);
    ctx.lineTo(s.x - 10 * view.scale, s.y + 14 * view.scale);
    ctx.lineTo(s.x + 10 * view.scale, s.y + 14 * view.scale);
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(s.x, s.y - 16 * view.scale, 3.4 * view.scale, 0, Math.PI * 2);
    ctx.fillStyle = station.primary ? "#57de83" : "#9edfff";
    ctx.fill();

    if (showLabels && station.primary) {
      ctx.shadowBlur = 0;
      ctx.font = uiCanvasFont(8.5, 900);
      const label = station.id;
      const tw = ctx.measureText(label).width + 14;
      roundRect(s.x - tw / 2, s.y + 18 * view.scale, tw, 18, 7);
      ctx.fillStyle = "rgba(6,17,28,.72)";
      ctx.fill();
      ctx.strokeStyle = station.primary ? "rgba(87,222,131,.40)" : "rgba(95,220,255,.28)";
      ctx.stroke();
      ctx.fillStyle = station.primary ? "#b9ffd0" : "#9edfff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, s.x, s.y + 27 * view.scale);
    }
    ctx.restore();
  });
}

function drawEdgeGateways(mode = "all") {
  const showLabels = W > 960 && demoState.stage !== "constraint" && demoStages.indexOf(demoState.stage) >= demoStages.indexOf("fusion");
  edgeGateways.forEach(gateway => {
    if ((mode === "primary" || mode === "sensor") && !gateway.primary) return;
    const s = toScreen(gateway);
    const size = (gateway.primary ? 13 : 10) * view.scale;

    ctx.save();
    ctx.setLineDash([]);
    ctx.shadowColor = gateway.primary ? "#57de83" : "#5fdcff";
    ctx.shadowBlur = gateway.primary ? 16 : 10;
    ctx.fillStyle = gateway.primary ? "rgba(18,74,43,.88)" : "rgba(7,38,54,.82)";
    ctx.strokeStyle = gateway.primary ? "rgba(87,222,131,.86)" : "rgba(95,220,255,.68)";
    ctx.lineWidth = 1.8;
    roundRect(s.x - size, s.y - size, size * 2, size * 2, 5);
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = gateway.primary ? "#b9ffd0" : "#9edfff";
    ctx.font = uiCanvasFont(8.5 * view.scale, 900);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("EG", s.x, s.y);

    if (showLabels && gateway.primary) {
      const label = "EDGE GATEWAY";
      ctx.font = uiCanvasFont(8, 900);
      const tw = ctx.measureText(label).width + 14;
      roundRect(s.x - tw / 2, s.y + 18 * view.scale, tw, 17, 6);
      ctx.fillStyle = "rgba(6,17,28,.72)";
      ctx.fill();
      ctx.strokeStyle = "rgba(87,222,131,.38)";
      ctx.stroke();
      ctx.fillStyle = "#b9ffd0";
      ctx.fillText(label, s.x, s.y + 26.5 * view.scale);
    }

    ctx.restore();
  });
}

function drawRailSensors(mode = "all") {
  const showLabels = demoState.stage !== "constraint" && demoStages.indexOf(demoState.stage) >= demoStages.indexOf("sensing") && W > 900;
  sensorNodes.forEach((node, i) => {
    if ((mode === "primary" || mode === "sensor") && !node.primary) return;
    const s = toScreen(node);
    const pulse = 1 + Math.sin(frameNow * MAP_ANIMATION.sensorPulseRate + i) * .12;
    const primary = node.primary || demoState.stage === "sensing";
    const color = node.primary ? "#ff7b70" : node.type === "thermal" ? "#ffe082" : "#9edfff";

    ctx.save();
    ctx.setLineDash([]);
    ctx.shadowColor = color;
    ctx.shadowBlur = node.primary ? 16 : 9;
    ctx.strokeStyle = node.primary ? "rgba(255,95,80,.88)" : "rgba(158,223,255,.58)";
    ctx.lineWidth = node.primary ? 1.8 : 1.2;
    ctx.beginPath();
    ctx.arc(s.x, s.y, (node.primary ? 12 : 8) * view.scale * pulse, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.rect(s.x - 3.5 * view.scale, s.y - 3.5 * view.scale, 7 * view.scale, 7 * view.scale);
    ctx.fill();

    if (showLabels && node.primary) {
      ctx.shadowBlur = 0;
      ctx.font = uiCanvasFont(8, 900);
      const tw = ctx.measureText(node.id).width + 12;
      roundRect(s.x - tw / 2, s.y - 23 * view.scale, tw, 17, 6);
      ctx.fillStyle = node.primary ? "rgba(76,16,14,.80)" : "rgba(6,17,28,.62)";
      ctx.fill();
      ctx.strokeStyle = node.primary ? "rgba(255,95,80,.48)" : "rgba(158,223,255,.25)";
      ctx.stroke();
      ctx.fillStyle = node.primary ? "#ffb1aa" : "#bfeeff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(node.id, s.x, s.y - 14 * view.scale);
    }
    ctx.restore();
  });
}
