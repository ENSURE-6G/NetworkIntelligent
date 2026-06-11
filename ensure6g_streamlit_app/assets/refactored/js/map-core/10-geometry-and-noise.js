function getBBox(points) {
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return {
    x: minX,
    y: minY,
    w: Math.max(...xs) - minX,
    h: Math.max(...ys) - minY
  };
}

function toScreen(p) {
  return { x: view.x + p.x * view.scale, y: view.y + p.y * view.scale };
}

function lerp(a,b,t){ return a + (b-a)*t; }
function fract(v){ return v - Math.floor(v); }
function hash(x,y){ return fract(Math.sin(x * NOISE_CONFIG.seedX + y * NOISE_CONFIG.seedY) * NOISE_CONFIG.seedScale); }

function noise(x,y) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi+1, yi), c = hash(xi, yi+1), d = hash(xi+1, yi+1);
  return lerp(lerp(a,b,u), lerp(c,d,u), v);
}

function fbm(x,y) {
  let value = 0;
  let amp = NOISE_CONFIG.baseAmplitude;
  let freq = NOISE_CONFIG.baseFrequency;
  for (let i = 0; i < NOISE_CONFIG.octaves; i++) {
    value += amp * noise(x*freq, y*freq);
    amp *= NOISE_CONFIG.amplitudeDecay;
    freq *= NOISE_CONFIG.frequencyGrowth;
  }
  return value;
}

function pointInPoly(p, poly) {
  let inside = false;
  for (let i=0, j=poly.length-1; i<poly.length; j=i++) {
    const xi = poly[i].x, yi = poly[i].y;
    const xj = poly[j].x, yj = poly[j].y;
    const intersect = ((yi > p.y) !== (yj > p.y)) &&
      (p.x < (xj - xi) * (p.y - yi) / (yj - yi + PATHING.pointIntersectEpsilon) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function polygonPath(poly) {
  ctx.beginPath();
  poly.forEach((p,i) => {
    const s = toScreen(p);
    if (i === 0) ctx.moveTo(s.x, s.y);
    else ctx.lineTo(s.x, s.y);
  });
  ctx.closePath();
}

function fillPoly(poly, fill, stroke = null, width = 1) {
  polygonPath(poly);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.stroke();
  }
}

function catmull(points, p) {
  const n = points.length - 1;
  const scaled = p * n;
  const i = Math.min(n - 1, Math.floor(scaled));
  const t = scaled - i;

  const p0 = points[Math.max(0, i - 1)];
  const p1 = points[i];
  const p2 = points[i + 1];
  const p3 = points[Math.min(n, i + 2)];

  const tt = t * t;
  const ttt = tt * t;

  return {
    x: .5 * ((2*p1.x) + (-p0.x+p2.x)*t + (2*p0.x-5*p1.x+4*p2.x-p3.x)*tt + (-p0.x+3*p1.x-3*p2.x+p3.x)*ttt),
    y: .5 * ((2*p1.y) + (-p0.y+p2.y)*t + (2*p0.y-5*p1.y+4*p2.y-p3.y)*tt + (-p0.y+3*p1.y-3*p2.y+p3.y)*ttt)
  };
}
