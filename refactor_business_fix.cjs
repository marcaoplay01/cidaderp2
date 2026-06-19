const fs = require('fs');
const path = './src/components/BusinessesSection.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/R\$ \{b\.revenuePerCycle\)\.toFixed\(0\)\}\/ciclo/g, 'R$ {(b.revenuePerCycle).toFixed(0)}/ciclo');

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed BusinessesSection syntax');
