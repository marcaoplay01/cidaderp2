const fs = require('fs');
const pathApp = './src/App.tsx';
let appContent = fs.readFileSync(pathApp, 'utf8');

// 1. Remove offline business passive
const offlineRegex = /let businessPassivePerSec = 0;[\s\S]*?const totalPassiveRate = propertyPassivePerSec \+ businessPassivePerSec;/;
appContent = appContent.replace(offlineRegex, 'const totalPassiveRate = propertyPassivePerSec;');

// 2. Add Progressive Taxes
const taxLogic = `
        let totalNetWorth = 0;
        prev.ownedVehicles.forEach(id => { const v = VEHICLES.find(x => x.id === id); if(v) totalNetWorth += v.price; });
        prev.ownedProperties.forEach(id => { const p = PROPERTIES.find(x => x.id === id); if(p) totalNetWorth += p.price; });
        Object.keys(prev.ownedBusinesses).forEach(id => { const b = BUSINESSES.find(x => x.id === id); if(b) totalNetWorth += b.price; });

        let taxRate = 0.002;
        if (totalNetWorth > 50000000) taxRate = 0.005;
        else if (totalNetWorth > 10000000) taxRate = 0.0025;

        const taxDrainPerSec = (totalNetWorth * taxRate) / 60;
        const cashGained = (propertyPassivePerSec - taxDrainPerSec) * deltaSec;
`;
appContent = appContent.replace(/const cashGained = propertyPassivePerSec \* deltaSec;/, taxLogic);

// 3. Proportional Crime fine in handleCommitCrimeFailure
const crimeFineRegex = /const penaltyFine = act\.fine;/;
const newCrimeFine = `
      const penaltyFine = Math.max(act.fine, Math.floor(prev.cash * 0.03));
`;
appContent = appContent.replace(crimeFineRegex, newCrimeFine);

// 4. Add Lawyer button correctly. We will insert it AFTER the btn-jail-cleanup closing tag.
const lawyerButton = `
                  <button
                    id="btn-jail-lawyer"
                    onClick={() => {
                      const lawyerCost = jailTimer * 2000;
                      if (player.cash < lawyerCost) {
                        playSound('error');
                        alert('Você não tem dinheiro para pagar o advogado (R$ ' + lawyerCost.toLocaleString('pt-BR') + ')!');
                        return;
                      }
                      playSound('cash');
                      updatePlayerState(prev => ({
                        ...prev,
                        cash: prev.cash - lawyerCost
                      }));
                      setJailTimer(0);
                      showToast('Habeas Corpus concedido! Você está solto.', 'success');
                    }}
                    className="bg-zinc-900 hover:bg-zinc-850 text-amber-500 hover:text-amber-400 font-bold py-3.5 px-3 rounded-xl border border-zinc-800 uppercase tracking-tight flex flex-col items-center justify-center gap-1 cursor-pointer transition active:scale-95 col-span-full"
                  >
                    ⚖️ Pagar Advogado
                    <span className="text-[9px] text-amber-600/70 font-bold font-mono">-R$ {(jailTimer * 2000).toLocaleString('pt-BR')} / Soltura Imediata</span>
                  </button>
`;

// We look for: <span className="text-[9px] text-zinc-500 font-bold font-mono">-8 EP / -2s Pena</span>\n                  </button>
// and insert after it.
const insertPoint = /<span className="text-\[9px\] text-zinc-500 font-bold font-mono">-8 EP \/ -2s Pena<\/span>\s*<\/button>/;
appContent = appContent.replace(insertPoint, match => match + '\n' + lawyerButton);

fs.writeFileSync(pathApp, appContent, 'utf8');
console.log('App.tsx fixed successfully');
