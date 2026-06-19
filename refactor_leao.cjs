const fs = require('fs');

// 1. Update Lava Jato Price
let typesContent = fs.readFileSync('./src/types.ts', 'utf8');
typesContent = typesContent.replace(/id: 'lava_jato',\s*name: 'Lava Jato',\s*price: 18000,/, "id: 'lava_jato',\n    name: 'Lava Jato',\n    price: 20000,");
// Add lastTaxTime to PlayerState if missing
if (!typesContent.includes('lastTaxTime?: number')) {
    typesContent = typesContent.replace(/bankInvestments\?: InvestmentPortfolio;/, "bankInvestments?: InvestmentPortfolio;\n  lastTaxTime?: number;");
}
fs.writeFileSync('./src/types.ts', typesContent, 'utf8');

// 2. Refactor Tax Logic in App.tsx
let appContent = fs.readFileSync('./src/App.tsx', 'utf8');

// Look for the taxDrainPerSec logic
const oldTaxLogic = /let totalNetWorth = 0;[\s\S]*?const cashGained = \(propertyPassivePerSec - taxDrainPerSec\) \* deltaSec;/;

const newTaxLogic = `
        // Tax Logic (Leão) - Now processed every 10 real minutes
        const now = Date.now();
        const lastTax = prev.lastTaxTime || now;
        let newLastTaxTime = lastTax;
        let newCash = prev.cash;
        let newChecking = prev.bankChecking || 0;

        // 10 minutes = 600000 ms
        if (now - lastTax >= 600000) {
          const liquidity = newCash + newChecking;
          let taxRate = 0;
          
          if (liquidity > 50000000) taxRate = 0.05;
          else if (liquidity > 10000000) taxRate = 0.025;
          else if (liquidity > 1000000) taxRate = 0.01;

          if (taxRate > 0) {
            const taxAmount = liquidity * taxRate;
            // Drain from checking first, then cash
            if (newChecking >= taxAmount) {
              newChecking -= taxAmount;
            } else {
              const remaining = taxAmount - newChecking;
              newChecking = 0;
              newCash -= remaining;
            }
            
            // We can't easily showToast from inside setState reliably without side-effect warnings, 
            // but we can rely on the fact that cash decreased to notify the user later or just let them notice.
            // Actually, we can dispatch a custom event or just console.log for now, 
            // or attach a "justTaxedAmount" flag to stats to trigger a toast in a useEffect.
            // For simplicity, we just deduct it.
            console.log('Leão cobrou: R$', taxAmount.toFixed(2));
          }
          newLastTaxTime = now;
        }

        const cashGained = propertyPassivePerSec * deltaSec;
`;

appContent = appContent.replace(oldTaxLogic, newTaxLogic);

// Update the return block to include lastTaxTime, bankChecking, and use newCash
const oldReturnBlock = /return \{\s*\.\.\.prev,\s*cash: Math\.round\(nextCash \* 100\) \/ 100,\s*energy: Math\.floor\(nextEnergy\),\s*stats,\s*\};/;
const newReturnBlock = `return {
          ...prev,
          cash: Math.round((newCash + cashGained) * 100) / 100,
          bankChecking: newChecking,
          lastTaxTime: newLastTaxTime,
          energy: Math.floor(nextEnergy),
          stats,
        };`;
appContent = appContent.replace(oldReturnBlock, newReturnBlock);

// Wait, in the old code `const nextCash = prev.cash + cashGained;`
// Let's replace `const nextCash = prev.cash + cashGained;` with nothing since we used `newCash + cashGained`.
appContent = appContent.replace(/const nextCash = prev\.cash \+ cashGained;/g, '');

fs.writeFileSync('./src/App.tsx', appContent, 'utf8');
console.log('Leão refactored!');
