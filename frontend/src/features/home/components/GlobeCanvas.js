'use client';

import { useEffect, useRef, useCallback } from 'react';
import createGlobe from 'cobe';

// Morocco center coordinates
const MOROCCO_LAT = 31.79;
const MOROCCO_LNG = -7.09;

const toRad = (deg) => (deg * Math.PI) / 180;

// Brand orange in 0-1 range (#ea580c)
const MARKER_COLOR = [0.918, 0.345, 0.047];

/**
 * Project a lat/lng point through the globe's current rotation to canvas 2D coords.
 * Returns null if the point is on the back of the globe.
 */
function projectToCanvas(lat, lng, phi, theta, canvasSize) {
  const latR = toRad(lat);
  const lngR = toRad(lng);

  // 3D point on unit sphere
  const x0 = Math.cos(latR) * Math.sin(lngR);
  const y0 = Math.sin(latR);
  const z0 = Math.cos(latR) * Math.cos(lngR);

  // Rotate around Y axis by phi
  const cosP = Math.cos(phi), sinP = Math.sin(phi);
  const x1 = cosP * x0 + sinP * z0;
  const z1 = -sinP * x0 + cosP * z0;

  // Rotate around X axis by theta
  const cosT = Math.cos(theta), sinT = Math.sin(theta);
  const y1 = cosT * y0 - sinT * z1;
  const z2 = sinT * y0 + cosT * z1;

  if (z2 < 0) return null; // behind the globe

  return {
    x: (x1 * 0.48 + 0.5) * canvasSize,
    y: (-y1 * 0.48 + 0.5) * canvasSize,
  };
}

export default function GlobeCanvas({ markers, size, onMarkerHover, onMarkerLeave }) {
  const canvasRef    = useRef(null);
  const globeRef     = useRef(null);
  const phiRef       = useRef(toRad(-MOROCCO_LNG));
  const thetaRef     = useRef(toRad(MOROCCO_LAT) * 0.35);
  const isHoveredRef = useRef(false);

  const buildCobeMarkers = useCallback(() =>
    markers.flatMap(({ lat, lng, partners }) =>
      // One cobe marker entry per partner, size scales with partner count
      partners.map(() => ({
        location: [lat, lng],
        size: Math.min(0.05 + partners.length * 0.012, 0.1),
      }))
    ),
  [markers]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2);

    globeRef.current = createGlobe(canvas, {
      devicePixelRatio: dpr,
      width:  size * dpr,
      height: size * dpr,
      phi:    phiRef.current,
      theta:  thetaRef.current,
      dark:   1,
      diffuse: 1.4,
      scale:  1.08,
      mapSamples:    16000,
      mapBrightness: 7,
      baseColor:   [0.08, 0.08, 0.08],
      markerColor: MARKER_COLOR,
      glowColor:   [0.918, 0.345, 0.047],
      markers: buildCobeMarkers(),
      onRender(state) {
        if (!isHoveredRef.current) {
          phiRef.current += 0.0025;
        }
        state.phi   = phiRef.current;
        state.theta = thetaRef.current;
      },
    });

    // Fade in smoothly
    canvas.style.opacity = '1';

    return () => {
      globeRef.current?.destroy();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size]);

  // Re-create when markers change (after data loads)
  useEffect(() => {
    if (!globeRef.current) return;
    globeRef.current?.destroy();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2);

    globeRef.current = createGlobe(canvas, {
      devicePixelRatio: dpr,
      width:  size * dpr,
      height: size * dpr,
      phi:    phiRef.current,
      theta:  thetaRef.current,
      dark:   1,
      diffuse: 1.4,
      scale:  1.08,
      mapSamples:    16000,
      mapBrightness: 7,
      baseColor:   [0.08, 0.08, 0.08],
      markerColor: MARKER_COLOR,
      glowColor:   [0.918, 0.345, 0.047],
      markers: buildCobeMarkers(),
      onRender(state) {
        if (!isHoveredRef.current) {
          phiRef.current += 0.0025;
        }
        state.phi   = phiRef.current;
        state.theta = thetaRef.current;
      },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markers]);

  const handleMouseMove = useCallback((e) => {
    if (!canvasRef.current || markers.length === 0) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let closest = null;
    let closestDist = 18; // px hit radius

    for (const marker of markers) {
      const proj = projectToCanvas(
        marker.lat, marker.lng,
        phiRef.current, thetaRef.current,
        size
      );
      if (!proj) continue;

      const dist = Math.hypot(proj.x - mouseX, proj.y - mouseY);
      if (dist < closestDist) {
        closestDist = dist;
        closest = { marker, canvasX: proj.x, canvasY: proj.y };
      }
    }

    if (closest) {
      onMarkerHover(closest.marker, closest.canvasX, closest.canvasY);
    } else {
      onMarkerLeave();
    }
  }, [markers, size, onMarkerHover, onMarkerLeave]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: size,
        height: size,
        opacity: 0,
        transition: 'opacity 1.2s ease',
        cursor: 'grab',
      }}
      width={size * 2}
      height={size * 2}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => { isHoveredRef.current = true; }}
      onMouseLeave={() => {
        isHoveredRef.current = false;
        onMarkerLeave();
      }}
    />
  );
}
