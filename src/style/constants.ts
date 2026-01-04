export const LAYERS = [
  {
    id: "background",
    type: "background",
    paint: {
      "background-color": "rgb(249,244,238)",
    },
  },
  {
    source: "versatiles-shortbread",
    id: "water-ocean",
    type: "fill",
    "source-layer": "ocean",
    paint: {
      "fill-color": "rgb(190,221,243)",
    },
  },
  {
    source: "versatiles-shortbread",
    id: "land-glacier",
    type: "fill",
    "source-layer": "water_polygons",
    filter: ["all", ["==", "kind", "glacier"]],
    paint: {
      "fill-color": "rgb(255,255,255)",
    },
  },
  {
    source: "versatiles-shortbread",
    id: "land-commercial",
    type: "fill",
    "source-layer": "land",
    filter: ["all", ["in", "kind", "commercial", "retail"]],
    paint: {
      "fill-color": "rgba(247,222,237,0.251)",
      "fill-opacity": {
        stops: [
          [10, 0],
          [11, 1],
        ],
      },
    },
  },
  {
    source: "versatiles-shortbread",
    id: "land-industrial",
    type: "fill",
    "source-layer": "land",
    filter: ["all", ["in", "kind", "industrial", "quarry", "railway"]],
    paint: {
      "fill-color": "rgba(255,244,194,0.333)",
      "fill-opacity": {
        stops: [
          [10, 0],
          [11, 1],
        ],
      },
    },
  },
  {
    source: "versatiles-shortbread",
    id: "land-residential",
    type: "fill",
    "source-layer": "land",
    filter: ["all", ["in", "kind", "garages", "residential"]],
    paint: {
      "fill-color": "rgba(234,230,225,0.2)",
      "fill-opacity": {
        stops: [
          [10, 0],
          [11, 1],
        ],
      },
    },
  },
  {
    source: "versatiles-shortbread",
    id: "land-agriculture",
    type: "fill",
    "source-layer": "land",
    filter: [
      "all",
      [
        "in",
        "kind",
        "brownfield",
        "farmland",
        "farmyard",
        "greenfield",
        "greenhouse_horticulture",
        "orchard",
        "plant_nursery",
        "vineyard",
      ],
    ],
    paint: {
      "fill-color": "rgb(240,231,209)",
      "fill-opacity": {
        stops: [
          [10, 0],
          [11, 1],
        ],
      },
    },
  },
  {
    source: "versatiles-shortbread",
    id: "land-waste",
    type: "fill",
    "source-layer": "land",
    filter: ["all", ["in", "kind", "landfill"]],
    paint: {
      "fill-color": "rgb(219,214,189)",
      "fill-opacity": {
        stops: [
          [10, 0],
          [11, 1],
        ],
      },
    },
  },
  {
    source: "versatiles-shortbread",
    id: "land-park",
    type: "fill",
    "source-layer": "land",
    filter: [
      "all",
      ["in", "kind", "park", "village_green", "recreation_ground"],
    ],
    paint: {
      "fill-color": "rgb(217,217,165)",
      "fill-opacity": {
        stops: [
          [11, 0],
          [12, 1],
        ],
      },
    },
  },
  {
    source: "versatiles-shortbread",
    id: "land-garden",
    type: "fill",
    "source-layer": "land",
    filter: ["all", ["in", "kind", "allotments", "garden"]],
    paint: {
      "fill-color": "rgb(217,217,165)",
      "fill-opacity": {
        stops: [
          [11, 0],
          [12, 1],
        ],
      },
    },
  },
  {
    source: "versatiles-shortbread",
    id: "land-burial",
    type: "fill",
    "source-layer": "land",
    filter: ["all", ["in", "kind", "cemetery", "grave_yard"]],
    paint: {
      "fill-color": "rgb(221,219,202)",
      "fill-opacity": {
        stops: [
          [13, 0],
          [14, 1],
        ],
      },
    },
  },
  {
    source: "versatiles-shortbread",
    id: "land-leisure",
    type: "fill",
    "source-layer": "land",
    filter: [
      "all",
      ["in", "kind", "miniature_golf", "playground", "golf_course"],
    ],
    paint: {
      "fill-color": "rgb(231,237,222)",
    },
  },
  {
    source: "versatiles-shortbread",
    id: "land-rock",
    type: "fill",
    "source-layer": "land",
    filter: ["all", ["in", "kind", "bare_rock", "scree", "shingle"]],
    paint: {
      "fill-color": "rgb(224,228,229)",
    },
  },
  {
    source: "versatiles-shortbread",
    id: "land-forest",
    type: "fill",
    "source-layer": "land",
    filter: ["all", ["in", "kind", "forest"]],
    paint: {
      "fill-color": "rgb(102,170,68)",
      "fill-opacity": {
        stops: [
          [7, 0],
          [8, 0.1],
        ],
      },
    },
  },
  {
    source: "versatiles-shortbread",
    id: "land-grass",
    type: "fill",
    "source-layer": "land",
    filter: [
      "all",
      ["in", "kind", "grass", "grassland", "meadow", "wet_meadow"],
    ],
    paint: {
      "fill-color": "rgb(216,232,200)",
      "fill-opacity": {
        stops: [
          [11, 0],
          [12, 1],
        ],
      },
    },
  },
  {
    source: "versatiles-shortbread",
    id: "land-vegetation",
    type: "fill",
    "source-layer": "land",
    filter: ["all", ["in", "kind", "heath", "scrub"]],
    paint: {
      "fill-color": "rgb(217,217,165)",
      "fill-opacity": {
        stops: [
          [11, 0],
          [12, 1],
        ],
      },
    },
  },
  {
    source: "versatiles-shortbread",
    id: "land-sand",
    type: "fill",
    "source-layer": "land",
    filter: ["all", ["in", "kind", "beach", "sand"]],
    paint: {
      "fill-color": "rgb(250,250,237)",
    },
  },
  {
    source: "versatiles-shortbread",
    id: "land-wetland",
    type: "fill",
    "source-layer": "land",
    filter: ["all", ["in", "kind", "bog", "marsh", "string_bog", "swamp"]],
    paint: {
      "fill-color": "rgb(211,230,219)",
    },
  },
] as const;
