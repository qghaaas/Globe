// Вспомогательная функция для перевода широты/долготы в 3D-координаты на сфере
export function latLngToCartesian(latDeg, lngDeg, radius) {
  const lat = (latDeg * Math.PI) / 180;
  const lng = (lngDeg * Math.PI) / 180;

  const x = radius * Math.cos(lat) * Math.sin(lng);
  const y = radius * Math.sin(lat);
  const z = radius * Math.cos(lat) * Math.cos(lng);

  return [x, y, z];
}
