const fs = require('fs');
let appContent = fs.readFileSync('./src/App.tsx', 'utf8');

// Add +2 stress at job completion
const energyDeductSearch = `      let energyDeduction = job.energyCost;`;
const energyDeductReplace = `      let energyDeduction = job.energyCost;
      let currentStress = prev.stress || 0;
      if (currentStress >= 81) {
        energyDeduction = Math.floor(energyDeduction * 1.5); // +50% energy cost for High Stress
      }`;
appContent = appContent.replace(energyDeductSearch, energyDeductReplace);

const finalReturnSearch = `      return {
        ...prev,
        cash: newCash,`;
const finalReturnReplace = `      let newStress = Math.min(100, (prev.stress || 0) + 2); // +2% stress per job
      return {
        ...prev,
        cash: newCash,
        stress: newStress,`;
appContent = appContent.replace(finalReturnSearch, finalReturnReplace);

const bonusChanceSearch = `      const bonusChanceTotal = Math.min(75, job.bonusChance + (currentCareer.level - 1) * 2);`;
const bonusChanceReplace = `      let bonusChanceTotal = Math.min(75, job.bonusChance + (currentCareer.level - 1) * 2);
      if ((prev.stress || 0) >= 21 && (prev.stress || 0) <= 50) {
        bonusChanceTotal = Math.max(0, bonusChanceTotal - 15); // -15% chance if stressed
      }`;
appContent = appContent.replace(bonusChanceSearch, bonusChanceReplace);

fs.writeFileSync('./src/App.tsx', appContent, 'utf8');
console.log('App.tsx updated for stress logic at completion');
