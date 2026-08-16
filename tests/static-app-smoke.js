#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('index.html');
const appJs = read('app.js');
const scriptFiles = [
  'app.js',
  'beat-boy.js',
  ...fs.readdirSync(path.join(root, 'scripts'), { recursive: true })
    .filter((file) => file.endsWith('.js'))
    .map((file) => path.join('scripts', file)),
];
const code = scriptFiles.map((file) => read(file)).join('\n');

function fail(message, details) {
  console.error(`\n❌ ${message}`);
  if(details && details.length) details.forEach((detail) => console.error(`  - ${detail}`));
  process.exitCode = 1;
}

const apps = [...appJs.matchAll(/\{ id: '([^']+)'/g)].map((match) => match[1]);
if(!apps.length) fail('No apps were found in app.js');

const missingScreens = apps.filter((id) => !html.includes(`id="${id}Screen"`) && !html.includes(`id='${id}Screen'`));
if(missingScreens.length) fail('Apps are missing matching #<id>Screen containers', missingScreens);

const specialLaunchers = new Set(['karaoke', 'todo', 'notes']);
const missingInit = apps
  .filter((id) => !specialLaunchers.has(id))
  .map((id) => `init${id[0].toUpperCase()}${id.slice(1)}`)
  .filter((fn) => !new RegExp(`(?:window\\.)?${fn}\\s*=|function\\s+${fn}\\s*\\(`).test(code));
if(missingInit.length) fail('Apps are missing launch init functions', missingInit);

const globals = new Set([
  ...code.matchAll(/window\.([A-Za-z_$][\w$]*)\s*=/g),
  ...code.matchAll(/function\s+([A-Za-z_$][\w$]*)\s*\(/g),
  ...code.matchAll(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/g),
].map((match) => match[1]));
const browserGlobals = new Set([
  'alert', 'clearInterval', 'clearTimeout', 'confirm', 'document', 'event',
  'getElementById', 'location', 'Math', 'navigator', 'prompt', 'setInterval',
  'setTimeout', 'this', 'window'
]);
const missingHandlers = new Map();
for (const match of html.matchAll(/on(?:click|input|change|keydown|mousedown|mouseup|mousemove|touchstart|touchmove|touchend)="([^"]+)"/g)) {
  const expr = match[1];
  const line = html.slice(0, match.index).split('\n').length;
  for (const call of expr.matchAll(/\b([A-Za-z_$][\w$]*)\s*\(/g)) {
    const name = call[1];
    if(expr[call.index - 1] === '.') continue;
    if(!globals.has(name) && !browserGlobals.has(name)) {
      if(!missingHandlers.has(name)) missingHandlers.set(name, []);
      missingHandlers.get(name).push(line);
    }
  }
}
if(missingHandlers.size) {
  fail('Inline handlers reference missing functions', [...missingHandlers].map(([name, lines]) => `${name} at index.html:${lines.join(',')}`));
}

if(!process.exitCode) {
  console.log(`✅ Static app smoke passed for ${apps.length} apps, ${scriptFiles.length} script files, and inline handlers.`);
}
