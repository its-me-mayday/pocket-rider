export type Direction = "up" | "down" | "left" | "right";

export type Tile = "road" | "grass" | "tree" | "shop" | "house" | "coin";

export type Position = {
  x: number;
  y: number;
};

export type GameState = {
  map: Tile[][];
  rider: Position;
  facing: Direction;
  shops: Position[];
  activeShop: Position;
  deliverySpots: Position[];
  activeDelivery: Position | null;
  hasPackage: boolean;
  level: number;
  stage: number;
  deliveries: number;
  coins: number;
  moves: number;
  message: string;
};

type LevelDefinition = {
  map: Tile[][];
  start: Position;
  coins: Position[];
};

const WIDTH = 9;
const HEIGHT = 13;
export const DELIVERIES_PER_LEVEL = 3;

const levels: LevelDefinition[] = [
  {
    start: { x: 3, y: 11 },
    map: [
      ["grass", "grass", "grass", "road", "grass", "grass", "grass", "grass", "grass"],
      ["grass", "tree", "grass", "road", "grass", "shop", "grass", "tree", "grass"],
      ["grass", "road", "road", "road", "road", "road", "road", "road", "grass"],
      ["grass", "house", "grass", "grass", "grass", "road", "grass", "road", "grass"],
      ["grass", "road", "grass", "tree", "grass", "road", "grass", "road", "grass"],
      ["road", "road", "road", "road", "road", "road", "road", "road", "road"],
      ["grass", "road", "grass", "tree", "grass", "road", "grass", "shop", "grass"],
      ["grass", "road", "grass", "grass", "grass", "road", "grass", "road", "grass"],
      ["grass", "road", "road", "road", "road", "road", "road", "road", "grass"],
      ["grass", "tree", "grass", "road", "grass", "road", "grass", "tree", "grass"],
      ["grass", "house", "grass", "road", "grass", "road", "grass", "house", "grass"],
      ["grass", "road", "road", "road", "road", "road", "road", "road", "grass"],
      ["grass", "grass", "grass", "grass", "grass", "grass", "grass", "grass", "grass"],
    ],
    coins: [
      { x: 1, y: 2 },
      { x: 7, y: 2 },
      { x: 0, y: 5 },
      { x: 8, y: 5 },
      { x: 3, y: 8 },
      { x: 5, y: 11 },
    ],
  },
  {
    start: { x: 4, y: 6 },
    map: [
      ["grass", "grass", "grass", "shop", "road", "house", "grass", "grass", "grass"],
      ["grass", "tree", "grass", "road", "grass", "road", "grass", "tree", "grass"],
      ["grass", "road", "road", "road", "road", "road", "road", "shop", "grass"],
      ["house", "road", "grass", "tree", "grass", "tree", "grass", "road", "grass"],
      ["grass", "road", "grass", "road", "road", "road", "grass", "road", "grass"],
      ["grass", "road", "road", "road", "grass", "road", "road", "road", "grass"],
      ["grass", "grass", "grass", "road", "road", "road", "grass", "grass", "grass"],
      ["grass", "road", "road", "road", "grass", "road", "road", "road", "grass"],
      ["grass", "road", "grass", "road", "road", "road", "grass", "road", "grass"],
      ["grass", "road", "grass", "tree", "grass", "tree", "grass", "road", "house"],
      ["grass", "shop", "road", "road", "road", "road", "road", "road", "grass"],
      ["grass", "tree", "grass", "road", "grass", "road", "grass", "tree", "grass"],
      ["grass", "grass", "grass", "house", "road", "shop", "grass", "grass", "grass"],
    ],
    coins: [
      { x: 4, y: 0 },
      { x: 2, y: 2 },
      { x: 3, y: 5 },
      { x: 5, y: 7 },
      { x: 6, y: 10 },
      { x: 4, y: 12 },
    ],
  },
  {
    start: { x: 0, y: 6 },
    map: [
      ["grass", "house", "road", "road", "road", "shop", "grass", "house", "grass"],
      ["grass", "road", "grass", "tree", "grass", "road", "grass", "road", "grass"],
      ["road", "road", "road", "road", "road", "road", "road", "road", "shop"],
      ["road", "grass", "tree", "grass", "road", "grass", "tree", "grass", "road"],
      ["road", "road", "road", "grass", "road", "grass", "road", "road", "road"],
      ["grass", "tree", "road", "road", "road", "road", "road", "tree", "grass"],
      ["road", "road", "road", "grass", "shop", "grass", "road", "road", "road"],
      ["grass", "tree", "road", "road", "road", "road", "road", "tree", "grass"],
      ["road", "road", "road", "grass", "road", "grass", "road", "road", "road"],
      ["road", "grass", "tree", "grass", "road", "grass", "tree", "grass", "road"],
      ["shop", "road", "road", "road", "road", "road", "road", "road", "road"],
      ["grass", "road", "grass", "tree", "grass", "road", "grass", "road", "grass"],
      ["grass", "house", "road", "road", "road", "house", "grass", "house", "grass"],
    ],
    coins: [
      { x: 2, y: 0 },
      { x: 6, y: 2 },
      { x: 0, y: 4 },
      { x: 8, y: 8 },
      { x: 2, y: 10 },
      { x: 4, y: 12 },
    ],
  },
];

export function createGame(): GameState {
  return createLevelState(1, 0, 0, 0, "Vai allo SHOP evidenziato per ricevere una consegna.");
}

export function moveRider(state: GameState, direction: Direction): GameState {
  const next = nextPosition(state.rider, direction);

  if (!isInside(next)) {
    return { ...state, facing: direction, message: "Strada chiusa." };
  }

  const tile = state.map[next.y][next.x];
  if (tile === "tree" || tile === "grass") {
    return { ...state, facing: direction, message: "Meglio restare sulla strada." };
  }

  const map = cloneMap(state.map);
  let coins = state.coins;
  let hasPackage = state.hasPackage;
  let activeDelivery = state.activeDelivery;
  let activeShop = state.activeShop;
  let deliveries = state.deliveries;
  let message = "Pedala verso lo SHOP evidenziato.";

  if (tile === "coin") {
    coins += 1;
    map[next.y][next.x] = "road";
    message = "+1 moneta.";
  }

  if (tile === "shop") {
    if (hasPackage) {
      message = "Hai gia un pacco. Vai alla HOME evidenziata.";
    } else if (!samePosition(next, state.activeShop)) {
      message = "Questo SHOP non ha richieste ora. Cerca quello evidenziato.";
    } else {
      activeDelivery = pickDeliverySpot(state.deliverySpots);
      hasPackage = true;
      message = "Richiesta ricevuta. Consegna alla HOME evidenziata.";
    }
  }

  if (tile === "house") {
    if (!hasPackage || !activeDelivery) {
      message = "Questa e una HOME. Prima passa da uno SHOP.";
    } else if (!samePosition(next, activeDelivery)) {
      message = "Non e questa HOME. Cerca quella evidenziata.";
    } else {
      deliveries += 1;
      coins += 3;
      hasPackage = false;
      activeDelivery = null;
      activeShop = pickShop(state.shops, next);

      if (deliveries % DELIVERIES_PER_LEVEL === 0) {
        const nextLevel = state.level + 1;
        return createLevelState(
          nextLevel,
          deliveries,
          coins,
          state.moves + 1,
          `Quadro ${displayLevel(nextLevel)} sbloccato. Trova lo SHOP evidenziato.`
        );
      }

      message = "Consegna fatta. +3 monete. Nuovo SHOP evidenziato.";
    }
  }

  return {
    ...state,
    map,
    rider: next,
    facing: direction,
    activeShop,
    activeDelivery,
    hasPackage,
    deliveries,
    coins,
    moves: state.moves + 1,
    message,
  };
}

function createLevelState(
  level: number,
  deliveries: number,
  coins: number,
  moves: number,
  message: string
): GameState {
  const definition = levels[(level - 1) % levels.length];
  const map = cloneMap(definition.map);
  for (const coin of definition.coins) {
    if (map[coin.y][coin.x] === "road") {
      map[coin.y][coin.x] = "coin";
    }
  }

  const shops = findTiles(map, "shop");

  return {
    map,
    rider: definition.start,
    facing: "up",
    shops,
    activeShop: pickShop(shops, definition.start),
    deliverySpots: findTiles(map, "house"),
    activeDelivery: null,
    hasPackage: false,
    level,
    stage: displayLevel(level),
    deliveries,
    coins,
    moves,
    message,
  };
}

function pickShop(shops: Position[], avoid?: Position): Position {
  const candidates = avoid
    ? shops.filter((shop) => !samePosition(shop, avoid))
    : shops;
  const pool = candidates.length > 0 ? candidates : shops;
  const index = Math.floor(Math.random() * pool.length);
  return pool[index] ?? { x: 0, y: 0 };
}

function pickDeliverySpot(deliverySpots: Position[]): Position {
  const index = Math.floor(Math.random() * deliverySpots.length);
  return deliverySpots[index] ?? { x: 0, y: 0 };
}

function displayLevel(level: number): number {
  return ((level - 1) % levels.length) + 1;
}

function findTiles(map: Tile[][], tile: Tile): Position[] {
  const positions: Position[] = [];

  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[y].length; x++) {
      if (map[y][x] === tile) {
        positions.push({ x, y });
      }
    }
  }

  return positions;
}

function nextPosition(position: Position, direction: Direction): Position {
  switch (direction) {
    case "up":
      return { x: position.x, y: position.y - 1 };
    case "down":
      return { x: position.x, y: position.y + 1 };
    case "left":
      return { x: position.x - 1, y: position.y };
    case "right":
      return { x: position.x + 1, y: position.y };
  }
}

function isInside(position: Position): boolean {
  return position.x >= 0 && position.x < WIDTH && position.y >= 0 && position.y < HEIGHT;
}

function samePosition(a: Position, b: Position): boolean {
  return a.x === b.x && a.y === b.y;
}

function cloneMap(map: Tile[][]): Tile[][] {
  return map.map((row) => [...row]);
}
