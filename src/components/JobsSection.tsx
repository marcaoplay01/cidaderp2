import { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Lock, 
  MapPin, 
  CheckCircle,
  Play,
  TrendingUp,
  AlertCircle,
  Truck,
  IdCard,
  Zap,
  ArrowRight,
  Wrench,
  Shield,
  Heart,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { PlayerState, JOBS, VEHICLES, Job, EconomyEvent } from '../types';
import { playSound } from '../utils/audio';

interface JobsSectionProps {
  player: PlayerState;
  activeEvent?: EconomyEvent | null;
  onCompleteJob: (
    job: Job, 
    rewardMultiplier: number,
    onResult: (res: {
      baseCash: number;
      vehicleBonusCash: number;
      bonusCash: number;
      totalCash: number;
      isBonusTriggered: boolean;
      newCareerLevel: number;
      newCareerXp: number;
      careerLeveledUp: boolean;
      careerXpNeeded: number;
    }) => void
  ) => void;
}

// Direction keys for the GPS Minigame
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
const DIRECTIONS: { [key in Direction]: string } = {
  UP: '▲',
  DOWN: '▼',
  LEFT: '◀',
  RIGHT: '▶',
};

export default function JobsSection({ player, activeEvent, onCompleteJob }: JobsSectionProps) {
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [gameActive, setGameActive] = useState(false);
  const [gpsSequence, setGpsSequence] = useState<Direction[]>([]);
  const [playerInputIndex, setPlayerInputIndex] = useState(0);
  const [gameMessage, setGameMessage] = useState('');
  const [timerLeft, setTimerLeft] = useState(15);
  const [deliveryFinished, setDeliveryFinished] = useState(false);
  const [earnedSummary, setEarnedSummary] = useState<{
    baseCash: number;
    vehicleBonusCash: number;
    bonusCash: number;
    totalCash: number;
    isBonusTriggered: boolean;
    newCareerLevel: number;
    newCareerXp: number;
    careerLeveledUp: boolean;
    careerXpNeeded: number;
  } | null>(null);

  // Check if player has the vehicle required
  const hasRequiredVehicle = (job: Job) => {
    if (!job.requiredVehicleId) return true;
    return player.ownedVehicles.includes(job.requiredVehicleId);
  };

  // Check license required
  const hasRequiredLicense = (job: Job) => {
    if (job.requiredLicense === 'none') return true;
    if (job.requiredLicense === 'driver') return player.hasDriversLicense;
    if (job.requiredLicense === 'truck') return player.hasTruckLicense;
    return false;
  };

  // Get current multiplier based on owned vehicles/car in garage
  const getSpeedMultiplier = () => {
    // If player has a current selected vehicle, use its multiplier
    if (player.currentVehicleId) {
      const activeVehicle = VEHICLES.find(v => v.id === player.currentVehicleId);
      return activeVehicle ? activeVehicle.multiplier : 1.0;
    }
    return 1.0;
  };

  // Generate a random GPS direction sequence
  const generateGpsSequence = (length: number) => {
    const keys: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
    const newSeq: Direction[] = [];
    for (let i = 0; i < length; i++) {
      const randKey = keys[Math.floor(Math.random() * keys.length)];
      newSeq.push(randKey);
    }
    return newSeq;
  };

  // Start the GPS route minigame
  const handleStartJob = (job: Job) => {
    let requiredEnergy = job.energyCost;
    const usesVehicle = job.requiredVehicleId || job.id === 'app_driver_job' || job.id === 'taxi_job' || job.id === 'trucker_job' || job.id === 'doctor_job' || job.id === 'police_job';
    const isGasAffected = usesVehicle && player.currentVehicleId && player.currentVehicleId !== 'bike_delivery';
    if (activeEvent?.id === 'aumento_combustivel' && isGasAffected) {
      requiredEnergy += 5;
    }

    if (player.energy < requiredEnergy) {
      playSound('error');
      alert(`Você está cansado demais para este trabalho! Compre um salgado na lanchonete ou deite para descansar.`);
      return;
    }

    playSound('click');
    setActiveJob(job);
    setGameActive(true);
    setPlayerInputIndex(0);
    setDeliveryFinished(false);
    setEarnedSummary(null);

    // Dynamic sequence size based on job tier difficulty
    let seqLength = 4;
    if (job.id === 'app_driver_job') seqLength = 5;
    if (job.id === 'mechanic_job') seqLength = 6;
    if (job.id === 'taxi_job') seqLength = 7;
    if (job.id === 'police_job') seqLength = 8;
    if (job.id === 'trucker_job') seqLength = 9;
    if (job.id === 'doctor_job') seqLength = 10;

    const secondsAvailable = job.executionTime || 12;

    setGpsSequence(generateGpsSequence(seqLength));
    setTimerLeft(secondsAvailable);

    // Dynamic instruction prompt
    let instructions = 'Siga as instruções do painel de navegação GPS rápido!';
    if (job.id === 'mechanic_job') instructions = 'Utilize as ferramentas corretas para consertar o motor AP!';
    if (job.id === 'police_job') instructions = 'Siga as direções no painel de rádio para capturar o suspeito!';
    if (job.id === 'doctor_job') instructions = 'Siga o sinal do desfibrilador no ritmo correto para reanimar!';

    setGameMessage(instructions);
  };

  // Game timer ticking down
  useEffect(() => {
    if (!gameActive || deliveryFinished) return;

    if (timerLeft <= 0) {
      playSound('error');
      setGameActive(false);
      setGameMessage('Tempo esgotado! Você se perdeu nas ruas ou falhou na execução.');
      return;
    }

    const timer = setTimeout(() => {
      setTimerLeft(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timerLeft, gameActive, deliveryFinished]);

  // Handle GPS direction press
  const handleDirectionPress = (dir: Direction) => {
    if (!gameActive || deliveryFinished) return;

    const expected = gpsSequence[playerInputIndex];
    if (dir === expected) {
      playSound('work');
      const nextIndex = playerInputIndex + 1;
      setPlayerInputIndex(nextIndex);

      if (nextIndex >= gpsSequence.length) {
        // Route complete! Successfully delivered!
        handleJobSuccess();
      }
    } else {
      // Mistake penalty
      playSound('error');
      setGameMessage('Errou o comando! Recalculando mecânica/rota (+1 seg de penalidade)...');
      setTimerLeft(prev => Math.max(1, prev - 1));
    }
  };

  // Keyboard support for ease of playing (Arrow keys and WASD!)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameActive || deliveryFinished) return;
      
      let keyDir: Direction | null = null;
      if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') keyDir = 'UP';
      if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') keyDir = 'DOWN';
      if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') keyDir = 'LEFT';
      if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') keyDir = 'RIGHT';

      if (keyDir) {
        e.preventDefault();
        handleDirectionPress(keyDir);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameActive, deliveryFinished, playerInputIndex, gpsSequence]);

  // Successfully finished job
  const handleJobSuccess = () => {
    if (!activeJob) return;
    setDeliveryFinished(true);

    const mult = getSpeedMultiplier();
    
    onCompleteJob(activeJob, mult, (res) => {
      setEarnedSummary(res);
    });
    
    playSound('cash');
  };

  return (
    <div id="jobs-section-container" className="w-full space-y-6">

      {/* ACTIVE EVENT SYSTEM NOTIFICATION */}
      {activeEvent && (
        <div id="jobs-active-event-alert" className={`p-4 rounded-xl border flex items-center gap-4 ${
          activeEvent.id === 'crise_economica' ? 'bg-red-950/40 border-red-900/50 text-red-300' :
          activeEvent.id === 'greve_caminhoneiros' ? 'bg-amber-950/40 border-amber-900/50 text-amber-300' :
          activeEvent.id === 'aumento_combustivel' ? 'bg-orange-950/40 border-orange-900/50 text-orange-300' :
          activeEvent.id === 'operacao_policial' ? 'bg-blue-950/40 border-blue-900/50 text-blue-300' :
          'bg-emerald-950/40 border-emerald-900/50 text-emerald-300'
        } text-xs leading-relaxed shadow-lg`}>
          <div className="h-6 w-6 flex-shrink-0 text-xl font-bold animate-bounce flex items-center justify-center">
            {activeEvent.id === 'crise_economica' ? '📉' :
             activeEvent.id === 'greve_caminhoneiros' ? '🚛' :
             activeEvent.id === 'aumento_combustivel' ? '⛽' :
             activeEvent.id === 'operacao_policial' ? '👮‍♂️' : '🍀'}
          </div>
          <div className="space-y-1">
            <div className="font-extrabold uppercase tracking-wide flex items-center gap-2">
              <span>{activeEvent.name}</span>
              <span className="bg-red-500/20 text-red-400 text-[10px] px-1.5 py-0.5 rounded font-mono animate-pulse">SETOR ATIVO</span>
            </div>
            <div className="text-zinc-300">{activeEvent.description}</div>
            <div className="font-bold text-zinc-100">{activeEvent.effectsDescription}</div>
          </div>
        </div>
      )}
      
      {/* Background/Current job status */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950/40 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-ping" />
          <span className="text-xs text-zinc-400">Garagem Ativa: </span>
          <span className="text-sm font-mono font-bold text-green-400">
            {player.currentVehicleId ? VEHICLES.find(v => v.id === player.currentVehicleId)?.name : 'Nenhum veículo ativo'}
          </span>
        </div>
        <div className="text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1 flex items-center gap-2">
          <span>Bônus Geral do Veículo:</span>
          <strong className="text-yellow-400 font-mono font-bold">+{Math.round((getSpeedMultiplier() - 1) * 100)}%</strong>
        </div>
      </div>

      {gameActive && activeJob ? (
        /* ACTIVE GPS GPS GAME INTERFACE */
        <div id="gps-minigame-box" className="p-6 rounded-2xl border-2 border-emerald-500/30 bg-zinc-950/90 shadow-2xl shadow-emerald-500/10 space-y-6 relative overflow-hidden animate-fade-in">
          
          <div className="absolute top-0 right-0 p-4 font-mono text-xl text-yellow-400 tracking-wider font-extrabold flex items-center gap-2 bg-zinc-900/60 rounded-bl-xl border-l border-b border-zinc-800">
            ⏱️ {timerLeft}s
          </div>

          <div>
            <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full text-emerald-400 font-bold uppercase tracking-widest">
              Trabalho Ativo • {activeJob.name}
            </span>
            <h3 className="text-xl font-black text-white uppercase tracking-tight mt-2 flex items-center gap-2">
              🧭 CMD / NAVEGAÇÃO DA CIDADE
            </h3>
          </div>

          {!deliveryFinished ? (
            <div className="space-y-6 py-4">
              {/* Route Sequence indicators */}
              <div className="flex flex-col items-center justify-center space-y-3 py-6 bg-zinc-900/50 border border-zinc-800/80 rounded-xl relative">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest text-[11px]">
                  Pressione usando <strong className="text-white">WASD</strong>, <strong className="text-white">Setas</strong> ou clique nos botões:
                </span>
                
                <div id="gps-sequence-steps" className="flex items-center gap-2 md:gap-3">
                  {gpsSequence.map((dir, idx) => {
                    const isPassed = idx < playerInputIndex;
                    const isActive = idx === playerInputIndex;
                    return (
                      <div
                        key={idx}
                        className={`h-9 w-9 sm:h-11 sm:w-11 md:h-14 md:w-14 shrink-0 rounded-lg flex items-center justify-center font-bold text-lg sm:text-xl md:text-2xl transition-all border duration-200 ${
                          isPassed 
                            ? 'bg-green-500 border-green-400 text-black shadow-lg shadow-green-500/20 font-mono' 
                            : isActive 
                            ? 'bg-amber-500 border-amber-400 text-white animate-pulse font-mono'
                            : 'bg-zinc-800 border-zinc-700 text-zinc-500 font-mono'
                        }`}
                      >
                        {DIRECTIONS[dir]}
                      </div>
                    );
                  })}
                </div>

                <div className="text-xs font-mono font-medium text-emerald-300 animate-pulse mt-3 text-center px-4">
                  {gameMessage}
                </div>
              </div>

              {/* Mobile and PC interactive buttons on screen */}
              <div>
                <div className="flex flex-col items-center gap-2">
                  <button
                    id="gps-key-up"
                    onClick={() => handleDirectionPress('UP')}
                    className="h-10 w-14 sm:h-12 sm:w-16 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 hover:border-zinc-500 text-white rounded-lg flex items-center justify-center font-bold text-xl active:bg-green-500 active:text-black active:border-green-400 transition-all font-mono shadow-md shadow-black"
                  >
                    ▲
                  </button>
                  <div className="flex gap-3">
                    <button
                      id="gps-key-left"
                      onClick={() => handleDirectionPress('LEFT')}
                      className="h-10 w-14 sm:h-12 sm:w-16 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 hover:border-zinc-500 text-white rounded-lg flex items-center justify-center font-bold text-xl active:bg-green-500 active:text-black active:border-green-400 transition-all font-mono shadow-md shadow-black"
                    >
                      ◀
                    </button>
                    <button
                      id="gps-key-down"
                      onClick={() => handleDirectionPress('DOWN')}
                      className="h-10 w-14 sm:h-12 sm:w-16 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 hover:border-zinc-500 text-white rounded-lg flex items-center justify-center font-bold text-xl active:bg-green-500 active:text-black active:border-green-400 transition-all font-mono shadow-md shadow-black"
                    >
                      ▼
                    </button>
                    <button
                      id="gps-key-right"
                      onClick={() => handleDirectionPress('RIGHT')}
                      className="h-10 w-14 sm:h-12 sm:w-16 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 hover:border-zinc-500 text-white rounded-lg flex items-center justify-center font-bold text-xl active:bg-green-500 active:text-black active:border-green-400 transition-all font-mono shadow-md shadow-black"
                    >
                      ▶
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2 mt-2 border-t border-zinc-900">
                <button
                  id="btn-abort-gps"
                  onClick={() => {
                    playSound('click');
                    setGameActive(false);
                    setActiveJob(null);
                  }}
                  className="bg-red-950/50 hover:bg-red-900 border border-red-500/20 text-red-400 rounded-md py-2 px-4 text-xs font-semibold"
                >
                  Cancelar Entrega
                </button>
              </div>
            </div>
          ) : (
            /* CONGRATS PANEL WITH RICH DETAILS */
            <div id="job-congrats-panel" className="text-center py-6 space-y-6 max-w-lg mx-auto">
              <div className="flex h-16 w-16 items-center justify-center bg-green-500/10 text-green-400 text-4xl rounded-full border border-green-500/30 mx-auto animate-bounce">
                🎉
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase bg-emerald-400/10 border border-emerald-400/20 px-3 py-1 rounded-full">
                  Faturamento de Plantão
                </span>
                <h4 className="text-xl font-extrabold text-white tracking-tight uppercase mt-2">
                  TRABALHO COMPLETADO COM SUCESSO!
                </h4>
                <p className="text-zinc-500 text-xs mt-1">Ganhos liquidados no tesouro de cidadania do RP.</p>
              </div>

              {/* Advanced Breakdowns */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3 text-xs text-zinc-300 font-mono">
                <div className="flex justify-between items-center bg-zinc-950/30 px-3 py-2 rounded">
                  <span className="text-zinc-400 font-sans">💵 Salário Base + Carreira</span>
                  <strong className="text-zinc-100 text-sm">R$ {earnedSummary?.baseCash}</strong>
                </div>

                {earnedSummary && earnedSummary.vehicleBonusCash > 0 && (
                  <div className="flex justify-between items-center bg-zinc-950/30 px-3 py-2 rounded">
                    <span className="text-zinc-400 font-sans">🔑 Bônus de Garagem (Veículo)</span>
                    <strong className="text-yellow-400 font-bold">+ R$ {earnedSummary.vehicleBonusCash}</strong>
                  </div>
                )}

                {/* Random bonus feedback */}
                <div className="flex justify-between items-center bg-zinc-950/30 px-3 py-2 rounded border border-green-500/10">
                  <span className="text-zinc-400 font-sans flex items-center gap-1">
                    🎲 Sorte de Bônus Aleatório
                  </span>
                  {earnedSummary?.isBonusTriggered ? (
                    <strong className="text-emerald-400 font-extrabold animate-pulse uppercase">
                      DOBRO ATIVADO! (+ R$ {earnedSummary.bonusCash})
                    </strong>
                  ) : (
                    <span className="text-zinc-500 font-sans">Nenhum acionado nesta corrida</span>
                  )}
                </div>

                <div className="flex justify-between items-center bg-emerald-500/[0.05] border border-emerald-500/20 px-3 py-2.5 rounded-lg text-sm text-white">
                  <span className="font-bold flex items-center gap-1 text-emerald-400">
                    💰 TOTAL DE GANHOS DO DIA
                  </span>
                  <strong className="text-lg text-emerald-300 font-black">
                    R$ {earnedSummary?.totalCash}
                  </strong>
                </div>

                {earnedSummary?.ammoDropped ? (
                  <div className="flex justify-between items-center bg-orange-500/[0.1] border border-orange-500/30 px-3 py-2.5 rounded-lg text-sm text-white mt-2">
                    <span className="font-bold flex items-center gap-1 text-orange-400">
                      📦 MUNIÇÃO FABRICADA
                    </span>
                    <strong className="text-lg text-orange-300 font-black">
                      +{earnedSummary.ammoDropped}
                    </strong>
                  </div>
                ) : null}

                {/* Career Level progress feedback */}
                <div className="bg-zinc-950/70 border border-zinc-900 p-3 rounded-lg text-left space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-zinc-400 uppercase font-bold font-sans">
                      Carreira de {activeJob.name}
                    </span>
                    <span className="text-[10px] text-yellow-400 font-bold">
                      Nível {earnedSummary?.newCareerLevel}
                    </span>
                  </div>
                  <div>
                    <div className="flex justify-between text-[9px] text-zinc-500 mb-0.5">
                      <span>Progresso da Carreira (+10 Career XP)</span>
                      <span>
                        {earnedSummary?.newCareerXp} / {earnedSummary?.careerXpNeeded} XP
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-300"
                        style={{ width: `${Math.min(100, ((earnedSummary?.newCareerXp || 0) / (earnedSummary?.careerXpNeeded || 50)) * 100)}%` }}
                      />
                    </div>
                  </div>
                  {earnedSummary?.careerLeveledUp && (
                    <p className="text-[10px] text-yellow-400 font-bold text-center animate-bounce pt-1">
                      🌟 PROMOÇÃO! Subiu de nível profissional na carreira! Ganhos permanentemente expandidos!
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 justify-center">
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-center font-mono">
                  <span className="text-[9px] text-zinc-500 uppercase block font-sans">XP de Cidadão</span>
                  <strong className="text-yellow-400">+{earnedSummary?.xpGained} XP</strong>
                </div>
              </div>

              <button
                id="btn-return-jobs-list"
                onClick={() => {
                  playSound('click');
                  setGameActive(false);
                  setActiveJob(null);
                }}
                className="w-full bg-emerald-500 font-bold hover:bg-emerald-400 hover:scale-[1.01] text-black rounded-lg py-3.5 transition-all active:scale-[0.98] shadow-lg shadow-emerald-500/20 font-sans uppercase text-xs tracking-wider"
              >
                Voltar ao Painel da Agência de Empregos
              </button>
            </div>
          )}
        </div>
      ) : (
        /* JOBS LIST PANEL CONTEXT */
        <div id="jobs-list" className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in text-sans">
          {JOBS.map(job => {
            const levelLocked = player.level < job.levelRequired;
            const targetVehicle = VEHICLES.find(v => v.id === job.requiredVehicleId);
            const needsVehicle = job.requiredVehicleId && !player.ownedVehicles.includes(job.requiredVehicleId);
            const needsLicense = job.requiredLicense !== 'none' && 
              ((job.requiredLicense === 'driver' && !player.hasDriversLicense) ||
               (job.requiredLicense === 'truck' && !player.hasTruckLicense));

            const isLocked = levelLocked || needsVehicle || needsLicense;

            // Compute current Career Level & multipliers
            const currentCareer = (player.careers && player.careers[job.id]) || { level: 1, xp: 0 };
            const careerBonusPct = (currentCareer.level - 1) * 15;
            let baseSalaryCalculated = Math.floor(job.baseReward * (1.0 + careerBonusPct / 100));

            // EVENT MODIFIERS IN RENDERING PREVIEW:
            let displayEnergyCost = job.energyCost;
            let displayEffectNotice = '';
            
            if (activeEvent) {
              if (activeEvent.id === 'crise_economica') {
                baseSalaryCalculated = Math.floor(baseSalaryCalculated * 0.7); // -30%
                displayEffectNotice = '📉 -30% Crise';
              } else if (activeEvent.id === 'greve_caminhoneiros') {
                if (job.id === 'trucker_job') {
                  baseSalaryCalculated = Math.floor(baseSalaryCalculated * 2.0); // +100%
                  displayEffectNotice = '🚛 +100% Greve';
                } else {
                  baseSalaryCalculated = Math.floor(baseSalaryCalculated * 0.6); // -40%
                  displayEffectNotice = '📉 -40% Escassez';
                }
              } else if (activeEvent.id === 'aumento_combustivel') {
                const usesVehicle = job.requiredVehicleId || job.id === 'app_driver_job' || job.id === 'taxi_job' || job.id === 'trucker_job' || job.id === 'doctor_job' || job.id === 'police_job';
                const isGasAffected = usesVehicle && player.currentVehicleId && player.currentVehicleId !== 'bike_delivery';
                if (isGasAffected) {
                  baseSalaryCalculated = Math.floor(baseSalaryCalculated * 0.8); // -20% fuel cost
                  displayEnergyCost += 5; // +5 fuel fatigue
                  displayEffectNotice = '⛽ Gasto Combustível & +5 Fadiga';
                }
              } else if (activeEvent.id === 'operacao_policial') {
                if (job.id === 'police_job') {
                  baseSalaryCalculated = Math.floor(baseSalaryCalculated * 2.0); // +100% Overtime
                  displayEffectNotice = '👮‍♂️ +100% Overtime Op.';
                }
              }
            }

            return (
              <div 
                key={job.id} 
                className={`relative rounded-2xl border bg-zinc-950/60 p-5 flex flex-col justify-between transition-all duration-300 ${
                  isLocked 
                    ? 'border-zinc-900 bg-zinc-950/10' 
                    : 'border-zinc-800 hover:border-emerald-500/30 hover:bg-zinc-900/40 hover:shadow-xl hover:shadow-black'
                }`}
              >
                
                {/* Advanced Job Header */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-11 w-11 rounded-xl flex items-center justify-center text-xl ${
                        isLocked ? 'bg-zinc-900 text-zinc-600' : 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20'
                      }`}>
                        {job.id === 'delivery_job' && '🚴'}
                        {job.id === 'app_driver_job' && '🚗'}
                        {job.id === 'mechanic_job' && '🔧'}
                        {job.id === 'taxi_job' && '🚖'}
                        {job.id === 'police_job' && '👮'}
                        {job.id === 'trucker_job' && '🚚'}
                        {job.id === 'doctor_job' && '🩺'}
                      </div>
                      <div>
                        <h4 className="text-base font-extrabold text-white tracking-tight flex items-center gap-1.5 leading-none mb-1">
                          {job.name}
                        </h4>
                        <span className="text-[10px] text-zinc-500 font-mono block">
                          Requisitos: LVL {job.levelRequired} • {job.requiredLicense === 'none' ? 'Sem CNH' : job.requiredLicense === 'driver' ? 'CNH B' : 'CNH E'}
                        </span>
                      </div>
                    </div>
                    {isLocked ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full uppercase scale-95 shrink-0">
                        <Lock className="h-3 w-3" /> Bloqueado
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full scale-95 shrink-0">
                        Nível de Carreira {currentCareer.level}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed min-h-[36px]">
                    {job.description}
                  </p>

                  {/* Career specific salary benefits */}
                  {!isLocked && (
                    <div className="flex items-center justify-between text-[11px] bg-zinc-900/60 p-2 rounded-lg border border-zinc-900 font-mono">
                      <span className="text-zinc-500">Profissionalização de Carreira:</span>
                      <strong className="text-emerald-400 text-right">
                        {careerBonusPct > 0 ? `+${careerBonusPct}% Salário (Promoção)` : 'Iniciante (Salário Base)'}
                      </strong>
                    </div>
                  )}

                  {/* Rewards Row (Salary, Duration, XP, Bônus) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 py-2.5 border-t border-b border-zinc-900 text-xs font-mono">
                    <div>
                      <span className="text-[9px] text-zinc-500 font-sans block leading-none mb-1">Salário Estimado</span>
                      <strong className="text-emerald-400 font-bold block">R$ {baseSalaryCalculated}
                        {displayEffectNotice && <span className="block text-[8px] text-orange-400 opacity-90 font-normal leading-tight mt-0.5">{displayEffectNotice}</span>}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-zinc-500 font-sans block leading-none mb-1">Execução (GPS)</span>
                      <strong className="text-sky-400 flex items-center gap-0.5 font-mono">{job.executionTime}s</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-zinc-500 font-sans block leading-none mb-1">Experiência</span>
                      <strong className="text-yellow-400">+{job.xpReward} XP</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-zinc-500 font-sans block leading-none mb-1">Sorte de Bônus</span>
                      <strong className="text-amber-500 text-right">{job.bonusChance + (currentCareer.level - 1) * 2}% Chance</strong>
                    </div>
                  </div>
                </div>

                {/* Job footer / Locker requirements */}
                <div className="mt-5 pt-3 border-t border-zinc-900 flex flex-col gap-2 justify-end">
                  {isLocked ? (
                    <div className="bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800 text-xs space-y-1 text-zinc-400">
                      <p className="font-bold flex items-center gap-1.5 text-red-400 uppercase text-[10px]">
                        <AlertCircle className="h-3.5 w-3.5" /> Requisitos Faltantes:
                      </p>
                      <ul className="list-disc list-inside space-y-0.5 pl-1 font-mono text-[11px]">
                        {levelLocked && <li>Alcançar Nível Geral {job.levelRequired}</li>}
                        {needsLicense && (
                          <li>Adquirir {job.requiredLicense === 'driver' ? 'Habilitação CNH B' : 'Habilitação CNH E'} na Lanchonete</li>
                        )}
                        {needsVehicle && targetVehicle && (
                          <li>Adquirir veículo {targetVehicle.name} na Concessionária</li>
                        )}
                      </ul>
                    </div>
                  ) : (
                    <button
                      id={`btn-start-${job.id}`}
                      onClick={() => handleStartJob(job)}
                      className="w-full bg-emerald-500 cursor-pointer font-bold text-black py-2.5 rounded-xl hover:bg-emerald-400 transition-all flex flex-col items-center justify-center gap-0.5 shadow-lg shadow-emerald-500/5 hover:shadow-emerald-500/10 active:scale-[0.98] text-xs uppercase tracking-wide font-sans md:py-3"
                    >
                      <span className="flex items-center gap-1"><Play className="h-3 w-3 fill-black shrink-0" /> Iniciar Serviços da Profissão</span>
                      <span className="text-[9px] opacity-75 font-mono font-bold">Consumo: {displayEnergyCost} EP (Fadiga)</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
