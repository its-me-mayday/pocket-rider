import { useEffect, useMemo, useRef, useState } from "react";
import { createGame, moveRider, type Direction, type GameState } from "./game";

type PointerStart = {
  x: number;
  y: number;
};

export function App() {
  const [game, setGame] = useState<GameState>(() => createGame());
  const pointerStart = useRef<PointerStart | null>(null);

  function move(direction: Direction) {
    setGame((current) => moveRider(current, direction));
  }

  function reset() {
    setGame(createGame());
  }

  function handlePointerDown(event: React.PointerEvent) {
    pointerStart.current = { x: event.clientX, y: event.clientY };
  }

  function handlePointerUp(event: React.PointerEvent) {
    const start = pointerStart.current;
    pointerStart.current = null;
    if (!start) return;

    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 18) return;

    if (Math.abs(dx) > Math.abs(dy)) {
      move(dx > 0 ? "right" : "left");
    } else {
      move(dy > 0 ? "down" : "up");
    }
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

  const goalLabel = useMemo(() => {
    if (!game.hasPackage) return "Vai allo SHOP blu";
    return "Vai alla HOME gialla";
  }, [game.hasPackage]);

  return (
    <main className="app-shell">
      <section className="hud" aria-label="Stato partita">
        <div>
          <span>Obiettivo</span>
          <strong>{goalLabel}</strong>
        </div>
        <div>
          <span>Consegne</span>
          <strong>{game.deliveries}</strong>
        </div>
        <div>
          <span>Monete</span>
          <strong>{game.coins}</strong>
        </div>
        <div>
          <span>Mosse</span>
          <strong>{game.moves}</strong>
        </div>
        <button className="reset" onClick={reset}>
          Reset
        </button>
      </section>

      <section
        className="board-wrap"
        aria-label="Mappa"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <div className="board">
          {game.map.map((row, y) =>
            row.map((tile, x) => {
              const isRider = game.rider.x === x && game.rider.y === y;
              const isShop = game.shop.x === x && game.shop.y === y;
              const isHouse = game.house.x === x && game.house.y === y;

              return (
                <div className={`tile tile-${tile}`} key={`${x}-${y}`}>
                  {isShop && <span className="sprite shop">SHOP</span>}
                  {isHouse && <span className="sprite house">HOME</span>}
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
      </section>

      <section className="status" aria-live="polite">
        <div className={game.hasPackage ? "package on" : "package"}>
          {game.hasPackage ? "Pacco a bordo" : "Senza pacco"}
        </div>
        <p>
          <strong>{goalLabel}.</strong> {game.message}
        </p>
      </section>

      <section
        className="swipe-pad"
        aria-label="Controllo swipe"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <div className="swipe-ring">
          <span>Swipe</span>
        </div>
      </section>
    </main>
  );
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
