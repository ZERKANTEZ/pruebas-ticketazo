const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/Ricar/Downloads/Ticketazo-v12 (8)/Ticketazo-v12';

function processDir(d) {
  const files = fs.readdirSync(d);
  for (const f of files) {
    const full = path.join(d, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory() && !full.includes('node_modules') && !full.includes('.git')) {
      processDir(full);
    } else if (stat.isFile() && (full.endsWith('.js') || full.endsWith('.html') || full.endsWith('.css'))) {
      let content = fs.readFileSync(full, 'utf8');
      const orig = content;
      // Also match trailing spaces if emoji is followed by a space
      content = content.replace(/[\u{1F300}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]\s?/gu, '');
      if (content !== orig) {
        fs.writeFileSync(full, content, 'utf8');
        console.log('Stripped emojis from', full);
      }
    }
  }
}

try {
  processDir(dir);
  console.log('Done!');
} catch (e) {
  console.error(e);
}
