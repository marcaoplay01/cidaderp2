const fs = require('fs');
let jobsContent = fs.readFileSync('./src/components/JobsSection.tsx', 'utf8');

// Add stress display to HUD or at least handle the time limit reduction
const timeSearch = `setTimerLeft(job.executionTime);`;
const timeReplace = `let finalTime = job.executionTime;
    if ((player.stress || 0) >= 51 && (player.stress || 0) <= 80) {
      finalTime = Math.max(3, finalTime - 1); // -1s time limit due to stress
    }
    setTimerLeft(finalTime);`;
jobsContent = jobsContent.replace(timeSearch, timeReplace);

// We need to show the stress bar to the user in JobsSection.
const headerSearch = `      {/* Background/Current job status */}`;
const headerReplace = `      {/* STRESS BAR */}
      <div className="bg-zinc-950/40 border border-zinc-800 p-4 rounded-xl flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-zinc-300">🧠 Estresse Mental / Trânsito</span>
          <span className="text-xs font-mono font-bold text-orange-400">{player.stress || 0}%</span>
        </div>
        <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
          <div 
            className="h-full transition-all duration-500 bg-gradient-to-r from-emerald-500 via-orange-500 to-red-600"
            style={{ width: \`\${Math.min(100, player.stress || 0)}%\` }}
          />
        </div>
        <div className="text-[10px] text-zinc-500">
          {(player.stress || 0) < 21 ? 'Tranquilo' : (player.stress || 0) < 51 ? 'Cansado (-15% Chance de Dobro)' : (player.stress || 0) < 81 ? 'Estressado (-1s Tempo no Minigame)' : 'Esgotado (+50% Custo de Energia)'}
        </div>
      </div>

      {/* Background/Current job status */}`;
jobsContent = jobsContent.replace(headerSearch, headerReplace);

fs.writeFileSync('./src/components/JobsSection.tsx', jobsContent, 'utf8');
console.log('JobsSection.tsx updated with stress logic');
