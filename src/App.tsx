import { useEffect, useMemo, useRef, useState } from "react";
import {
  DELIVERIES_PER_LEVEL,
  createGame,
  moveRider,
  type Direction,
  type GameState,
} from "./game";

type PointerStart = {
  x: number;
  y: number;
};

type RideGesture = {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  direction: Direction | null;
};

type TiltPermissionEvent = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<PermissionState>;
};

const MOVE_THRESHOLD = 22;
const TILT_THRESHOLD = 14;
const TILT_STEP_MS = 420;

export function App() {
  const [game, setGame] = useState<GameState>(() => createGame());
  const pointerStart = useRef<PointerStart | null>(null);
  const [rideGesture, setRideGesture] = useState<RideGesture | null>(null);
  const [tiltEnabled, setTiltEnabled] = useState(false);
  const [tiltStatus, setTiltStatus] = useState("Touch ride");
  const tiltDirection = useRef<Direction | null>(null);

  function move(direction: Direction) {
    setGame((current) => moveRider(current, direction));
    if ("vibrate" in navigator) {
      navigator.vibrate(12);
    }
  }

  function reset() {
    setGame(createGame());
  }

  async function toggleTiltRide() {
    if (tiltEnabled) {
      setTiltEnabled(false);
      tiltDirection.current = null;
      setTiltStatus("Touch ride");
      return;
    }

    if (!("DeviceOrientationEvent" in window)) {
      setTiltStatus("Sensori non disponibili");
      return;
    }

    const OrientationEvent = window.DeviceOrientationEvent as TiltPermissionEvent;
    if (OrientationEvent.requestPermission) {
      try {
        const permission = await OrientationEvent.requestPermission();
        if (permission !== "granted") {
          setTiltStatus("Permesso sensori negato");
          return;
        }
      } catch {
        setTiltStatus("Permesso sensori non riuscito");
        return;
      }
    }

    setTiltEnabled(true);
    setTiltStatus("Inclina per pedalare");
  }

  function handlePointerDown(event: React.PointerEvent) {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointerStart.current = { x: event.clientX, y: event.clientY };
    setRideGesture({
      startX: event.clientX,
      startY: event.clientY,
      currentX: event.clientX,
      currentY: event.clientY,
      direction: null,
    });
  }

  function handlePointerMove(event: React.PointerEvent) {
    const start = pointerStart.current;
    if (!start) return;

    setRideGesture({
      startX: start.x,
      startY: start.y,
      currentX: event.clientX,
      currentY: event.clientY,
      direction: directionFromDelta(event.clientX - start.x, event.clientY - start.y),
    });
  }

  function handlePointerUp(event: React.PointerEvent) {
    const start = pointerStart.current;
    pointerStart.current = null;
    setRideGesture(null);
    if (!start) return;

    const direction = directionFromDelta(event.clientX - start.x, event.clientY - start.y);
    if (direction) {
      move(direction);
    }
  }

  function handlePointerCancel() {
    pointerStart.current = null;
    setRideGesture(null);
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const direction = keyToDirection(event.key);
      if (!direction) return;
      event.preventDefault();
      move(direction);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!tiltEnabled) return;

    function onDeviceOrientation(event: DeviceOrientationEvent) {
      const beta = event.beta ?? 0;
      const gamma = event.gamma ?? 0;
      tiltDirection.current = directionFromTilt(beta, gamma);
    }

    window.addEventListener("deviceorientation", onDeviceOrientation);
    const interval = window.setInterval(() => {
      if (tiltDirection.current) {
        move(tiltDirection.current);
      }
    }, TILT_STEP_MS);

    return () => {
      window.removeEventListener("deviceorientation", onDeviceOrientation);
      window.clearInterval(interval);
      tiltDirection.current = null;
    };
  }, [tiltEnabled]);

  const goalLabel = useMemo(() => {
    if (!game.hasPackage) return "SHOP evidenziato";
    return "HOME evidenziata";
  }, [game.hasPackage]);

  const deliveriesThisLevel = game.deliveries % DELIVERIES_PER_LEVEL;

  return (
    <main className="app-shell">
      <section className="top-panel" aria-label="Stato partita">
        <div className="mission-row">
          <div className="mission">
            <span>Obiettivo</span>
            <strong>{goalLabel}</strong>
          </div>
          <button className={tiltEnabled ? "tilt-toggle tilt-toggle-on" : "tilt-toggle"} onClick={toggleTiltRide}>
            Tilt
          </button>
          <button className="reset" onClick={reset}>
            Reset
          </button>
        </div>

        <div className="stats-row">
          <div>
            <span>Quadro</span>
            <strong>{game.stage}</strong>
          </div>
          <div>
            <span>Consegne</span>
            <strong>{deliveriesThisLevel}/{DELIVERIES_PER_LEVEL}</strong>
          </div>
          <div>
            <span>Monete</span>
            <strong>{game.coins}</strong>
          </div>
          <span className={game.hasPackage ? "package on" : "package"}>
            {game.hasPackage ? "Pacco" : "No pacco"}
          </span>
        </div>

        <p className="status" aria-live="polite">
          <span>{tiltStatus}</span>
          {game.message}
        </p>
      </section>

      <section
        className="play-field"
        aria-label="Mappa"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        <div className="board">
          {game.map.map((row, y) =>
            row.map((tile, x) => {
              const isRider = game.rider.x === x && game.rider.y === y;
              const isShop = tile === "shop";
              const isHouse = tile === "house";
              const isActiveShop = game.activeShop.x === x && game.activeShop.y === y;
              const isTargetHouse =
                game.activeDelivery?.x === x && game.activeDelivery.y === y;

              return (
                <div className={`tile tile-${tile}`} key={`${x}-${y}`}>
                  {isShop && (
                    <span className={isActiveShop ? "sprite shop active-shop" : "sprite shop"}>
                      SHOP
                    </span>
                  )}
                  {isHouse && (
                    <span className={isTargetHouse ? "sprite house target-house" : "sprite house"}>
                      HOME
                    </span>
                  )}
                  {tile === "coin" && <span className="sprite coin">c</span>}
                  {tile === "tree" && <span className="sprite tree">T</span>}
                  {isRider && (
                    <span className={`rider rider-${game.facing}`} aria-label="Rider">
                      R
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
        {rideGesture && <RideHandle gesture={rideGesture} />}
      </section>
    </main>
  );
}

function RideHandle({ gesture }: { gesture: RideGesture }) {
  const dx = gesture.currentX - gesture.startX;
  const dy = gesture.currentY - gesture.startY;
  const distance = Math.min(Math.hypot(dx, dy), 48);
  const angle = Math.atan2(dy, dx);
  const knobX = Math.cos(angle) * distance;
  const knobY = Math.sin(angle) * distance;
  const arrow = directionArrow(gesture.direction);

  return (
    <div
      className={gesture.direction ? "ride-handle ride-handle-ready" : "ride-handle"}
      style={{ left: gesture.startX, top: gesture.startY }}
      aria-hidden="true"
    >
      <div className="ride-handle-track" />
      <div
        className="ride-handle-knob"
        style={{ transform: `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))` }}
      >
        {arrow}
      </div>
    </div>
  );
}

function directionFromDelta(dx: number, dy: number): Direction | null {
  const distance = Math.hypot(dx, dy);
  if (distance < MOVE_THRESHOLD) return null;

  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? "right" : "left";
  }

  return dy > 0 ? "down" : "up";
}

function directionFromTilt(beta: number, gamma: number): Direction | null {
  const absBeta = Math.abs(beta);
  const absGamma = Math.abs(gamma);

  if (Math.max(absBeta, absGamma) < TILT_THRESHOLD) return null;

  if (absGamma > absBeta) {
    return gamma > 0 ? "right" : "left";
  }

  return beta > 0 ? "down" : "up";
}

function directionArrow(direction: Direction | null): string {
  switch (direction) {
    case "up":
      return "↑";
    case "down":
      return "↓";
    case "left":
      return "←";
    case "right":
      return "→";
    default:
      return "●";
  }
}

function keyToDirection(key: string): Direction | null {
  switch (key) {
    case "ArrowUp":
    case "w":
    case "W":
      return "up";
    case "ArrowDown":
    case "s":
    case "S":
      return "down";
    case "ArrowLeft":
    case "a":
    case "A":
      return "left";
    case "ArrowRight":
    case "d":
    case "D":
      return "right";
    default:
      return null;
  }
}
