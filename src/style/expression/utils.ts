/**
 * Given a value and an array of stops, returns the interpolated value at the
 * given value.
 * @example
 * ```ts
 * stops(0.5, [[0, 10], [1, 20]]) // -> 15
 * ```
 */
export const stops = (
  input: number,
  stops: Array<[number, number]>,
): number => {
  ``;
  if (stops.length === 0) {
    return input;
  }

  const firstStop = stops[0];
  if (stops.length === 1 && firstStop) {
    return firstStop[1];
  }

  // find the two stops to interpolate between
  for (let i = 0; i < stops.length - 1; i++) {
    const stopLow = stops[i];
    const stopHigh = stops[i + 1];

    if (!stopLow || !stopHigh) continue;

    const [inputLow, outputLow] = stopLow;
    const [inputHigh, outputHigh] = stopHigh;

    if (input <= inputLow) {
      return outputLow;
    }

    if (input >= inputLow && input <= inputHigh) {
      // linear interpolation
      const t = (input - inputLow) / (inputHigh - inputLow);
      return outputLow + t * (outputHigh - outputLow);
    }
  }

  // if input is greater than all stops, return the last output value
  const lastStop = stops[stops.length - 1];
  return lastStop ? lastStop[1] : input;
};
