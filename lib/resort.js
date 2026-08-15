// This module contains the application rules, not HTTP details.
// Keeping this logic separate makes it easier to understand and test.

const fs = require('fs');

// These values tell the frontend what each map character represents.
const LEGEND = { W: 'cabana', p: 'pool', '#': 'path', c: 'chalet', '.': 'empty' };

function loadMap(mapPath) {
  // Remove only line breaks. Keep the map characters unchanged.
  const rows = fs.readFileSync(mapPath, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/);
  if (rows.length > 0 && rows[rows.length - 1] === '') rows.pop();
  if (rows.length === 0 || rows.some((row) => row.length === 0)) {
    throw new Error('The map file must not be empty or contain empty rows.');
  }
  const width = rows[0].length;
  if (rows.some((row) => row.length !== width)) throw new Error('All map rows must have the same width.');
  const unknownSymbol = rows.flatMap((row) => [...row]).find((symbol) => !LEGEND[symbol]);
  if (unknownSymbol) throw new Error(`The map contains an unknown symbol: ${unknownSymbol}`);
  return rows;
}

function loadBookings(bookingsPath) {
  // The JSON file is read once when the server starts.
  const bookings = JSON.parse(fs.readFileSync(bookingsPath, 'utf8'));
  if (!Array.isArray(bookings)) throw new Error('The bookings file must contain an array.');
  return bookings.map((booking, index) => {
    if (!booking || booking.room === undefined || typeof booking.guestName !== 'string') {
      throw new Error(`Invalid guest record at position ${index + 1}.`);
    }
    return { room: String(booking.room).trim(), guestName: booking.guestName.trim() };
  });
}

function normaliseGuestName(name) {
  // Letter case and accidental extra spaces should not block a guest.
  return String(name || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}

function createMapState(rows, bookedCabanas) {
  let cabanaNumber = 0;
  const tiles = rows.map((row, rowIndex) => [...row].map((symbol, columnIndex) => {
    const isCabana = symbol === 'W';
    const cabanaId = isCabana ? `W-${cabanaNumber + 1}` : null;
    if (isCabana) cabanaNumber += 1;
    return {
      row: rowIndex,
      column: columnIndex,
      symbol,
      type: LEGEND[symbol],
      cabanaId,
      available: isCabana ? !bookedCabanas.has(cabanaId) : null,
    };
  }));

  const allTiles = tiles.flat();
  return {
    width: rows[0].length,
    height: rows.length,
    legend: LEGEND,
    tiles,
    availableCabanas: allTiles.filter((tile) => tile.type === 'cabana' && tile.available).length,
    totalCabanas: allTiles.filter((tile) => tile.type === 'cabana').length,
  };
}

function createResortStore({ mapPath, bookingsPath }) {
  // Startup loading fails early if either input file is missing or invalid.
  const rows = loadMap(mapPath);
  const guests = loadBookings(bookingsPath);
  const bookedCabanas = new Set();

  // W identifiers are assigned from left to right and top to bottom, so they stay stable.
  const cabanaIds = new Set(createMapState(rows, bookedCabanas).tiles.flat()
    .filter((tile) => tile.type === 'cabana').map((tile) => tile.cabanaId));

  return {
    getMap() {
      // Build a fresh response so the API always reflects the current in-memory bookings.
      return createMapState(rows, bookedCabanas);
    },

    bookCabana({ cabanaId, room, guestName }) {
      if (!cabanaIds.has(cabanaId)) return { status: 400, body: { error: 'That cabana does not exist.' } };
      if (!room || !guestName) return { status: 400, body: { error: 'Enter the room number and guest name.' } };
      if (bookedCabanas.has(cabanaId)) return { status: 409, body: { error: 'This cabana is already booked.' } };

      const validGuest = guests.some((guest) => guest.room === room
        && normaliseGuestName(guest.guestName) === normaliseGuestName(guestName));
      if (!validGuest) return { status: 403, body: { error: 'The room number and name do not match a current guest.' } };

      bookedCabanas.add(cabanaId);
      return {
        status: 201,
        body: {
          message: `Cabana ${cabanaId} was booked successfully.`,
          cabanaId,
          map: createMapState(rows, bookedCabanas),
        },
      };
    },
  };
}

module.exports = {
  LEGEND,
  createMapState,
  createResortStore,
  loadBookings,
  loadMap,
  normaliseGuestName,
};
