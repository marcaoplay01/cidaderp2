const fs = require('fs');
const path = './src/components/CrimeSection.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/feePercent: 40,/, 'feePercent: 50,');

content = content.replace(/case 'lava_jato':\s*fee = 25;/, "case 'lava_jato':\n        fee = 45;");
content = content.replace(/case 'oficina':\s*fee = 20;/, "case 'oficina':\n        fee = 40;");
content = content.replace(/case 'mercado_bairro':\s*fee = 15;/, "case 'mercado_bairro':\n        fee = 35;");
content = content.replace(/case 'posto_combustivel':\s*fee = 10;/, "case 'posto_combustivel':\n        fee = 30;");
content = content.replace(/case 'transportadora':\s*fee = 5;/, "case 'transportadora':\n        fee = 28;");
content = content.replace(/case 'concessionaria':\s*fee = 0;/, "case 'concessionaria':\n        fee = 25;");

fs.writeFileSync(path, content, 'utf8');
console.log('Laundering fees updated!');
