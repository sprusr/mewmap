import type { PreparedLayer } from "../../types.js";
import { getResolvedValue, getSvgPathD } from "./common.js";

export const render = (layer: Extract<PreparedLayer, { type: "line" }>) => {
  const element = document.createElementNS("http://www.w3.org/2000/svg", "g");

  for (const feature of layer.features) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");

    path.setAttribute("data-layername", layer.name);

    const d = getSvgPathD(feature.geometry);
    path.setAttribute("d", d);

    path.setAttribute(
      "stroke",
      getResolvedValue(feature.paint?.["line-color"]) ?? "black",
    );

    path.setAttribute(
      "stroke-width",
      getResolvedValue(feature.paint?.["line-width"])?.toString() ?? "1",
    );

    const opacity = getResolvedValue(feature.paint?.["line-opacity"]);
    if (opacity !== undefined) {
      path.setAttribute("opacity", opacity.toString() ?? "1");
    }

    // TODO: move to parent styles
    path.setAttribute("fill", "none");

    element.appendChild(path);
  }

  return element;
};
