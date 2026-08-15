// The test runner uses Node.js built-ins and does not need a browser or test framework.
const assert = require('assert');
const fs = require('fs');
const http = require('http');
const path = require('path');
const { createApp } = require('../app');
const { createMapState } = require('../lib/resort');
const { parseArguments } = require('../server');
const { getRoadAsset, getRoadConnections } = require('../public/road');

const servRoot = path.resolve(__dirname, '..');
const mapPath = path.join(servRoot, 'map.ascii');
const bookingsPath = path.join(servRoot, 'bookings.json');

function request(port, method, requestPath, body) {
  return new Promise((resolve, reject) => {
    const request = http.request({
      port,
      method,
      path: requestPath,
      headers: body ? { 'Content-Type': 'application/json' } : {},
    }, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        const payload = Buffer.concat(chunks);
        const isJson = String(response.headers['content-type'] || '').includes('application/json');
        resolve({
          status: response.statusCode,
          body: payload.length === 0 ? null : isJson ? JSON.parse(payload.toString('utf8')) : payload,
        });
      });
    });
    request.on('error', reject);
    if (body) request.write(JSON.stringify(body));
    request.end();
  });
}

async function run() {
  let passed = 0;
  const test = async (name, callback) => {
    await callback();
    passed += 1;
    console.log(`✓ ${name}`);
  };

  await test('CLI accepts --map and --bookings', () => {
    const options = parseArguments(['--map', 'custom.map', '--bookings', 'custom.json', '--port', '0']);
    assert.strictEqual(options.port, 0);
    assert.ok(options.mapPath.endsWith(`${path.sep}custom.map`));
    assert.ok(options.bookingsPath.endsWith(`${path.sep}custom.json`));
  });

  await test('map becomes data with coordinates and cabanas', () => {
    const rows = fs.readFileSync(mapPath, 'utf8').trim().split(/\r?\n/);
    const state = createMapState(rows, new Set());
    assert.strictEqual(state.width, 20);
    assert.strictEqual(state.height, 19);
    assert.ok(state.totalCabanas > 0);
    assert.strictEqual(state.availableCabanas, state.totalCabanas);
    assert.ok(state.tiles.flat().some((tile) => tile.cabanaId === 'W-1' && tile.available));
  });

  await test('path chooses an asset from its four neighbors', () => {
    const rows = fs.readFileSync(mapPath, 'utf8').trim().split(/\r?\n/);
    const state = createMapState(rows, new Set());
    const topHorizontalPath = getRoadAsset(state.tiles, 2, 4);
    const verticalPath = getRoadAsset(state.tiles, 3, 3);
    const cornerPath = getRoadAsset(state.tiles, 2, 18);
    assert.deepStrictEqual(getRoadConnections(state.tiles, 2, 4), ['right', 'left']);
    assert.strictEqual(topHorizontalPath.src, '/assets/arrowStraight.png');
    assert.strictEqual(topHorizontalPath.rotation, 90);
    assert.strictEqual(verticalPath.src, '/assets/arrowStraight.png');
    assert.strictEqual(verticalPath.rotation, 0);
    assert.strictEqual(cornerPath.src, '/assets/arrowCornerSquare.png');
  });

  const app = createApp({ mapPath, bookingsPath });
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const port = server.address().port;

  try {
    await test('GET /api/health returns server status', async () => {
      const result = await request(port, 'GET', '/api/health');
      assert.strictEqual(result.status, 200);
      assert.strictEqual(result.body.ok, true);
    });

    await test('map assets are served from public/static/assets', async () => {
      const result = await request(port, 'GET', '/assets/cabana.png');
      assert.strictEqual(result.status, 200);
      assert.deepStrictEqual(result.body.subarray(0, 4), Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    });

    await test('GET /api/map returns the map and availability', async () => {
      const result = await request(port, 'GET', '/api/map');
      assert.strictEqual(result.status, 200);
      assert.strictEqual(result.body.tiles.length, 19);
      assert.strictEqual(result.body.tiles[0].length, 20);
      assert.ok(result.body.tiles.flat().some((tile) => tile.cabanaId === 'W-1' && tile.available));
    });

    await test('invalid guest details are rejected', async () => {
      const result = await request(port, 'POST', '/api/bookings', {
        cabanaId: 'W-1', room: '999', guestName: 'Nobody',
      });
      assert.strictEqual(result.status, 403);
      assert.match(result.body.error, /do not match/);
    });

    await test('valid guest books a cabana and the map updates', async () => {
      const result = await request(port, 'POST', '/api/bookings', {
        cabanaId: 'W-1', room: '101', guestName: 'alice smith',
      });
      assert.strictEqual(result.status, 201);
      const booked = result.body.map.tiles.flat().find((tile) => tile.cabanaId === 'W-1');
      assert.strictEqual(booked.available, false);
    });

    await test('booking the same cabana again returns 409', async () => {
      const result = await request(port, 'POST', '/api/bookings', {
        cabanaId: 'W-1', room: '101', guestName: 'Alice Smith',
      });
      assert.strictEqual(result.status, 409);
    });

    await test('frontend uses contextual empty tile quadrants and a centered modal', () => {
      const html = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
      const js = fs.readFileSync(path.join(__dirname, '../public/app.js'), 'utf8');
      const css = fs.readFileSync(path.join(__dirname, '../public/style.css'), 'utf8');
      const road = fs.readFileSync(path.join(__dirname, '../public/road.js'), 'utf8');
      assert.match(html, /id="map"/);
      assert.match(html, /src="\/static\/logo\.png"/);
      assert.match(html, /class="site-logo"/);
      assert.match(html, /href="\/static\/favicon\.ico"/);
      assert.match(html, /class="title-group[^"]*"/);
      assert.match(html, /01 \/ TEST PROJECT/);
      assert.match(html, /id="booking-form"/);
      assert.match(html, /id="selected-cabana-label"/);
      assert.match(html, /Check the guest details before confirming\./);
      assert.match(html, /bootstrap@5\.3\.8/);
      assert.match(html, /class="modal fade booking-modal"/);
      assert.match(html, /modal-dialog-centered/);
      assert.match(html, /class="map-scroll"/);
      assert.doesNotMatch(html, /menu-button/);
      assert.doesNotMatch(html, /class="hero/);
      assert.match(js, /bootstrap\.Modal/);
      assert.match(js, /openUnavailableCabana/);
      assert.match(js, /selectedCabanaLabelElement\.textContent = cabanaId/);
      assert.match(js, /selectedCabanaElement\.textContent = 'Check the guest details before confirming\.'/);
      assert.match(js, /showMessage\(result\.message/);
      assert.match(js, /result\.map/);
      assert.match(js, /groundSpriteByType/);
      assert.match(js, /overlayAssetByType/);
      assert.match(js, /chalet: '100%'/);
      assert.match(js, /cabana: '75%'/);
      assert.match(js, /path: '100%'/);
      assert.match(js, /className = 'tile-art'/);
      assert.match(js, /artElement\.style\.transform/);
      assert.doesNotMatch(js, /Math\.random/);
      assert.match(css, /background: url\('\/assets\/parchmentBasic\.png'\) var\(--ground-position, left top\) \/ 200% 200% no-repeat/);
      assert.match(css, /\.tile-art \{ position: absolute; inset: 0; z-index: 1;/);
      assert.match(css, /width: min\(80vw, 1100px\)/);
      assert.match(css, /\.title-group \{ display: flex; align-items: center;/);
      assert.match(css, /\.site-logo \{ display: block; flex: 0 0 48px; width: 48px; height: 48px;/);
      assert.match(css, /\.tile \{ position: relative; min-width: 0; aspect-ratio: 1; border: 1px solid #ffffff;/);
      assert.match(css, /\.tile\.empty \{ background-color: #ede0bd; opacity: 1;/);
      assert.match(css, /border-radius: 0/);
      assert.match(css, /min-width: 640px/);
      assert.match(css, /@media \(max-width: 767\.98px\)/);
      assert.match(road, /arrowCrossing/);
    });
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }

  console.log(`\nAll tests passed: ${passed}`);
}

run().catch((error) => {
  console.error(`\nTest failed: ${error.message}`);
  process.exitCode = 1;
});
