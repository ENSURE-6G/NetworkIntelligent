function currentMapProfile() {
  return MAP_STAGE_PROFILES[demoState.stage] || MAP_STAGE_PROFILES.mission;
}

const canvasTypeScaleCache = {
  frame: null,
  value: 1
};

function uiCanvasTextScale() {
  if (canvasTypeScaleCache.frame === frameNow) {
    return canvasTypeScaleCache.value;
  }
  const scale = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--map-font-scale"));
  canvasTypeScaleCache.frame = frameNow;
  canvasTypeScaleCache.value = Number.isFinite(scale) && scale > 0 ? scale : 1;
  return canvasTypeScaleCache.value;
}

function uiCanvasFont(sizePx, weight = 900, family = "Inter, system-ui", multiplier = 1) {
  const computedSize = Math.max(7, sizePx * uiCanvasTextScale() * multiplier);
  return `${weight} ${computedSize.toFixed(2)}px ${family}`;
}

function drawSea() {
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, "#18364a");
  g.addColorStop(.45, "#0d2a3d");
  g.addColorStop(1, "#06111c");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Screen-aligned presentation grid. The previous skewed grid fought the map layout.
  ctx.save();
  ctx.globalAlpha = .065;
  ctx.strokeStyle = "#9edfff";
  ctx.lineWidth = 1;
  const minor = 64;
  const major = minor * 4;
  const offsetX = Math.round((W * 0.5) % minor);
  const offsetY = Math.round((H * 0.5) % minor);

  for (let x = offsetX; x < W + minor; x += minor) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = offsetY; y < H + minor; y += minor) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  ctx.globalAlpha = .095;
  for (let x = offsetX; x < W + major; x += major) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = offsetY; y < H + major; y += major) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawNeighbors() {
  // Norway and Finland removed for a cleaner Sweden-focused demo map.
}

function drawSwedenTexture(poly) {
  ctx.save();
  polygonPath(poly);
  ctx.clip();

  const bbox = getBBox(poly);
  const step = Math.max(2.2, 3.2 * view.scale);

  for (let y = bbox.y; y < bbox.y + bbox.h; y += 3) {
    for (let x = bbox.x; x < bbox.x + bbox.w; x += 3) {
      const p = {x, y};
      if (!pointInPoly(p, poly)) continue;

      const n = fbm(x, y);
      const mountain = Math.max(0, 1 - x / 300) * Math.max(0, 1 - y / 1050) * fbm(x - 800, y + 600);
      let r, g, b;

      if (mountain > .42) {
        r = lerp(90, 145, mountain);
        g = lerp(100, 130, mountain);
        b = lerp(80, 112, mountain);
      } else if (n > .58) {
        r = 27; g = 72; b = 39;
      } else if (n < .32 && y > 600) {
        r = 105; g = 130; b = 74;
      } else {
        r = 55; g = 103; b = 55;
      }

      const s = toScreen(p);
      ctx.fillStyle = `rgb(${r|0},${g|0},${b|0})`;
      ctx.fillRect(s.x, s.y, step, step);
    }
  }

  ctx.restore();
}

function drawSweden() {
  drawSwedenTexture(sweden);
  drawSwedenTexture(gotland);
  drawSwedenTexture(oland);

  fillPoly(sweden, "rgba(255,255,255,.035)", "rgba(255,255,255,.38)", 1.8);
  fillPoly(gotland, "rgba(255,255,255,.025)", "rgba(255,255,255,.30)", 1.3);
  fillPoly(oland, "rgba(255,255,255,.025)", "rgba(255,255,255,.28)", 1.2);
}

function drawLake(lake) {
  void lake;
}
function drawRailwayRoute(route) {
  const pts = route.points.map(name => cities[name]);
  const isMain = route.type === "main";

  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Shadow / corridor bed
  ctx.beginPath();
  for (let i = 0; i <= 260; i++) {
    const p = toScreen(catmull(pts, i / 260));
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  }
  ctx.strokeStyle = isMain ? "rgba(0,0,0,.66)" : "rgba(0,0,0,.42)";
  ctx.lineWidth = (isMain ? 8 : 5) * view.scale;
  ctx.stroke();

  // Route line
  ctx.beginPath();
  for (let i = 0; i <= 260; i++) {
    const p = toScreen(catmull(pts, i / 260));
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  }

  ctx.strokeStyle = isMain ? "rgba(244,241,220,.96)" : "rgba(95,220,255,.72)";
  ctx.lineWidth = (isMain ? 4.2 : 2.5) * view.scale;
  if (!isMain) ctx.setLineDash([8 * view.scale, 7 * view.scale]);
  ctx.shadowColor = isMain ? "rgba(255,255,255,.48)" : "rgba(95,220,255,.75)";
  ctx.shadowBlur = isMain ? 8 : 12;
  ctx.stroke();

  ctx.restore();
}

function drawRouteLabel(route) {
  // Route labels removed: the demo focuses on one highlighted corridor.
}


function drawStationCatchments() {
  const hubs = ["Stockholm", "Göteborg", "Malmö"];
  ctx.save();
  hubs.forEach(name => {
    const c = cities[name];
    const s = toScreen(c);
    const radius = 38 * view.scale;
    const gradient = ctx.createRadialGradient(s.x, s.y, 2, s.x, s.y, radius);
    gradient.addColorStop(0, "rgba(255,224,130,.22)");
    gradient.addColorStop(1, "rgba(255,224,130,0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(s.x, s.y, radius, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawStationHierarchyLabels() {
  if (W < MAP_BREAKPOINTS.stationHierarchy) return;
  const groups = [
    {label:"T1 NATIONAL HUBS", names:["Stockholm","Göteborg","Malmö"], color:"rgba(255,224,130,.9)"},
    {label:"T2 REGIONAL HUBS", names:["Kiruna","Luleå","Umeå","Sundsvall","Örebro"], color:"rgba(158,223,255,.86)"}
  ];

  ctx.save();
  groups.forEach(group => {
    const pts = group.names.map(n => cities[n]);
    const avg = pts.reduce((a,p)=>({x:a.x+p.x,y:a.y+p.y}), {x:0,y:0});
    avg.x /= pts.length;
    avg.y /= pts.length;
    const s = toScreen(avg);
    ctx.font = uiCanvasFont(10, 900);
    const w = ctx.measureText(group.label).width + 16;
    ctx.fillStyle = "rgba(6,17,28,.58)";
    roundRect(s.x - w/2, s.y - 12, w, 22, 999);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.16)";
    ctx.stroke();
    ctx.fillStyle = group.color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(group.label, s.x, s.y);
  });
  ctx.restore();
}

function drawRailwayTopology() {
  railwayRoutes.forEach(drawRailwayRoute);
  railwayRoutes.forEach(drawRouteLabel);
}
function drawWeatherLayer() {
  ctx.save();
  weatherZones.forEach((zone, i) => {
    const c = cities[zone.city];
    if (!c) return;
    const s = toScreen(c);
    const pulse = 1 + (Math.sin(frameNow * MAP_ANIMATION.weatherPulseRate + i) + 1) * MAP_ANIMATION.weatherPulseAmount;
    const r = zone.radius * view.scale * pulse;

    const g = ctx.createRadialGradient(s.x, s.y, 2, s.x, s.y, r);
    if (zone.color === "#ff3b30") {
      g.addColorStop(0, "rgba(255,59,48,.34)");
      g.addColorStop(1, "rgba(255,59,48,0)");
    } else {
      g.addColorStop(0, "rgba(130,230,255,.25)");
      g.addColorStop(1, "rgba(130,230,255,0)");
    }

    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
    ctx.fill();

  });
  ctx.restore();
}

function drawDigitalTwinLayer(mode = "all") {
  ctx.save();
  const primaryOnly = mode === "primary" || mode === "sensor";
  const sensorOnly = mode === "sensor";

  // Sensor uplinks terminate at nearby edge gateways before crossing the radio network.
  sensorNodes.forEach((node, i) => {
    if (primaryOnly && !node.primary) return;
    const gateway = gatewayById[node.gatewayId];
    if (!gateway) return;
    drawDataLink(node, gateway, {
      color: node.primary ? "rgba(255,224,130,.58)" : "rgba(255,224,130,.32)",
      glow: node.primary ? "#ffe082" : "#d7ecff",
      width: node.primary ? 1.5 : 1,
      dash: [3, 6],
      phase: i * 0.11
    });
  });

  // Edge gateways aggregate local sensor meaning and forward to base stations.
  if (!sensorOnly) {
    edgeGateways.forEach((gateway, i) => {
      if (primaryOnly && !gateway.primary) return;
      const base = baseStationById[gateway.baseStationId];
      if (!base) return;
      drawDataLink(gateway, base, {
        color: gateway.primary ? "rgba(87,222,131,.58)" : "rgba(95,220,255,.36)",
        glow: gateway.primary ? "#57de83" : "#5fdcff",
        width: gateway.primary ? 1.8 : 1.25,
        dash: [6, 6],
        phase: i * 0.18
      });
    });
  }

  // Backhaul/data links from corridor base stations to national control center near Stockholm.
  const control = {x: cities.Stockholm.x - 92, y: cities.Stockholm.y - 20};
  if (!sensorOnly) {
    baseStations.forEach((station, i) => {
      if (primaryOnly && !station.primary) return;
      drawDataLink(station, control, {
        color: station.primary ? "rgba(87,222,131,.44)" : "rgba(76,169,255,.26)",
        glow: station.primary ? "#57de83" : "#4ca9ff",
        width: station.primary ? 1.55 : 1.05,
        dash: [5, 8],
        bend: Math.sin(i) * 30,
        phase: i * 0.2
      });
    });
  }

  // Control center badge
  if (!sensorOnly && W > MAP_BREAKPOINTS.controlCenter) {
    const s = toScreen(control);
    ctx.setLineDash([]);
    ctx.font = uiCanvasFont(10, 900);
    ctx.fillStyle = "rgba(6,17,28,.82)";
    roundRect(s.x - 68, s.y - 20, 136, 40, 7);
    ctx.fill();
    ctx.strokeStyle = "rgba(128,207,255,.35)";
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("NATIONAL", s.x, s.y - 6);
    ctx.fillText("CONTROL CENTER", s.x, s.y + 8);
  }

  drawBaseStations(mode);
  drawEdgeGateways(mode);
  drawRailSensors(mode);
  drawInfrastructureLegend();

  ctx.restore();
}

function drawInfrastructureLegend() {
  if (demoState.stage !== "constraint" || W < 900 || W >= 1180) return;
  const x = W - 255;
  const y = H - 150;
  const w = 210;
  const h = 92;

  ctx.save();
  roundRect(x, y, w, h, 14);
  ctx.fillStyle = "rgba(6,17,28,.68)";
  ctx.fill();
  ctx.strokeStyle = "rgba(129,209,255,.22)";
  ctx.stroke();
  ctx.font = uiCanvasFont(9, 900);
  ctx.fillStyle = "#9edfff";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("MAP DATA PATH", x + 14, y + 17);

  const rows = [
    ["sensor", "#ffe082", "Sensors"],
    ["edge", "#57de83", "Edge gateway"],
    ["bs", "#5fdcff", "Base station"],
    ["ncc", "#ffffff", "National control"]
  ];

  rows.forEach((row, i) => {
    const yy = y + 36 + i * 13;
    ctx.fillStyle = row[1];
    if (row[0] === "sensor") {
      ctx.fillRect(x + 16, yy - 3, 6, 6);
    } else if (row[0] === "edge") {
      roundRect(x + 13, yy - 5, 12, 10, 3);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(x + 19, yy, row[0] === "bs" ? 5 : 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "rgba(255,255,255,.72)";
    ctx.font = uiCanvasFont(8.5, 800);
    ctx.fillText(row[2], x + 34, yy);
  });

  ctx.restore();
}
