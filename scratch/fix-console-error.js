const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...walk(full));
    else if (/\.(ts|tsx)$/.test(e.name)) files.push(full);
  }
  return files;
}

const files = walk(srcDir);
let count = 0;

for (const filePath of files) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('console.error')) continue;

  // Replace console.error( with logger.error(
  let newContent = content.replaceAll('console.error(', 'logger.error(');

  // Add logger import if not already present
  if (!newContent.includes("from '@/lib/logger'")) {
    // Find the last import line and insert after it
    const lastImportMatch = [...newContent.matchAll(/^import .+$/gm)];
    if (lastImportMatch.length > 0) {
      const last = lastImportMatch[lastImportMatch.length - 1];
      const insertAt = last.index + last[0].length;
      newContent = newContent.slice(0, insertAt) + "\nimport { logger } from '@/lib/logger'" + newContent.slice(insertAt);
    } else {
      newContent = "import { logger } from '@/lib/logger'\n" + newContent;
    }
  }

  fs.writeFileSync(filePath, newContent, 'utf8');
  count++;
  console.log('Fixed:', path.basename(filePath));
}

console.log(`\nDone. Fixed ${count} files.`);
