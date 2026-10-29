import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

async function run() {
  const tempDir = path.resolve('scratch/chrome-profile-verify');
  const shotsDir = path.resolve('scratch/screenshots');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
  if (!fs.existsSync(shotsDir)) fs.mkdirSync(shotsDir, { recursive: true });

  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9224',
    `--user-data-dir=${tempDir}`,
    '--disable-gpu',
    '--disable-extensions',
    '--no-first-run',
    '--no-default-browser-check',
    'http://localhost:3000'
  ]);

  await new Promise(r => setTimeout(r, 2500));

  try {
    const listRes = await fetch('http://127.0.0.1:9224/json/list');
    let targets = await listRes.json();
    let target = targets.find(t => t.type === 'page' && !t.url.startsWith('chrome-extension')) || targets[0];
    const ws = new WebSocket(target.webSocketDebuggerUrl);

    let id = 1;
    const callbacks = new Map();
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && callbacks.has(msg.id)) {
        callbacks.get(msg.id)(msg);
        callbacks.delete(msg.id);
      }
    };

    await new Promise(r => ws.onopen = r);

    const send = (method, params = {}) => new Promise((resolve) => {
      const msgId = id++;
      callbacks.set(msgId, resolve);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });

    await send('Page.enable');
    await send('DOM.enable');

    // Warm-up initial load
    await send('Page.navigate', { url: 'http://localhost:3000' });
    for (let i = 0; i < 40; i++) {
      await new Promise(r => setTimeout(r, 250));
      const check = await send('Runtime.evaluate', {
        expression: 'Boolean(document.querySelector("section") && document.querySelector("[class*=\\"statsBar\\"]"))',
        returnByValue: true
      });
      if (check?.result?.result?.value) {
        console.log('Warmup ready after', (i + 1) * 250, 'ms');
        break;
      }
    }
    await new Promise(r => setTimeout(r, 1000));

    const devices = [
      { name: 'Android_360x640', width: 360, height: 640, dsf: 2, mobile: true },
      { name: 'iPhone_SE_375x667', width: 375, height: 667, dsf: 2, mobile: true },
      { name: 'iPhone_14_390x844', width: 390, height: 844, dsf: 3, mobile: true },
      { name: 'Android_Tall_412x915', width: 412, height: 915, dsf: 2.625, mobile: true, dark: true },
      { name: 'iPhone_16_Pro_Max_430x932', width: 430, height: 932, dsf: 3, mobile: true },
      { name: 'Tablet_768x1024', width: 768, height: 1024, dsf: 2, mobile: true },
      { name: 'Laptop_1366x768', width: 1366, height: 768, dsf: 1, mobile: false },
      { name: 'Desktop_1920x1080', width: 1920, height: 1080, dsf: 1, mobile: false }
    ];

    for (const dev of devices) {
      await send('Emulation.setDeviceMetricsOverride', {
        width: dev.width,
        height: dev.height,
        deviceScaleFactor: dev.dsf,
        mobile: dev.mobile
      });

      if (dev.dark) {
        await send('Emulation.setEmulatedMedia', {
          features: [{ name: 'prefers-color-scheme', value: 'dark' }]
        });
      } else {
        await send('Emulation.setEmulatedMedia', {
          features: [{ name: 'prefers-color-scheme', value: 'light' }]
        });
      }

      await new Promise(r => setTimeout(r, 500));

      const res = await send('Runtime.evaluate', {
        expression: `(() => {
          const header = document.querySelector('header');
          const bottomNav = document.querySelector('[class*="bottomNav" i]');
          const hero = document.querySelector('section');
          const statsBar = document.querySelector('[class*="statsBar" i]');
          const ctas = document.querySelector('[class*="ctas" i]');
          const leftCol = document.querySelector('[class*="leftCol" i]');
          const rightCol = document.querySelector('[class*="rightCol" i]');
          const headline = document.querySelector('[class*="headline" i]');
          const liveChip = document.querySelector('[class*="liveChip" i]');

          const getBox = el => el ? {
            top: Math.round(el.getBoundingClientRect().top),
            bottom: Math.round(el.getBoundingClientRect().bottom),
            height: Math.round(el.getBoundingClientRect().height)
          } : null;

          return {
            windowHeight: window.innerHeight,
            windowWidth: window.innerWidth,
            header: getBox(header),
            bottomNav: getBox(bottomNav),
            leftCol: getBox(leftCol),
            headline: getBox(headline),
            ctas: getBox(ctas),
            statsBar: getBox(statsBar),
            rightCol: getBox(rightCol),
            horizontalScroll: document.documentElement.scrollWidth > window.innerWidth,
            marginToNav: bottomNav && statsBar ? Math.round(bottomNav.getBoundingClientRect().top - statsBar.getBoundingClientRect().bottom) : null
          };
        })()`,
        returnByValue: true
      });

      console.log(`\n=== DEVICE: ${dev.name} (${dev.width}x${dev.height}) ===`);
      console.log(JSON.stringify(res.result.result.value, null, 2));

      // Capture screenshot
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      const imgPath = path.join(shotsDir, `${dev.name}.png`);
      fs.writeFileSync(imgPath, Buffer.from(shot.result.data, 'base64'));
      console.log(`Saved screenshot: ${imgPath}`);
    }

    ws.close();
  } catch (err) {
    console.error('Error:', err);
  } finally {
    chromeProc.kill();
  }
}

run();
