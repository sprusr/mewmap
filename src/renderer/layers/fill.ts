import type { PreparedLayer } from "../../types.js";
import type { RenderedLayer } from "../types.js";
import { featureValueResolver, getSvgPathD } from "./utils.js";

export const render = (
  layer: Extract<PreparedLayer, { type: "fill" }>,
): RenderedLayer => {
  const element = document.createElementNS("http://www.w3.org/2000/svg", "g");
  const resolver = featureValueResolver();

  for (const feature of layer.features) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");

    path.setAttribute("data-layername", layer.name);
    path.setAttribute("d", getSvgPathD(feature.geometry));

    resolver.resolve(
      feature.paint?.["fill-color"] ?? layer.paint?.["fill-color"],
      (value) => path.setAttribute("fill", value),
      "black",
    );

    resolver.resolve(
      feature.paint?.["fill-opacity"] ?? layer.paint?.["fill-opacity"],
      (value) => path.setAttribute("opacity", value.toString()),
      1,
    );

    // resolver.resolve(
    //   feature.paint?.["fill-translate"] ?? layer.paint?.["fill-translate"],
    //   (value) =>
    //     path.setAttribute("transform", `translate(${value.x} ${value.y})`),
    // );

    // TODO: move to parent styles
    path.setAttribute("stroke", "none");

    element.appendChild(path);
  }

  return { element, repaint: resolver.repaint };
};
