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
  shop: Position;
  house: Position;
  hasPackage: boolean;
  deliveries: number;
  coins: number;
  moves: number;
  message: string;
};

const WIDTH = 9;
const HEIGHT = 13;

const baseMap: Tile[][] = [
  ["grass", "grass", "grass", "road", "grass", "grass", "grass", "grass", "grass"],
  ["grass", "tree", "grass", "road", "grass", "shop", "grass", "tree", "grass"],
  ["grass", "road", "road", "road", "road", "road", "road", "road", "grass"],
  ["grass", "road", "grass", "grass", "grass", "road", "grass", "road", "grass"],
  ["grass", "road", "grass", "tree", "grass", "road", "grass", "road", "grass"],
  ["road", "road", "road", "road", "road", "road", "road", "road", "road"],
  ["grass", "road", "grass", "tree", "grass", "road", "grass", "road", "grass"],
  ["grass", "road", "grass", "grass", "grass", "road", "grass", "road", "grass"],
  ["grass", "road", "road", "road", "road", "road", "road", "road", "grass"],
  ["grass", "tree", "grass", "road", "grass", "road", "grass", "tree", "grass"],
  ["grass", "grass", "grass", "road", "grass", "road", "grass", "house", "grass"],
  ["grass", "road", "road", "road", "road", "road", "road", "road", "grass"],
  ["grass", "grass", "grass", "grass", "grass", "grass", "grass", "grass", "grass"],
];

const coinSpots: Position[] = [
  { x: 1, y: 2 },
  { x: 7, y: 2 },
  { x: 0, y: 5 },
  { x: 8, y: 5 },
  { x: 3, y: 8 },
  { x: 5, y: 11 },
];

export function createGame(): GameState {
  const map = cloneMap(baseMap);
  for (const coin of coinSpots) {
    map[coin.y][coin.x] = "coin";
  }

  return {
    map,
    rider: { x: 3, y: 11 },
    facing: "up",
    shop: { x: 5, y: 1 },
    house: { x: 7, y: 10 },
    hasPackage: false,
    deliveries: 0,
    coins: 0,
    moves: 0,
    message: "Vai al negozio, prendi il pacco, consegnalo alla casa.",
  };
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
  let deliveries = state.deliveries;
  let message = "Pedala.";

  if (tile === "coin") {
    coins += 1;
    map[next.y][next.x] = "road";
    message = "+1 moneta.";
  }

  if (samePosition(next, state.shop)) {
    if (hasPackage) {
      message = "Hai gia un pacco. Portalo alla casa.";
    } else {
      hasPackage = true;
      message = "Pacco ritirato. Ora vai alla casa.";
    }
  }

  if (samePosition(next, state.house)) {
    if (hasPackage) {
      hasPackage = false;
      deliveries += 1;
      coins += 3;
      message = "Consegna fatta. +3 monete.";
    } else {
      message = "Questa e la casa. Serve prima un pacco.";
    }
  }

  return {
    ...state,
    map,
    rider: next,
    facing: direction,
    hasPackage,
    deliveries,
    coins,
    moves: state.moves + 1,
    message,
  };
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
