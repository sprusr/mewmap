import type { PreparedLayer } from "../../types.js";
import type { RenderedLayer } from "../types.js";
import { featureValueResolver, getSvgPathD } from "./utils.js";

export const render = (
  layer: Extract<PreparedLayer, { type: "line" }>,
): RenderedLayer => {
  const element = document.createElementNS("http://www.w3.org/2000/svg", "g");
  const resolver = featureValueResolver();

  for (const feature of layer.features) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");

    path.setAttribute("data-layername", layer.name);
    path.setAttribute("d", getSvgPathD(feature.geometry));

    resolver.resolve(
      feature.paint?.["line-color"] ?? layer.paint?.["line-color"],
      (value) => path.setAttribute("stroke", value),
      "black",
    );

    resolver.resolve(
      feature.paint?.["line-width"] ?? layer.paint?.["line-width"],
      (value) => path.setAttribute("stroke-width", value.toString()),
      1,
    );

    resolver.resolve(
      feature.paint?.["line-opacity"] ?? layer.paint?.["line-opacity"],
      (value) => path.setAttribute("opacity", value.toString()),
      1,
    );

    // TODO: move to parent styles
    path.setAttribute("fill", "none");

    element.appendChild(path);
  }

  return { element, repaint: resolver.repaint };
};
