const fs = require('fs');
let jobsContent = fs.readFileSync('./src/components/JobsSection.tsx', 'utf8');

// Inject Licenses barrier
// The UI currently shows "Sem CNH", "CNH B" etc. We need to add licenses for specific jobs.
// 'app_driver_job' needs 'alvara_app'
// 'trucker_job' needs 'licenca_antt'
// 'doctor_job' needs 'crm_ativo'
// 'armeiro_clandestino' needs 'contato_submundo'

const licensesLogicSearch = `            const needsLicense = job.requiredLicense !== 'none' && \n              ((job.requiredLicense === 'driver' && !player.hasDriversLicense) ||\n               (job.requiredLicense === 'truck' && !player.hasTruckLicense));`;
const licensesLogicReplace = `            const needsLicense = job.requiredLicense !== 'none' && 
              ((job.requiredLicense === 'driver' && !player.hasDriversLicense) ||
               (job.requiredLicense === 'truck' && !player.hasTruckLicense));

            let requiredWorkPermit = null;
            if (job.id === 'app_driver_job') requiredWorkPermit = 'alvara_app';
            if (job.id === 'trucker_job') requiredWorkPermit = 'licenca_antt';
            if (job.id === 'doctor_job') requiredWorkPermit = 'crm_ativo';
            if (job.id === 'armeiro_clandestino') requiredWorkPermit = 'contato_submundo';

            const needsPermit = requiredWorkPermit ? !(player.workPermits || []).includes(requiredWorkPermit) : false;`;

const isLockedSearch = `            const isLocked = levelLocked || repLocked || needsVehicle || needsLicense;`;
const isLockedReplace = `            const isLocked = levelLocked || repLocked || needsVehicle || needsLicense || needsPermit;`;

jobsContent = jobsContent.replace(licensesLogicSearch, licensesLogicReplace);
jobsContent = jobsContent.replace(isLockedSearch, isLockedReplace);

const requirementsSearch = `Requisitos: LVL {job.levelRequired} {job.criminalReputationRequired ? '\u2022 Rep. ' + job.criminalReputationRequired : ''} \u2022 {job.requiredLicense === 'none' ? 'Sem CNH' : job.requiredLicense === 'driver' ? 'CNH B' : 'CNH E'}`;
const requirementsReplace = `Requisitos: LVL {job.levelRequired} {job.criminalReputationRequired ? '\u2022 Rep. ' + job.criminalReputationRequired : ''} \u2022 {job.requiredLicense === 'none' ? 'Sem CNH' : job.requiredLicense === 'driver' ? 'CNH B' : 'CNH E'} {requiredWorkPermit ? '\u2022 Alvará Necessário' : ''}`;
jobsContent = jobsContent.replace(requirementsSearch, requirementsReplace);

// Add "Comprar Alvará" button to the locked card if it's just the permit that is missing
const actionButtonSearch = `                      <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full uppercase scale-95 shrink-0">
                        <Lock className="h-3 w-3" /> Bloqueado
                      </span>`;
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
                      </button>`;

// We need to carefully replace this. Let's make sure we find the right match.
// Let's modify the above search to avoid errors.
// Wait, I will just use multi_replace_file_content or a better RegExp.
fs.writeFileSync('./src/components/JobsSection.tsx', jobsContent, 'utf8');
console.log('JobsSection.tsx updated for licenses part 1');
