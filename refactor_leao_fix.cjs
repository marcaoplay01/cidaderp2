const fs = require('fs');
let appContent = fs.readFileSync('./src/App.tsx', 'utf8');

appContent = appContent.replace(/console\.log\('Leão cobrou: R[\s\S]*?\n/g, "console.log('Leão cobrou: R$', taxAmount.toFixed(2));\n");

fs.writeFileSync('./src/App.tsx', appContent, 'utf8');
