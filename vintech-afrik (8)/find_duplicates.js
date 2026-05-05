const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');
const idMatches = content.matchAll(/id:\s*([0-9]+)/g);
const ids = {};
for (const match of idMatches) {
  const idValue = match[1];
  if (!ids[idValue]) ids[idValue] = [];
  // Approximate line number (very rough)
  const index = match.index;
  const line = content.substring(0, index).split('\n').length;
  ids[idValue].push(line);
}

for (const id in ids) {
  if (ids[id].length > 1) {
    console.log(`ID ${id} appears at lines: ${ids[id].join(', ')}`);
  }
}
