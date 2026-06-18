import React, { useState, useEffect } from 'react';
import { PlayerState, VEHICLES, BUSINESSES, PROPERTIES, EconomyEvent } from '../types';
import { playSound } from '../utils/audio';
import { 
  Skull, 
  ShieldAlert, 
  TrendingUp, 
  TrendingDown, 
  Flame, 
  Coins, 
  Clock, 
  Fingerprint, 
  Check, 
  X, 
  AlertOctagon, 
  Info, 
  Building2, 
  Briefcase, 
  DollarSign, 
  UserX,
  PlusSquare,
  HelpCircle,
  Truck,
  Car
} from 'lucide-react';

interface CrimeSectionProps {
  player: PlayerState;
  activeEvent?: EconomyEvent | null;
  onCommitCrimeSuccess: (dirtyCashEarned: number, repEarned: number, energyCost: number, logMessage: string) => void;
  onCommitCrimeFailure: (finePaid: number, jailDurationSeconds: number, repLost: number, energyCost: number, logMessage: string) => void;
  onLaunderMoney: (dirtyAmount: number, cleanAmountReceived: number, feePaid: number, isSeized: boolean, logMessage: string) => void;
}

interface CriminalActivity {
  id: string;
  name: string;
  category: 'furtivo' | 'violento' | 'logistica';
  levelRequired: number;
  energyCost: number;
  baseSuccessChance: number;
  reputationGain: number;
  minReward: number;
  maxReward: number;
  fine: number;
  jailTime: number;
  description: string;
  emoji: string;
  requiresDriversLicense?: boolean;
  requiresTruckLicense?: boolean;
}

export const CRIMINAL_ACTIVITIES: CriminalActivity[] = [
  {
    id: 'furto_celular',
    name: 'Furto de Celular / Carteira',
    category: 'furtivo',
    levelRequired: 1,
    energyCost: 15,
    baseSuccessChance: 85,
    reputationGain: 1,
    minReward: 320,
    maxReward: 780,
    fine: 250,
    jailTime: 6,
    description: 'Furtar aparelhos eletrônicos e relógios de turistas no calçadão esburacado de Copacabana de forma sorrateira.',
    emoji: '📱'
  },
  {
    id: 'trafico_esquinas',
    name: 'Tráfico em Escurecido de Beco',
    category: 'furtivo',
    levelRequired: 3,
    energyCost: 25,
    baseSuccessChance: 70,
    reputationGain: 3,
    minReward: 1600,
    maxReward: 3350,
    fine: 1200,
    jailTime: 12,
    description: 'Venda de pacotes fechados e bagulhos ilegais para viciados e baladeiros noturnos nas esquinas e ruelas sombrias da Lapa.',
    emoji: '🌿'
  },
  {
    id: 'racha_rua',
    name: 'Racha de Rua na Rodovia Ayrton Senna',
    category: 'violento',
    levelRequired: 4,
    energyCost: 35,
    baseSuccessChance: 60,
    reputationGain: 8,
    minReward: 3200,
    maxReward: 6400,
    fine: 2200,
    jailTime: 15,
    description: 'Aposte corridas clandestinas de alta velocidade contra superesportivos e motos modificadas na rodovia principal.',
    emoji: '🏁',
    requiresDriversLicense: true
  },
  {
    id: 'roubo_loja_conveniencias',
    name: 'Assalto a Loja de Conveniência',
    category: 'violento',
    levelRequired: 5,
    energyCost: 40,
    baseSuccessChance: 55,
    reputationGain: 7,
    minReward: 4800,
    maxReward: 9500,
    fine: 3500,
    jailTime: 18,
    description: 'Grite com a balconista, estoure a registradora e limpe todo o caixa confidencial de uma loja de posto na Autoestrada às 03:00 da manhã.',
    emoji: '🏪'
  },
  {
    id: 'roubo_veiculo_desmanche',
    name: 'Roubo de Veículos de Patrão',
    category: 'violento',
    levelRequired: 7,
    energyCost: 55,
    baseSuccessChance: 45,
    reputationGain: 14,
    minReward: 12000,
    maxReward: 25000,
    fine: 7500,
    jailTime: 25,
    description: 'Copie a chave codificada, intercepte as travas e leve SUVs de luxo importadas direto para o desmanche na Baixada Fluminense.',
    emoji: '🏎️',
    requiresDriversLicense: true
  },
  {
    id: 'trafico_armamento_pesado',
    name: 'Escoamento de Carga e Armas',
    category: 'logistica',
    levelRequired: 10,
    energyCost: 75,
    baseSuccessChance: 35,
    reputationGain: 30,
    minReward: 42000,
    maxReward: 85000,
    fine: 18000,
    jailTime: 35,
    description: 'Opere rotas de logística de ferro carregando armamentos pesados e mercadorias valiosas direto para o centro do complexo.',
    emoji: '🚚',
    requiresTruckLicense: true
  }
];

export default function CrimeSection({
  player,
  activeEvent,
  onCommitCrimeSuccess,
  onCommitCrimeFailure,
  onLaunderMoney
}: CrimeSectionProps) {
  // Tabs within Shady Panel
  const [activeTab, setActiveTab] = useState<'crime' | 'laundering' | 'history'>('crime');
  
  // States
  const [selectedLaunderMethod, setSelectedLaunderMethod] = useState<'dealer' | 'business'>('dealer');
  const [selectedBusinessLaunderId, setSelectedBusinessLaunderId] = useState<string>('lava_jato');
  const [launderAmountInput, setLaunderAmountInput] = useState<string>('');
  
  // Animation/Alert feedback
  const [crimeResult, setCrimeResult] = useState<{
    id: string;
    success: boolean;
    reward: number;
    repGain: number;
    finePaid: number;
    jailDuration: number;
    activityName: string;
    description: string;
  } | null>(null);

  // Local crime statistics logs
  const [crimeLog, setCrimeLog] = useState<{
    time: string;
    text: string;
    type: 'success' | 'failure' | 'laundering';
    cashDiff: string;
  }[]>([]);

  const addLog = (text: string, type: 'success' | 'failure' | 'laundering', cashDiff: string) => {
    const time = new Date().toLocaleTimeString('pt-BR');
    setCrimeLog(prev => [{ time, text, type, cashDiff }, ...prev].slice(0, 50));
  };

  const reputation = player.criminalReputation || 0;
  const dirtyCash = player.dirtyCash || 0;

  // Multiplier formulas:
  // 1. Reputation reward bonus (each point of rep increases illegal payouts by +1%, up to +100%)
  const repRewardMultiplier = 1 + (reputation * 0.0125); // +1.25% per rep point
  
  // 2. Reputation alert deduction (each point of rep decreases success chance by -0.12%, capped at max -15% reduction)
  const repSuccessDeduction = Math.min(18, reputation * 0.12);

  // Check if player has a fast vehicle to dodge police (+10% escape / success chance bonus)
  const hasEscapeVehicleBonus = player.ownedVehicles.some(vid => {
    const carDetails = VEHICLES.find(v => v.id === vid);
    return carDetails && (carDetails.type === 'sport' || carDetails.speed >= 190);
  });

  const getSlippedSuccessChance = (activity: CriminalActivity) => {
    let chance = activity.baseSuccessChance;
    
    // Deduct due to reputation focus
    chance -= repSuccessDeduction;

    // Fast vehicle escape boost
    if (hasEscapeVehicleBonus) {
      chance += 10;
    }

    // Level factor bonus
    const levelAdvantage = Math.min(15, (player.level - activity.levelRequired) * 1.5);
    chance += levelAdvantage;

    // EVENT MODIFIERS
    if (activeEvent?.id === 'operacao_policial') {
      chance -= 20; // -20% absolute penalty during police lockdown
    }
    if (activeEvent?.id === 'corridas_ilegais' && activity.id === 'racha_rua') {
      chance += 15; // +15% bypass help during Illegal racing
    }

    return Math.max(10, Math.min(95, Math.floor(chance)));
  };

  // COMMIT CRIME EXECUTION
  const handleCommitCrime = (act: CriminalActivity) => {
    if (player.energy < act.energyCost) {
      playSound('error');
      alert(`Você não tem energia suficiente para essa ação! Vá até os imóveis para dormir ou lanchar na lanchonete.`);
      return;
    }

    if (player.level < act.levelRequired) {
      playSound('error');
      alert(`Operação muito complexa para o seu level! Requer Nível ${act.levelRequired}.`);
      return;
    }

    if (act.requiresDriversLicense && !player.hasDriversLicense) {
      playSound('error');
      alert(`Você precisa de CNH de Carro emitida no Detran para conduzir veículo ilegal nessa fuga!`);
      return;
    }

    if (act.requiresTruckLicense && !player.hasTruckLicense) {
      playSound('error');
      alert(`Você precisa de CNH de Caminhão (tipo E) emitida no Detran para pilotar essa carga contrabandista!`);
      return;
    }

    // Determine success or fail
    const finalChance = getSlippedSuccessChance(act);
    const rolledValue = Math.random() * 100;
    const isSuccessful = rolledValue <= finalChance;

    if (isSuccessful) {
      // SUCCESS PATTERN
      let baseValue = Math.floor(act.minReward + Math.random() * (act.maxReward - act.minReward));
      
      // EVENT MODIFIER: double payouts for illegal racing on racha_rua
      if (activeEvent?.id === 'corridas_ilegais' && act.id === 'racha_rua') {
        baseValue *= 2;
      }
      
      const multipliedReward = Math.floor(baseValue * repRewardMultiplier);
      const repIncrement = act.reputationGain;

      // Execute dispatch state in App
      const logMessage = `Sucesso na atividade "${act.name}": Faturou R$ ${multipliedReward.toLocaleString('pt-BR')} (Sujo).`;
      onCommitCrimeSuccess(multipliedReward, repIncrement, act.energyCost, logMessage);

      // State record for display banner
      setCrimeResult({
        id: act.id,
        success: true,
        reward: multipliedReward,
        repGain: repIncrement,
        finePaid: 0,
        jailDuration: 0,
        activityName: act.name,
        description: `Você executou com maestria. Despistou a viatura usando ruelas de terra e recolheu os malotes de notas!`
      });

      addLog(`Subtração concluída em: ${act.name}`, 'success', `+ R$ ${multipliedReward.toLocaleString('pt-BR')} (Sujo)`);
      playSound('cash');
    } else {
      // ARREST / BUST PATTERN
      const penaltyFine = act.fine;
      let prisonSeconds = act.jailTime;
      
      // EVENT MODIFIER: double jail time during police lockdown
      if (activeEvent?.id === 'operacao_policial') {
        prisonSeconds *= 2;
      }
      
      const repLoss = Math.min(reputation, Math.max(1, Math.floor(act.reputationGain / 2)));

      const logMessage = `Fracassou na atividade "${act.name}": Preso em fragrante, multado em R$ ${penaltyFine.toLocaleString('pt-BR')}.`;
      onCommitCrimeFailure(penaltyFine, prisonSeconds, repLoss, act.energyCost, logMessage);

      // State record for display banner
      setCrimeResult({
        id: act.id,
        success: false,
        reward: 0,
        repGain: 0,
        finePaid: penaltyFine,
        jailDuration: prisonSeconds,
        activityName: act.name,
        description: `POLÍCIA! A radiopatrulha fechou o cerco eletrônico. Você foi imobilizado, recebeu multas pesadas e foi encaminhado à Prisão do Estado!`
      });

      addLog(`Cercado pela PM no ato de: ${act.name}`, 'failure', `- R$ ${penaltyFine.toLocaleString('pt-BR')} (Mina)`);
      playSound('error');
    }
  };

  // RETRIEVE LAUNDERING FEE & MAX INFO
  const getLaunderMethodStats = () => {
    if (selectedLaunderMethod === 'dealer') {
      return {
        name: 'Doleiro Corrupto da Favela (Beco)',
        feePercent: 40,
        maxLimit: 15000,
        seizeChance: 12,
        unlocked: true,
        desc: 'Negociação na calada da noite com doleiros de facção. Sem exigências de empresas, mas cobram taxas agressivas e há risco de fiscalização policial.'
      };
    }

    // Business launder metrics
    const ownedBusinessesIds = Object.keys(player.ownedBusinesses);
    const hasAnyBusiness = ownedBusinessesIds.length > 0;

    if (!hasAnyBusiness) {
      return {
        name: 'Lavagem Corporativa',
        feePercent: 0,
        maxLimit: 0,
        seizeChance: 0,
        unlocked: false,
        desc: 'Você não possui escrituras comerciais jurídicas ainda para fantasiar recibos! Compre lava-jatos ou postos de combustíveis na aba Empresas.'
      };
    }

    // Deduce fee/limit depending on selected business id
    // Lava Jato, Oficina, Mercado, Posto, Transportadora, Concessionária
    let fee = 25;
    let limit = 10000;
    
    switch (selectedBusinessLaunderId) {
      case 'lava_jato':
        fee = 25;
        limit = 12000;
        break;
      case 'oficina':
        fee = 20;
        limit = 35000;
        break;
      case 'mercado_bairro':
        fee = 15;
        limit = 120000;
        break;
      case 'posto_combustivel':
        fee = 10;
        limit = 350000;
        break;
      case 'transportadora':
        fee = 5;
        limit = 1000000;
        break;
      case 'concessionaria':
        fee = 0;
        limit = 10000000; // unlimited basically
        break;
    }

    const bDetails = BUSINESSES.find(item => item.id === selectedBusinessLaunderId);
    const isOwned = ownedBusinessesIds.includes(selectedBusinessLaunderId);

    return {
      name: `Caixa Paralelo S.A. (${bDetails?.name || 'Empresa'})`,
      feePercent: fee,
      maxLimit: limit,
      seizeChance: 0, // perfect safety through corporate tax evasion!
      unlocked: isOwned,
      desc: isOwned 
        ? `Misture o dinheiro sujo no faturamento bruto do seu estabelecimento do(a) ${bDetails?.name}. 100% de sigilo auditivo, sem fiscalização da Receita!`
        : `Você ainda não arrematou o contrato do(a) "${bDetails?.name}". Compre este negócio para desbloquear taxas de lavagem reduzidas!`
    };
  };

  const launderStats = getLaunderMethodStats();

  const handleLaunderExecution = () => {
    const amountToLaunder = parseFloat(launderAmountInput);
    if (!amountToLaunder || isNaN(amountToLaunder) || amountToLaunder <= 0) {
      playSound('error');
      alert('Digite uma quantia válida de dinheiro ilegal para processar.');
      return;
    }

    if (amountToLaunder > dirtyCash) {
      playSound('error');
      alert(`Você não tem esse volume de dinheiro sujo na maleta! Máximo disponível: R$ ${dirtyCash.toFixed(2)}`);
      return;
    }

    if (amountToLaunder > launderStats.maxLimit) {
      playSound('error');
      alert(`Quantidade excede o limite máximo para este canal de lavagem! Canto atual aceita até R$ ${launderStats.maxLimit.toLocaleString('pt-BR')}`);
      return;
    }

    if (selectedLaunderMethod === 'business' && !launderStats.unlocked) {
      playSound('error');
      alert(`Você precisa possuir a escritura de "${BUSINESSES.find(item => item.id === selectedBusinessLaunderId)?.name}" para usar esse canal!`);
      return;
    }

    // Laundering transaction processing
    const isIntercepted = selectedLaunderMethod === 'dealer' && (Math.random() * 100 < launderStats.seizeChance);

    if (isIntercepted) {
      // Busted during grey-market launder
      const penaltyFine = Math.floor(amountToLaunder * 0.35); // 35% fine of requested amount
      const logMsg = `Fiscalização policial interceptou doleiro! R$ ${amountToLaunder.toLocaleString('pt-BR')} confiscados, multa de R$ ${penaltyFine.toLocaleString('pt-BR')} cobrada.`;
      
      onLaunderMoney(amountToLaunder, 0, 0, true, logMsg);

      addLog(`Remessa interceptada pelo fisco federal`, 'failure', `- R$ ${amountToLaunder.toLocaleString('pt-BR')} (Sujo Confiscado)`);
      playSound('error');
      alert(`OPERACAO BUSTED! A Polícia Civil e os cães farejadores de divisas estouraram a remessa secreta do Doleiro. Você perdeu todo o dinheiro levado à mesa e foi multado em R$ ${penaltyFine.toLocaleString('pt-BR')}!`);
    } else {
      // Laundering successful!
      const feePaid = Math.floor(amountToLaunder * (launderStats.feePercent / 100));
      const cleanCashReceived = amountToLaunder - feePaid;
      
      const logMsg = `Limpou R$ ${amountToLaunder.toLocaleString('pt-BR')} em notas marcadas. Recebeu R$ ${cleanCashReceived.toLocaleString('pt-BR')} na conta após comissão de ${launderStats.feePercent}%.`;
      onLaunderMoney(amountToLaunder, cleanCashReceived, feePaid, false, logMsg);

      addLog(`Lote processado e branqueado`, 'laundering', `+ R$ ${cleanCashReceived.toLocaleString('pt-BR')} (Saldo Limpo)`);
      playSound('cash');
      alert(`É O SUCESSO DO CRIME! R$ ${amountToLaunder.toLocaleString('pt-BR')} foram misturados, processados e convertidos. R$ ${cleanCashReceived.toLocaleString('pt-BR')} em notas frias limpas entraram direto no seu saldo corporativo de patrão!`);
    }

    setLaunderAmountInput('');
  };

  const ownedBusinessesWithLevel = Object.keys(player.ownedBusinesses).map(bid => BUSINESSES.find(item => item.id === bid));

  return (
    <div id="crime-section-wrapper" className="w-full space-y-6 font-sans">
      
      {/* Crime Header Title */}
      <div id="crime-banner-billboard" className="rounded-2xl border border-red-950 bg-zinc-950/90 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl shadow-red-950/5 relative overflow-hidden">
        {/* Glow behind */}
        <div className="absolute -left-10 bottom-0 h-40 w-40 bg-red-600/10 rounded-full blur-2xl pointer-events-none" />

        <div className="space-y-1 relative z-10">
          <span className="text-[10px] bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-full text-red-500 font-bold uppercase tracking-widest leading-none flex items-center gap-1.5 w-fit">
            <Flame className="h-3 w-3 text-red-500 animate-pulse" /> Atividades Ilicitas & Corrupção de RP
          </span>
          <h3 className="text-xl font-extrabold text-white uppercase tracking-tight mt-2 font-display flex items-center gap-2">
            <Skull className="h-5 w-5 text-red-500" /> Sistema de Submundo Ilegal
          </h3>
          <p className="text-zinc-500 text-xs">
            Assuma o risco em grandes operações ilegais para formar fortunas de dinheiro sujo extremamente rápido. Mas fique atento: se falhar, multas pesadas e punições em cela te esperam!
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0 font-mono text-center md:text-right relative z-10">
          <div className="bg-red-950/20 border border-red-900/20 px-4 py-3 rounded-xl">
            <span className="text-[9px] text-red-400 block font-sans uppercase">Dinheiro Sujo na Mala</span>
            <strong className="text-xl font-black text-red-400 drop-shadow-[0_2px_10px_rgba(239,68,68,0.25)]">
              R$ {dirtyCash.toLocaleString('pt-BR')}
            </strong>
          </div>

          <div className="bg-zinc-900 border border-zinc-850 px-4 py-3 rounded-xl">
            <span className="text-[9px] text-zinc-400 block font-sans uppercase">Reputação de Facção</span>
            <strong className="text-xl font-extrabold text-yellow-500">
              {reputation} pontos
            </strong>
          </div>
        </div>
      </div>

      {/* ACTIVE EVENT SUBMUNDO NOTIFICATION */}
      {activeEvent && (activeEvent.id === 'operacao_policial' || activeEvent.id === 'corridas_ilegais') && (
        <div id="crime-active-event-alert" className={`p-4 rounded-xl border flex items-center gap-4 ${
          activeEvent.id === 'operacao_policial' 
            ? 'bg-blue-950/40 border-blue-900/50 text-blue-300' 
            : 'bg-purple-950/40 border-purple-900/50 text-purple-300'
        } text-xs leading-relaxed shadow-lg`}>
          <ShieldAlert className={`h-6 w-6 flex-shrink-0 animate-bounce ${
            activeEvent.id === 'operacao_policial' ? 'text-blue-400' : 'text-purple-400'
          }`} />
          <div className="space-y-1">
            <div className="font-extrabold uppercase tracking-wide flex items-center gap-1">
              <span>{activeEvent.id === 'operacao_policial' ? '🔵' : '🟣'} {activeEvent.name}</span>
              <span className="bg-red-500/20 text-red-400 text-[10px] px-1.5 py-0.5 rounded font-mono animate-pulse">CLIMA ATIVO</span>
            </div>
            <div className="text-zinc-300">{activeEvent.description}</div>
            <div className={`font-bold ${
              activeEvent.id === 'operacao_policial' ? 'text-blue-300' : 'text-purple-300'
            }`}>{activeEvent.effectsDescription}</div>
          </div>
        </div>
      )}

      {/* Crime Reputation Warning and mechanics explanation */}
      <div className="rounded-xl border border-zinc-900 bg-zinc-950/60 p-4 leading-relaxed text-xs text-zinc-400 flex items-start gap-3">
        <Info className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
        <div>
          <h5 className="font-bold text-zinc-300">Regras de Equilíbrio Criminal:</h5>
          <p className="text-zinc-500 text-[11px] mt-1">
            Cada ponto de sua <strong className="text-yellow-500">Reputação</strong> escoa melhor as mercadorias ilegais, dando um bônus multiplicador de <strong className="text-red-400">+{reputation * 1.25}% de lucro extra</strong> em crimes. Entretanto, sua reputação aciona os radares da polícia civil municipal, o que reduz sua chance de sucesso geral em <strong className="text-yellow-600">-{repSuccessDeduction.toFixed(2)}%</strong>. 
            {hasEscapeVehicleBonus ? (
              <span className="text-emerald-400 font-bold ml-1">🚙 Você tem um veículo veloz na garagem: bônus de escape de +10% de sucesso aplicado!</span>
            ) : (
              <span className="text-zinc-500 font-normal ml-1"> Compre uma moto esportiva ou carro turbo para ganhar +10% de chance de escapar do flagrante.</span>
            )}
          </p>
        </div>
      </div>

      {/* Tabs navigation menu for criminology subpanels */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-zinc-900 pb-4">
        <div className="flex bg-zinc-950 p-1 rounded-xl gap-2 w-full sm:w-auto border border-zinc-900 overflow-x-auto whitespace-nowrap [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <button
            id="tab-crime-ops"
            onClick={() => {
              playSound('click');
              setActiveTab('crime');
            }}
            className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-lg text-xs font-bold leading-none tracking-wider uppercase transition-all duration-300 ${
              activeTab === 'crime'
                ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-500/10'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            🔫 Operações de Beco ({CRIMINAL_ACTIVITIES.length})
          </button>
          <button
            id="tab-money-laundering"
            onClick={() => {
              playSound('click');
              setActiveTab('laundering');
            }}
            className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-lg text-xs font-bold leading-none tracking-wider uppercase transition-all duration-300 relative ${
              activeTab === 'laundering'
                ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-500/10'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            💧 Branqueamento / Lavadora
            {dirtyCash > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-4 min-w-4 flex items-center justify-center bg-red-600 text-white text-[9px] font-black font-mono rounded-full px-1 border border-zinc-950 animate-bounce">
                $
              </span>
            )}
          </button>
          <button
            id="tab-history-logs"
            onClick={() => {
              playSound('click');
              setActiveTab('history');
            }}
            className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-lg text-xs font-bold leading-none tracking-wider uppercase transition-all duration-300 ${
              activeTab === 'history'
                ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-500/10'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            📋 Registro de Ocorrências
          </button>
        </div>
      </div>

      {/* RENDER DETAILED SELECTED SUBPANEL */}
      {activeTab === 'crime' && (
        /* CRIMINAL ACTIONS DIRECTORY */
        <div id="subpanel-crime-activities" className="grid grid-cols-1 gap-6">
          {CRIMINAL_ACTIVITIES.map(act => {
            const isLockedByLevel = player.level < act.levelRequired;
            const isLockedByLicense = act.requiresDriversLicense && !player.hasDriversLicense;
            const isLockedByTruckLic = act.requiresTruckLicense && !player.hasTruckLicense;

            const finalSuccessRate = getSlippedSuccessChance(act);
            const canAffordEnergy = player.energy >= act.energyCost;

            const isLocked = isLockedByLevel || isLockedByLicense || isLockedByTruckLic;

            // Project estimated rewards with multipliers
            const projMinReward = Math.floor(act.minReward * repRewardMultiplier);
            const projMaxReward = Math.floor(act.maxReward * repRewardMultiplier);

            return (
              <div 
                key={act.id}
                className={`rounded-2xl border p-5 bg-zinc-950/70 flex flex-col xl:flex-row xl:items-center justify-between gap-6 transition duration-300 ${
                  isLocked 
                    ? 'border-zinc-900 bg-zinc-950/15 opacity-60' 
                    : 'border-zinc-850 hover:border-red-900/30 hover:bg-zinc-950/95 shadow-md hover:shadow-red-950/5'
                }`}
              >
                
                {/* Information, demands and stats */}
                <div className="space-y-4 flex-1">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-zinc-900/80 border border-zinc-850 flex items-center justify-center text-3xl shrink-0">
                      {act.emoji}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h4 className="text-base font-black text-white leading-tight uppercase tracking-tight">
                          {act.name}
                        </h4>
                        
                        {/* Requirement badges */}
                        {isLockedByLevel && (
                          <span className="bg-red-500/15 border border-red-500/20 text-red-400 text-[8px] font-bold font-mono px-2 py-0.5 rounded uppercase font-black uppercase">
                            🔒 Nível {act.levelRequired}
                          </span>
                        )}
                        {act.requiresDriversLicense && (
                          <span className={`${player.hasDriversLicense ? 'bg-sky-500/10 text-sky-400 border border-sky-500/10' : 'bg-red-500/10 text-red-400 border border-red-500/10'} text-[8px] font-bold px-2 py-0.5 rounded uppercase font-sans border tracking-tight`}>
                            {player.hasDriversLicense ? '✓ CNH Carros' : '✗ Requer CNH B'}
                          </span>
                        )}
                        {act.requiresTruckLicense && (
                          <span className={`${player.hasTruckLicense ? 'bg-sky-500/10 text-sky-400 border border-sky-500/10' : 'bg-red-500/10 text-red-500 border border-red-500/10'} text-[8px] font-bold px-2 py-0.5 rounded uppercase font-sans border tracking-tight`}>
                            {player.hasTruckLicense ? '✓ CNH Caminhão' : '✗ Requer CNH E'}
                          </span>
                        )}
                      </div>

                      <p className="text-zinc-400 text-xs mt-1.5 leading-relaxed max-w-2xl">
                        {act.description}
                      </p>
                    </div>
                  </div>

                  {/* Crime specs matrix info */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-xl border border-zinc-900/50 bg-zinc-900/20 p-3 text-center">
                      <span className="text-[9px] block text-zinc-500 uppercase font-sans font-bold">Faturamento (Sujo)</span>
                      <strong className="text-red-400 font-mono text-xs font-bold leading-none block mt-1">
                        R$ {projMinReward.toLocaleString('pt-BR')} - {projMaxReward.toLocaleString('pt-BR')}
                      </strong>
                    </div>

                    <div className="rounded-xl border border-zinc-900/50 bg-zinc-900/20 p-3 text-center">
                      <span className="text-[9px] block text-zinc-500 uppercase font-sans font-bold">Chance Útil de Sucesso</span>
                      <strong className="text-emerald-400 font-mono text-sm font-black leading-none block mt-1">
                        {finalSuccessRate}%
                      </strong>
                    </div>

                    <div className="rounded-xl border border-zinc-900/50 bg-zinc-900/20 p-3 text-center">
                      <span className="text-[9px] block text-zinc-500 uppercase font-sans font-bold">Custo de Energia</span>
                      <strong className={`${canAffordEnergy ? 'text-yellow-400' : 'text-red-500'} font-mono text-xs font-bold leading-none block mt-1`}>
                        {act.energyCost} EP
                      </strong>
                    </div>

                    <div className="rounded-xl border border-zinc-900/50 bg-zinc-900/20 p-3 text-center">
                      <span className="text-[9px] block text-zinc-500 uppercase font-sans font-bold">Punição Estimada</span>
                      <strong className="text-red-500 font-mono text-[10px] uppercase font-bold leading-none block mt-1">
                        Fiança: R$ {act.fine} • {act.jailTime}s Cadeia
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Submit operations button block */}
                <div className="w-full xl:w-56 shrink-0 border-t xl:border-t-0 xl:border-l border-zinc-900 pt-4 xl:pt-0 xl:pl-6 flex flex-col justify-center">
                  {isLocked ? (
                    <div className="py-3 px-4 rounded-xl bg-zinc-900/30 border border-zinc-850 text-zinc-500 text-center font-bold text-xs select-none">
                      🔒 Operação Bloqueada
                    </div>
                  ) : (
                    <button
                      id={`btn-commit-crime-${act.id}`}
                      onClick={() => handleCommitCrime(act)}
                      disabled={!canAffordEnergy}
                      className={`w-full py-4 px-4 rounded-xl font-extrabold text-xs uppercase tracking-widest cursor-pointer transition-all duration-300 shadow-md ${
                        canAffordEnergy
                          ? 'bg-gradient-to-r from-red-655 to-rose-600 text-white hover:from-red-600 hover:to-rose-500 active:scale-[0.98] shadow-red-950/20 hover:shadow-lg'
                          : 'bg-zinc-900 border border-zinc-850 text-zinc-500 cursor-not-allowed'
                      }`}
                    >
                      {canAffordEnergy ? `Iniciar Crime (-${act.energyCost} EP)` : 'Fadiga Extrema / Sem Energia'}
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'laundering' && (
        /* MONEY LAUNDERING / BRANQUEAMENTO SCREEN */
        <div id="subpanel-money-laundering" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left panel: configure laundering */}
          <div className="rounded-xl border border-zinc-850 bg-zinc-950 p-5 space-y-4 lg:col-span-2">
            <div>
              <span className="bg-red-500/10 border border-red-500/20 px-2 py-0.5 mt-1 rounded text-red-500 text-[9px] font-black uppercase tracking-wider">
                Cofre do Submundo
              </span>
              <h4 className="text-lg font-black text-white mt-1.5 uppercase font-display select-none">Mecanismo de Lavanderia / Conversão</h4>
              <p className="text-zinc-500 text-[11px] leading-relaxed">
                Dinheiro marcado ilegal não pode ser depositado na banca limpa ou usado para comprar propriedades, negócios e licenciamentos regulamentados pelo RP. Limpe a grana para faturar capitais limpos comerciáveis.
              </p>
            </div>

            {/* Selector: Doleiro vs Owned businesses */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-zinc-900 p-1 rounded-xl">
              <button
                id="btn-select-laundertype-dealer"
                onClick={() => {
                  playSound('click');
                  setSelectedLaunderMethod('dealer');
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold uppercase transition leading-none ${
                  selectedLaunderMethod === 'dealer'
                    ? 'bg-red-600 text-white shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                👤 Doleiro Beco
              </button>
              <button
                id="btn-select-laundertype-business"
                onClick={() => {
                  playSound('click');
                  setSelectedLaunderMethod('business');
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold uppercase transition leading-none ${
                  selectedLaunderMethod === 'business'
                    ? 'bg-red-600 text-white shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                🏢 Canal Corporativo
              </button>
            </div>

            {/* Render business chooser if selected business laundering */}
            {selectedLaunderMethod === 'business' && (
              <div className="space-y-3 p-4 rounded-xl border border-zinc-900 bg-zinc-900/20">
                <label className="text-[10px] text-zinc-500 font-bold uppercase block">Selecione seu Estabelecimento do RP:</label>
                
                {/* List of possible businesses with fees */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {BUSINESSES.map(b => {
                    const isOwned = Object.keys(player.ownedBusinesses).includes(b.id);
                    let fee = 25;
                    let cap = 10000;
                    switch (b.id) {
                      case 'lava_jato': fee = 25; cap = 12000; break;
                      case 'oficina': fee = 20; cap = 35000; break;
                      case 'mercado_bairro': fee = 15; cap = 120000; break;
                      case 'posto_combustivel': fee = 10; cap = 350500; break;
                      case 'transportadora': fee = 5; cap = 1000000; break;
                      case 'concessionaria': fee = 0; cap = 10000000; break;
                    }

                    return (
                      <button
                        key={b.id}
                        id={`btn-select-laundering-biz-${b.id}`}
                        onClick={() => {
                          playSound('click');
                          setSelectedBusinessLaunderId(b.id);
                        }}
                        className={`p-3.5 rounded-xl border text-left transition ${
                          selectedBusinessLaunderId === b.id && isOwned
                            ? 'border-red-500 bg-red-950/5 relative shadow-md shadow-red-500/5'
                            : isOwned
                            ? 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
                            : 'border-zinc-950 bg-zinc-950/20 opacity-40 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex justify-between items-start font-sans">
                          <strong className="text-xs text-zinc-200 font-extrabold">{b.name}</strong>
                          {isOwned ? (
                            <span className="text-[8px] bg-red-500/10 text-red-400 border border-red-500/20 px-1 py-0.5 rounded font-black font-mono">
                              Proprietário
                            </span>
                          ) : (
                            <span className="text-[8px] bg-zinc-900 text-zinc-650 px-1 py-0.5 rounded border border-zinc-850">
                              Trancado
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2 font-mono text-[10px] text-zinc-500">
                          <div>Taxa: <em className="not-italic text-red-400 font-bold">{fee}%</em></div>
                          <div>Teto: <em className="not-italic text-zinc-300">{cap >= 1000000 ? 'Ilimitado' : `R$ ${cap.toLocaleString('pt-BR')}`}</em></div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* General input for laundering */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center text-xs text-zinc-500 font-sans">
                <span className="uppercase block font-bold">Quantia de Notas Marcadas (Sujas)</span>
                <span className="font-mono">Capacidade de Remessa: R$ {launderStats.maxLimit.toLocaleString('pt-BR')}</span>
              </div>
              <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1 items-center">
                <div className="pl-3 text-red-500 font-black font-mono text-sm leading-none">$</div>
                <input
                  id="input-laundering-amount"
                  type="number"
                  placeholder="0.00"
                  value={launderAmountInput}
                  onChange={(e) => setLaunderAmountInput(e.target.value)}
                  className="flex-1 bg-transparent py-3 px-3 outline-none text-zinc-100 font-mono text-sm font-bold min-w-0"
                />
                <button
                  onClick={() => {
                    playSound('click');
                    setLaunderAmountInput(Math.min(dirtyCash, launderStats.maxLimit).toString());
                  }}
                  className="px-3.5 py-2 bg-zinc-800 text-zinc-300 font-black text-[10px] uppercase tracking-wider rounded-lg hover:bg-zinc-700 transition"
                >
                  Máximo
                </button>
              </div>
            </div>

            {/* Execution trigger button */}
            <div className="pt-3 border-t border-zinc-900">
              {dirtyCash === 0 ? (
                <div className="text-zinc-600 bg-zinc-900/30 border border-zinc-900 rounded-xl text-center font-bold text-xs py-4 select-none">
                  Nenhum Dinheiro Sujo em Posse. Faça operações ilegais primeiro para acumular dividendos!
                </div>
              ) : (
                <button
                  id="btn-trigger-laundering-run"
                  onClick={handleLaunderExecution}
                  className="w-full bg-gradient-to-r from-red-600 to-red-500 py-3.5 text-center text-white rounded-xl font-extrabold text-xs tracking-widest cursor-pointer uppercase transition-all duration-300 shadow hover:from-red-500 hover:to-red-400 active:scale-[0.98]"
                >
                  Iniciar Branqueamento Corporativo (Taxa {launderStats.feePercent}%)
                </button>
              )}
            </div>

          </div>

          {/* Right panel: summary details channel */}
          <div className="rounded-xl border border-zinc-850 bg-zinc-950 p-5 space-y-4">
            <h5 className="font-extrabold text-white text-xs uppercase tracking-wider text-red-500 font-sans flex items-center gap-1">
              <Info className="h-4 w-4" /> Detalhes da Lavadora ativa
            </h5>

            <div className="space-y-4 text-xs font-sans text-zinc-400">
              <div>
                <strong className="block text-zinc-200 uppercase text-[10px]">Canal Selecionado:</strong>
                <span className="text-indigo-400 font-bold block text-sm mt-0.5">{launderStats.name}</span>
              </div>

              <div>
                <strong className="block text-zinc-200 uppercase text-[10px]">Taxa Administrativa:</strong>
                <span className="text-red-400 font-mono font-bold text-base block mt-0.5">{launderStats.feePercent}% de retenção</span>
              </div>

              <div>
                <strong className="block text-zinc-200 uppercase text-[10px]">Risco de apreensão policial:</strong>
                <span className={`${launderStats.seizeChance > 0 ? 'text-red-500 animate-pulse font-extrabold' : 'text-emerald-400 font-bold'} block mt-0.5`}>
                  {launderStats.seizeChance > 0 ? `${launderStats.seizeChance}% Chance de batida policial` : '0% Seguro (Invisível)'}
                </span>
              </div>

              <div className="pt-2 border-t border-zinc-900">
                <p className="text-[10px] text-zinc-500 leading-normal">
                  {launderStats.desc}
                </p>
              </div>

              {/* Tying summary illustration */}
              <div className="rounded-xl bg-zinc-900/30 border border-zinc-900/60 p-4 border-l-2 border-l-red-500 text-[10px] space-y-1 mt-6">
                <p className="text-zinc-400 font-extrabold uppercase">Dica do Cartel:</p>
                <p className="text-zinc-500 leading-snug">
                  "Oficinas mecânicas e postos de gasolinas são ótimos canais para pequenos e médios volumes. Mas se o seu objetivo é o topo absoluto, compre a Concessionária de Luxo para branquear bilhões de dinheiro do tráfico de caminhões com 0% de comissões!"
                </p>
              </div>
            </div>
          </div>

        </div>
      )}

      {activeTab === 'history' && (
        /* ILLEGAL ACTIVITY HISTORIC LOGS LIST */
        <div id="subpanel-crime-logs" className="space-y-4">
          <div className="flex justify-between items-center bg-zinc-950 px-4 py-3.5 border border-zinc-900 rounded-xl text-xs font-sans">
            <span className="text-zinc-500">Histórico criminal provisório de ocorrências de sua sessão:</span>
            <strong className="text-red-400 font-mono uppercase text-[10px]">
              {crimeLog.length} Ações Registradas no Radar
            </strong>
          </div>

          {crimeLog.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-900 p-12 text-center text-zinc-650 max-w-sm mx-auto space-y-2">
              <span className="text-4xl block">📋</span>
              <h5 className="font-bold text-xs uppercase text-zinc-500">Nenhum evento anotado na ficha criminosa</h5>
              <p className="text-[11px] leading-relaxed text-zinc-600">
                Os flagrantes policiais e faturamento ilegal gerado durante o dia aparecerão catalogados aqui para controle.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-2">
              {crimeLog.map((log, index) => (
                <div 
                  key={index} 
                  className={`rounded-xl border p-3 flex justify-between items-center text-xs font-mono transition ${
                    log.type === 'success' 
                      ? 'border-emerald-950/40 bg-emerald-950/[0.02]' 
                      : log.type === 'failure'
                      ? 'border-red-950/40 bg-red-950/[0.02]'
                      : 'border-yellow-950/40 bg-yellow-950/[0.02]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-zinc-500 text-[10px] shrink-0 font-sans">{log.time}</span>
                    <span className={`h-2 w-2 rounded-full ${
                      log.type === 'success' ? 'bg-emerald-500' : log.type === 'failure' ? 'bg-red-500' : 'bg-yellow-500'
                    }`} />
                    <span className="text-zinc-300 font-sans tracking-tight">{log.text}</span>
                  </div>

                  <strong className={`${
                    log.type === 'success' ? 'text-emerald-400' : log.type === 'failure' ? 'text-red-400 font-black' : 'text-yellow-400'
                  } shrink-0 text-[11px]`}>
                    {log.cashDiff}
                  </strong>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* OVERLAY FLOATING MODAL SCREEN SHOWING SUCCEEDED/FAILED BUSTED ADAPTIVE POPUP */}
      {crimeResult && (
        <div id="crime-action-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/90 p-4 animate-fade-in backdrop-blur-sm select-none">
          <div className={`w-full max-w-md rounded-2xl border p-6 space-y-6 text-center shadow-2xl relative overflow-hidden ${
            crimeResult.success 
              ? 'border-emerald-500 bg-zinc-900 shadow-emerald-500/5' 
              : 'border-red-500 bg-zinc-900 shadow-red-500/5'
          }`}>
            
            {/* Ambient indicator lights */}
            <div className={`absolute top-0 left-0 right-0 h-1 ${
              crimeResult.success ? 'bg-emerald-500' : 'bg-red-500'
            }`} />

            <div className="space-y-2">
              <div className="mx-auto h-16 w-16 rounded-full flex items-center justify-center text-3xl shadow-inner border animate-bounce">
                {crimeResult.success ? '🏆' : '🚨'}
              </div>
              <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded border inline-block ${
                crimeResult.success 
                  ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400' 
                  : 'bg-red-500/15 border-red-500/25 text-red-500'
              }`}>
                {crimeResult.success ? 'Operação Concluída com Sucesso' : 'Flagrado e Enclausurado'}
              </span>
              <h3 className="text-xl font-black text-zinc-100 uppercase tracking-tight leading-snug">
                {crimeResult.activityName}
              </h3>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed py-1 px-3">
              {crimeResult.description}
            </p>

            {/* Financial and stats recap logs */}
            <div className="rounded-xl bg-zinc-950/70 border border-zinc-900 p-4 font-mono text-xs space-y-2.5">
              {crimeResult.success ? (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500 font-sans">Dinheiro Sujo Faturado:</span>
                    <strong className="text-red-400">+ R$ {crimeResult.reward.toLocaleString('pt-BR')}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500 font-sans">Reputação de Facção:</span>
                    <strong className="text-yellow-500">+{crimeResult.repGain} pontos</strong>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-center text-red-400">
                    <span className="text-zinc-500 font-sans">Multas Administrativas:</span>
                    <strong>R$ {crimeResult.finePaid.toLocaleString('pt-BR')}</strong>
                  </div>

                  <div className="flex justify-between items-center select-none">
                    <span className="text-zinc-500 font-sans">Punição Judicial:</span>
                    <strong className="text-yellow-500 flex items-center gap-1">
                      <Clock className="h-3 w-3 inline text-yellow-500 animate-spin" /> {crimeResult.jailDuration}s Trancafiado
                    </strong>
                  </div>
                </>
              )}
            </div>

            {/* Action buttons footer */}
            <div className="pt-2">
              <button
                id="btn-close-crime-result"
                onClick={() => setCrimeResult(null)}
                className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-wider cursor-pointer transition ${
                  crimeResult.success 
                    ? 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-md' 
                    : 'bg-red-650 hover:bg-red-600 text-white shadow-md'
                }`}
              >
                {crimeResult.success ? 'Golear e Continuar' : 'Aguardar Julgamento'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
