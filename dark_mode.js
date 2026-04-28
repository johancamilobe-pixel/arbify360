const fs = require('fs');
const path = require('path');

const REPLACEMENTS = [
  ['bg-white ',          'bg-card '],
  ['bg-white"',          'bg-card"'],
  ['bg-white)',          'bg-card)'],
  ['bg-white\n',         'bg-card\n'],
  ['bg-gray-50 ',        'bg-background '],
  ['bg-gray-50"',        'bg-background"'],
  ['bg-gray-50)',        'bg-background)'],
  ['bg-gray-100 ',       'bg-muted '],
  ['bg-gray-100"',       'bg-muted"'],
  ['bg-gray-100)',       'bg-muted)'],
  ['bg-gray-200 ',       'bg-muted '],
  ['bg-gray-200"',       'bg-muted"'],
  ['text-gray-900 ',     'text-foreground '],
  ['text-gray-900"',     'text-foreground"'],
  ['text-gray-900)',     'text-foreground)'],
  ['text-gray-800 ',     'text-foreground '],
  ['text-gray-800"',     'text-foreground"'],
  ['text-gray-700 ',     'text-foreground/80 '],
  ['text-gray-700"',     'text-foreground/80"'],
  ['text-gray-600 ',     'text-muted-foreground '],
  ['text-gray-600"',     'text-muted-foreground"'],
  ['text-gray-600)',     'text-muted-foreground)'],
  ['text-gray-500 ',     'text-muted-foreground '],
  ['text-gray-500"',     'text-muted-foreground"'],
  ['text-gray-500)',     'text-muted-foreground)'],
  ['text-gray-400 ',     'text-muted-foreground/70 '],
  ['text-gray-400"',     'text-muted-foreground/70"'],
  ['text-gray-400)',     'text-muted-foreground/70)'],
  ['text-gray-300 ',     'text-muted-foreground/50 '],
  ['text-gray-300"',     'text-muted-foreground/50"'],
  ['border-gray-200 ',   'border-border '],
  ['border-gray-200"',   'border-border"'],
  ['border-gray-100 ',   'border-border/50 '],
  ['border-gray-100"',   'border-border/50"'],
  ['hover:bg-gray-50 ',  'hover:bg-muted '],
  ['hover:bg-gray-100 ', 'hover:bg-muted '],
  ['hover:bg-gray-200 ', 'hover:bg-accent '],
  ['hover:bg-gray-50"',  'hover:bg-muted"'],
  ['hover:bg-gray-100"', 'hover:bg-muted"'],
  ['hover:bg-gray-200"', 'hover:bg-accent"'],
  ['divide-gray-100',    'divide-border/50'],
  ['divide-gray-200',    'divide-border'],
];

const SKIP_DIRS = new Set(['node_modules', '.next', '.git', 'dist', 'build']);
const EXTENSIONS = new Set(['.tsx', '.ts']);

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  const original = content;
  for (const [from, to] of REPLACEMENTS) {
    content = content.split(from).join(to);
  }
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8');
    return true;
  }
  return false;
}

function walk(dir, updated) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(path.join(dir, entry.name), updated);
    } else if (EXTENSIONS.has(path.extname(entry.name))) {
      const full = path.join(dir, entry.name);
      if (processFile(full)) updated.push(full.replace(process.cwd(), ''));
    }
  }
}

const updated = [];
walk(process.cwd(), updated);
console.log(`✅ ${updated.length} archivos actualizados:`);
updated.forEach(p => console.log('  ', p));
