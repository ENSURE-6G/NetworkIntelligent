const majorStationsOnly = new Set([
  "Kiruna", "Umeå", "Sundsvall", "Stockholm", "Göteborg", "Malmö"
]);

const heroCorridor = ["Kiruna", "Luleå", "Umeå", "Sundsvall", "Gävle", "Uppsala", "Stockholm"];

const railwayRoutes = [
  {
    name: "Malmbanan / Iron Ore Line",
    type: "main",
    labelAt: .34,
    points: ["Narvik", "Kiruna", "Gällivare", "Boden", "Luleå"]
  },
  {
    name: "Northern Main / Bothnia Railway Track",
    type: "main",
    labelAt: .44,
    points: ["Luleå", "Skellefteå", "Umeå", "Sundsvall", "Gävle", "Uppsala", "Stockholm"]
  },
  {
    name: "East Coast Line",
    type: "main",
    labelAt: .57,
    points: ["Sundsvall", "Hudiksvall", "Gävle", "Uppsala", "Stockholm"]
  },
  {
    name: "Western Main Line",
    type: "main",
    labelAt: .52,
    points: ["Stockholm", "Västerås", "Örebro", "Hallsberg", "Göteborg"]
  },
  {
    name: "Southern Main Line",
    type: "main",
    labelAt: .54,
    points: ["Stockholm", "Norrköping", "Linköping", "Nässjö", "Alvesta", "Lund", "Malmö"]
  },
  {
    name: "West Coast Line",
    type: "main",
    labelAt: .42,
    points: ["Göteborg", "Halmstad", "Helsingborg", "Lund", "Malmö", "Copenhagen"]
  },
  {
    name: "Mittbanan",
    type: "branch",
    labelAt: .46,
    points: ["Östersund", "Ånge", "Sundsvall"]
  },
  {
    name: "Bergslagen Link",
    type: "branch",
    labelAt: .48,
    points: ["Gävle", "Falun", "Borlänge", "Örebro"]
  },
  {
    name: "Southeast Line",
    type: "branch",
    labelAt: .62,
    points: ["Stockholm", "Norrköping", "Linköping", "Kalmar"]
  }
];

const trainFleet = [
  {
    id: "TRAIN 01",
    operator: "PASS",
    route: 1,
    color: "#20242b",
    from: "Umeå",
    to: "Stockholm"
  }
];

const weatherZones = [
  {name:"SNOW RISK", city:"Kiruna", radius:42, color:"#b8ecff"},
  {name:"ICE WARNING", city:"Umeå", radius:38, color:"#58d7ff"},
  {name:"SIGNAL DELAY", city:"Stockholm", radius:34, color:"#ff3b30"}
];

const baseStations = [
  {id:"BS-N1", label:"BS north", x:386, y:118, coverage:74},
  {id:"BS-U1", label:"BS Umeå", x:432, y:324, coverage:68},
  {id:"BS-S1", label:"BS Sundsvall", x:420, y:430, coverage:76, primary:true},
  {id:"BS-C1", label:"BS control", x:402, y:612, coverage:72}
];

const edgeGateways = [
  {id:"EG-N", label:"edge gateway", x:402, y:330, baseStationId:"BS-U1"},
  {id:"EG-S", label:"sensor edge", x:372, y:462, baseStationId:"BS-S1", primary:true},
  {id:"EG-C", label:"edge gateway", x:370, y:590, baseStationId:"BS-C1"}
];

const sensorNodes = [
  {id:"TS-01", label:"thermal", x:377, y:345, type:"thermal", gatewayId:"EG-N"},
  {id:"TS-02", label:"rail", x:359, y:402, type:"rail", gatewayId:"EG-S"},
  {id:"TS-04", label:"hotspot", x:340, y:452, type:"thermal", gatewayId:"EG-S", primary:true},
  {id:"TS-05", label:"vibration", x:338, y:503, type:"vibration", gatewayId:"EG-S"},
  {id:"TS-06", label:"thermal", x:337, y:558, type:"thermal", gatewayId:"EG-C"},
  {id:"TS-07", label:"switch", x:336, y:602, type:"rail", gatewayId:"EG-C"}
];
