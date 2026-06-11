# ENSURE-6G Streamlit App

This folder contains a Streamlit conversion of the HTML demonstrator from `/Users/kyitha/Downloads/ensure6g_synced_train_story.html`.

## Why this structure

The source file is already a complete interactive application:

- inline CSS for the presentation layer
- inline JavaScript for demo state and autoplay
- a custom canvas renderer for the animated Sweden rail map

Rewriting that into native Streamlit widgets and charts would be slower, larger, and more fragile than packaging the original artifact inside a Streamlit shell.

## Files

- `app.py`: Streamlit entrypoint
- `demo_loader.py`: asset composer and iframe sizing bridge
- `assets/refactored/index.html`: HTML template
- `assets/refactored/css/`: ordered stylesheet partials composed at runtime
- `assets/refactored/body/`: ordered markup partials composed at runtime
- `assets/refactored/js/data/`: generated evidence data bundle
- `assets/refactored/js/demo-data/`: timing/config, copy, and seasonal scenario partials
- `assets/refactored/js/demo-state/`: presenter controls, stage transitions, and event wiring partials
- `assets/refactored/js/map-core/`: canvas setup, geometry helpers, viewport math
- `assets/refactored/js/map-data/`: geography, railway, station, train, weather, and sensor inputs
- `assets/refactored/js/map-renderer/`: ordered map rendering partials composed at runtime
- `scripts/generate_thermal_summary.py`: scans `../ThermalData/p2pro` and regenerates the evidence summary
- `assets/ensure6g_synced_train_story.html`: original source kept for reference
- `requirements.txt`: minimal dependency set

## Run

```bash
cd "/Users/kyitha/Documents/New project 3/ensure6g_streamlit_app"
streamlit run app.py
```

## Refresh Actual Evidence

The app does not load all thermal arrays during presentation. It uses the generated
`assets/refactored/js/data/00-thermal-summary.generated.js` file for fast startup and stable slides.
The same generator also copies the representative P2 Pro preview into
`assets/refactored/evidence/p2pro_representative.png` for Step 2.

Regenerate it after changing files in `../ThermalData/p2pro`:

```bash
cd "/Users/kyitha/Documents/New project 3/ensure6g_streamlit_app"
../Ensure6gDemo1/.venv/bin/python scripts/generate_thermal_summary.py
```

## Presenter Notes

Recommended live flow:

Transition from PPT:

> This demo is the railway-track version of the slide story: Network Intelligence = Edge AI + Semantic Communication + Operational Action.

Demo objective:

> Watch the payload change from raw measurements to grounded meaning, then watch that meaning survive a constrained network and change train operation.

1. Problem: actual thermal sensing produces rich raw evidence, but raw evidence is not the same as an operational decision.
2. Anomaly Detection: the demo uses actual P2 Pro thermal evidence, not animation-frame-specific values, to show edge detection of a rail thermal hotspot.
3. Semantic Encoding: Edge AI grounds the evidence into Weaver Level B meaning: risk, confidence, location, and recommended TMS action.
4. Semantic Communication: compare RAW, HYBRID, and SEMANTIC under adverse network conditions. Emphasize that the telecom path is `sensor → edge gateway → base station → national control`, not packets moving through the railway.
5. Level C Decision: the TMS receives trusted meaning, validates confidence/integrity/policy, and changes operation by issuing the TSR command.
6. Network Intelligence Outcome: close with the presentation proof: `90%+` lower routine traffic, compact semantic packet, high adverse-link delivery, low transfer latency, and safer train operation.

Trust / hallucination cue:

> The semantic event is grounded in real P2 Pro evidence and carries confidence/trust checks. The point is not to generate plausible text; it is to preserve the operational meaning needed for a safe decision.
