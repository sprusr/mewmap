import type { PreparedFeatureContext, PreparedLayer } from "../../types.js";
import { getResolvedValue, getSvgPathD } from "./utils.js";

export const render = (
  layer: Extract<PreparedLayer, { type: "fill" }>,
  context: PreparedFeatureContext,
) => {
  const element = document.createElementNS("http://www.w3.org/2000/svg", "g");

  for (const feature of layer.features) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");

    path.setAttribute("data-layername", layer.name);

    const d = getSvgPathD(feature.geometry);
    path.setAttribute("d", d);

    path.setAttribute(
      "fill",
      getResolvedValue(
        feature.paint?.["fill-color"] ?? layer.paint?.["fill-color"],
        context,
      ) ?? "black",
    );

    const opacity = getResolvedValue(
      feature.paint?.["fill-opacity"] ?? layer.paint?.["fill-opacity"],
      context,
    );
    if (opacity !== undefined) {
      path.setAttribute("opacity", opacity.toString() ?? "1");
    }

    // const fillTranslate = getResolvedValue(
    //   feature.paint?.["fill-translate"] ?? layer.paint?.["fill-translate"],
    // );
    // if (fillTranslate) {
    //   path.setAttribute(
    //     "transform",
    //     `translate(${fillTranslate.x} ${fillTranslate.y})`,
    //   );
    // }

    // TODO: move to parent styles
    path.setAttribute("stroke", "none");

    element.appendChild(path);
  }

  return element;
};
