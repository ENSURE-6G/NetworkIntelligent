function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, VIEWPORT_LIMITS.maxDpr);
  const host = canvas.parentElement;
  const hostRect = host ? host.getBoundingClientRect() : null;
  W = Math.max(1, Math.round(hostRect?.width || innerWidth));
  H = Math.max(1, Math.round(hostRect?.height || innerHeight));
  canvas.width = Math.floor(W * DPR);
  canvas.height = Math.floor(H * DPR);
  canvas.style.width = W + "px";
  canvas.style.height = H + "px";
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

  const bbox = getBBox([...sweden, ...gotland, ...oland]);
  const isSmall = W < VIEWPORT_LIMITS.smallWidth;
  const isShort = H < VIEWPORT_LIMITS.shortHeight;
  const presentationProfile = getPresentationProfile(W, H);
  const reservedX = isSmall
    ? VIEWPORT_LIMITS.smallReservedX
    : presentationProfile.reservedX;
  const reservedY = isSmall
    ? (isShort ? VIEWPORT_LIMITS.smallReservedYShort : VIEWPORT_LIMITS.smallReservedY)
    : presentationProfile.reservedY;
  const fit = Math.min(W / (bbox.w + reservedX), H / (bbox.h + reservedY));

  view.scale = fit * (
    isSmall
      ? (isShort ? VIEWPORT_LIMITS.smallScaleShort : VIEWPORT_LIMITS.smallScale)
      : presentationProfile.scale
  );
  view.x = W / 2 - (bbox.x + bbox.w / 2) * view.scale + (isSmall ? 0 : presentationProfile.offsetX);
  view.y = H / 2 - (bbox.y + bbox.h / 2) * view.scale + (
    isSmall
      ? (isShort ? 52 : 82)
      : presentationProfile.offsetY
  );
  document.body.dataset.layout = isSmall ? (isShort ? "phone-short" : "phone") : presentationProfile.layout;
}

window.addEventListener("resize", resize);

function routePoint(routeIndex, p) {
  const pts = railwayRoutes[routeIndex].points.map(name => cities[name]);
  return catmull(pts, p);
}

function routeTangent(routeIndex, p) {
  const pts = railwayRoutes[routeIndex].points.map(name => cities[name]);
  const a = catmull(pts, Math.max(0, p - PATHING.routeTangentStep));
  const b = catmull(pts, Math.min(1, p + PATHING.routeTangentStep));
  return Math.atan2(b.y - a.y, b.x - a.x);
}
