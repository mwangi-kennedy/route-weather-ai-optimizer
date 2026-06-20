/**
 * Samples N evenly spaced coordinates from a dense route geometry array
 * @param {Array} coordinates 
 * @param {number} maxSamples 
 * @returns {Array}
 */
export function sampleRouteCoordinates(coordinates, maxSamples = 12) {
  if (!coordinates || coordinates.length === 0) return [];
  if (coordinates.length <= maxSamples) return coordinates;

  const sampled = [];
  const step = (coordinates.length - 1) / (maxSamples - 1);

  for (let i = 0; i < maxSamples; i++) {
    const index = Math.round(i * step);
    sampled.push(coordinates[index]);
  }

  return sampled;
}