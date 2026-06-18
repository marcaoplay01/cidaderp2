import { useState } from 'react';
import { PlayerState, DailyQuest, WeeklyObjective } from '../types';
import { 
  User, 
  Calendar, 
  Award, 
  Trophy, 
  Sparkles, 
  Check, 
  Lock, 
  Coins, 
  Zap, 
  ChevronRight, 
  HelpCircle, 
  Trash2,
  Gift,
  Flame,
  ArrowUpRight,
  TrendingUp,
  Gem,
  Compass
} from 'lucide-react';
import { playSound } from '../utils/audio';
import { motion, AnimatePresence } from 'motion/react';
import { 
  DAILY_LOGIN_CALENDAR, 
  RARE_COLLECTIBLES, 
  ACHIEVEMENTS_LIST, 
  SimulatedLeaderboardEntry,
  getPassiveBonusMultipliers
} from '../utils/retentionData';

interface RetentionSectionProps {
  player: PlayerState;
  onClaimDaily: () => void;
  onClaimQuest: (id: string) => void;
  onClaimWeekly: (id: string) => void;
  onBuyMysteryBox: (price: number) => void;
  leaderboard: SimulatedLeaderboardEntry[];
  onTriggerBooster: (type: 'double_salary' | 'free_energy' | 'double_crime') => void;
  onWipeSave: () => void;
  activeBoosterType: 'double_salary' | 'free_energy' | 'double_crime' | null;
  boosterTimeRemaining: number;
}

const CAREER_TITLES: { [id: string]: string[] } = {
  delivery_job: ["Amador de Bike", "Entregador Veloz", "Motoboy de Elite", "Rei do Grau", "Lenda dos Hambúrgueres"],
  app_driver_job: ["Pilotando o AP", "Uber Preferencial", "VIP 5 Estrelas", "Grande Chofer da Capital", "Magnata de Frota"],
  mechanic_job: ["Graxa no Bolso", "Mecânico Prático", "Preparador de Motor AP", "Mestre da Retífica", "Engenheiro de Performance"],
  taxi_job: ["Bandeira Três", "Cooperado do Ponto Amarelo", "Terror dos Acessos", "Imperador das Rodovias", "Padrinho da Central"],
  police_job: ["Recruta de Viatura", "Cabo Protetor", "Sargento Patrulheiro", "Tenente Comandante", "Coronel da Reserva"],
  trucker_job: ["Pé de Bode", "Comandante do Asfalto", "Lenda da Rodovia BR-116", "Rei do Comboio Pesado", "Soberano Interestadual"],
  doctor_job: ["Estagiário de Hospital", "Socorrista Ambulância", "Cirurgião Residente", "Médico Chefe de Trauma", "Diretor do SAMU"],
};

export default function RetentionSection({
  player,
  onClaimDaily,
  onClaimQuest,
  onClaimWeekly,
  onBuyMysteryBox,
  leaderboard,
  onTriggerBooster,
  onWipeSave,
  activeBoosterType,
  boosterTimeRemaining
}: RetentionSectionProps) {
  const [subTab, setSubTab] = useState<'status' | 'quests' | 'collections' | 'ranking'>('quests');
  const [activeCategory, setActiveCategory] = useState<'chavoso' | 'miniaturas' | 'ostentacao'>('chavoso');

  // Compute passive stats from collections
  const ownedItemIds = player.retention?.ownedCollections || [];
  const passiveStats = getPassiveBonusMultipliers(ownedItemIds);

  const currentStreak = player.retention?.loginStreak ?? 1;
  const isDailyClaimedToday = player.retention?.claimedDailyToday ?? false;

  // Calculate box price dynamically based on level
  const baseBoxPrice = Math.max(15000, player.level * 10000);

  // Return style badge according to rarity
  const getRarityBadge = (rarity: string) => {
    switch (rarity) {
      case 'lendario':
        return 'bg-purple-500/10 text-purple-400 border border-purple-500/30 font-black';
      case 'raro':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/30';
      default:
        return 'bg-zinc-800 text-zinc-400 border border-zinc-700/50';
    }
  };

  return (
    <div className="space-y-6 font-sans text-white animate-fade-in relative z-20">
      
      {/* Sub Navigation Bar for Retention Deck */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-900 pb-4">
        <div>
          <h3 className="text-xl font-extrabold text-white uppercase tracking-tight font-display flex items-center gap-2">
            🏆 Central de Atividades & Temporada
          </h3>
          <p className="text-zinc-500 text-xs">
            Aumente sua retenção diária! Dispute rankings de faturamento, colete relíquias e reivindique prêmios acumulados.
          </p>
        </div>

        {/* Sub-nav Category switchers */}
        <div className="flex flex-wrap gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-900">
          <button
            onClick={() => { playSound('click'); setSubTab('quests'); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase font-orbitron tracking-wider flex items-center gap-1.5 cursor-pointer transition-all ${
              subTab === 'quests'
                ? 'bg-yellow-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" /> Desafios & Doação
          </button>
          
          <button
            onClick={() => { playSound('click'); setSubTab('collections'); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase font-orbitron tracking-wider flex items-center gap-1.5 cursor-pointer transition-all ${
              subTab === 'collections'
                ? 'bg-yellow-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
            }`}
          >
            <Gem className="h-3.5 w-3.5" /> Coleções Raras
          </button>

          <button
            onClick={() => { playSound('click'); setSubTab('ranking'); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase font-orbitron tracking-wider flex items-center gap-1.5 cursor-pointer transition-all ${
              subTab === 'ranking'
                ? 'bg-yellow-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
            }`}
          >
            <Trophy className="h-3.5 w-3.5" /> Classificação
          </button>

          <button
            onClick={() => { playSound('click'); setSubTab('status'); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase font-orbitron tracking-wider flex items-center gap-1.5 cursor-pointer transition-all ${
              subTab === 'status'
                ? 'bg-yellow-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
            }`}
          >
            <User className="h-3.5 w-3.5" /> Passaporte & Carreiras
          </button>
        </div>
      </div>

      {/* RENDER ACTIVE TAB */}
      <AnimatePresence mode="wait">
        
        {/* SUBTAB 1: QUESTS & CALENDAR */}
        {subTab === 'quests' && (
          <motion.div
            key="quests-container"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* ROW 1: 7-DAY LOGIN STREAK CALENDAR CALENDAR */}
            <div className="rounded-2xl border border-zinc-900 bg-zinc-950/40 p-5 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 sm:p-8 text-4xl sm:text-7xl opacity-[0.02] pointer-events-none font-bold font-orbitron select-none">
                LOGIN STREAK
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-900 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🎁</span>
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-tight">Calendário Escalonado de Login Diário</h4>
                    <p className="text-[10px] text-zinc-500">Conecte-se todos os dias consecutivos para ganhar bônus e peças de coleções raras!</p>
                  </div>
                </div>

                {isDailyClaimedToday ? (
                  <span className="px-3.5 py-1.5 rounded-lg bg-zinc-900 text-zinc-500 border border-zinc-800 text-xs font-bold flex items-center gap-1 font-orbitron">
                    <Check className="h-4 w-4 text-emerald-500" /> RESGATADO HOJE
                  </span>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClaimDaily}
                    className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 text-black hover:from-yellow-400 hover:to-amber-400 rounded-xl text-xs font-black uppercase font-orbitron shadow-lg shadow-yellow-500/10 cursor-pointer"
                  >
                    🎁 RESGATAR RECOMPENSA DO DIA {currentStreak}
                  </motion.button>
                )}
              </div>

              {/* 7 Day display units */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {DAILY_LOGIN_CALENDAR.map((d) => {
                  const isCurrent = d.day === currentStreak;
                  const isClaimed = d.day < currentStreak || (d.day === currentStreak && isDailyClaimedToday);
                  const isUpcoming = d.day > currentStreak;

                  return (
                    <div
                      key={d.day}
                      className={`relative flex flex-col justify-between p-3.5 rounded-xl border text-left transition-all ${
                        isCurrent && !isDailyClaimedToday
                          ? 'border-yellow-500 bg-yellow-500/5 shadow-md shadow-yellow-500/5 scale-[1.02]'
                          : isClaimed
                          ? 'border-zinc-900 bg-zinc-900/20 opacity-60'
                          : 'border-zinc-900 bg-zinc-950/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase font-orbitron text-zinc-500">
                          Dia {d.day}
                        </span>
                        {isClaimed && <Check className="h-3.5 w-3.5 text-green-400" />}
                        {isCurrent && !isDailyClaimedToday && (
                          <span className="h-2 w-2 rounded-full bg-yellow-500 animate-ping" />
                        )}
                      </div>

                      <div className="mt-4 space-y-1">
                        <strong className="text-sm font-black text-white block truncate">
                          R$ {d.rewardCash.toLocaleString('pt-BR')}
                        </strong>
                        <span className="text-[10px] text-zinc-400 block font-mono">
                          +{d.rewardXp} XP
                        </span>
                      </div>

                      {/* Display underlying rare drops on day 4 & 7 */}
                      {d.itemRewardId && (
                        <div className="mt-2.5 pt-2 border-t border-zinc-800 text-[10px] text-amber-500 font-bold flex items-center gap-1">
                          <span>📦 Relíquia</span>
                        </div>
                      )}

                      {isCurrent && !isDailyClaimedToday && (
                        <div className="absolute inset-x-0 bottom-0 h-1 bg-yellow-500 animate-pulse" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ROW 2: DAILY & WEEKLY QUESTS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              
              {/* Daily Quests column (7 Cols) */}
              <div className="lg:col-span-7 rounded-2xl border border-zinc-900 bg-zinc-950/40 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🎯</span>
                    <div>
                      <h4 className="text-sm font-black text-white uppercase tracking-tight">Missões Ativas Hoje</h4>
                      <p className="text-[10px] text-zinc-500">Realize suas tarefas de rotina civil para lucrar comissões rápidas.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {player.retention?.dailyQuests?.map((q) => {
                    const pct = Math.min(100, Math.floor((q.currentCount / q.targetCount) * 100));
                    return (
                      <div
                        key={q.id}
                        className={`p-3.5 rounded-xl border border-zinc-900 bg-zinc-950/50 flex items-center justify-between gap-4 transition-all ${
                          q.claimed ? 'opacity-40 filter grayscale' : ''
                        }`}
                      >
                        <div className="space-y-2 flex-grow">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-bold text-zinc-200">{q.description}</span>
                            <span className="text-[10px] font-mono text-zinc-500 whitespace-nowrap">
                              {q.currentCount} / {q.targetCount}
                            </span>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-yellow-500 to-amber-500 transition-all duration-300"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          
                          <div className="flex items-center gap-3 text-[10px] font-mono font-bold text-green-400">
                            <span>💰 R$ {q.rewardCash.toLocaleString('pt-BR')}</span>
                            <span className="text-zinc-500">|</span>
                            <span className="text-zinc-400">⭐ +{q.rewardXp} XP</span>
                          </div>
                        </div>

                        {/* Claim action button representation */}
                        <div>
                          {q.claimed ? (
                            <span className="px-3 py-1 rounded bg-zinc-900 text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none block whitespace-nowrap">
                              RECEBIDO
                            </span>
                          ) : q.completed ? (
                            <button
                              onClick={() => { playSound('click'); onClaimQuest(q.id); }}
                              className="px-3.5 py-1.5 bg-green-500 hover:bg-green-400 text-black text-[10px] font-black uppercase font-orbitron tracking-wider rounded-lg shadow-md cursor-pointer block whitespace-nowrap"
                            >
                              🎁 RESGATAR
                            </button>
                          ) : (
                            <span className="px-3 py-1.5 bg-zinc-900/60 border border-zinc-800 text-zinc-650 text-[10px] font-bold uppercase block leading-none whitespace-nowrap">
                              EM PROGRESSO
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {(!player.retention?.dailyQuests || player.retention.dailyQuests.length === 0) && (
                    <div className="text-center py-6 text-zinc-600 text-xs">
                      Nenhuma missão diária gerada ainda. Volte amanhã!
                    </div>
                  )}
                </div>
              </div>

              {/* Weekly Objectives & Event Boosters column (5 Cols) */}
              <div className="lg:col-span-5 space-y-4">
                
                {/* Weekly Goal board */}
                <div className="rounded-2xl border border-zinc-900 bg-zinc-950/40 p-5 space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-zinc-450 border-b border-zinc-900 pb-2 flex items-center gap-1.5 font-orbitron">
                    <Trophy className="h-4 w-4 text-amber-500" /> Objetivos Semanais
                  </h4>

                  <div className="space-y-3">
                    {player.retention?.weeklyObjectives?.map((w) => {
                      const pct = Math.min(100, Math.floor((w.currentCount / w.targetCount) * 100));
                      return (
                        <div
                          key={w.id}
                          className={`p-3 rounded-lg border border-zinc-900/80 bg-zinc-950/30 space-y-1.5 transition ${
                            w.claimed ? 'opacity-40' : ''
                          }`}
                        >
                          <span className="text-[11px] font-medium text-zinc-300 leading-snug block">
                            {w.description}
                          </span>

                          <div className="flex items-center justify-between text-[9px] font-mono text-zinc-500">
                            <span>Sua marca: {w.currentCount.toLocaleString('pt-BR')} / {w.targetCount.toLocaleString('pt-BR')}</span>
                            <span>{pct}%</span>
                          </div>

                          <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-500 transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] text-zinc-400 font-mono">
                              Prêmio: <strong className="text-green-400">R$ {w.rewardCash.toLocaleString('pt-BR')}</strong>
                            </span>

                            {w.claimed ? (
                              <span className="text-[9px] font-bold text-zinc-500 uppercase">COLETADO ✓</span>
                            ) : w.completed ? (
                              <button
                                onClick={() => { playSound('click'); onClaimWeekly(w.id); }}
                                className="px-2.5 py-1 bg-indigo-500 hover:bg-indigo-400 text-white rounded text-[9px] font-black uppercase cursor-pointer"
                              >
                                RESGATAR
                              </button>
                            ) : (
                              <span className="text-[9px] text-zinc-650 uppercase font-mono">Trancado</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Eventos Especiais & Boosters */}
                <div className="rounded-2xl border border-zinc-900 bg-zinc-950/40 p-5 space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 shrink-0 text-yellow-500 text-3xl opacity-10 font-bold">
                    ⚡
                  </div>
                  
                  <h4 className="text-xs font-black uppercase tracking-widest text-zinc-450 border-b border-zinc-900 pb-2 flex items-center gap-1.5 font-orbitron">
                    <Sparkles className="h-4 w-4 text-yellow-500" /> Eventos & Ativações Especiais
                  </h4>

                  <p className="text-[10px] text-zinc-400 leading-normal">
                    Selecione e ative um estimulante de reputação temporário hoje. Adiciona super bônus civis por tempo limitado!
                  </p>

                  <div className="space-y-3 pt-1">
                    {activeBoosterType ? (
                      <div className="p-3.5 rounded-xl border border-yellow-500/20 bg-yellow-500/[0.03] text-center space-y-1">
                        <span className="text-yellow-500 font-black font-orbitron text-xs block uppercase animate-pulse">
                          🔥 BOOSTER ATIVO: {activeBoosterType === 'double_salary' ? 'SALÁRIO DUPLO' : activeBoosterType === 'free_energy' ? 'ENERGIA EXTRA' : 'CRIME DE ELITE'}
                        </span>
                        <span className="text-zinc-400 font-mono text-xs block">
                          Termina em <strong className="text-white font-black">{Math.floor(boosterTimeRemaining / 60)}m {boosterTimeRemaining % 60}s</strong>
                        </span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-2">
                        <button
                          onClick={() => { playSound('click'); onTriggerBooster('double_salary'); }}
                          className="flex items-center justify-between p-3 rounded-xl border border-zinc-900 bg-zinc-950/80 hover:border-yellow-500/30 hover:bg-zinc-900 transition-all text-left cursor-pointer"
                        >
                          <div>
                            <strong className="text-xs font-black block text-yellow-500">💸 Happy Hour Salarial</strong>
                            <span className="text-[9px] text-zinc-500 block">Dobra todos o pagamento de bicos civis por 3 minutos.</span>
                          </div>
                          <ArrowUpRight className="h-4 w-4 text-zinc-700 shrink-0" />
                        </button>

                        <button
                          onClick={() => { playSound('click'); onTriggerBooster('free_energy'); }}
                          className="flex items-center justify-between p-3 rounded-xl border border-zinc-900 bg-zinc-950/80 hover:border-yellow-500/30 hover:bg-zinc-900 transition-all text-left cursor-pointer"
                        >
                          <div>
                            <strong className="text-xs font-black block text-emerald-450 text-emerald-400">⚡ Adrenalina Pura</strong>
                            <span className="text-[9px] text-zinc-500 block">Recarrega +100 EP e reduz fadiga de trabalhos em 50% por 3 minutos.</span>
                          </div>
                          <ArrowUpRight className="h-4 w-4 text-zinc-700 shrink-0" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          </motion.div>
        )}

        {/* SUBTAB 2: RARE COLLECTIONS Shelf shelf */}
        {subTab === 'collections' && (
          <motion.div
            key="collections-container"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Collector statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-xl border border-zinc-900 bg-zinc-950/60 p-4 font-mono text-left">
                <span className="text-[10px] text-zinc-500 uppercase font-sans font-bold block">Relíquias Adquiridas</span>
                <strong className="text-amber-500 text-xl font-orbitron">{ownedItemIds.length} / {RARE_COLLECTIBLES.length}</strong>
              </div>
              <div className="rounded-xl border border-zinc-900 bg-zinc-950/60 p-4 font-mono text-left">
                <span className="text-[10px] text-zinc-500 uppercase font-sans font-bold block">Multiplicador de Empresa</span>
                <strong className="text-indigo-400 text-xl font-orbitron">+{Math.round((passiveStats.passiveIncomeMultiplier - 1) * 100)}% Passivo</strong>
              </div>
              <div className="rounded-xl border border-zinc-900 bg-zinc-950/60 p-4 font-mono text-left">
                <span className="text-[10px] text-zinc-500 uppercase font-sans font-bold block">Consumo de Trabalho</span>
                <strong className="text-emerald-400 text-xl font-orbitron">-{passiveStats.energyCostReduction}% Fadiga</strong>
              </div>
              <div className="rounded-xl border border-zinc-900 bg-zinc-950/60 p-4 font-mono text-left">
                <span className="text-[10px] text-zinc-500 uppercase font-sans font-bold block">Bônus de Bico Braçal</span>
                <strong className="text-yellow-400 text-xl font-orbitron">+{Math.round((passiveStats.salaryMultiplier - 1) * 100)}% Ganhos</strong>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Left shelves (8 Cols) */}
              <div className="md:col-span-8 rounded-2xl border border-zinc-900 bg-zinc-950/40 p-5 space-y-6">
                
                {/* Category switch filter */}
                <div className="flex border-b border-zinc-900">
                  <button
                    onClick={() => { playSound('click'); setActiveCategory('chavoso'); }}
                    className={`pb-3 text-[10px] sm:text-xs whitespace-nowrap font-bold uppercase font-orbitron tracking-wider px-2 sm:px-4 border-b-2 transition ${
                      activeCategory === 'chavoso'
                        ? 'border-yellow-500 text-yellow-500'
                        : 'border-transparent text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    🕶️ Coleção Kit Chavoso
                  </button>
                  <button
                    onClick={() => { playSound('click'); setActiveCategory('miniaturas'); }}
                    className={`pb-3 text-[10px] sm:text-xs whitespace-nowrap font-bold uppercase font-orbitron tracking-wider px-2 sm:px-4 border-b-2 transition ${
                      activeCategory === 'miniaturas'
                        ? 'border-yellow-500 text-yellow-500'
                        : 'border-transparent text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    🚗 Coleção Miniaturas do Rio
                  </button>
                  <button
                    onClick={() => { playSound('click'); setActiveCategory('ostentacao'); }}
                    className={`pb-3 text-[10px] sm:text-xs whitespace-nowrap font-bold uppercase font-orbitron tracking-wider px-2 sm:px-4 border-b-2 transition ${
                      activeCategory === 'ostentacao'
                        ? 'border-yellow-500 text-yellow-500'
                        : 'border-transparent text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    👑 Coleção Ostentação Pura
                  </button>
                </div>

                {/* Items display shelf */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {RARE_COLLECTIBLES.filter(c => c.category === activeCategory).map(item => {
                    const isOwned = ownedItemIds.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        className={`p-4 rounded-xl border flex flex-col justify-between text-left transition-all ${
                          isOwned
                            ? 'border-zinc-800 bg-zinc-900/60 shadow-lg'
                            : 'border-zinc-950 bg-zinc-950/20 opacity-30 select-none'
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-3xl select-none">{item.icon}</span>
                            <span className={`px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-orbitron ${getRarityBadge(item.rarity)}`}>
                              {item.rarity}
                            </span>
                          </div>

                          <div>
                            <strong className="text-xs font-black text-white block mb-0.5">{item.name}</strong>
                            <p className="text-[10px] text-zinc-500 leading-normal">{item.description}</p>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-zinc-800/80 bg-zinc-950/20 p-2 rounded text-[9px] font-mono leading-normal text-amber-500 font-bold">
                          {isOwned ? (
                            <>
                              <span className="text-zinc-500 uppercase block text-[8px] mb-0.5 tracking-wider">EFEITO CIVIL ATIVO:</span>
                              {item.passiveBonusDesc}
                            </>
                          ) : (
                            <span className="text-zinc-600 block text-center">🔐 ITEM BLOQUEADO</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-4 bg-zinc-900/40 rounded-xl border border-zinc-900 text-xs leading-normal text-zinc-400 flex items-start gap-2">
                  <span className="text-yellow-500 shrink-0">💡</span>
                  <span>Colecionáveis são salvos de forma persistente. Complete qualquer trabalho braçal com excelência ou realize delitos no submundo para ter chance de encontrar estes itens secretamente de graça! Alternativamente, use a Caixa Suprema no painel ao lado.</span>
                </div>
              </div>

              {/* Mystery Box Gacha simulator (4 Cols) */}
              <div className="md:col-span-4 rounded-2xl border border-zinc-900 bg-zinc-950/40 p-5 space-y-4 text-center flex flex-col justify-between relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(#1c1c1f_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />
                
                <div className="space-y-2">
                  <span className="inline-block px-2.5 py-0.5 text-[9px] font-black tracking-widest text-purple-400 border border-purple-500/20 rounded-md bg-purple-500/10 font-orbitron animate-pulse">
                    GACHA CIVIL
                  </span>
                  <h4 className="text-sm font-black text-white uppercase tracking-tight">Caixa Suprema de Relíquias</h4>
                  <p className="text-[10px] text-zinc-500 max-w-xs mx-auto leading-normal">
                    Gaste seu capital acumulado de magnata para tentar extrair uma das relíquias raras do servidor.
                  </p>
                </div>

                {/* Chest visual animation */}
                <div className="py-6 flex flex-col items-center justify-center relative">
                  <motion.div 
                    animate={{ rotate: [0, -3, 3, -3, 0] }}
                    transition={{ repeat: Infinity, duration: 4, repeatDelay: 1 }}
                    className="text-7xl drop-shadow-[0_0_20px_rgba(168,85,247,0.25)] select-none"
                  >
                    📦
                  </motion.div>
                  <span className="text-[11px] text-purple-400 font-mono font-bold tracking-tight block mt-3">
                    35% Chance de Peça Inédita
                  </span>
                  <span className="text-[9px] text-zinc-500 font-sans block leading-none mt-1">
                    Atendimento preferencial instantâneo
                  </span>
                </div>

                <div className="space-y-3 pt-3 border-t border-zinc-900/80">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-zinc-500">Preço Unitário:</span>
                    <strong className="text-emerald-400 font-bold">R$ {baseBoxPrice.toLocaleString('pt-BR')}</strong>
                  </div>

                  <button
                    onClick={() => {
                      if (player.cash < baseBoxPrice) {
                        playSound('error');
                        alert('Dinheiro insuficiente para comprar a Caixa Suprema de Relíquias!');
                        return;
                      }
                      onBuyMysteryBox(baseBoxPrice);
                    }}
                    className="w-full py-3.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 text-white rounded-xl text-xs font-black uppercase font-orbitron tracking-widest hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-500/10 cursor-pointer transition active:scale-[0.98]"
                  >
                    COMPRAR E GIRAR ➔
                  </button>
                </div>

              </div>

            </div>
          </motion.div>
        )}

        {/* SUBTAB 3: RANKING & ACHIEVEMENTS */}
        {subTab === 'ranking' && (
          <motion.div
            key="ranking-container"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-5"
          >
            {/* Leaderboard panel (6 Cols) */}
            <div className="lg:col-span-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 p-5 space-y-4">
              <div className="border-b border-zinc-900 pb-2">
                <h4 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
                  ⚔️ RANKING DE FATURAMENTO DA METRÓPOLE
                </h4>
                <p className="text-[10px] text-zinc-500">Aguardando sincronização com banco de dados global. Exibindo apenas status local no modo offline.</p>
              </div>

              {/* Leaderboard list table */}
              <div className="space-y-1.5 overflow-hidden rounded-xl border border-zinc-900 max-h-[460px] overflow-y-auto">
                {leaderboard.map((u) => {
                  return (
                    <div
                      key={u.name}
                      className={`flex items-center justify-between px-3.5 py-3 transition ${
                        u.isPlayer
                          ? 'bg-yellow-500/10 border-y border-yellow-500/20'
                          : 'bg-zinc-950/50 hover:bg-zinc-900/30'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        {/* Position numbers */}
                        <span className={`w-6 text-center font-orbitron font-extrabold text-xs leading-none ${
                          u.rank === 1 ? 'text-yellow-405 text-yellow-400 font-black text-sm' : u.rank === 2 ? 'text-zinc-300' : u.rank === 3 ? 'text-amber-600' : 'text-zinc-600'
                        }`}>
                          {u.rank === 1 ? '🥇' : u.rank === 2 ? '🥈' : u.rank === 3 ? '🥉' : `#${u.rank}`}
                        </span>

                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xs font-bold ${u.isPlayer ? 'text-yellow-400 font-extrabold' : 'text-white'}`}>
                              {u.name}
                            </span>
                            {u.vip && (
                              <span className="px-1.5 py-0.2 select-none shrink-0 text-[7px] font-black uppercase rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-orbitron leading-none">
                                VIP {u.vip}
                              </span>
                            )}
                          </div>
                          <span className="text-[9px] text-zinc-500 font-sans block mt-0.5">{u.statusText}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-emerald-400 text-xs font-mono font-bold">
                          R$ {u.cashEarned.toLocaleString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Achievements column (6 Cols) */}
            <div className="lg:col-span-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 p-5 space-y-4">
              <div className="border-b border-zinc-900 pb-2">
                <h4 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
                  🏆 CONQUISTAS ESCRITURADAS CIVIS
                </h4>
                <p className="text-[10px] text-zinc-500">Consiga insígnias policiais e realizações financeiras para resgatar títulos de integridade.</p>
              </div>

              {/* Achievements scroll board */}
              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {ACHIEVEMENTS_LIST.map(ach => {
                  const isUnlocked = player.retention?.unlockedAchievements?.includes(ach.id) || false;
                  return (
                    <div
                      key={ach.id}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-left transition-all ${
                        isUnlocked
                          ? 'border-zinc-800 bg-zinc-900/40'
                          : 'border-zinc-950 bg-zinc-950/20 opacity-40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xl shadow-inner select-none">
                          {ach.icon}
                        </div>
                        <div>
                          <span className={`text-xs font-bold block ${isUnlocked ? 'text-white' : 'text-zinc-400'}`}>
                            {ach.name}
                          </span>
                          <span className="text-[10px] text-zinc-500 leading-normal block mt-0.5">
                            {ach.description}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {isUnlocked ? (
                          <div className="flex flex-col items-end gap-1 font-mono text-[9px] font-bold text-green-400 text-right leading-none">
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[8px] uppercase tracking-wider font-orbitron">COMPLETO ✓</span>
                            <span>+R$ {ach.rewardCash.toLocaleString('pt-BR')}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-[9px] text-zinc-600 uppercase font-mono">
                            <Lock className="h-3 w-3 inline shrink-0" /> Trancado
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* SUBTAB 4: STATUS & ORIGINAL CAREERS (Backward compatible) */}
        {subTab === 'status' && (
          <motion.div
            key="status-container"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Operational summary stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-xl border border-zinc-900 bg-zinc-950/60 p-4 font-mono text-left">
                <span className="text-[10px] text-zinc-500 uppercase font-sans font-bold block">Tudo que Faturou</span>
                <strong className="text-emerald-400 text-base md:text-lg">R$ {player.stats.totalEarned.toLocaleString('pt-BR')}</strong>
              </div>
              
              <div className="rounded-xl border border-zinc-900 bg-zinc-950/60 p-4 font-mono text-left">
                <span className="text-[10px] text-zinc-500 uppercase font-sans font-bold block">Bens Adquiridos</span>
                <strong className="text-zinc-350 text-zinc-300 text-base md:text-lg">R$ {player.stats.totalSpent.toLocaleString('pt-BR')}</strong>
              </div>

              <div className="rounded-xl border border-zinc-900 bg-zinc-950/60 p-4 font-mono text-left">
                <span className="text-[10px] text-zinc-500 uppercase font-sans font-bold block">Passaporte Nível</span>
                <strong className="text-yellow-400 text-base md:text-lg">Nível {player.level}</strong>
              </div>

              <div className="rounded-xl border border-zinc-900 bg-zinc-950/60 p-4 font-mono text-left font-sans">
                <span className="text-[10px] text-zinc-500 uppercase font-sans font-bold block leading-none mb-1">Status Civil</span>
                <span className="px-2 py-0.5 bg-green-500/10 text-emerald-450 border border-green-500/20 rounded text-[10px] font-bold text-emerald-400 tracking-wider">ATIVO NO RIO</span>
              </div>
            </div>

            {/* Careers Evolutionary Panel */}
            <div className="rounded-2xl border border-zinc-900 bg-zinc-950/40 p-5 space-y-4">
              <div>
                <h4 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
                  🌟 SISTEMA DE EVOLUÇÃO DE CARREIRA
                </h4>
                <p className="text-[10px] text-zinc-500">Evolua profissionalmente em cada bico civil para galgar novos bônus (+15% salário por degrau de carreira!).</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.keys(CAREER_TITLES).map(id => {
                  const currentCareer = (player.careers && player.careers[id]) || { level: 1, xp: 0 };
                  const careerXpNeeded = currentCareer.level * 30 + 20;
                  const progressPercent = Math.min(100, (currentCareer.xp / careerXpNeeded) * 100);
                  
                  const roleTitleList = CAREER_TITLES[id] || ["Trabalhador Dedicado"];
                  const careerTitle = roleTitleList[Math.min(roleTitleList.length - 1, currentCareer.level - 1)];

                  return (
                    <div key={id} className="p-3.5 rounded-xl border border-zinc-900 bg-zinc-950/50 space-y-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <strong className="text-xs font-bold text-white uppercase tracking-wide block">
                            {id === 'delivery_job' ? '🚴 Delivery de Bike' : 
                             id === 'app_driver_job' ? '🚗 Motorista de Uber' :
                             id === 'mechanic_job' ? '🔧 Mecânico de Oficina' : 
                             id === 'taxi_job' ? '🚖 Táxi Amarelo' :
                             id === 'police_job' ? '👮 Polícia Militar' : 
                             id === 'trucker_job' ? '🚚 Motorista de Caminhão' :
                             '🩺 Socorrista SAMU'}
                          </strong>
                          <span className="text-[10px] text-green-400 font-bold block">{careerTitle}</span>
                        </div>

                        <div className="text-right">
                          <span className="text-[9px] bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded text-zinc-300 font-black">
                            LEVEL {currentCareer.level}
                          </span>
                          <span className="text-[9px] text-zinc-500 font-mono block mt-0.5">+{((currentCareer.level - 1) * 15)}% Bônus</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[8px] font-mono text-zinc-500">
                          <span>Competência Técnica</span>
                          <span>{currentCareer.xp} / {careerXpNeeded} XP</span>
                        </div>
                        <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-300"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Miscellaneous detailed stats & Reset Character */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-zinc-900 bg-zinc-950/60 p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-900 pb-2">Cidadania Operacional</h4>
                <ul className="space-y-1.5 text-xs text-zinc-300 font-mono">
                  <li className="flex justify-between">
                    <span className="text-zinc-500">🚴 Entregas Realizadas:</span>
                    <strong>{player.stats.deliveriesCompleted}</strong>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-zinc-500">🚗 Passageiros do Uber:</span>
                    <strong>{player.stats.ridesCompleted}</strong>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-zinc-500">🔧 Motores AP Consertados:</span>
                    <strong>{player.stats.mechanicJobsCompleted || 0}</strong>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-zinc-500">👮 Patrulhas da Recruta:</span>
                    <strong>{player.stats.policeJobsCompleted || 0}</strong>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-zinc-500">🩺 Resgates SAMU Efetuados:</span>
                    <strong>{player.stats.doctorJobsCompleted || 0}</strong>
                  </li>
                </ul>
              </div>

              {/* Danger Zone */}
              <div className="rounded-xl border border-red-500/10 bg-red-500/[0.01] p-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider">Seção Administrativa</h4>
                  <p className="text-[10px] text-zinc-500 leading-normal">
                    Se deseja migrar para outro estado civil ou começar sua vida de imigrante dócil do zero, clique no botão para estornar todo o seu progresso da metrópole. É irreversível.
                  </p>
                </div>

                <button
                  onClick={onWipeSave}
                  className="w-full mt-4 py-2.5 bg-red-950/40 text-red-400 hover:bg-red-900/60 hover:text-white border border-red-500/20 hover:border-red-500 rounded text-xs font-extrabold uppercase font-orbitron tracking-widest cursor-pointer flex items-center justify-center gap-1"
                >
                  <Trash2 className="h-4 w-4" /> Resetar Personagem Completo
                </button>
              </div>

            </div>
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}
