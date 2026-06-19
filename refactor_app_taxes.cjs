const fs = require('fs');
const pathApp = './src/App.tsx';
let appContent = fs.readFileSync(pathApp, 'utf8');

const newTaxLogic = `
        let totalNetWorth = 0;
        prev.ownedVehicles.forEach(id => { const v = VEHICLES.find(x => x.id === id); if(v) totalNetWorth += v.price; });
        prev.ownedProperties.forEach(id => { const p = PROPERTIES.find(x => x.id === id); if(p) totalNetWorth += p.price; });
        Object.keys(prev.ownedBusinesses).forEach(id => { const b = BUSINESSES.find(x => x.id === id); if(b) totalNetWorth += b.price; });

        let taxRate = 0.002;
        if (totalNetWorth > 50000000) taxRate = 0.005;
        else if (totalNetWorth > 10000000) taxRate = 0.0025;

        const taxDrainPerSec = (totalNetWorth * taxRate) / 60;
`;

const oldTaxLogicRegex = /let totalNetWorth = 0;[\s\S]*?const taxDrainPerSec = \(totalNetWorth \* 0\.002\) \/ 60;/;
appContent = appContent.replace(oldTaxLogicRegex, newTaxLogic);

// Also, crime proportional fine
const oldCrimePenalty = /const penaltyFine = act\.fine;/;
const newCrimePenalty = `
      let totalNetWorthFail = prev.cash;
      // Add properties/vehicles if we wanted, but just taking 2-5% of their cash is harsh enough!
      const penaltyFine = Math.max(act.fine, Math.floor(prev.cash * 0.03)); // 3% of current cash as fine if higher than base
`;
// Wait, act.fine is inside handleCommitCrimeFailure which takes prev state? No, handleCommitCrime is in App.tsx?
// Ah, handleCommitCrimeFailure is in App.tsx.

fs.writeFileSync(pathApp, appContent, 'utf8');
console.log('App.tsx taxes updated');
