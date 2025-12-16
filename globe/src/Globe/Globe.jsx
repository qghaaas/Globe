import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Html, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { latLngToCartesian } from './spherical';
import earthNight from './img/earthNight.jpg';
import earthDay from './img/earthDay.jpg';
import search from './img/search.svg';
import close from './img/close.svg';
import './Globe.css';
import SunIcon from './img/SunIcon.svg';
import MoonIcon from './img/MoonIcon.svg';
import earthBump from './img/earthBump.jpg';

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

function Earth({ radius, theme }) {
  const textures = useTexture(
    theme === 'light'
      ? {
        map: earthDay,
        bumpMap: earthBump,
      }
      : {
        map: earthNight,
      }
  );

  return (
    <mesh>
      <sphereGeometry args={[radius, 64, 64]} />
      <meshStandardMaterial
        map={textures.map}
        bumpMap={theme === 'light' ? textures.bumpMap : null}
        bumpScale={theme === 'light' ? 0.25 : 0}
        roughness={0.9}
        metalness={0.0}
      />
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
  const { camera } = useThree();
  const [isVisible, setIsVisible] = useState(true);
  const visibleRef = useRef(true);

  const position = useMemo(
    () => latLngToCartesian(marker.lat, marker.lng, radius + 0),
    [marker.lat, marker.lng, radius]
  );

  useFrame(() => {
    const markerDir = new THREE.Vector3(...position).normalize();
    const camDir = camera.position.clone().normalize();
    const visible = markerDir.dot(camDir) > 0;

    if (visible !== visibleRef.current) {
      visibleRef.current = visible;
      setIsVisible(visible);
    }
  });

  if (!isVisible) return null;

  const popularityLevel = getPopularityLevel(marker);
  const borderColor = marker.popularity_color || getPopularityColor(popularityLevel);

  const offers = Number(marker.offers_count ?? 0);
  const hotels = Number(marker.hotels_count ?? 0);

  return (
    <group position={position}>
      <Html distanceFactor={10}>
        <div
          style={{ borderColor }}
          className={`marker-pill ${isActive ? 'marker-pill--active' : ''}`}
          onMouseEnter={(e) => {
            e.stopPropagation();
            onHover?.(marker);
          }}
          onMouseLeave={() => onHoverEnd?.(marker)}
          onClick={(e) => {
            e.stopPropagation();
            onClick?.(marker);
          }}
        >
          <div className="marker-flag-wrapper">
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

            {/* вместо tours_count */}
            <span className="marker-tours">
              {offers} предложений · {hotels} отелей
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
  theme,
}) {
  const controlsRef = useRef();
  const { camera } = useThree();
  const flyRef = useRef(null);
  const initialDoneRef = useRef(false);
  const initialProgressRef = useRef(0);
  const LIGHT_PRESETS = {
    light: {
      ambient: {
        intensity: 0.5,
        color: "#ffffff",
      },
      directional: {
        intensity: 1.1,
        color: "#ffffff",
        position: [5, 5, 5],
      },
    },
    dark: {
      ambient: {
        intensity: 10.2,
        color: "#888888",
      },
      directional: {
        intensity: 10.2,
        color: "#888888",
        position: [5, 5, 5],
      },
    },
  };
  const light = LIGHT_PRESETS[theme];
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
      <ambientLight
        intensity={light.ambient.intensity}
        color={light.ambient.color}
      />
      <directionalLight
        position={light.directional.position}
        intensity={light.directional.intensity}
        color={light.directional.color}
      />
      <Stars radius={100} depth={50} count={5000} factor={3} saturation={0} fade />

      <Earth radius={radius} theme={theme} />

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
  const [theme, setTheme] = useState('dark');

  const radius = 4;


  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

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

  const suggestions = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) return [];

    return markers
      .filter((m) => {
        const ru = m.name_ru?.toLowerCase() || '';
        const en = m.name_en?.toLowerCase() || '';
        return ru.includes(query) || en.includes(query);
      })
      .slice(0, 7);
  }, [searchValue, markers]);

  const handleSearch = () => {
    if (!searchValue.trim()) return;

    const foundFromSuggestions = suggestions[0];

    if (foundFromSuggestions) {
      setSearchMarkerId(foundFromSuggestions.id);
      return;
    }

    const query = searchValue.trim().toLowerCase();
    const found = markers.find((m) => {
      const ru = m.name_ru?.toLowerCase() || '';
      const en = m.name_en?.toLowerCase() || '';
      return ru.includes(query) || en.includes(query);
    });

    if (!found) return;

    setSearchMarkerId(found.id);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSuggestionClick = (marker) => {
    setSearchValue(marker.name_ru || marker.name_en || '');
    setSearchMarkerId(marker.id);
  };

  return (
    <div className={`globe-wrapper ${theme}`}>

      <div className="globe-theme-toggle">
        <img
          src={theme === 'dark' ? SunIcon : MoonIcon}
          alt="theme toggle"
          onClick={toggleTheme}
          className="theme-toggle-icon"
        />
      </div>

      <div className="globe-search">
        <div className="globe-search-input-wrapper">
          <input
            className="globe-search-input"
            type="text"
            placeholder="Поиск страны..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          {searchValue.length === 0 ? (
            <img
              src={search}
              alt="search"
              className="globe-search-icon"
            />
          ) : (
            <img
              src={close}
              alt="clear"
              className="globe-search-icon globe-search-icon--clear"
              onClick={() => {
                setSearchValue('');
                setSearchMarkerId(null);
              }}
            />
          )}
        </div>

        <button
          className="globe-search-btn"
          type="button"
          onClick={handleSearch}
        >
          Найти
        </button>


        {/* Подсказки под строкой поиска */}
        {suggestions.length > 0 && (
          <ul className="globe-search-suggestions">
            {suggestions.map((m) => (
              <li
                key={m.id}
                className="globe-search-suggestion"
                onMouseDown={() => handleSuggestionClick(m)}
              >
                {m.flag_url && (
                  <img
                    src={m.flag_url}
                    alt={m.name_en || m.name_ru}
                    className="globe-search-suggestion-flag"
                  />
                )}
                <span className="globe-search-suggestion-name">
                  {m.name_ru}
                  {m.name_en && m.name_en !== m.name_ru && (
                    <span className="globe-search-suggestion-name-en">
                      {' '}
                      ({m.name_en})
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="globe-legend">
        <div className="globe-legend-item">
          <span className="globe-legend-dot globe-legend-dot--low" />
          <span>Низкая популярность</span>
        </div>
        <div className="globe-legend-item">
          <span className="globe-legend-dot globe-legend-dot--medium" />
          <span>Средняя популярность</span>
        </div>
        <div className="globe-legend-item">
          <span className="globe-legend-dot globe-legend-dot--high" />
          <span>Высокая популярность</span>
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
          theme={theme}
        />
      </Canvas>
    </div>
  );
}


export default Globe;
