# ENSURE-6G Network Intelligent Demo

This repository contains the Streamlit control-center demo for semantic communication over a Sweden railway track scenario.

## Run

```bash
cd ensure6g_streamlit_app
pip install -r requirements.txt
streamlit run app.py
```

The app packages the interactive dashboard, digital twin map, RAW / HYBRID / SEMANTIC mode comparison, and receiver validation workflow.

## Main App

- `ensure6g_streamlit_app/app.py`: Streamlit entrypoint
- `ensure6g_streamlit_app/assets/refactored/`: dashboard UI, map rendering, semantic transfer drawer, and evidence assets
- `ensure6g_streamlit_app/scripts/generate_thermal_summary.py`: optional evidence summary generator for local thermal frames

Large raw thermal data folders are excluded from git. The committed app uses compact generated evidence assets for fast presentation startup.
