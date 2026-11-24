const number = '(-?\\d+(?:\\.\\d+)?)';
const coordinatePair = new RegExp(`^\\s*${number}\\s*,\\s*${number}\\s*$`);
const placeCoordinates = new RegExp(`!3d${number}!4d${number}(?=!|$)`, 'g');

export function restaurantLocation(input) {
  let match = input.match(coordinatePair);
  if (!match) {
    try {
      const url = new URL(input);
      if (url.protocol !== 'https:' || !['google.com', 'www.google.com', 'maps.google.com'].includes(url.hostname)) return null;
      if (url.hostname !== 'maps.google.com' && !/^\/maps(?:\/|$)/.test(url.pathname)) return null;
      match = url.searchParams.get('query')?.match(coordinatePair)
        || url.searchParams.get('q')?.match(coordinatePair)
        || Array.from(decodeURIComponent(url.pathname).matchAll(placeCoordinates)).at(-1);
    } catch {
      return null;
    }
  }
  if (!match) return null;
  const latitude = Number(match[1]);
  const longitude = Number(match[2]);
  return Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180 ? { latitude, longitude } : null;
}

export function distanceKm(from, to) {
  const rad = Math.PI / 180;
  const a = Math.sin((to.latitude - from.latitude) * rad / 2) ** 2
    + Math.cos(from.latitude * rad) * Math.cos(to.latitude * rad)
    * Math.sin((to.longitude - from.longitude) * rad / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(Math.min(1, a)));
}
