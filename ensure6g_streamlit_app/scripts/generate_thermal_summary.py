from __future__ import annotations

import json
import shutil
import struct
from pathlib import Path
import re
import zlib

import numpy as np


APP_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = APP_DIR.parent / "ThermalData"
P2PRO_DIR = DATA_DIR / "p2pro"
OUTPUT_PATH = APP_DIR / "assets" / "refactored" / "js" / "data" / "00-thermal-summary.generated.js"
EVIDENCE_DIR = APP_DIR / "assets" / "refactored" / "evidence"
REPRESENTATIVE_PREVIEW = EVIDENCE_DIR / "p2pro_representative.png"
REPRESENTATIVE_HEATMAP = EVIDENCE_DIR / "p2pro_thermal_heatmap.png"
FRAME_RE = re.compile(r"(\d+)$")


def celsius_from_p2pro(raw: np.ndarray) -> np.ndarray:
    return raw / 64.0 - 273.2


def write_rgb_png(path: Path, rgb: np.ndarray) -> None:
    """Write an RGB PNG without adding image dependencies to the demo."""
    if rgb.dtype != np.uint8 or rgb.ndim != 3 or rgb.shape[2] != 3:
        raise ValueError("write_rgb_png expects a uint8 HxWx3 array")

    height, width, _ = rgb.shape

    def chunk(name: bytes, payload: bytes) -> bytes:
        return (
            struct.pack(">I", len(payload))
            + name
            + payload
            + struct.pack(">I", zlib.crc32(name + payload) & 0xFFFFFFFF)
        )

    scanlines = b"".join(b"\x00" + rgb[row].tobytes() for row in range(height))
    png = (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(scanlines, level=9))
        + chunk(b"IEND", b"")
    )
    path.write_bytes(png)


def thermal_colormap(temp_c: np.ndarray) -> np.ndarray:
    lower = float(np.nanpercentile(temp_c, 3))
    upper = float(np.nanpercentile(temp_c, 99.6))
    norm = np.clip((temp_c - lower) / max(upper - lower, 1e-6), 0, 1)

    stops = np.array(
        [
            [8, 17, 34],
            [22, 72, 116],
            [46, 142, 149],
            [248, 211, 92],
            [246, 114, 54],
            [218, 43, 38],
        ],
        dtype=float,
    )
    scaled = norm * (len(stops) - 1)
    left = np.floor(scaled).astype(int)
    right = np.clip(left + 1, 0, len(stops) - 1)
    frac = (scaled - left)[..., None]
    rgb = stops[left] * (1 - frac) + stops[right] * frac
    return rgb.astype(np.uint8)


def risk_label(p99_temp_c: float, delta_temp_c: float) -> str:
    if p99_temp_c >= 36 or delta_temp_c >= 5:
        return "high"
    if p99_temp_c >= 33 or delta_temp_c >= 2.5:
        return "medium"
    return "low"


def confidence_from_stats(p99_temp_c: float, delta_temp_c: float) -> float:
    thermal_strength = max(0.0, (p99_temp_c - 31.0) / 7.0)
    anomaly_strength = max(0.0, delta_temp_c / 5.0)
    return round(float(min(0.96, 0.45 + 0.35 * thermal_strength + 0.20 * anomaly_strength)), 2)


def recommended_action(risk: str) -> str:
    return {
        "high": "issue_tsr",
        "medium": "increase_monitoring",
        "low": "monitor",
    }.get(risk, "monitor")


def fmt_bytes(num_bytes: int) -> str:
    if num_bytes >= 1024 * 1024:
        return f"{num_bytes / (1024 * 1024):.1f} MB"
    if num_bytes >= 1024:
        return f"{num_bytes / 1024:.1f} KB"
    return f"{num_bytes:,} B"


def pct_reduction(raw_bytes: int, compact_bytes: int) -> float:
    return round((1 - compact_bytes / max(raw_bytes, 1)) * 100, 1)


def transfer_ms(payload_bytes: int, cap_bps: int) -> int:
    return int(round(1000 * payload_bytes * 8 / max(cap_bps, 1)))


def frame_id_from_stem(stem: str) -> int:
    match = FRAME_RE.search(stem)
    return int(match.group(1)) if match else 0


def summarize_frames() -> dict:
    files = sorted(P2PRO_DIR.glob("*.npy"))
    if not files:
        raise FileNotFoundError(f"No P2 Pro .npy files found in {P2PRO_DIR}")

    rows = []
    shape = None
    dtype_name = None
    raw_payload_bytes = 0
    for path in files:
        raw = np.load(path)
        temp = celsius_from_p2pro(raw)
        hotspot_flat_idx = int(np.nanargmax(temp))
        hotspot_y, hotspot_x = np.unravel_index(hotspot_flat_idx, temp.shape)
        shape = tuple(int(v) for v in raw.shape)
        dtype_name = str(raw.dtype)
        raw_payload_bytes = int(raw.nbytes)
        mean_temp = float(np.nanmean(temp))
        p95_temp = float(np.nanpercentile(temp, 95))
        p99_temp = float(np.nanpercentile(temp, 99))
        max_temp = float(np.nanmax(temp))
        delta_temp = p99_temp - mean_temp
        risk = risk_label(p99_temp, delta_temp)
        rows.append(
            {
                "stem": path.stem,
                "mean_temp_c": mean_temp,
                "p95_temp_c": p95_temp,
                "p99_temp_c": p99_temp,
                "max_temp_c": max_temp,
                "delta_temp_c": delta_temp,
                "hotspot_x": int(hotspot_x),
                "hotspot_y": int(hotspot_y),
                "risk": risk,
                "confidence": confidence_from_stats(p99_temp, delta_temp),
            }
        )

    def values(key: str) -> np.ndarray:
        return np.array([row[key] for row in rows], dtype=float)

    risk_rank = {"low": 0, "medium": 1, "high": 2}
    event = max(
        rows,
        key=lambda row: (
            risk_rank[row["risk"]],
            row["confidence"],
            row["p99_temp_c"],
            row["delta_temp_c"],
        ),
    )
    event_risk = event["risk"]
    event_action = recommended_action(event_risk)
    preview_source = DATA_DIR / "p2proPic" / f"{event['stem']}.png"
    preview_asset = None
    if preview_source.exists():
        EVIDENCE_DIR.mkdir(parents=True, exist_ok=True)
        shutil.copy2(preview_source, REPRESENTATIVE_PREVIEW)
        preview_asset = "evidence/p2pro_representative.png"

    thermal_asset = None
    event_raw_path = P2PRO_DIR / f"{event['stem']}.npy"
    if event_raw_path.exists():
        EVIDENCE_DIR.mkdir(parents=True, exist_ok=True)
        write_rgb_png(REPRESENTATIVE_HEATMAP, thermal_colormap(celsius_from_p2pro(np.load(event_raw_path))))
        thermal_asset = "evidence/p2pro_thermal_heatmap.png"

    semantic_event = {
        "sensor_id": "thermal-camera",
        "frame_id": frame_id_from_stem(event["stem"]),
        "event_type": "thermal_hotspot" if event_risk != "low" else "thermal_nominal",
        "hotspot_x": event["hotspot_x"],
        "hotspot_y": event["hotspot_y"],
        "p95_temp_c": round(event["p95_temp_c"], 1),
        "p99_temp_c": round(event["p99_temp_c"], 1),
        "max_temp_c": round(event["max_temp_c"], 1),
        "delta_temp_c": round(event["delta_temp_c"], 1),
        "risk_label": event_risk,
        "confidence": event["confidence"],
        "recommended_action": event_action,
    }
    semantic_payload_bytes = len(json.dumps(semantic_event, separators=(",", ":")).encode("utf-8"))
    hybrid_payload_bytes = int(round(semantic_payload_bytes + raw_payload_bytes * 0.12))
    normal_cap_bps = 5_000_000
    adverse_cap_bps = 500_000

    return {
        "source": "Actual P2 Pro thermal evidence",
        "sampleCount": len(rows),
        "shape": f"{shape[0]} x {shape[1]}",
        "dtype": dtype_name,
        "riskDistribution": {
            risk: sum(1 for row in rows if row["risk"] == risk)
            for risk in ("low", "medium", "high")
        },
        "ranges": {
            "meanTempC": {
                "min": round(float(values("mean_temp_c").min()), 1),
                "median": round(float(np.percentile(values("mean_temp_c"), 50)), 1),
                "max": round(float(values("mean_temp_c").max()), 1),
            },
            "p99TempC": {
                "min": round(float(values("p99_temp_c").min()), 1),
                "median": round(float(np.percentile(values("p99_temp_c"), 50)), 1),
                "max": round(float(values("p99_temp_c").max()), 1),
            },
            "deltaTempC": {
                "min": round(float(values("delta_temp_c").min()), 1),
                "median": round(float(np.percentile(values("delta_temp_c"), 50)), 1),
                "max": round(float(values("delta_temp_c").max()), 1),
            },
        },
        "representativeEvent": {
            "frameId": semantic_event["frame_id"],
            "frameName": f"{event['stem']}.npy",
            "previewAsset": preview_asset,
            "thermalAsset": thermal_asset,
            "hotspotX": event["hotspot_x"],
            "hotspotY": event["hotspot_y"],
            "p95TempC": round(event["p95_temp_c"], 1),
            "p99TempC": round(event["p99_temp_c"], 1),
            "meanTempC": round(event["mean_temp_c"], 1),
            "maxTempC": round(event["max_temp_c"], 1),
            "deltaTempC": round(event["delta_temp_c"], 1),
            "risk": event_risk,
            "confidence": event["confidence"],
            "recommendedAction": event_action,
            "semanticEvent": semantic_event,
        },
        "payloads": {
            "raw": {
                "bytes": raw_payload_bytes,
                "label": fmt_bytes(raw_payload_bytes),
                "normalTransferMs": transfer_ms(raw_payload_bytes, normal_cap_bps),
                "adverseTransferMs": transfer_ms(raw_payload_bytes, adverse_cap_bps),
                "adverseReliabilityPct": 52,
            },
            "hybrid": {
                "bytes": hybrid_payload_bytes,
                "label": fmt_bytes(hybrid_payload_bytes),
                "normalTransferMs": transfer_ms(hybrid_payload_bytes, normal_cap_bps),
                "adverseTransferMs": transfer_ms(hybrid_payload_bytes, adverse_cap_bps),
                "adverseReliabilityPct": 82,
                "reductionPct": pct_reduction(raw_payload_bytes, hybrid_payload_bytes),
            },
            "semantic": {
                "bytes": semantic_payload_bytes,
                "label": fmt_bytes(semantic_payload_bytes),
                "normalTransferMs": transfer_ms(semantic_payload_bytes, normal_cap_bps),
                "adverseTransferMs": transfer_ms(semantic_payload_bytes, adverse_cap_bps),
                "adverseReliabilityPct": 99,
                "reductionPct": pct_reduction(raw_payload_bytes, semantic_payload_bytes),
            },
        },
    }


def main() -> None:
    summary = summarize_frames()
    OUTPUT_PATH.write_text(
        "const THERMAL_SUMMARY = "
        + json.dumps(summary, indent=2, sort_keys=True)
        + ";\n",
        encoding="utf-8",
    )
    print(f"Wrote {OUTPUT_PATH}")
    print(
        f"Samples: {summary['sampleCount']} | "
        f"P99 max: {summary['ranges']['p99TempC']['max']}C | "
        f"semantic payload: {summary['payloads']['semantic']['label']}"
    )


if __name__ == "__main__":
    main()
