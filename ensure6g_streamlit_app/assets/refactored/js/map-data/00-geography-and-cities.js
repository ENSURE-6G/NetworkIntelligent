// Hand-traced simplified Sweden silhouette based on the classic vertical Sweden map.
// It is intentionally map-like, not GIS-grade, but much closer to the recognizable national shape.
const sweden = [
  {x:376,y:10},{x:402,y:28},{x:428,y:33},{x:448,y:57},{x:478,y:76},{x:474,y:110},
  {x:498,y:138},{x:476,y:170},{x:486,y:205},{x:462,y:237},{x:472,y:270},{x:448,y:305},
  {x:462,y:346},{x:428,y:382},{x:442,y:424},{x:404,y:464},{x:418,y:506},{x:382,y:550},
  {x:394,y:596},{x:356,y:640},{x:368,y:690},{x:330,y:736},{x:338,y:782},{x:306,y:834},
  {x:320,y:884},{x:288,y:930},{x:246,y:944},{x:214,y:910},{x:182,y:916},{x:150,y:874},
  {x:160,y:830},{x:128,y:800},{x:142,y:750},{x:112,y:714},{x:130,y:670},{x:104,y:626},
  {x:126,y:580},{x:112,y:528},{x:142,y:486},{x:136,y:438},{x:168,y:392},{x:160,y:344},
  {x:194,y:302},{x:190,y:254},{x:224,y:212},{x:224,y:170},{x:258,y:136},{x:264,y:96},
  {x:300,y:70},{x:320,y:36}
];

const gotland = [
  {x:492,y:670},{x:522,y:704},{x:518,y:758},{x:492,y:812},{x:458,y:826},{x:436,y:790},
  {x:442,y:736},{x:466,y:690}
];

const oland = [
  {x:420,y:738},{x:436,y:772},{x:432,y:838},{x:416,y:884},{x:400,y:848},{x:402,y:780}
];

const norway = sweden.map(p => ({ x: p.x - 238 + Math.sin(p.y * .018) * 25, y: p.y + 18 }));
const finland = [
  {x:560,y:20},{x:640,y:90},{x:656,y:210},{x:620,y:336},{x:646,y:470},{x:610,y:620},
  {x:644,y:760},{x:594,y:900},{x:520,y:920},{x:506,y:800},{x:536,y:640},{x:512,y:500},
  {x:540,y:350},{x:516,y:200}
];

const lakes = [
  {name:"Vänern", x:174, y:682, rx:54, ry:30},
  {name:"Vättern", x:284, y:714, rx:20, ry:64},
  {name:"Mälaren", x:338, y:612, rx:44, ry:18},
  {name:"Siljan", x:244, y:468, rx:29, ry:22},
  {name:"Storsjön", x:160, y:358, rx:36, ry:22}
];

const cities = {
  Narvik:{x:238,y:72,rank:3, tier:"INT", foreign:true, role:"Norway connection"},
  Kiruna:{x:354,y:91,rank:2, tier:"T2", role:"Arctic rail / mining"},
  Gällivare:{x:374,y:132,rank:3, tier:"T3", role:"mining junction"},
  Boden:{x:394,y:178,rank:3, tier:"T3", role:"northern junction"},
  Luleå:{x:412,y:196,rank:2, tier:"T2", role:"northern port hub"},
  Skellefteå:{x:404,y:270,rank:3, tier:"T3", role:"regional station"},
  Umeå:{x:382,y:342,rank:2, tier:"T2", role:"northern regional hub"},
  Östersund:{x:166,y:368,rank:2, tier:"T2", role:"inland hub"},
  Ånge:{x:278,y:424,rank:3, tier:"T3", role:"junction"},
  Sundsvall:{x:340,y:452,rank:2, tier:"T2", role:"east coast hub"},
  Hudiksvall:{x:338,y:500,rank:3, tier:"T3", role:"regional station"},
  Gävle:{x:336,y:558,rank:2, tier:"T2", role:"east coast junction"},
  Borlänge:{x:252,y:548,rank:3, tier:"T3", role:"Bergslagen node"},
  Falun:{x:278,y:540,rank:3, tier:"T3", role:"regional station"},
  Uppsala:{x:334,y:602,rank:2, tier:"T2", role:"Stockholm region"},
  Stockholm:{x:350,y:642,rank:1, tier:"T1", role:"national hub"},
  Västerås:{x:292,y:632,rank:3, tier:"T3", role:"Mälaren station"},
  Örebro:{x:232,y:666,rank:2, tier:"T2", role:"central junction"},
  Karlstad:{x:150,y:678,rank:2, tier:"T2", role:"western regional hub"},
  Hallsberg:{x:252,y:690,rank:3, tier:"T3", role:"freight/passenger junction"},
  Norrköping:{x:326,y:708,rank:2, tier:"T2", role:"southern corridor"},
  Linköping:{x:304,y:732,rank:2, tier:"T2", role:"southern corridor"},
  Jönköping:{x:232,y:755,rank:2, tier:"T2", role:"regional hub"},
  Nässjö:{x:258,y:782,rank:3, tier:"T3", role:"southern junction"},
  Alvesta:{x:268,y:835,rank:3, tier:"T3", role:"southern junction"},
  Kalmar:{x:350,y:842,rank:3, tier:"T3", role:"southeast endpoint"},
  Göteborg:{x:130,y:826,rank:1, tier:"T1", role:"western national hub"},
  Halmstad:{x:178,y:870,rank:3, tier:"T3", role:"west coast station"},
  Helsingborg:{x:210,y:910,rank:3, tier:"T3", role:"west coast station"},
  Lund:{x:238,y:922,rank:3, tier:"T3", role:"Skåne junction"},
  Malmö:{x:250,y:928,rank:1, tier:"T1", role:"southern national hub"},
  Copenhagen:{x:235,y:962,rank:3, tier:"INT", foreign:true, role:"Denmark connection"}
};
