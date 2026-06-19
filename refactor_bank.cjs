const fs = require('fs');
const path = './src/components/BankSection.tsx';
let content = fs.readFileSync(path, 'utf8');

// We need to lower savings interest. Currently, it's 0.05 per interval probably?
// Let's replace 'rate: 0.005' or similar with 'rate: 0.0005'
content = content.replace(/rate = 0\.005; \/\/ 0\.5%/, 'rate = 0.0005; // 0.05%');
content = content.replace(/rate = 0\.01; \/\/ 1%/, 'rate = 0.001; // 0.1%');
content = content.replace(/rate = 0\.02; \/\/ 2%/, 'rate = 0.002; // 0.2%');

fs.writeFileSync(path, content, 'utf8');
console.log('BankSection interest rates updated');
