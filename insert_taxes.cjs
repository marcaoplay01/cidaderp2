const fs = require('fs');
const pathApp = './src/App.tsx';
let appContent = fs.readFileSync(pathApp, 'utf8');

const taxLogic = `
        // Taxas (IPTU, IPVA, Seguros) - O "Leão" cobra 0.2% do patrimônio a cada 60s (0.0033% ao segundo)
        let totalNetWorth = 0;
        prev.ownedVehicles.forEach(id => { const v = VEHICLES.find(x => x.id === id); if(v) totalNetWorth += v.price; });
        prev.ownedProperties.forEach(id => { const p = PROPERTIES.find(x => x.id === id); if(p) totalNetWorth += p.price; });
        Object.keys(prev.ownedBusinesses).forEach(id => { const b = BUSINESSES.find(x => x.id === id); if(b) totalNetWorth += b.price; });

        const taxDrainPerSec = (totalNetWorth * 0.002) / 60;
        const cashGained = (propertyPassivePerSec - taxDrainPerSec) * deltaSec;
`;

appContent = appContent.replace(
  /const cashGained = propertyPassivePerSec \* deltaSec;/,
  taxLogic
);

fs.writeFileSync(pathApp, appContent, 'utf8');
console.log('Taxes logic inserted in App.tsx!');
