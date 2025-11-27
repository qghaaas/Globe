// spherical.js

// Перевод географических координат (широта/долгота в градусах)
// в 3D-координаты на сфере Three.js с equirectangular-текстурой.
export function latLngToCartesian(latDeg, lonDeg, radius) {
  // latDeg  — широта:  +90 (северный полюс) … 0 … -90 (южный)
  // lonDeg  — долгота: -180 … 0 … +180

  // Переводим в радианы через сферические углы
  const phi = (90 - latDeg) * (Math.PI / 180);   // угол от "северного полюса"
  const theta = (lonDeg + 180) * (Math.PI / 180); // смещение по долготе

  // Формула, согласованная с тем, как Three.js мапит текстуру на SphereGeometry
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const z =  radius * Math.sin(phi) * Math.sin(theta);
  const y =  radius * Math.cos(phi);

  return [x, y, z];
}
