import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

async function run() {
  const tempDir = path.resolve('scratch/chrome-profile-iphone');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9223',
    `--user-data-dir=${tempDir}`,
    '--disable-gpu',
    '--disable-extensions',
    '--no-first-run',
    '--no-default-browser-check',
    'http://localhost:3000'
  ]);

  await new Promise(r => setTimeout(r, 2500));

  try {
    const listRes = await fetch('http://127.0.0.1:9223/json/list');
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

    const iphoneModels = [
      { name: 'iPhone_SE_1st_gen', width: 320, height: 568 },
      { name: 'iPhone_SE_2nd_3rd_gen', width: 375, height: 667 },
      { name: 'iPhone_12_13_mini', width: 375, height: 812 },
      { name: 'iPhone_12_13_14', width: 390, height: 844 },
      { name: 'iPhone_14_15_Pro', width: 393, height: 852 },
      { name: 'iPhone_15_16_Pro_Max', width: 430, height: 932 },
    ];

    for (const phone of iphoneModels) {
      await send('Emulation.setDeviceMetricsOverride', {
        width: phone.width,
        height: phone.height,
        deviceScaleFactor: 2,
        mobile: true
      });

      await send('Page.navigate', { url: 'http://localhost:3000' });

      for (let i = 0; i < 40; i++) {
        await new Promise(r => setTimeout(r, 250));
        const check = await send('Runtime.evaluate', {
          expression: 'Boolean(document.querySelector("section") && document.querySelector("[class*=\\"statsBar\\"]"))',
          returnByValue: true
        });
        if (check?.result?.result?.value) break;
      }
      await new Promise(r => setTimeout(r, 600));

      const res = await send('Runtime.evaluate', {
        expression: `(() => {
          const header = document.querySelector('header');
          const bottomNav = document.querySelector('[class*="bottomNav" i]');
          const hero = document.querySelector('section');
          const statsBar = document.querySelector('[class*="statsBar" i]');
          const ctas = document.querySelector('[class*="ctas" i]');
          const leftCol = document.querySelector('[class*="leftCol" i]');

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
            ctas: getBox(ctas),
            statsBar: getBox(statsBar),
            horizontalScroll: document.documentElement.scrollWidth > window.innerWidth,
            marginToNav: bottomNav && statsBar ? Math.round(bottomNav.getBoundingClientRect().top - statsBar.getBoundingClientRect().bottom) : null
          };
        })()`,
        returnByValue: true
      });

      console.log(`\n=== IPHONE MODEL: ${phone.name} (${phone.width}x${phone.height}) ===`);
      console.log(JSON.stringify(res.result.result.value, null, 2));
    }

    ws.close();
  } catch (err) {
    console.error('Error:', err);
  } finally {
    chromeProc.kill();
  }
}

run();
