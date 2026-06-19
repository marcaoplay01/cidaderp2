const fs = require('fs');

let content = fs.readFileSync('./src/components/FactionsSection.tsx', 'utf8');

// 1. We need to add territories to the faction state.
// But first, let's just inject the "Territory War" UI and "Ammo" donation to the FactionsSection.

const injectionStart = `        {/* TAB NAVIGATION */}`;
const newTabNav = `
        {/* TERRITORY WARS BANNER */}
        <div className="bg-red-950/40 border-2 border-red-900 rounded-2xl p-4 mb-4 flex flex-col sm:flex-row items-center justify-between shadow-[0_0_15px_rgba(220,38,38,0.2)]">
          <div className="space-y-1">
            <h2 className="text-xl font-black text-red-500 uppercase tracking-widest flex items-center gap-2">
              <Swords className="w-5 h-5" /> Guerra de Territórios
            </h2>
            <p className="text-zinc-400 text-sm">Deposite Dinheiro e Munição no Cofre da sua facção. O sorteio de invasão ocorre nos sábados (ou simule abaixo).</p>
          </div>
          <button 
            onClick={() => simulateTerritoryWar()}
            className="mt-3 sm:mt-0 bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-xl flex items-center gap-2 transition-all"
          >
            <Skull className="w-4 h-4" /> Simular Invasão
          </button>
        </div>

        {/* DOMAIN STATUS UI */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
           <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col items-center text-center">
             <h3 className="font-bold text-zinc-100">O Porto</h3>
             <p className="text-[10px] text-emerald-400 font-mono mb-2">Bônus: Doleiro -15%</p>
             <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded">Dominado por: {territories.porto || 'Ninguém'}</span>
           </div>
           <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col items-center text-center">
             <h3 className="font-bold text-zinc-100">Centro Financeiro</h3>
             <p className="text-[10px] text-yellow-400 font-mono mb-2">Bônus: +10% Empresas</p>
             <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded">Dominado por: {territories.centro || 'Ninguém'}</span>
           </div>
           <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col items-center text-center">
             <h3 className="font-bold text-zinc-100">Periferia</h3>
             <p className="text-[10px] text-blue-400 font-mono mb-2">Bônus: -15% Energia Jobs</p>
             <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded">Dominado por: {territories.periferia || 'Ninguém'}</span>
           </div>
        </div>

        {/* TAB NAVIGATION */}
`;

if (!content.includes('Guerra de Territórios')) {
  content = content.replace(injectionStart, newTabNav);
}

// 2. Add simulateTerritoryWar function and territory state
if (!content.includes('const [territories, setTerritories] = useState')) {
  const stateInjection = `const [activeTab, setActiveTab] = useState<'info' | 'missions' | 'members'>('info');`;
  const newState = `const [activeTab, setActiveTab] = useState<'info' | 'missions' | 'members'>('info');
  const [territories, setTerritories] = useState<any>(() => {
    return JSON.parse(localStorage.getItem('cidade_rp_territories') || '{"porto": null, "centro": null, "periferia": null}');
  });
  
  useEffect(() => {
    localStorage.setItem('cidade_rp_territories', JSON.stringify(territories));
  }, [territories]);

  const simulateTerritoryWar = () => {
    if (!player.faction) {
      showToast('Afilie-se a uma facção primeiro!', 'critical');
      return;
    }
    
    // Simulate War Logic
    let totalWeight = 0;
    const mapped = factions.map(f => {
       const ammo = f.vaultAmmo || 0;
       const cash = f.vaultCash || 0;
       const weight = (ammo * 2500) + cash;
       totalWeight += weight;
       return { ...f, weight };
    });
    
    if (totalWeight === 0) {
      showToast('Nenhuma facção investiu no cofre para guerrear.', 'info');
      return;
    }

    let randomPoint = Math.random() * totalWeight;
    let winner = factions[0];
    
    for (let f of mapped) {
       if (randomPoint < f.weight) {
           winner = f;
           break;
       }
       randomPoint -= f.weight;
    }
    
    setTerritories({
      porto: winner.name,
      centro: winner.name,
      periferia: winner.name
    });
    
    playSound('cash');
    // Fake-X Notification Alert!
    alert(\`🚨 URGENTE: Tiroteio intenso na madrugada! A facção "\${winner.name}" acaba de dominar as ruas com \${(winner.weight/totalWeight*100).toFixed(1)}% das forças armadas da cidade. A cidade está em choque!\`);
  };
`;
  content = content.replace(stateInjection, newState);
}

// 3. Add Donate Ammo button in Vault
const donateCashSearch = `<div className="text-xs text-zinc-400">Doar Dinheiro</div>`;
const donateAmmoButton = `
                  <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center cursor-pointer hover:bg-zinc-800 transition"
                       onClick={() => {
                         if (!player.ammo || player.ammo < 1) {
                           showToast('Você não tem Munição! Fabrique no emprego Armeiro.', 'critical');
                           return;
                         }
                         updatePlayerState(prev => ({
                           ...prev,
                           ammo: (prev.ammo || 0) - 1,
                           factionXp: (prev.factionXp || 0) + 10
                         }));
                         setFactions(factions.map(f => f.id === player.faction ? { ...f, vaultAmmo: (f.vaultAmmo || 0) + 1 } : f));
                         playSound('cash');
                         showToast('+1 Munição enviada para o Cofre de Guerra!', 'success');
                       }}>
                    <div className="flex items-center justify-center mb-1">
                      <Target className="w-5 h-5 text-orange-500" />
                    </div>
                    <div className="font-bold text-orange-400">Munição ({(factions.find(f => f.id === player.faction) as any)?.vaultAmmo || 0})</div>
                    <div className="text-[10px] text-zinc-500">Toque para Doar</div>
                  </div>
`;
if (!content.includes('vaultAmmo')) {
  // We need to inject the ammo button next to cash
  content = content.replace(
    `<div className="flex gap-4">`,
    `<div className="flex gap-4">\n${donateAmmoButton}`
  );
}

fs.writeFileSync('./src/components/FactionsSection.tsx', content, 'utf8');
console.log('Factions UI updated!');
