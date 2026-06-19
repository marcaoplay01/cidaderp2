const fs = require('fs');
let jobsContent = fs.readFileSync('./src/components/JobsSection.tsx', 'utf8');

const actionButtonSearch = `                      <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full uppercase scale-95 shrink-0">
                        <Lock className="h-3 w-3" /> Bloqueado
                      </span>
                    ) : (`;

const actionButtonReplace = `                      <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full uppercase scale-95 shrink-0">
                        <Lock className="h-3 w-3" /> Bloqueado
                      </span>
                    ) : needsPermit ? (
                      <button 
                         onClick={() => {
                            let price = 0;
                            let name = '';
                            if (job.id === 'app_driver_job') { price = 15000; name = 'Alvará Municipal'; }
                            if (job.id === 'trucker_job') { price = 60000; name = 'Licença ANTT'; }
                            if (job.id === 'doctor_job') { price = 150000; name = 'CRM Ativo'; }
                            if (job.id === 'armeiro_clandestino') { price = 35000; name = 'Contato do Submundo'; }
                            
                            if (player.cash >= price) {
                               updatePlayerState(p => ({
                                  ...p,
                                  cash: p.cash - price,
                                  workPermits: [...(p.workPermits || []), requiredWorkPermit as string]
                               }));
                               playSound('cash');
                               showToast(\`\${name} adquirido com sucesso!\`, 'success');
                            } else {
                               showToast(\`Você precisa de R$ \${price} para comprar \${name}.\`, 'critical');
                            }
                         }}
                         className="flex items-center gap-1 text-[10px] font-bold text-yellow-500 hover:text-white bg-yellow-500/10 hover:bg-yellow-600 border border-yellow-500/20 px-2 py-0.5 rounded-full uppercase scale-95 shrink-0 transition"
                      >
                        <Lock className="h-3 w-3" /> Comprar Alvará
                      </button>
                    ) : (`;

jobsContent = jobsContent.replace(actionButtonSearch, actionButtonReplace);
fs.writeFileSync('./src/components/JobsSection.tsx', jobsContent, 'utf8');
console.log('JobsSection.tsx updated for licenses part 2');
