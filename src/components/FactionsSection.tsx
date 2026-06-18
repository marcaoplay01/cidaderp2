import React, { useState, useEffect } from 'react';
import { Shield, Skull, Target, TrendingUp, HandMetal, Swords, Crosshair, Crown, Coins, Info } from 'lucide-react';
import { PlayerState, FactionType, FactionRole, FactionState, FactionMission } from '../types';

interface FactionsSectionProps {
  player: PlayerState;
  updatePlayerState: (updater: (prev: PlayerState) => PlayerState, bypassPersist?: boolean) => void;
  playSound: (soundId: string) => void;
  showToast: (text: string, type?: 'success' | 'info' | 'critical') => void;
}

// Initial default factions state
// TODO: Fetch from real database. These start at 0 for MVP so real players build them up.
const INITIAL_FACTIONS: FactionState[] = [
  { id: 'cv', name: 'Comando Vermelho', vaultCash: 0, influence: 0 },
  { id: 'pcc', name: 'PCC', vaultCash: 0, influence: 0 },
  { id: 'milicia', name: 'Milícia', vaultCash: 0, influence: 0 },
  { id: 'cartel', name: 'Cartel Internacional', vaultCash: 0, influence: 0 },
];

const FACTIONS_COLORS: Record<FactionType, string> = {
  'cv': 'text-red-500 border-red-500 bg-red-500',
  'pcc': 'text-zinc-300 border-zinc-400 bg-zinc-400',
  'milicia': 'text-blue-500 border-blue-500 bg-blue-500',
  'cartel': 'text-emerald-500 border-emerald-500 bg-emerald-500',
};

const FACTION_DESCRIPTIONS: Record<FactionType, string> = {
  'cv': 'A facção mais tradicional do Rio. Foco em controle de território e guerrilha armada.',
  'pcc': 'Organização altamente estruturada. Foco em grandes lucros e logística de entorpecentes.',
  'milicia': 'Controle de taxas locais e influência política. Bônus em segurança e menor risco com a polícia.',
  'cartel': 'Conexões internacionais poderosas. O maior cofre, mas difícil de ganhar influência nas ruas locais.',
};

const ROLE_REQUIREMENTS: Record<FactionRole, number> = {
  'soldado': 0,
  'gerente': 1000,
  'frente': 5000,
  'chefe': 15000,
};

const MISSIONS: FactionMission[] = [
  { id: 'extorsao', title: 'Extorsão Local', description: 'Cobrar taxas de comerciantes.', factionXpReward: 50, vaultCashReward: 500, personalCashReward: 150, durationSeconds: 5 },
  { id: 'trafico', title: 'Escolta de Carga', description: 'Proteger carregamento nas rodovias.', factionXpReward: 120, vaultCashReward: 2500, personalCashReward: 600, durationSeconds: 15 },
  { id: 'assalto_banco', title: 'Assalto a Caixa Eletrônico', description: 'Explodir e limpar caixas na madrugada.', factionXpReward: 300, vaultCashReward: 8000, personalCashReward: 1500, durationSeconds: 30 },
];

export default function FactionsSection({ player, updatePlayerState, playSound, showToast }: FactionsSectionProps) {
  const [factions, setFactions] = useState<FactionState[]>(() => {
    const saved = localStorage.getItem('cidade_rp_factions_v1');
    return saved ? JSON.parse(saved) : INITIAL_FACTIONS;
  });

  const [activeTab, setActiveTab] = useState<'ranking' | 'missions' | 'war' | 'vault'>('ranking');
  const [activeMissionId, setActiveMissionId] = useState<string | null>(null);
  const [missionTimer, setMissionTimer] = useState<number>(0);
  const [vaultDepositAmount, setVaultDepositAmount] = useState<string>('');

  useEffect(() => {
    localStorage.setItem('cidade_rp_factions_v1', JSON.stringify(factions));
  }, [factions]);

  useEffect(() => {
    if (!activeMissionId || missionTimer <= 0) return;
    const interval = setInterval(() => {
      setMissionTimer(prev => {
        if (prev <= 1) {
          completeMission();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeMissionId, missionTimer]);

  const joinFaction = (factionId: FactionType) => {
    if (player.faction) {
      showToast('Você já pertence a uma facção!', 'critical');
      return;
    }
    playSound('cash');
    updatePlayerState(prev => ({
      ...prev,
      faction: factionId,
      factionRole: 'soldado',
      factionXp: 0
    }));
    showToast(`Bem-vindo ao ${factions.find(f => f.id === factionId)?.name}!`, 'success');
  };

  const completeMission = () => {
    const mission = MISSIONS.find(m => m.id === activeMissionId);
    if (!mission || !player.faction) return;

    playSound('cash');
    updatePlayerState(prev => ({
      ...prev,
      cash: prev.cash + mission.personalCashReward,
      factionXp: (prev.factionXp || 0) + mission.factionXpReward
    }));

    setFactions(prev => prev.map(f => {
      if (f.id === player.faction) {
        return { ...f, vaultCash: f.vaultCash + mission.vaultCashReward };
      }
      return f;
    }));

    showToast(`Missão Concluída! Ganhou R$ ${mission.personalCashReward} e +${mission.factionXpReward} XP.`, 'success');
    setActiveMissionId(null);
  };

  const startMission = (missionId: string) => {
    if (!player.faction) {
      showToast('Você precisa de uma facção!', 'critical');
      return;
    }
    if (activeMissionId) {
      showToast('Já existe uma missão em andamento!', 'info');
      return;
    }
    const mission = MISSIONS.find(m => m.id === missionId);
    if (mission) {
      playSound('click');
      setActiveMissionId(mission.id);
      setMissionTimer(mission.durationSeconds);
    }
  };

  const handleDepositVault = () => {
    const amt = parseFloat(vaultDepositAmount);
    if (isNaN(amt) || amt <= 0 || amt > player.cash) {
      playSound('error');
      showToast('Valor inválido ou saldo insuficiente!', 'critical');
      return;
    }

    playSound('cash');
    updatePlayerState(prev => ({
      ...prev,
      cash: prev.cash - amt,
      factionXp: (prev.factionXp || 0) + Math.floor(amt / 100)
    }));

    setFactions(prev => prev.map(f => {
      if (f.id === player.faction) {
        const influenceGain = (amt / 100000);
        return { 
          ...f, 
          vaultCash: f.vaultCash + amt,
          influence: Math.min(100, f.influence + influenceGain)
        };
      }
      const highestRival = [...prev].filter(rival => rival.id !== player.faction).sort((a,b) => b.influence - a.influence)[0];
      if (f.id === highestRival?.id) {
         return { ...f, influence: Math.max(0, f.influence - (amt / 100000)) };
      }
      return f;
    }));

    setVaultDepositAmount('');
    showToast(`R$ ${amt.toLocaleString('pt-BR')} depositados no Cofre da Facção!`, 'success');
  };

  const handleAttackTerritory = (targetFactionId: FactionType) => {
    if (targetFactionId === player.faction) return;
    
    const cost = 25000;
    if (player.cash < cost) {
      playSound('error');
      showToast(`Você precisa de R$ ${cost.toLocaleString('pt-BR')} para financiar um ataque!`, 'critical');
      return;
    }

    playSound('click');
    updatePlayerState(prev => ({ ...prev, cash: prev.cash - cost }));

    const myFaction = factions.find(f => f.id === player.faction);
    const targetFaction = factions.find(f => f.id === targetFactionId);
    
    if (!myFaction || !targetFaction) return;

    let winChance = 50 + ((myFaction.influence - targetFaction.influence) / 2);
    if (player.factionRole === 'frente') winChance += 10;
    if (player.factionRole === 'chefe') winChance += 20;

    const roll = Math.random() * 100;
    if (roll <= winChance) {
      playSound('cash');
      const influenceStolen = 2;
      const cashStolen = Math.floor(targetFaction.vaultCash * 0.05);
      
      setFactions(prev => prev.map(f => {
        if (f.id === player.faction) {
          return { ...f, influence: Math.min(100, f.influence + influenceStolen), vaultCash: f.vaultCash + cashStolen };
        }
        if (f.id === targetFactionId) {
          return { ...f, influence: Math.max(0, f.influence - influenceStolen), vaultCash: Math.max(0, f.vaultCash - cashStolen) };
        }
        return f;
      }));
      showToast(`Vitória! Você roubou 2% de influência e R$ ${cashStolen.toLocaleString('pt-BR')} do cofre inimigo!`, 'success');
    } else {
      playSound('error');
      const influenceLost = 1;
      setFactions(prev => prev.map(f => {
        if (f.id === player.faction) {
          return { ...f, influence: Math.max(0, f.influence - influenceLost) };
        }
        if (f.id === targetFactionId) {
          return { ...f, influence: Math.min(100, f.influence + influenceLost) };
        }
        return f;
      }));
      showToast(`Derrota! O ataque falhou. Sua facção perdeu 1% de influência.`, 'critical');
    }
  };

  const getRoleDisplay = () => {
    if (!player.factionRole) return 'Nenhum';
    const roles = {
      'soldado': 'Soldado',
      'gerente': 'Gerente de Boca',
      'frente': 'Frente (General)',
      'chefe': 'Chefe Supremo'
    };
    return roles[player.factionRole];
  };

  const checkPromotion = () => {
    if (!player.faction || !player.factionRole) return;
    const currentXp = player.factionXp || 0;
    let newRole = player.factionRole;

    if (currentXp >= ROLE_REQUIREMENTS['chefe']) newRole = 'chefe';
    else if (currentXp >= ROLE_REQUIREMENTS['frente']) newRole = 'frente';
    else if (currentXp >= ROLE_REQUIREMENTS['gerente']) newRole = 'gerente';

    if (newRole !== player.factionRole) {
      playSound('cash');
      updatePlayerState(prev => ({ ...prev, factionRole: newRole }));
      showToast(`Parabéns! Você foi promovido a ${newRole.toUpperCase()}!`, 'success');
    }
  };

  useEffect(() => { checkPromotion(); }, [player.factionXp]);

  const sortedFactions = [...factions].sort((a, b) => b.influence - a.influence);

  return (
    <div className="space-y-6 pb-24">
      <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-900 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Skull className="w-32 h-32" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-white font-display flex items-center gap-2 tracking-tight">
              <Swords className="h-6 w-6 text-red-500" />
              SISTEMA DE FACÇÕES
            </h2>
            <p className="text-zinc-400 text-sm mt-1 max-w-xl">
              Guerra por território, lavagem de dinheiro em larga escala e poder bélico. Escolha um lado, conquiste o topo da hierarquia e domine o Rio de Janeiro.
            </p>
          </div>
          
          {player.faction && (
            <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800 text-right shrink-0">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block">Sua Afiliação</span>
              <strong className={`text-xl font-black font-orbitron block ${FACTIONS_COLORS[player.faction].split(' ')[0]}`}>
                {factions.find(f => f.id === player.faction)?.name}
              </strong>
              <div className="flex items-center justify-end gap-2 mt-1">
                <span className="text-xs text-zinc-300 font-mono bg-zinc-800 px-2 py-0.5 rounded">
                  Cargo: <span className="text-white font-bold">{getRoleDisplay()}</span>
                </span>
                <span className="text-xs text-yellow-500 font-mono bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">
                  {player.factionXp || 0} XP
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {!player.faction ? (
        <div className="space-y-4 animate-fade-in">
          <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4">Escolha sua Aliança</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {factions.map(faction => (
              <div key={faction.id} className="bg-zinc-950/60 p-5 rounded-2xl border border-zinc-900 hover:border-zinc-700 transition flex flex-col justify-between">
                <div>
                  <h4 className={`text-xl font-black font-orbitron ${FACTIONS_COLORS[faction.id].split(' ')[0]}`}>
                    {faction.name}
                  </h4>
                  <p className="text-xs text-zinc-400 mt-2 min-h-[40px]">
                    {FACTION_DESCRIPTIONS[faction.id]}
                  </p>
                  
                  <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] font-mono text-zinc-500">
                    <div className="bg-zinc-900/50 p-2 rounded">
                      <span className="block mb-0.5">Influência na Cidade:</span>
                      <strong className="text-white text-xs">{faction.influence.toFixed(1)}%</strong>
                    </div>
                    <div className="bg-zinc-900/50 p-2 rounded">
                      <span className="block mb-0.5">Cofre Atual:</span>
                      <strong className="text-emerald-400 text-xs">R$ {(faction.vaultCash / 1000000).toFixed(1)}M</strong>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => joinFaction(faction.id)}
                  className={`mt-5 w-full py-3 rounded-xl font-bold uppercase text-xs tracking-wider transition-all border-2
                    ${FACTIONS_COLORS[faction.id].replace('text-', 'border-').replace('bg-', 'hover:bg-').split(' ').filter(c => !c.startsWith('text-') && !c.startsWith('bg-')).join(' ')}
                    hover:text-white text-zinc-300
                  `}
                >
                  Jurar Lealdade
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-zinc-900 pb-4">
            <div className="flex bg-zinc-950 p-1 rounded-xl gap-2 w-full sm:w-auto border border-zinc-900 overflow-x-auto whitespace-nowrap [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <button
                onClick={() => { playSound('click'); setActiveTab('ranking'); }}
                className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-lg text-xs font-bold leading-none tracking-wider uppercase transition-all duration-300 ${
                  activeTab === 'ranking' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                📊 Ranking Global
              </button>
              <button
                onClick={() => { playSound('click'); setActiveTab('missions'); }}
                className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-lg text-xs font-bold leading-none tracking-wider uppercase transition-all duration-300 ${
                  activeTab === 'missions' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                🎯 Missões ({MISSIONS.length})
              </button>
              <button
                onClick={() => { playSound('click'); setActiveTab('war'); }}
                className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-lg text-xs font-bold leading-none tracking-wider uppercase transition-all duration-300 ${
                  activeTab === 'war' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-zinc-400 hover:text-white'
                }`}
              >
                ⚔️ Guerra de Território
              </button>
              <button
                onClick={() => { playSound('click'); setActiveTab('vault'); }}
                className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-lg text-xs font-bold leading-none tracking-wider uppercase transition-all duration-300 ${
                  activeTab === 'vault' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-zinc-400 hover:text-white'
                }`}
              >
                💰 Cofre
              </button>
            </div>
          </div>

          {activeTab === 'ranking' && (
            <div className="space-y-4">
              <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-900 mb-6 flex gap-3 items-start">
                <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                <p className="text-xs text-zinc-400 leading-relaxed">
                  O Ranking Global define qual organização controla a Cidade RP. A influência dita a hegemonia e reduz a interferência policial. Domine através de guerras de território e contribuições astronômicas ao cofre.
                </p>
              </div>

              {sortedFactions.map((faction, idx) => {
                const isMe = faction.id === player.faction;
                return (
                  <div key={faction.id} className={`p-4 rounded-2xl border ${isMe ? 'border-zinc-700 bg-zinc-900/50' : 'border-zinc-900 bg-zinc-950/30'} flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden`}>
                    {idx === 0 && <div className="absolute top-0 right-0 p-1.5 px-3 bg-yellow-500 text-black text-[10px] font-black uppercase rounded-bl-lg">TOP 1 HEGEMONIA</div>}
                    
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xl border-2 ${FACTIONS_COLORS[faction.id]}`}>
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className={`text-lg font-black font-orbitron ${FACTIONS_COLORS[faction.id].split(' ')[0]}`}>
                          {faction.name} {isMe && <span className="text-[10px] text-zinc-400 font-sans ml-2">(Sua Facção)</span>}
                        </h4>
                        <div className="flex gap-4 mt-1">
                          <span className="text-[10px] font-mono text-zinc-400">
                            Influência: <strong className="text-white text-xs">{faction.influence.toFixed(1)}%</strong>
                          </span>
                          <span className="text-[10px] font-mono text-zinc-400">
                            Cofre: <strong className="text-emerald-400 text-xs">R$ {(faction.vaultCash / 1000000).toFixed(2)}M</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="w-full md:w-1/3">
                      <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
                        <div className={`h-full ${FACTIONS_COLORS[faction.id].split(' ')[2]}`} style={{ width: `${faction.influence}%` }}></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'missions' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {MISSIONS.map(mission => {
                const isRunning = activeMissionId === mission.id;
                
                return (
                  <div key={mission.id} className={`p-5 rounded-2xl border bg-zinc-950/60 flex flex-col justify-between ${isRunning ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-zinc-900'}`}>
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-white text-sm uppercase">{mission.title}</h4>
                        <span className="text-xs font-mono text-zinc-500">{mission.durationSeconds}s</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 min-h-[34px]">{mission.description}</p>
                      
                      <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] font-mono bg-zinc-900/50 p-2 rounded-lg">
                        <div>
                          <span className="text-zinc-500 block">Sua Recompensa:</span>
                          <strong className="text-emerald-400">R$ {mission.personalCashReward}</strong>
                        </div>
                        <div>
                          <span className="text-zinc-500 block">Pro Cofre:</span>
                          <strong className="text-zinc-300">R$ {mission.vaultCashReward}</strong>
                        </div>
                        <div className="col-span-2 pt-1 border-t border-zinc-800">
                          <span className="text-zinc-500 block">XP de Facção:</span>
                          <strong className="text-yellow-500">+{mission.factionXpReward} XP</strong>
                        </div>
                      </div>
                    </div>

                    <button
                      disabled={!!activeMissionId}
                      onClick={() => startMission(mission.id)}
                      className={`mt-4 w-full py-2.5 rounded-xl font-bold uppercase text-xs tracking-wider transition-all
                        ${isRunning 
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                          : !!activeMissionId 
                            ? 'bg-zinc-900 text-zinc-600 cursor-not-allowed'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700'}
                      `}
                    >
                      {isRunning ? `Executando... ${missionTimer}s` : 'Iniciar Operação'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'war' && (
            <div className="space-y-6">
              <div className="bg-zinc-950/50 p-5 rounded-2xl border border-red-900/30">
                <h3 className="text-sm font-black text-red-400 uppercase flex items-center gap-2 mb-2">
                  <Target className="h-5 w-5" /> Iniciar Guerra de Território
                </h3>
                <p className="text-xs text-zinc-400">
                  Financie ataques (R$ 25.000) contra as facções rivais para roubar Influência na Cidade e Parte do Cofre deles. A chance de vitória baseia-se na influência atual da sua facção e no seu cargo! Se perder, sua facção perde influência.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {factions.filter(f => f.id !== player.faction).map(faction => {
                  const myFaction = factions.find(f => f.id === player.faction);
                  let winChance = 50 + (((myFaction?.influence || 0) - faction.influence) / 2);
                  if (player.factionRole === 'frente') winChance += 10;
                  if (player.factionRole === 'chefe') winChance += 20;
                  winChance = Math.max(10, Math.min(90, winChance));

                  return (
                    <div key={faction.id} className="p-4 rounded-2xl border border-zinc-900 bg-zinc-950/60 flex flex-col justify-between">
                      <div>
                        <h4 className={`text-lg font-black font-orbitron ${FACTIONS_COLORS[faction.id].split(' ')[0]}`}>{faction.name}</h4>
                        <div className="mt-2 space-y-1 text-xs font-mono text-zinc-400">
                          <p>Influência Alvo: <strong className="text-white">{faction.influence.toFixed(1)}%</strong></p>
                          <p>Sua Chance: <strong className={winChance > 50 ? 'text-emerald-400' : 'text-red-400'}>{winChance.toFixed(0)}%</strong></p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAttackTerritory(faction.id)}
                        className="mt-4 w-full py-2 bg-red-950 border border-red-900 hover:bg-red-900 text-red-200 text-xs font-bold uppercase rounded-lg transition"
                      >
                        Atacar (R$ 25k)
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'vault' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-zinc-950/50 p-6 rounded-2xl border border-zinc-900">
                <h3 className="text-sm font-black text-emerald-400 uppercase flex items-center gap-2 mb-2">
                  <Coins className="h-5 w-5" /> Cofre da Facção
                </h3>
                <p className="text-xs text-zinc-400 mb-6">
                  O dinheiro depositado aqui fortalece o arsenal da facção e aumenta gradualmente a Influência Global de vocês. Depósitos também rendem bônus de XP pessoal de facção.
                </p>

                <div className="p-4 bg-zinc-900/50 rounded-xl border border-emerald-900/30 text-center mb-6">
                  <span className="block text-[10px] text-zinc-500 font-mono uppercase">Saldo Total em Caixa</span>
                  <strong className="text-3xl font-black font-orbitron text-emerald-400">
                    R$ {factions.find(f => f.id === player.faction)?.vaultCash.toLocaleString('pt-BR')}
                  </strong>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-zinc-400 block uppercase">VALOR PARA DEPOSITAR (R$)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Ex: 10000"
                      value={vaultDepositAmount}
                      onChange={e => setVaultDepositAmount(e.target.value)}
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-zinc-700"
                    />
                    <button
                      onClick={() => setVaultDepositAmount(player.cash.toString())}
                      className="px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[10px] font-mono font-bold uppercase transition"
                    >
                      Tudo
                    </button>
                  </div>
                  <button
                    onClick={handleDepositVault}
                    className="w-full py-3 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs uppercase font-extrabold tracking-wider transition-all"
                  >
                    Contribuir para o Cofre
                  </button>
                </div>
              </div>

              <div className="bg-zinc-950/50 p-6 rounded-2xl border border-zinc-900">
                <h3 className="text-sm font-black text-yellow-500 uppercase flex items-center gap-2 mb-4">
                  <Crown className="h-5 w-5" /> Sua Hierarquia
                </h3>
                
                <div className="space-y-4">
                  {Object.entries(ROLE_REQUIREMENTS).map(([role, req]) => {
                    const isCurrent = player.factionRole === role;
                    const isUnlocked = (player.factionXp || 0) >= req;
                    
                    return (
                      <div key={role} className={`p-3 rounded-xl border flex items-center justify-between ${isCurrent ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-zinc-900/30 border-zinc-800'}`}>
                        <div>
                          <h4 className={`text-sm font-bold capitalize ${isCurrent ? 'text-yellow-400' : isUnlocked ? 'text-zinc-300' : 'text-zinc-500'}`}>
                            {role} {isCurrent && '(Atual)'}
                          </h4>
                          <span className="text-[10px] font-mono text-zinc-500">Requisito: {req} XP</span>
                        </div>
                        {!isUnlocked && (
                          <div className="text-[10px] font-mono text-zinc-600 bg-zinc-950 px-2 py-1 rounded">
                            Faltam {req - (player.factionXp || 0)} XP
                          </div>
                        )}
                        {isCurrent && (
                          <div className="text-[10px] font-bold text-yellow-500 bg-yellow-500/20 px-2 py-1 rounded border border-yellow-500/30">
                            CARGO ATUAL
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}