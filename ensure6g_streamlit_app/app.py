from pathlib import Path

import streamlit as st
import streamlit.components.v1 as components

from demo_loader import build_demo_html


APP_DIR = Path(__file__).resolve().parent
ASSET_DIR = APP_DIR / "assets" / "refactored"


st.set_page_config(
    page_title="ENSURE-6G Demonstrator",
    page_icon="🚆",
    layout="wide",
    initial_sidebar_state="collapsed",
)

st.markdown(
    """
    <style>
      [data-testid="stHeader"],
      [data-testid="stToolbar"],
      [data-testid="stSidebar"],
      [data-testid="collapsedControl"] {
        display: none;
      }
      [data-testid="stAppViewContainer"] {
        background: #07111c;
        height: 100vh;
        overflow: hidden;
      }
      [data-testid="stMainBlockContainer"] {
        max-width: 100%;
        padding: 0;
        height: 100vh;
      }
      [data-testid="stVerticalBlock"] {
        gap: 0;
        height: 100vh;
      }
      .block-container {
        max-width: 100%;
        padding: 0;
        height: 100vh;
        overflow: hidden;
      }
      [data-testid="stIFrame"],
      iframe {
        height: 100vh !important;
        max-height: 100vh !important;
      }
      iframe {
        display: block;
        width: 100%;
        border: 0;
        border-radius: 0;
        box-shadow: none;
      }
    </style>
    """,
    unsafe_allow_html=True,
)

if not ASSET_DIR.exists():
    st.error(f"Missing demo asset directory: {ASSET_DIR}")
    st.stop()

if "dashboard_bootstrap" not in st.session_state:
    st.session_state.dashboard_bootstrap = {
        "season": "summer",
        "network": "normal",
        "viewMode": "operations",
        "lastDemoStage": "sensing",
    }

components.html(
    build_demo_html(ASSET_DIR, st.session_state.dashboard_bootstrap),
    height=900,
    scrolling=False,
)
