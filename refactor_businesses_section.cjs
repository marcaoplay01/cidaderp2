const fs = require('fs');
const path = './src/components/BusinessesSection.tsx';
let content = fs.readFileSync(path, 'utf8');

// We need to replace `baseIncomePerSecond` with `revenuePerCycle` and add collect logic.
content = content.replace(/baseIncomePerSecond/g, 'revenuePerCycle');

// Look for "Renda Estimada" text to fix the UI.
const estimateRegex = /let income = Math\.floor\(business\.revenuePerCycle \* currentLvl \* employeeMultiplier \* 60\);/;
const newEstimate = `
    let income = Math.floor(business.revenuePerCycle * currentLvl * employeeMultiplier);
`;
content = content.replace(estimateRegex, newEstimate);

// We also need a "Coletar Faturamento" button. We can add it where we show "Reformar Sede".
// Let's add it dynamically to `BusinessesSection.tsx` inside the owned business card.
const buyButtonRegex = /<button[\s\S]*?onClick=\{[\s\S]*?handleUpgrade\(business\.id\)[\s\S]*?<\/button>/;
// Wait, that's inside a grid.
// Let's replace the whole grid. Wait, better to just inject the handleCollect logic.

const collectFn = `
  const handleCollect = (bizId: string) => {
    const bizData = player.ownedBusinesses[bizId];
    const bizTemplate = BUSINESSES.find(b => b.id === bizId);
    if (!bizData || !bizTemplate) return;

    const now = Date.now();
    const elapsed = (now - bizData.lastCollected) / 1000;
    if (elapsed < bizTemplate.productionCycleTime) {
      alert('O ciclo de faturamento ainda não terminou! Aguarde mais ' + Math.ceil((bizTemplate.productionCycleTime - elapsed)/60) + ' minutos.');
      return;
    }

    const currentLvl = bizData.level;
    const employeeMultiplier = 1 + ((bizData.employeesCount || 0) * 0.20);
    const income = Math.floor(bizTemplate.revenuePerCycle * currentLvl * employeeMultiplier);

    playSound('cash');
    updatePlayerState(prev => ({
      ...prev,
      cash: prev.cash + income,
      ownedBusinesses: {
        ...prev.ownedBusinesses,
        [bizId]: {
          ...prev.ownedBusinesses[bizId],
          lastCollected: now
        }
      }
    }));
    showToast(\`Faturamento coletado: R$ \${income.toLocaleString('pt-BR')}!\`, 'success');
  };
`;

// Insert `handleCollect` after `handleUpgrade`
content = content.replace(/const handleUpgrade = \(bizId: string\) => \{[\s\S]*?\n  \};/, match => match + '\n' + collectFn);

// Now add the Collect button to the UI.
const gridRegex = /<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-sans">/;
const newGrid = `
                      <div className="mt-2">
                        <button
                          onClick={() => handleCollect(business.id)}
                          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition active:scale-95 mb-2"
                        >
                          💰 Coletar Faturamento
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-sans">
`;
content = content.replace(gridRegex, newGrid);

// Replace "R$ X/m" with "R$ X/ciclo"
content = content.replace(/\(b\.revenuePerCycle \* 60\)\.toFixed\(0\)\}\/m/g, 'b.revenuePerCycle).toFixed(0)}/ciclo');

fs.writeFileSync(path, content, 'utf8');
console.log('BusinessesSection converted to manual cycles');
