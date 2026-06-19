const fs = require('fs');
let jobsContent = fs.readFileSync('./src/components/JobsSection.tsx', 'utf8');

const useEffectSearch = `  // Start timer on mount/active job change\n  useEffect(() => {\n    let timer: NodeJS.Timeout;`;

const useEffectReplace = `  // Initialize Daily Contracts
  useEffect(() => {
    const today = new Date().toLocaleDateString();
    const lastDate = localStorage.getItem('dailyContractsDate');
    if (lastDate !== today || !player.dailyContracts || player.dailyContracts.length === 0) {
      localStorage.setItem('dailyContractsDate', today);
      updatePlayerState(p => ({
        ...p,
        dailyContracts: [
          {
            id: 'daily_trucker_1',
            title: 'Mestre da Rodovia',
            description: 'Conclua 5 entregas como Caminhoneiro',
            targetJob: 'trucker_job',
            goal: 5,
            progress: 0,
            rewardType: 'cash',
            rewardValue: 8500,
            completed: false
          },
          {
            id: 'daily_app_1',
            title: 'Maratona App',
            description: 'Conclua 10 corridas no Motorista de App',
            targetJob: 'app_driver_job',
            goal: 10,
            progress: 0,
            rewardType: 'cash',
            rewardValue: 5000,
            completed: false
          }
        ]
      }));
    }
  }, [player.dailyContracts, updatePlayerState]);

  // Start timer on mount/active job change
  useEffect(() => {
    let timer: NodeJS.Timeout;`;

jobsContent = jobsContent.replace(useEffectSearch, useEffectReplace);

// Display Contracts UI in JobsSection
const uiSearch = `      {/* Background/Current job status */}`;
const uiReplace = `      {/* DAILY CONTRACTS */}
      {(player.dailyContracts && player.dailyContracts.length > 0) && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
           <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" /> 
              Contratos Corporativos do Dia
           </h3>
           <div className="space-y-2">
              {player.dailyContracts.map(contract => (
                 <div key={contract.id} className="flex justify-between items-center bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                    <div>
                       <div className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                          {contract.completed ? <Check className="w-4 h-4 text-emerald-500" /> : null}
                          <span className={contract.completed ? 'line-through text-zinc-500' : ''}>{contract.title}</span>
                       </div>
                       <div className="text-xs text-zinc-500 mt-1">{contract.description}</div>
                       <div className="text-xs font-mono text-amber-400 mt-1">
                          Recompensa: R$ {contract.rewardValue.toLocaleString('pt-BR')}
                       </div>
                    </div>
                    <div className="text-right">
                       <div className="text-sm font-mono font-bold text-zinc-300">
                          {contract.progress} / {contract.goal}
                       </div>
                    </div>
                 </div>
              ))}
           </div>
        </div>
      )}

      {/* Background/Current job status */}`;
jobsContent = jobsContent.replace(uiSearch, uiReplace);

fs.writeFileSync('./src/components/JobsSection.tsx', jobsContent, 'utf8');
console.log('JobsSection.tsx updated for Daily Contracts');
