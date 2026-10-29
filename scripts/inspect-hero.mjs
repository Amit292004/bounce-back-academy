import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

async function run() {
  const tempDir = path.resolve('scratch/chrome-profile');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9222',
    `--user-data-dir=${tempDir}`,
    '--disable-gpu',
    '--disable-extensions',
    '--no-first-run',
    '--no-default-browser-check',
    'http://localhost:3000'
  ]);

  // wait for chrome to start
  await new Promise(r => setTimeout(r, 2500));

  try {
    const listRes = await fetch('http://127.0.0.1:9222/json/list');
    let targets = await listRes.json();
    let target = targets.find(t => t.type === 'page' && !t.url.startsWith('chrome-extension')) || targets[0];
    console.log('Target found:', target.url, target.webSocketDebuggerUrl);
    if (!target) {
      const putRes = await fetch('http://127.0.0.1:9222/json/new', { method: 'PUT' });
      target = await putRes.json();
    }
    console.log('Target:', target.webSocketDebuggerUrl);

    const ws = new WebSocket(target.webSocketDebuggerUrl);

    let id = 1;
    const callbacks = new Map();
    const eventListeners = new Map();
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && callbacks.has(msg.id)) {
        callbacks.get(msg.id)(msg);
        callbacks.delete(msg.id);
      }
      if (msg.method && eventListeners.has(msg.method)) {
        for (const fn of eventListeners.get(msg.method)) {
          fn(msg.params);
        }
      }
    };

    const onEvent = (method) => new Promise((resolve) => {
      if (!eventListeners.has(method)) eventListeners.set(method, []);
      eventListeners.get(method).push(resolve);
    });

    await new Promise(r => ws.onopen = r);

    const send = (method, params = {}) => new Promise((resolve) => {
      const msgId = id++;
      callbacks.set(msgId, resolve);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });

    await send('Page.enable');
    await send('DOM.enable');

    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await send('Page.navigate', { url: 'http://localhost:3000' });

    // Poll until document is loaded and section exists
    for (let i = 0; i < 40; i++) {
      await new Promise(r => setTimeout(r, 250));
      const check = await send('Runtime.evaluate', {
        expression: '(() => ({ ready: document.readyState, url: location.href, htmlLen: document.body ? document.body.innerHTML.length : 0, hasSection: Boolean(document.querySelector("section")) }))()',
        returnByValue: true
      });
      const v = check?.result?.result?.value;
      if (v?.hasSection) {
        console.log('Page loaded after', (i + 1) * 250, 'ms:', v);
        break;
      }
      if (i % 8 === 0) console.log('Waiting...', v);
    }
    await new Promise(r => setTimeout(r, 1200));

    const testSizes = [
      { name: 'mobile_360x640', width: 360, height: 640, mobile: true },
      { name: 'mobile_375x667', width: 375, height: 667, mobile: true },
      { name: 'mobile_390x844', width: 390, height: 844, mobile: true },
      { name: 'tablet_768x1024', width: 768, height: 1024, mobile: true },
      { name: 'laptop_1366x768', width: 1366, height: 768, mobile: false },
      { name: 'desktop_1920x1080', width: 1920, height: 1080, mobile: false }
    ];

    for (const size of testSizes) {
      await send('Emulation.setDeviceMetricsOverride', {
        width: size.width,
        height: size.height,
        deviceScaleFactor: 1,
        mobile: size.mobile
      });

      await new Promise(r => setTimeout(r, 600));

      const res = await send('Runtime.evaluate', {
        expression: `(() => {
          const header = document.querySelector('header');
          const bottomNav = document.querySelector('[class*="bottomNav" i]');
          const hero = document.querySelector('section');
          const statsBar = document.querySelector('[class*="statsBar" i]');
          const ctas = document.querySelector('[class*="ctas" i]');
          const rightCol = document.querySelector('[class*="rightCol" i]');
          const leftCol = document.querySelector('[class*="leftCol" i]');

          const getBox = el => el ? { top: Math.round(el.getBoundingClientRect().top), bottom: Math.round(el.getBoundingClientRect().bottom), height: Math.round(el.getBoundingClientRect().height) } : null;

          return {
            windowHeight: window.innerHeight,
            windowWidth: window.innerWidth,
            header: getBox(header),
            bottomNav: getBox(bottomNav),
            hero: getBox(hero),
            leftCol: getBox(leftCol),
            ctas: getBox(ctas),
            statsBar: getBox(statsBar),
            rightCol: getBox(rightCol),
            horizontalScroll: document.documentElement.scrollWidth > window.innerWidth
          };
        })()`,
        returnByValue: true
      });

      console.log(`\n=== SIZE: ${size.name} (${size.width}x${size.height}) ===`);
      console.log(JSON.stringify(res.result.result.value, null, 2));

      const screenshot = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(`test_${size.name}.png`, Buffer.from(screenshot.result.data, 'base64'));
    }

    ws.close();
  } catch (err) {
    console.error('Error:', err);
  } finally {
    chromeProc.kill();
  }
}

run();
