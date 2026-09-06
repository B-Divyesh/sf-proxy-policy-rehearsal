import './style.css';
import { fixture, parseFixture, rehearse, type DemoRow } from './demo';

const demoKey = 'demo:ppr:fixture';
const isDemo = document.body.dataset.demoDefault === 'true' || new URLSearchParams(window.location.search).get('demo') === '1';
const input = document.querySelector<HTMLTextAreaElement>('#policy-input');
const runButton = document.querySelector<HTMLButtonElement>('#run-button');
const resetButton = document.querySelector<HTMLButtonElement>('#reset-button');
const rows = document.querySelector<HTMLTableSectionElement>('#result-rows');
const tableWrap = document.querySelector<HTMLElement>('#result-table-wrap');
const empty = document.querySelector<HTMLElement>('#empty-state');
const error = document.querySelector<HTMLElement>('#error-message');
const count = document.querySelector<HTMLElement>('#result-count');
const explanation = document.querySelector<HTMLElement>('#explanation');
const demoBanner = document.querySelector<HTMLElement>('#demo-banner');
const demoResetButton = document.querySelector<HTMLButtonElement>('#demo-reset-button');
const startRealButton = document.querySelector<HTMLButtonElement>('#start-real-button');

const sampleText = JSON.stringify(fixture, null, 2);

function readDemoFixture(): string {
  try { return localStorage.getItem(demoKey) ?? sampleText; }
  catch { return sampleText; }
}

function writeDemoFixture(value: string): void {
  try { localStorage.setItem(demoKey, value); }
  catch { /* The demo still works when browser storage is unavailable. */ }
}

function discardDemoFixture(): void {
  try { localStorage.removeItem(demoKey); }
  catch { /* The demo never depends on storage. */ }
}

if (isDemo) {
  demoBanner?.removeAttribute('hidden');
  document.title = 'Demo — Proxy Policy Rehearsal';
}

if (input && runButton && resetButton && rows && tableWrap && empty && error && count && explanation) {
  const showEmpty = () => {
    error.hidden = true;
    tableWrap.hidden = true;
    empty.hidden = false;
    count.textContent = 'Ready';
    count.className = 'result-count';
  };

  const render = (result: DemoRow[]) => {
    rows.replaceChildren(...result.map((row) => {
      const tr = document.createElement('tr');
      for (const [label, value, className] of [
        ['Case', row.caseName, ''], ['Adapter', row.adapter, 'adapter-cell'], ['Client', row.client, 'mono'], ['Decision', row.decision, `status ${row.decision}`], ['Check', row.passed ? 'Pass ✓' : 'Fail ✕', row.passed ? 'check pass' : 'check fail']
      ]) {
        const td = document.createElement('td');
        td.dataset.label = label;
        td.textContent = value;
        td.className = className;
        tr.append(td);
      }
      tr.tabIndex = 0;
      const explain = () => { explanation.textContent = `${row.caseName} / ${row.adapter}: ${row.explanation}.`; };
      tr.addEventListener('focus', explain);
      tr.addEventListener('click', explain);
      return tr;
    }));
    const passed = result.filter((row) => row.passed).length;
    count.textContent = passed === result.length ? `${passed}/${result.length} pass` : `${result.length - passed} regression${result.length - passed === 1 ? '' : 's'}`;
    count.className = passed === result.length ? 'result-count pass' : 'result-count fail';
    explanation.textContent = 'Select a result row to inspect how its client address and decision were derived.';
    error.hidden = true;
    empty.hidden = true;
    tableWrap.hidden = false;
  };

  const runRehearsal = () => {
    runButton.classList.add('is-running');
    try {
      render(rehearse(parseFixture(input.value)));
    } catch (problem) {
      error.textContent = problem instanceof Error ? problem.message : 'The rehearsal could not run. Paste a valid fixture, then run it again.';
      error.hidden = false;
      empty.hidden = true;
      tableWrap.hidden = true;
      count.textContent = 'Needs repair';
      count.className = 'result-count fail';
    }
    window.setTimeout(() => runButton.classList.remove('is-running'), 180);
  };

  const resetDemo = () => {
    input.value = sampleText;
    writeDemoFixture(sampleText);
    runRehearsal();
    input.focus();
  };

  if (isDemo) {
    input.value = readDemoFixture();
    runRehearsal();
  } else {
    input.value = '';
    showEmpty();
  }

  runButton.addEventListener('click', runRehearsal);
  resetButton.addEventListener('click', () => {
    if (isDemo) resetDemo();
    else { input.value = ''; showEmpty(); input.focus(); }
  });
  demoResetButton?.addEventListener('click', resetDemo);
  startRealButton?.addEventListener('click', () => {
    discardDemoFixture();
    window.location.assign('/?start=real');
  });
  input.addEventListener('input', () => { if (isDemo) writeDemoFixture(input.value); });
  input.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      runRehearsal();
    }
  });
}

const copyButton = document.querySelector<HTMLButtonElement>('#copy-button');
copyButton?.addEventListener('click', async () => {
  const command = 'cargo install --git https://github.com/B-Divyesh/sf-proxy-policy-rehearsal --bin ppr';
  try { await navigator.clipboard.writeText(command); copyButton.textContent = 'Copied'; }
  catch { copyButton.textContent = 'Select command'; }
  window.setTimeout(() => { copyButton.textContent = 'Copy'; }, 1800);
});

const network = document.querySelector<HTMLElement>('#network-status');
const showNetwork = () => {
  if (network) network.innerHTML = navigator.onLine
    ? '<span aria-hidden="true"></span> Offline-ready'
    : '<span aria-hidden="true"></span> Offline · sample still works';
};
window.addEventListener('online', showNetwork);
window.addEventListener('offline', showNetwork);
showNetwork();

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => undefined));
}
