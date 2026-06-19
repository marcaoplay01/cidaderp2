const fs = require('fs');
const path = './src/components/CrimeSection.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldFineRegex = /const penaltyFine = act\.fine;/;
const newFine = `      const proportionalFine = Math.floor(player.cash * 0.05); // 5% of all their money
      const penaltyFine = Math.max(act.fine, proportionalFine);`;
content = content.replace(oldFineRegex, newFine);

fs.writeFileSync(path, content, 'utf8');
console.log('CrimeSection fine updated');
