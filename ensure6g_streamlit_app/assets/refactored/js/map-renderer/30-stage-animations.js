function stageProgress01(durationFallback = 8) {
  const duration = (stageDurationsMs[demoState.stage] || durationFallback * 1000) / 1000;
  return Math.max(0, Math.min(1, stageElapsed() / duration));
}

function syncedTrainState() {
  const stage = demoState.stage;
  const t = stageProgress01();

  // Route 1: Luleå → Skellefteå → Umeå → Sundsvall → Gävle → Uppsala → Stockholm
  // Keep the train near the active corridor/hotspot during the demo, then slow after TSR.
  const states = {
    mission:  { p: 0.34 + 0.03 * t, label: "NORMAL", tone: "amber", speedText: "80 km/h", showLabel: false },
    sensing:  { p: 0.42 + 0.035 * t, label: "APPROACHING", tone: "amber", speedText: "80 km/h", showLabel: true },
    fusion:   { p: 0.455 + 0.025 * t, label: "RISK AHEAD", tone: "red", speedText: "80 km/h", showLabel: true },
    constraint:{ p: 0.50 + 0.015 * t, label: "TMS UPDATE", tone: "amber", speedText: "80 → 40", showLabel: true },
    decision: { p: 0.515 + 0.006 * t, label: "TSR ACTIVE", tone: "green", speedText: "40 km/h", showLabel: true },
    outcome:  { p: 0.522 + 0.004 * t, label: "TRAIN PROTECTED", tone: "green", speedText: "40 km/h", showLabel: true }
  };

  return states[stage] || states.mission;
}

function drawTrainFleet() {
  ctx.save();

  const train = trainFleet[0];
  const state = syncedTrainState();
  const p = routePoint(train.route, state.p);
  const a = routeTangent(train.route, state.p);
  const s = toScreen(p);
  const sc = Math.max(TRAIN_RENDER.minScale, Math.min(TRAIN_RENDER.maxScale, view.scale * TRAIN_RENDER.scaleMultiplier));
  const affected = state.tone === "green";
  const warning = state.tone === "red";

  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate(a);
  ctx.scale(sc, sc);

  ctx.globalAlpha = 0.95;
  ctx.shadowColor = affected ? "#57de83" : warning ? "#ff5f50" : "#ffe082";
  ctx.shadowBlur = affected ? TRAIN_RENDER.safeShadow : warning ? TRAIN_RENDER.warningShadow : TRAIN_RENDER.normalShadow;
  ctx.fillStyle = affected ? "#57de83" : warning ? "#ff5f50" : train.color;
  roundRect(TRAIN_RENDER.carX, TRAIN_RENDER.carY, TRAIN_RENDER.carWidth, TRAIN_RENDER.carHeight, TRAIN_RENDER.carRadius);
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,.66)";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(TRAIN_RENDER.headlightX, 0, TRAIN_RENDER.headlightRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  ctx.restore();
}

function drawExecutiveOverlay() {
  // subtle scanning line and map polish
  ctx.save();
  const y = (frameNow * MAP_ANIMATION.scanlineRate) % H;
  const grad = ctx.createLinearGradient(0, y - 30, 0, y + 30);
  grad.addColorStop(0, "rgba(95,220,255,0)");
  grad.addColorStop(.5, "rgba(95,220,255,.045)");
  grad.addColorStop(1, "rgba(95,220,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, y - 30, W, 60);

  // vignette
  const vignette = ctx.createRadialGradient(W/2, H/2, Math.min(W,H)*.20, W/2, H/2, Math.max(W,H)*.72);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,.44)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0,0,W,H);
  ctx.restore();
}

function drawCity(name, c) {
  const s = toScreen(c);
  const isT1 = c.rank === 1;
  const isT2 = c.rank === 2;
  const isForeign = c.foreign;
  const baseRadius = isT1 ? 8.5 : isT2 ? 6 : 4.3;
  const r = baseRadius * Math.max(.75, Math.min(1.25, view.scale * 1.7));

  ctx.save();

  // Junction halo for high-importance stations.
  if (isT1 || isT2) {
    ctx.globalAlpha = isT1 ? .18 : .10;
    ctx.fillStyle = isT1 ? "#ffe082" : "#9edfff";
    ctx.beginPath();
    ctx.arc(s.x, s.y, r * (isT1 ? 2.55 : 2.0), 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  ctx.shadowColor = isForeign ? "rgba(255,255,255,.75)" : isT1 ? "#ffe082" : isT2 ? "#9edfff" : "rgba(255,255,255,.45)";
  ctx.shadowBlur = isT1 ? 20 : isT2 ? 15 : 6;

  ctx.fillStyle = isForeign ? "rgba(255,255,255,.68)" : isT1 ? "#ffe082" : isT2 ? "#9edfff" : "rgba(255,255,255,.78)";
  ctx.beginPath();
  ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = isT1 ? "rgba(40,30,0,.92)" : "rgba(5,14,24,.9)";
  ctx.lineWidth = isT1 ? 2.4 : 1.7;
  ctx.stroke();

  // Tier badge ring
  if (isT1) {
    ctx.beginPath();
    ctx.arc(s.x, s.y, r + 5, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,224,130,.72)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  const labeledStations = new Set(["Kiruna", "Sundsvall", "Stockholm"]);
  const show = labeledStations.has(name);

  if (show) {
    ctx.shadowBlur = 0;
    const fontSize = isT1 ? (W < 700 ? 10 : 12) : (W < 700 ? 8.5 : 10.5);
    ctx.font = `900 ${fontSize}px Inter, system-ui`;
    const label = isT1 ? `${name} C` : name;
    const tw = ctx.measureText(label).width + 16;
    const h = isT1 ? 25 : 22;
    const laptopLayout = document.body.dataset.layout === "laptop";
    const shiftLeft = laptopLayout && name === "Kiruna";
    const x = shiftLeft ? s.x - tw - r - 7 : s.x + r + 7;
    const y = s.y - h / 2;

    ctx.fillStyle = isT1 ? "rgba(34,25,5,.84)" : isT2 ? "rgba(6,28,42,.78)" : "rgba(6,17,28,.72)";
    roundRect(x, y, tw, h, 7);
    ctx.fill();

    ctx.strokeStyle = isT1 ? "rgba(255,224,130,.45)" : isT2 ? "rgba(158,223,255,.38)" : "rgba(255,255,255,.18)";
    ctx.stroke();

    ctx.fillStyle = "#fff";
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText(label, x + 8, s.y);
  }

  ctx.restore();
}

function roundRect(x,y,w,h,r) {
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);
  ctx.arcTo(x,y,x+w,y,r);
}

function drawMapLabels() {
  // Static geography labels are intentionally hidden to keep the presentation map clean.
}

function drawVignette() {
  const vignette = ctx.createRadialGradient(W/2, H/2, Math.min(W,H)*.20, W/2, H/2, Math.max(W,H)*.72);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,.42)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0,0,W,H);
}


function stageElapsed() {
  return (Date.now() - demoState.stageEnteredAt) / 1000;
}

function drawMapCallout(x, y, label, sublabel, tone = "blue") {
  ctx.save();
  ctx.font = uiCanvasFont(10, 900);
  const labelWidth = ctx.measureText(label).width;
  ctx.font = uiCanvasFont(9, 700);
  const subWidth = sublabel ? ctx.measureText(sublabel).width : 0;
  const w = Math.max(labelWidth, subWidth) + 24;
  const h = sublabel ? 42 : 26;
  const palette = {
    blue: ["rgba(6,30,44,.88)", "rgba(95,220,255,.38)", "#9edfff"],
    amber: ["rgba(46,34,8,.88)", "rgba(255,224,130,.42)", "#ffe082"],
    red: ["rgba(76,16,14,.88)", "rgba(255,95,80,.48)", "#ff7b70"],
    green: ["rgba(15,64,36,.88)", "rgba(87,222,131,.48)", "#57de83"],
    violet: ["rgba(40,26,72,.88)", "rgba(178,140,255,.48)", "#c9b4ff"]
  }[tone] || ["rgba(6,30,44,.88)", "rgba(95,220,255,.38)", "#9edfff"];
  roundRect(x - w/2, y - h/2, w, h, 9);
  ctx.fillStyle = palette[0];
  ctx.fill();
  ctx.strokeStyle = palette[1];
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = uiCanvasFont(10, 900);
  ctx.fillStyle = "#fff";
  ctx.fillText(label, x, y - (sublabel ? 8 : 0));
  if (sublabel) {
    ctx.font = uiCanvasFont(9, 700);
    ctx.fillStyle = palette[2];
    ctx.fillText(sublabel, x, y + 9);
  }
  ctx.restore();
}

function drawRouteGlow(routeNames, tone = "blue", width = 10, alpha = 1) {
  const pts = routeNames.map(name => cities[name]).filter(Boolean);
  if (pts.length < 2) return;
  const colors = {
    blue: ["rgba(95,220,255,.70)", "#5fdcff"],
    amber: ["rgba(255,224,130,.70)", "#ffe082"],
    red: ["rgba(255,59,48,.78)", "#ff3b30"],
    green: ["rgba(87,222,131,.82)", "#57de83"],
    violet: ["rgba(178,140,255,.76)", "#b28cff"]
  }[tone] || ["rgba(95,220,255,.70)", "#5fdcff"];
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  for (let i = 0; i <= 220; i++) {
    const p = toScreen(catmull(pts, i / 220));
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  }
  ctx.strokeStyle = colors[0];
  ctx.lineWidth = width * view.scale;
  ctx.shadowColor = colors[1];
  ctx.shadowBlur = 20;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();
  ctx.restore();
}


function drawHeroCorridor() {
  const pts = heroCorridor.map(name => cities[name]).filter(Boolean);
  if (pts.length < 2) return;

  ctx.save();

  // Outer glow
  ctx.beginPath();
  for (let i = 0; i <= 260; i++) {
    const p = toScreen(catmull(pts, i / 260));
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  }
  ctx.strokeStyle = "rgba(255,224,130,.34)";
  ctx.lineWidth = 16 * view.scale;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.shadowColor = "#ffe082";
  ctx.shadowBlur = 22;
  ctx.stroke();

  // Main corridor line
  ctx.beginPath();
  for (let i = 0; i <= 260; i++) {
    const p = toScreen(catmull(pts, i / 260));
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  }
  ctx.strokeStyle = "rgba(255,250,220,.96)";
  ctx.lineWidth = 5.5 * view.scale;
  ctx.shadowBlur = 8;
  ctx.stroke();

  // Animated direction markers
  const now = frameNow * MAP_ANIMATION.heroMarkerRate;
  for (let k = 0; k < 4; k++) {
    const pos = (now + k * 0.22) % 1;
    const p = toScreen(catmull(pts, pos));
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4.5 * view.scale, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,224,130,.96)";
    ctx.shadowColor = "#ffe082";
    ctx.shadowBlur = 14;
    ctx.fill();
  }

  ctx.restore();
}

function drawPacketAlong(points, progress, label, tone = "blue", dropped = false) {
  const pts = points.map(name => cities[name]).filter(Boolean);
  if (pts.length < 2) return;
  const p = catmull(pts, Math.max(0, Math.min(1, progress)));
  const s = toScreen(p);
  const palette = {
    blue: ["#5fdcff", "rgba(95,220,255,.24)"],
    amber: ["#ffe082", "rgba(255,224,130,.24)"],
    red: ["#ff3b30", "rgba(255,59,48,.24)"],
    green: ["#57de83", "rgba(87,222,131,.24)"],
    violet: ["#b28cff", "rgba(178,140,255,.24)"]
  }[tone] || ["#5fdcff", "rgba(95,220,255,.24)"];
  ctx.save();
  ctx.shadowColor = palette[0];
  ctx.shadowBlur = 18;
  ctx.fillStyle = dropped ? "rgba(255,59,48,.92)" : palette[0];
  ctx.beginPath();
  ctx.arc(s.x, s.y, dropped ? 9 : label.includes("SEMANTIC") ? 8 : 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawSynchronizedMapAnimation() {
  const stage = demoState.stage;
  const t = stageElapsed();
  const focus = cities.Sundsvall;
  if (!focus) return;
  const framedMap = Boolean(document.querySelector(".map-presentation-frame"));
  const fs = toScreen(focus);
  const boardroomLayout = ["cinematic", "wide", "laptop"].includes(document.body.dataset.layout);
  const mapFieldBias = boardroomLayout ? 56 * view.scale : 0;
  const strongMapFieldBias = boardroomLayout ? 78 * view.scale : 0;

  if (stage === "mission") {
    const ack = demoState.operatorAck || "pending";
    const lifecycle = demoState.incident ? demoState.incident.lifecycle : "new";
    const modeProfile = communicationModeProfile();
    const communicationMode = currentCommunicationMode();
    const routeTone = lifecycle === "closed"
      ? "blue"
      : lifecycle === "mitigated"
        ? "green"
        : ack === "escalated"
          ? "amber"
          : ack === "acknowledged"
            ? "green"
            : modeProfile.routeTone;
    const routeWidth = lifecycle === "mitigated" ? 9 : ack === "escalated" ? 8 : ack === "acknowledged" ? 7 : 6;
    const routeAlpha = lifecycle === "closed" ? .28 : ack === "escalated" ? .66 : ack === "acknowledged" ? .58 : modeProfile.routeAlpha;
    drawRouteGlow(heroCorridor, routeTone, routeWidth, routeAlpha);

    if (ack !== "pending" || lifecycle === "mitigated" || lifecycle === "closed") {
      ctx.save();
      const wash = ctx.createLinearGradient(0, 0, W, H);
      wash.addColorStop(0, lifecycle === "closed"
        ? "rgba(4,12,20,.10)"
        : lifecycle === "mitigated" || ack === "acknowledged"
          ? "rgba(4,12,20,.14)"
          : "rgba(18,10,4,.18)");
      wash.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = wash;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    if (framedMap && demoState.viewMode === "operations") {
      return;
    }

    drawMapCallout(
      fs.x + mapFieldBias,
      fs.y - 82 * view.scale,
      lifecycle === "closed"
        ? "WATCH MODE"
        : lifecycle === "mitigated"
          ? "MITIGATION ACTIVE"
          : ack === "escalated"
            ? "FIELD ESCALATION"
            : ack === "acknowledged"
              ? "OPERATOR ACK"
              : "ACTIVE INCIDENT",
      lifecycle === "closed"
        ? "Railway track ready for the next event cycle"
        : lifecycle === "mitigated"
          ? "Validated action is holding the railway track"
          : ack === "escalated"
            ? "Crew mobilizing at Sundsvall railway track"
            : ack === "acknowledged"
              ? "Sundsvall alarm now operator-owned"
              : "Sundsvall railway track monitored",
      lifecycle === "closed" ? "blue" : (ack === "acknowledged" || lifecycle === "mitigated") ? "green" : "amber"
    );
    drawMapCallout(
      fs.x + 144 * view.scale + strongMapFieldBias,
      fs.y - 10 * view.scale,
      lifecycle === "closed"
        ? "READY STATE"
        : ack === "escalated"
          ? "HYBRID SUPPORT"
          : communicationMode === "raw"
            ? "RAW FLOW"
            : communicationMode === "hybrid"
              ? "HYBRID FLOW"
              : "SEMANTIC PATH",
      lifecycle === "closed"
        ? "wall ready for the next railway track alarm"
        : ack === "escalated"
          ? "fallback evidence armed"
          : lifecycle === "mitigated" || ack === "acknowledged"
            ? "validated command path active"
            : communicationMode === "raw"
              ? "full payload overloads the link"
              : communicationMode === "hybrid"
                ? "reduced evidence narrows the alarm"
                : "receiver queue healthy",
      lifecycle === "closed" ? "blue" : ack === "escalated" ? "amber" : modeProfile.pathTone
    );
  }

  if (stage === "sensing") {
    const summerHeat = (demoState.season || DEFAULT_SEASON) === "summer";
    const pulse = 1 + Math.sin(frameNow * MAP_ANIMATION.hotspotPulseRate) * .12;

    ctx.save();
    ctx.beginPath();
    ctx.arc(fs.x, fs.y, 90 * view.scale * pulse, 0, Math.PI * 2);
    ctx.fillStyle = summerHeat ? "rgba(255,184,77,.16)" : "rgba(255,59,48,.12)";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(fs.x, fs.y, 130 * view.scale * pulse, 0, Math.PI * 2);
    ctx.fillStyle = summerHeat ? "rgba(255,184,77,.08)" : "rgba(255,59,48,.06)";
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.arc(fs.x, fs.y, 52 * view.scale * pulse, 0, Math.PI * 2);
    ctx.fillStyle = summerHeat ? "rgba(255,184,77,.24)" : "rgba(255,59,48,.22)";
    ctx.fill();
    ctx.strokeStyle = summerHeat ? "rgba(255,200,112,.96)" : "rgba(255,95,80,.90)";
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.restore();
    drawMapCallout(
      fs.x + 18 + mapFieldBias,
      fs.y - 76 * view.scale,
      summerHeat ? "HEAT RISK" : "THERMAL RISK",
      `P99 ${evidenceP99.toFixed(1)}°C`,
      summerHeat ? "amber" : "red"
    );
  }

  if (stage === "fusion") {
    const scenario = seasonalScenarios[demoState.season || "winter"];
    drawMapCallout(fs.x + mapFieldBias, fs.y - 82 * view.scale, scenario.mapLabel, scenario.mapSub, "violet");
    drawMapCallout(
      fs.x + 126 * view.scale + strongMapFieldBias,
      fs.y + 18 * view.scale,
      `RISK ${String(scenario.semantic.risk_label || scenario.semantic.risk).toUpperCase()}`,
      `confidence ${scenario.semantic.confidence}`,
      "amber"
    );
  }

  if (stage === "constraint") {
    drawMapCallout(fs.x - 10 + mapFieldBias, fs.y - 76 * view.scale, "SEMANTIC ENCODER", "sensor data becomes meaning", "green");
    const x = fs.x + 135 * view.scale + strongMapFieldBias;
    const y = fs.y + 15 * view.scale;
    drawMapCallout(x, y, "RAW IMAGE", "too heavy for stressed link", "red");
    ctx.save();
    ctx.strokeStyle = "rgba(255,59,48,.78)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(fs.x + 78 * view.scale, fs.y + 2 * view.scale);
    ctx.lineTo(x - 58, y);
    ctx.setLineDash([5, 6]);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = "rgba(87,222,131,.95)";
    ctx.lineWidth = 4;
    ctx.shadowColor = "#57de83";
    ctx.shadowBlur = 14;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(fs.x + 70 * view.scale, fs.y - 10 * view.scale);
    ctx.lineTo(fs.x + 140 * view.scale + mapFieldBias, fs.y - 34 * view.scale);
    ctx.stroke();
    ctx.restore();
    drawMapCallout(fs.x + 174 * view.scale + strongMapFieldBias, fs.y - 44 * view.scale, "SEMANTIC ARRIVES", "TSR decision survives link", "green");
  }

  if (stage === "decision") {
    drawMapCallout(fs.x + mapFieldBias, fs.y - 78 * view.scale, "LEVEL C EFFECT", "TSR changes operation", "green");
    drawMapCallout(fs.x + 136 * view.scale + strongMapFieldBias, fs.y - 18 * view.scale, "REMOTE INSPECTION", "priority raised only if trust fails", "amber");
  }

  if (stage === "outcome") {
    drawRouteGlow(heroCorridor, "green", 9, .70);
    drawMapCallout(
      fs.x + mapFieldBias,
      fs.y - 82 * view.scale,
      (demoState.season || DEFAULT_SEASON) === "summer" ? "SAFER SUMMER RAIL" : "SAFER WINTER RAIL",
      "semantic action delivered",
      "green"
    );
  }
}

function drawStoryMapFocus() {
  const sensingStages = ["mission", "sensing", "fusion", "constraint", "decision", "outcome"];
  const focusCity = sensingStages.includes(demoState.stage) ? "Sundsvall" : null;
  if (!focusCity || !cities[focusCity]) return;
  const s = toScreen(cities[focusCity]);
  const pulse = 1 + Math.sin(frameNow * MAP_ANIMATION.focusPulseRate) * .08;
  ctx.save();

  if ((demoState.stage === "decision" || demoState.stage === "outcome") && demoState.actionIssued) {
    const pts = [cities.Umeå, cities.Sundsvall, cities.Gävle].filter(Boolean);
    ctx.beginPath();
    for (let i = 0; i <= 180; i++) {
      const p = toScreen(catmull(pts, i / 180));
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.strokeStyle = "rgba(87,222,131,.88)";
    ctx.lineWidth = 7 * view.scale;
    ctx.shadowColor = "#57de83";
    ctx.shadowBlur = 18;
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(s.x, s.y, 38 * view.scale * pulse, 0, Math.PI * 2);
  ctx.fillStyle = demoState.actionIssued ? "rgba(87,222,131,.20)" : "rgba(255,59,48,.18)";
  ctx.fill();
  ctx.lineWidth = 2.4;
  ctx.strokeStyle = demoState.actionIssued ? "rgba(87,222,131,.85)" : "rgba(255,59,48,.75)";
  ctx.stroke();

  if (["mission", "decision", "outcome"].includes(demoState.stage)) {
    const ack = demoState.operatorAck || "pending";
    const lifecycle = demoState.incident ? demoState.incident.lifecycle : "new";
    const modeProfile = communicationModeProfile();
    const communicationMode = currentCommunicationMode();
    ctx.font = uiCanvasFont(10, 900);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const label = demoState.stage === "mission"
      ? (lifecycle === "closed"
          ? "WATCH MODE"
          : lifecycle === "mitigated"
            ? "RISK CONTAINED"
            : ack === "escalated"
              ? "CREW DISPATCHED"
              : ack === "acknowledged"
                ? "COMMAND OWNED"
                : communicationMode === "raw"
                  ? "RAW IN TRANSIT"
                  : communicationMode === "hybrid"
                    ? "HYBRID TRIAGE"
                    : "INCIDENT TRACKED")
      : (demoState.actionIssued ? "TSR ISSUED" : "ACTION PENDING");
    const w = ctx.measureText(label).width + 18;
    roundRect(s.x - w/2, s.y - 58 * view.scale, w, 24, 8);
    ctx.fillStyle = demoState.stage === "mission"
      ? (lifecycle === "closed"
          ? "rgba(10,38,56,.84)"
          : lifecycle === "mitigated"
            ? "rgba(18,76,42,.86)"
            : ack === "escalated"
              ? "rgba(88,56,14,.84)"
              : ack === "acknowledged"
                ? "rgba(18,76,42,.86)"
                : communicationMode === "raw"
                  ? "rgba(76,16,14,.84)"
                  : communicationMode === "hybrid"
                    ? "rgba(88,56,14,.84)"
                    : "rgba(18,76,42,.80)")
      : (demoState.actionIssued ? "rgba(20,86,46,.86)" : "rgba(105,18,18,.82)");
    ctx.fill();
    ctx.strokeStyle = demoState.stage === "mission"
      ? (lifecycle === "closed"
          ? "rgba(95,220,255,.44)"
          : lifecycle === "mitigated"
            ? "rgba(87,222,131,.48)"
            : ack === "escalated"
              ? "rgba(255,224,130,.46)"
              : ack === "acknowledged"
                ? "rgba(87,222,131,.48)"
                : communicationMode === "raw"
                  ? "rgba(255,95,80,.45)"
                  : communicationMode === "hybrid"
                    ? "rgba(255,224,130,.42)"
                    : "rgba(87,222,131,.42)")
      : (demoState.actionIssued ? "rgba(87,222,131,.48)" : "rgba(255,95,80,.45)");
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.fillText(label, s.x, s.y - 46 * view.scale);
  }

  ctx.restore();
}
