import React, { useEffect, useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Html, useTexture } from '@react-three/drei';
import { latLngToCartesian } from './spherical';
import earth from './img/earth.jpg'
import './Globe.css'

const API_URL = 'http://localhost:5000/api/globe';

// Компонент "Земля": шар с текстурой планеты
function Earth({ radius }) {
  const earthTexture = useTexture(earth);

  return (
    <mesh>
      <sphereGeometry args={[radius, 64, 64]} />
      <meshStandardMaterial
        map={earthTexture}
        roughness={0.9}
        metalness={0.0}
      />
    </mesh>
  );
}

// Компонент маркера страны: маленькая сфера + подпись с флагом и названием
function CountryMarker({ marker, radius, onClick }) {
  // Вычисляем позицию маркера на поверхности сферы по lat/lng
  const position = useMemo(
    () => latLngToCartesian(marker.lat, marker.lng, radius + 0.03),
    [marker.lat, marker.lng, radius]
  );

  return (
    <group position={position}>
      {/* Сфера-маркер на глобусе */}
      <mesh
        onClick={() => onClick(marker)}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default';
        }}
      >
        <sphereGeometry args={[0.035, 16, 16]} />
        <meshStandardMaterial
          emissive="#ffffff"
          emissiveIntensity={marker.is_popular ? 1.4 : 0.8}
        />
      </mesh>

      {/* Флаг (круглый) + имя страны рядом */}
      <Html distanceFactor={10}>
        <div className="marker-label">
          {marker.flag_url && (
            <img
              src={marker.flag_url}
              alt={marker.name_en}
              className="marker-flag"
            />
          )}
          <span className="marker-text">
            {marker.name_ru} ({marker.tours_count})
          </span>
        </div>
      </Html>
    </group>
  );
}

// Основной компонент глобуса: фон, свет, Земля и набор маркеров
function Globe({ onCountrySelect }) {
  const [markers, setMarkers] = useState([]);
  const radius = 2;

  // Загружаем список стран/маркеров с бэкенда
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/markers`);
        const data = await res.json();
        setMarkers(data);
      } catch (e) {
        console.error('Ошибка при загрузке маркеров:', e);
      }
    })();
  }, []);

  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 45 }}
      className="globe-canvas"
    >
      {/* Мягкий общий свет */}
      <ambientLight intensity={0.4} />
      {/* Направленный свет, создающий блики на сфере */}
      <directionalLight position={[5, 5, 5]} intensity={1.2} />

      {/* Звёздный фон вокруг глобуса */}
      <Stars
        radius={100}
        depth={50}
        count={5000}
        factor={3}
        saturation={0}
        fade
      />

      {/* Сам глобус */}
      <Earth radius={radius} />

      {/* Метки стран на поверхности глобуса */}
      {markers.map((m) => (
        <CountryMarker
          key={m.id}
          marker={m}
          radius={radius}
          onClick={onCountrySelect}
        />
      ))}

      {/* Управление камерой: вращение мышью, масштабирование */}
      <OrbitControls enablePan={false} enableZoom={true} />
    </Canvas>
  );
}

export default Globe;
