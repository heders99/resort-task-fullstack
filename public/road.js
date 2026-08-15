// This small module controls only the visual appearance of paths.
// It checks four neighboring cells and chooses the matching asset.

const ROAD_ASSETS = {
  straight: '/assets/arrowStraight.png',
  end: '/assets/arrowEnd.png',
  corner: '/assets/arrowCornerSquare.png',
  split: '/assets/arrowSplit.png',
  crossing: '/assets/arrowCrossing.png',
};

const DIRECTIONS = ['top', 'right', 'bottom', 'left'];

function isRoad(tiles, row, column) {
  return Boolean(tiles[row] && tiles[row][column] && tiles[row][column].symbol === '#');
}

function getRoadConnections(tiles, row, column) {
  // A chalet, empty space, pool, or the map edge means there is no neighboring path.
  return DIRECTIONS.filter((direction) => {
    if (direction === 'top') return isRoad(tiles, row - 1, column);
    if (direction === 'right') return isRoad(tiles, row, column + 1);
    if (direction === 'bottom') return isRoad(tiles, row + 1, column);
    return isRoad(tiles, row, column - 1);
  });
}

function sameConnections(actual, expected) {
  return actual.length === expected.length && expected.every((direction) => actual.includes(direction));
}

function getRoadAsset(tiles, row, column) {
  const connections = getRoadConnections(tiles, row, column);
  const count = connections.length;

  if (count === 4) return { src: ROAD_ASSETS.crossing, rotation: 0, connections };

  if (count === 3) {
    // arrowSplit has no left exit in its default orientation.
    const missingDirection = DIRECTIONS.find((direction) => !connections.includes(direction));
    const rotations = { left: 0, top: 90, right: 180, bottom: 270 };
    return { src: ROAD_ASSETS.split, rotation: rotations[missingDirection], connections };
  }

  if (count === 2) {
    if (sameConnections(connections, ['top', 'bottom'])) return { src: ROAD_ASSETS.straight, rotation: 0, connections };
    if (sameConnections(connections, ['left', 'right'])) return { src: ROAD_ASSETS.straight, rotation: 90, connections };

    // arrowCornerSquare connects the top and right sides in its default orientation.
    const cornerRotations = [
      { directions: ['top', 'right'], rotation: 0 },
      { directions: ['right', 'bottom'], rotation: 90 },
      { directions: ['bottom', 'left'], rotation: 180 },
      { directions: ['left', 'top'], rotation: 270 },
    ];
    const corner = cornerRotations.find((item) => sameConnections(connections, item.directions));
    return { src: ROAD_ASSETS.corner, rotation: corner ? corner.rotation : 0, connections };
  }

  // arrowEnd shows an endpoint at the bottom in its default orientation and rotates toward its neighbor.
  const endRotations = { bottom: 0, left: 90, top: 180, right: 270 };
  return { src: ROAD_ASSETS.end, rotation: count === 1 ? endRotations[connections[0]] : 0, connections };
}

// The browser uses window; tests load the same file with require.
if (typeof window !== 'undefined') window.roadUtils = { getRoadAsset, getRoadConnections };
if (typeof module !== 'undefined') module.exports = { getRoadAsset, getRoadConnections };
