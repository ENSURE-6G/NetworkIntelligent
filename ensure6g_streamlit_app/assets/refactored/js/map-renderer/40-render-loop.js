function draw(now = performance.now()) {
  frameNow = now;
  requestAnimationFrame(draw);
  if (frameNow - lastRenderAt < RENDER_BUDGET.targetFrameMs) return;
  lastRenderAt = frameNow;
  const profile = currentMapProfile();
  rebuildBaseLayerIfNeeded();
  rebuildStageLayerIfNeeded(profile);
  rebuildOverlayLayerIfNeeded();
  ctx.clearRect(0, 0, W, H);
  drawCachedLayer(renderLayers.base);
  drawCachedLayer(renderLayers.stage);

  if (profile.weather) drawWeatherLayer();
  if (profile.catchments) drawStationCatchments();
  if (profile.heroCorridor) drawHeroCorridor();
  if (profile.telecom) drawDigitalTwinLayer(profile.telecom);
  if (profile.communicationChain) drawPrimaryCommunicationChain();

  if (profile.train) drawTrainFleet();
  drawSynchronizedMapAnimation();
  drawExecutiveOverlay();
  if (profile.focus) drawStoryMapFocus();
  drawCachedLayer(renderLayers.overlay);
  if (typeof syncMapDrawerHotspot === "function") syncMapDrawerHotspot();
}

resize();
requestAnimationFrame(draw);
