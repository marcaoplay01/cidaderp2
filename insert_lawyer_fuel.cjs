const fs = require('fs');

// --- LAWYER BUTTON in App.tsx ---
const pathApp = './src/App.tsx';
let appContent = fs.readFileSync(pathApp, 'utf8');

const lawyerButton = `
                  <button
                    id="btn-jail-cleanup"
                    onClick={() => {
                      if (player.energy < 15) {
                        playSound('error');
                        alert('Energia insuficiente para a faxina pesada!');
                        return;
                      }
                      playSound('click');
                      updatePlayerState(prev => ({
                        ...prev,
                        energy: Math.max(0, prev.energy - 15)
                      }));
                      setJailTimer(prev => Math.max(0, prev - 4));
                      showToast('Faxina concluída! -4 segundos de pena.', 'success');
                    }}
                    className="bg-zinc-900 hover:bg-zinc-850 text-zinc-350 hover:text-white font-bold py-3.5 px-3 rounded-xl border border-zinc-800 uppercase tracking-tight flex flex-col items-center justify-center gap-1 cursor-pointer transition active:scale-95"
                  >
                    🧹 Limpar Cela
                    <span className="text-[9px] text-zinc-500 font-bold font-mono">-15 EP / -4s Pena</span>
                  </button>

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

// The string to replace is a bit complex, let's just replace the btn-jail-cleanup entirely.
// We need a precise regex.
const cleanupRegex = /<button[\s\S]*?id="btn-jail-cleanup"[\s\S]*?<span[\s\S]*?<\/button>/;
appContent = appContent.replace(cleanupRegex, lawyerButton);
fs.writeFileSync(pathApp, appContent, 'utf8');
console.log('Lawyer button added to App.tsx');


// --- FUEL COST in JobsSection.tsx ---
const pathJobs = './src/components/JobsSection.tsx';
let jobsContent = fs.readFileSync(pathJobs, 'utf8');

const rewardRegex = /onCompleteJob\(multipliedReward, act.xpReward, act.energyCost, act.id, logMessage, statsUpdates\);/;
const fuelLogic = `
      const carDetails = VEHICLES.find(v => v.id === vehicleId);
      const fuelCost = carDetails ? carDetails.consumption * 15 : 0;
      const netReward = Math.max(0, multipliedReward - fuelCost);
      const fuelLog = fuelCost > 0 ? \` (Gasto Combustível: -R$ \${fuelCost})\` : '';
      
      onCompleteJob(netReward, act.xpReward, act.energyCost, act.id, logMessage + fuelLog, statsUpdates);
`;

jobsContent = jobsContent.replace(rewardRegex, fuelLogic);
fs.writeFileSync(pathJobs, jobsContent, 'utf8');
console.log('Fuel cost added to JobsSection.tsx');
