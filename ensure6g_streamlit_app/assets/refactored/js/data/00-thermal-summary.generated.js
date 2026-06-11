const THERMAL_SUMMARY = {
  "dtype": "int32",
  "payloads": {
    "hybrid": {
      "adverseReliabilityPct": 82,
      "adverseTransferMs": 382,
      "bytes": 23845,
      "label": "23.3 KB",
      "normalTransferMs": 38,
      "reductionPct": 87.9
    },
    "raw": {
      "adverseReliabilityPct": 52,
      "adverseTransferMs": 3146,
      "bytes": 196608,
      "label": "192.0 KB",
      "normalTransferMs": 315
    },
    "semantic": {
      "adverseReliabilityPct": 99,
      "adverseTransferMs": 4,
      "bytes": 252,
      "label": "252 B",
      "normalTransferMs": 0,
      "reductionPct": 99.9
    }
  },
  "ranges": {
    "deltaTempC": {
      "max": 7.6,
      "median": 1.9,
      "min": 0.1
    },
    "meanTempC": {
      "max": 38.5,
      "median": 16.7,
      "min": 4.0
    },
    "p99TempC": {
      "max": 42.9,
      "median": 18.5,
      "min": 5.8
    }
  },
  "representativeEvent": {
    "confidence": 0.96,
    "deltaTempC": 4.5,
    "frameId": 325,
    "frameName": "p2img00325.npy",
    "hotspotX": 185,
    "hotspotY": 161,
    "maxTempC": 45.9,
    "meanTempC": 38.5,
    "p95TempC": 41.6,
    "p99TempC": 42.9,
    "previewAsset": "evidence/p2pro_representative.png",
    "recommendedAction": "issue_tsr",
    "risk": "high",
    "semanticEvent": {
      "confidence": 0.96,
      "delta_temp_c": 4.5,
      "event_type": "thermal_hotspot",
      "frame_id": 325,
      "hotspot_x": 185,
      "hotspot_y": 161,
      "max_temp_c": 45.9,
      "p95_temp_c": 41.6,
      "p99_temp_c": 42.9,
      "recommended_action": "issue_tsr",
      "risk_label": "high",
      "sensor_id": "thermal-camera"
    },
    "thermalAsset": "evidence/p2pro_thermal_heatmap.png"
  },
  "riskDistribution": {
    "high": 63,
    "low": 1110,
    "medium": 515
  },
  "sampleCount": 1688,
  "shape": "192 x 256",
  "source": "Actual P2 Pro thermal evidence"
};
