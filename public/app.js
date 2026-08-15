// The frontend never keeps its own map copy: every update comes from the REST API.
const mapElement = document.querySelector('#map');
const availabilityElement = document.querySelector('#availability');
const messageElement = document.querySelector('#message');
const bookingModalElement = document.querySelector('#bookingModal');
const bookingForm = document.querySelector('#booking-form');
const formErrorElement = document.querySelector('#form-error');
const selectedCabanaLabelElement = document.querySelector('#selected-cabana-label');
const selectedCabanaElement = document.querySelector('#selected-cabana');
const bookingModal = bootstrap.Modal.getOrCreateInstance(bookingModalElement);
let selectedCabanaId = null;

const assetByType = {
  pool: '/assets/textureWater.png',
};

// The parchment asset is a 2x2 sprite sheet used as the lower tile layer.
// Every non-pool tile gets one full quadrant as its ground background.
const groundSpriteByType = {
  empty: 'left top',      // 1: empty ground
  cabana: 'right top',    // 2: ground under a cabana
  chalet: 'left bottom',  // 3: ground under a chalet
  path: 'right bottom',   // 4: ground under a path
};

const overlayAssetByType = {
  chalet: '/assets/houseChimney.png',
  cabana: '/assets/cabana.png',
};

const overlaySizeByType = {
  chalet: '100%',
  cabana: '75%',
  path: '100%',
};

function showMessage(text, kind = 'success') {
  const alertClass = kind === 'error' ? 'alert-danger' : kind === 'info' ? 'alert-info' : 'alert-success';
  messageElement.className = `alert ${alertClass} d-flex align-items-center gap-2`;
  messageElement.textContent = text;
  messageElement.hidden = false;
}

function closeBookingModal() {
  bookingModal.hide();
  selectedCabanaId = null;
  selectedCabanaLabelElement.textContent = '';
  selectedCabanaElement.textContent = 'Check the guest details before confirming.';
  formErrorElement.hidden = true;
  bookingForm.reset();
}

function openAvailableCabana(cabanaId) {
  selectedCabanaId = cabanaId;
  selectedCabanaLabelElement.textContent = cabanaId;
  selectedCabanaElement.textContent = 'Check the guest details before confirming.';
  formErrorElement.hidden = true;
  bookingModal.show();
}

function openUnavailableCabana(cabanaId) {
  closeBookingModal();
  showMessage(`Cabana ${cabanaId} is already booked and unavailable.`, 'info');
}

function renderMap(mapData) {
  // CSS Grid repeats the width reported by the API in mapData.width.
  mapElement.innerHTML = '';
  mapElement.style.setProperty('--map-columns', mapData.width);
  mapData.tiles.flat().forEach((tile) => {
    const isCabana = tile.type === 'cabana';
    const tileElement = document.createElement(isCabana ? 'button' : 'div');
    tileElement.className = `tile ${tile.type} ${isCabana && !tile.available ? 'booked' : ''}`;
    const roadAsset = tile.type === 'path' ? window.roadUtils.getRoadAsset(mapData.tiles, tile.row, tile.column) : null;
    if (tile.type === 'pool') {
      // Pools use their own full-tile texture instead of the parchment sprite sheet.
      tileElement.style.backgroundImage = `url("${assetByType.pool}")`;
      tileElement.style.backgroundSize = 'cover';
    } else {
      // The CSS pseudo-element renders parchment below the transparent art layer.
      tileElement.style.setProperty('--ground-position', groundSpriteByType[tile.type]);
      const overlaySource = roadAsset ? roadAsset.src : overlayAssetByType[tile.type];
      if (overlaySource) {
        const artElement = document.createElement('span');
        artElement.className = 'tile-art';
        artElement.style.backgroundImage = `url("${overlaySource}")`;
        artElement.style.backgroundSize = overlaySizeByType[tile.type];
        if (roadAsset) {
          artElement.style.transform = `rotate(${roadAsset.rotation}deg)`;
          tileElement.dataset.connections = roadAsset.connections.join(',');
        }
        tileElement.appendChild(artElement);
      }
    }
    tileElement.title = isCabana ? `${tile.cabanaId}: ${tile.available ? 'available' : 'booked'}` : tile.type;
    tileElement.setAttribute('aria-label', tileElement.title);
    if (isCabana) {
      tileElement.type = 'button';
      tileElement.dataset.cabanaId = tile.cabanaId;
      tileElement.addEventListener('click', () => tile.available ? openAvailableCabana(tile.cabanaId) : openUnavailableCabana(tile.cabanaId));
    }
    mapElement.appendChild(tileElement);
  });
  availabilityElement.textContent = `${mapData.availableCabanas} of ${mapData.totalCabanas} cabanas available`;
}

async function getMap() {
  const response = await fetch('/api/map');
  if (!response.ok) throw new Error('Could not load the map.');
  return response.json();
}

async function loadMap() {
  try {
    renderMap(await getMap());
  } catch (error) {
    availabilityElement.textContent = 'Map unavailable';
    showMessage(error.message, 'error');
  }
}

bookingModalElement.addEventListener('shown.bs.modal', () => document.querySelector('#room').focus());
bookingModalElement.addEventListener('hidden.bs.modal', () => {
  selectedCabanaId = null;
  selectedCabanaLabelElement.textContent = '';
  selectedCabanaElement.textContent = 'Check the guest details before confirming.';
  formErrorElement.hidden = true;
  bookingForm.reset();
});

bookingForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  formErrorElement.hidden = true;
  const submitButton = bookingForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  try {
    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cabanaId: selectedCabanaId, room: bookingForm.room.value, guestName: bookingForm.guestName.value }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'The booking could not be completed.');
    renderMap(result.map);
    bookingModal.hide();
    showMessage(result.message, 'success');
  } catch (error) {
    formErrorElement.textContent = error.message;
    formErrorElement.hidden = false;
  } finally {
    submitButton.disabled = false;
  }
});

loadMap();
