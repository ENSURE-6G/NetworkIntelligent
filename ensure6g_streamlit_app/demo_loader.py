from pathlib import Path
import base64
import json
import mimetypes


ASSET_BUNDLES = {
    "/* INLINE:styles.css */": [
        "css/00-foundation.css",
        "css/10-story-shell.css",
        "css/20-sensing.css",
        "css/30-fusion-and-semantics.css",
        "css/40-trust-decision-outcome.css",
        "css/50-responsive-and-presentation.css",
        "css/60-semantic-constraint.css",
        "css/70-transfer-and-ux-shell.css",
        "css/80-control-center-dashboard.css",
    ],
    "<!-- INLINE:body.html -->": [
        "body/00-shell-start.html",
        "body/10-stage-mission.html",
        "body/20-stage-sensing.html",
        "body/30-stage-fusion.html",
        "body/40-stage-constraint.html",
        "body/50-stage-decision.html",
        "body/60-stage-outcome.html",
        "body/90-shell-end.html",
    ],
    "/* INLINE:thermal-summary.js */": ["js/data/00-thermal-summary.generated.js"],
    "/* INLINE:demo-data.js */": [
        "js/demo-data/00-config-and-evidence.js",
        "js/demo-data/10-copy.js",
        "js/demo-data/20-seasonal-scenarios.js",
    ],
    "/* INLINE:demo-state.js */": [
        "js/demo-state/00-ui-cache.js",
        "js/demo-state/10-semantic-packet.js",
        "js/demo-state/20-runtime-and-season.js",
        "js/demo-state/25-resizable-divider.js",
        "js/demo-state/26-fluid-typography.js",
        "js/demo-state/27-operator-ack.js",
        "js/demo-state/29-incident-engine.js",
        "js/demo-state/28-operations-wall.js",
        "js/demo-state/30-presenter-and-stage-control.js",
        "js/demo-state/40-bootstrap.js",
    ],
    "/* INLINE:map-core.js */": [
        "js/map-core/00-canvas-and-config.js",
        "js/map-core/10-geometry-and-noise.js",
        "js/map-core/20-viewport-and-routing.js",
    ],
    "/* INLINE:map-data.js */": [
        "js/map-data/00-geography-and-cities.js",
        "js/map-data/10-network-assets.js",
    ],
    "/* INLINE:map-renderer.js */": [
        "js/map-renderer/00-config-and-cache.js",
        "js/map-renderer/10-base-map.js",
        "js/map-renderer/20-network-overlays.js",
        "js/map-renderer/30-stage-animations.js",
        "js/map-renderer/40-render-loop.js",
    ],
}


def _streamlit_bridge_script() -> str:
    return """
<script>
  (function () {
    const sendHeight = () => {
      const height = window.innerHeight;
      window.parent.postMessage(
        {
          type: "streamlit:setFrameHeight",
          height: height
        },
        "*"
      );
    };

    window.addEventListener("load", sendHeight);
    window.addEventListener("resize", sendHeight);
    setTimeout(sendHeight, 150);
    setTimeout(sendHeight, 600);
  })();
</script>
"""


def _bootstrap_script(bootstrap_state: dict | None) -> str:
    payload = json.dumps(bootstrap_state or {}, ensure_ascii=True)
    return f"""
<script>
  window.DASHBOARD_BOOTSTRAP = {payload};
</script>
"""


def _inline_asset_urls(html: str, asset_dir: Path) -> str:
    for path in (asset_dir / "evidence").glob("*"):
        if not path.is_file():
            continue
        mime_type = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
        encoded = base64.b64encode(path.read_bytes()).decode("ascii")
        html = html.replace(
            f"src=\"evidence/{path.name}\"",
            f"src=\"data:{mime_type};base64,{encoded}\"",
        )
    return html


def _read_bundle(asset_dir: Path, relative_paths: list[str]) -> str:
    parts: list[str] = []
    for relative_path in relative_paths:
        parts.append((asset_dir / relative_path).read_text(encoding="utf-8"))
    return "\n".join(parts)


def build_demo_html(asset_dir: Path, bootstrap_state: dict | None = None) -> str:
    html = (asset_dir / "index.html").read_text(encoding="utf-8")
    for marker, relative_paths in ASSET_BUNDLES.items():
        html = html.replace(marker, _read_bundle(asset_dir, relative_paths))

    html = _inline_asset_urls(html, asset_dir)

    bridge = _bootstrap_script(bootstrap_state) + _streamlit_bridge_script()
    if "</body>" in html:
        return html.replace("</body>", f"{bridge}\n</body>", 1)
    return html + bridge
