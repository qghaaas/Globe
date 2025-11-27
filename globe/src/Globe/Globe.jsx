import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Html, useTexture } from '@react-three/drei';
import * as THREE from 'three';

import { latLngToCartesian } from './spherical';
import earth from './img/earth.jpg';
import './Globe.css';

const API_URL = 'http://localhost:5000/api/globe';

function getPopularityLevel(marker) {
  if (marker.popularity_level) return marker.popularity_level;

  const score = Number(marker.popularity_score) || 0;

  if (score < 60) return 'low';   
  if (score < 80) return 'medium';  
  return 'high';                   
}

function getPopularityColor(level) {
  switch (level) {
    case 'low':
      return '#27ae60';
    case 'medium':
      return '#f1c40f'; 
    case 'high':
      return '#e74c3c'; 
    default:
      return 'rgba(255, 255, 255, 0.6)';
  }
}

function Earth({ radius }) {
  const earthTexture = useTexture(earth);

  return (
    <mesh>
      <sphereGeometry args={[radius, 64, 64]} />
      <meshStandardMaterial map={earthTexture} roughness={0.9} metalness={0.0} />
    </mesh>
  );
}

function CountryMarker({
  marker,
  radius,
  onClick,
  isActive,
  onHover,
  onHoverEnd,
}) {
  const position = useMemo(
    () => latLngToCartesian(marker.lat, marker.lng, radius + 0.01),
    [marker.lat, marker.lng, radius]
  );

  const popularityLevel = getPopularityLevel(marker);
  const borderColor =
    marker.popularity_color || 
    getPopularityColor(popularityLevel);

  return (
    <group position={position}>
      <Html distanceFactor={10}>
        <div
          className={`marker-pill ${isActive ? 'marker-pill--active' : ''}`}
          onMouseEnter={(e) => {
            e.stopPropagation();
            onHover?.(marker);
          }}
          onMouseLeave={() => {
            onHoverEnd?.(marker);
          }}
          onClick={(e) => {
            e.stopPropagation();
            onClick?.(marker);
          }}
        >
          <div
            className="marker-flag-wrapper"
            style={{ borderColor }}
          >
            {marker.flag_url && (
              <img
                src={marker.flag_url}
                alt={marker.name_en || marker.name_ru}
                className="marker-flag"
              />
            )}
          </div>

          <div className="marker-info">
            <span className="marker-country">{marker.name_ru}</span>
            <span className="marker-tours">
              {marker.tours_count} туров
            </span>
          </div>
        </div>
      </Html>
    </group>
  );
}

function GlobeScene({
  markers,
  radius,
  onCountrySelect,
  hoveredMarkerId,
  searchMarkerId,
  setHoveredMarkerId,
  onInterruptSearch,
}) {
  const controlsRef = useRef();
  const { camera } = useThree();
  const flyRef = useRef(null);      
  const initialDoneRef = useRef(false); 
  const initialProgressRef = useRef(0);  

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  }, []);

  useEffect(() => {
    if (!searchMarkerId) return;
    const marker = markers.find((m) => m.id === searchMarkerId);
    if (!marker) return;

    const posArr = latLngToCartesian(marker.lat, marker.lng, radius);
    const markerDir = new THREE.Vector3(posArr[0], posArr[1], posArr[2]).normalize();
    const distance = radius + 2.5; 
    const endPos = markerDir.clone().multiplyScalar(distance);

    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }

    flyRef.current = {
      startPos: camera.position.clone(),
      endPos,
      progress: 0,
    };
  }, [searchMarkerId, markers, radius, camera]);

  useFrame((_, delta) => {
    if (!initialDoneRef.current && !flyRef.current) {
      const speed = 0.6;
      initialProgressRef.current += delta * speed;
      const t = Math.min(initialProgressRef.current, 1);

      const startZ = 12; 
      const endZ = 8;   
      const z = startZ + (endZ - startZ) * t;

      camera.position.set(0, 0, z);
      if (controlsRef.current) {
        controlsRef.current.update();
      }

      if (t >= 1) {
        initialDoneRef.current = true;
      }
      return;
    }

    if (!flyRef.current) return;

    const speed = 0.8;
    flyRef.current.progress += delta * speed;
    const t = Math.min(flyRef.current.progress, 1);

    const { startPos, endPos } = flyRef.current;
    const newPos = startPos.clone().lerp(endPos, t);

    camera.position.copy(newPos);
    if (controlsRef.current) {
      controlsRef.current.update();
    }

    if (t >= 1) {
      flyRef.current = null;
    }
  });

  return (
    <>
      <ambientLight intensity={1} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} />
      <Stars radius={100} depth={50} count={5000} factor={3} saturation={0} fade />

      <Earth radius={radius} />

      {markers.map((m) => (
        <CountryMarker
          key={m.id}
          marker={m}
          radius={radius}
          onClick={onCountrySelect}
          isActive={hoveredMarkerId === m.id || searchMarkerId === m.id}
          onHover={() => setHoveredMarkerId(m.id)}
          onHoverEnd={(marker) => {
            setHoveredMarkerId((cur) => (cur === marker.id ? null : cur));
          }}
        />
      ))}

      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableZoom={true}
        enableRotate={true}
        minDistance={7}   
        maxDistance={15}  
        onStart={() => {
          flyRef.current = null;
          initialDoneRef.current = true;

          if (controlsRef.current) {
            controlsRef.current.target.set(0, 0, 0);
            controlsRef.current.update();
          }

          onInterruptSearch?.(); 
        }}
      />
    </>
  );
}

function Globe({ onCountrySelect }) {
  const [markers, setMarkers] = useState([]);
  const [hoveredMarkerId, setHoveredMarkerId] = useState(null);
  const [searchMarkerId, setSearchMarkerId] = useState(null);
  const [searchValue, setSearchValue] = useState('');

  const radius = 4;

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

  const handleSearch = () => {
    if (!searchValue.trim()) return;

    const query = searchValue.trim().toLowerCase();

    const found = markers.find((m) => {
      const ru = m.name_ru?.toLowerCase() || '';
      const en = m.name_en?.toLowerCase() || '';
      return ru.includes(query) || en.includes(query);
    });

    if (!found) {
      return;
    }

    setSearchMarkerId(found.id);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="globe-wrapper">
      <div className="globe-search">
        <input
          className="globe-search-input"
          type="text"
          placeholder="Поиск страны..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          className="globe-search-btn"
          type="button"
          onClick={handleSearch}
        >
          Найти
        </button>
      </div>

      <div className="globe-legend">
        <div className="globe-legend-item">
          <span className="globe-legend-dot globe-legend-dot--low" />
          <span>Мало туров</span>
        </div>
        <div className="globe-legend-item">
          <span className="globe-legend-dot globe-legend-dot--medium" />
          <span>Средняя популярность</span>
        </div>
        <div className="globe-legend-item">
          <span className="globe-legend-dot globe-legend-dot--high" />
          <span>Очень популярно</span>
        </div>
      </div>

      <Canvas
        camera={{ position: [0, 0, 12], fov: 45 }}
        className="globe-canvas"
      >
        <GlobeScene
          markers={markers}
          radius={radius}
          onCountrySelect={onCountrySelect}
          hoveredMarkerId={hoveredMarkerId}
          searchMarkerId={searchMarkerId}
          setHoveredMarkerId={setHoveredMarkerId}
          onInterruptSearch={() => setSearchMarkerId(null)}
        />
      </Canvas>
    </div>
  );
}

export default Globe;
