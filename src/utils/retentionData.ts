import { DailyQuest, WeeklyObjective, PlayerState } from '../types';

export interface RareCollectible {
  id: string;
  name: string;
  description: string;
  category: 'chavoso' | 'miniaturas' | 'ostentacao';
  rarity: 'comum' | 'raro' | 'lendario';
  icon: string;
  passiveBonusDesc: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  rewardCash: number;
  rewardXp: number;
  check: (player: PlayerState) => boolean;
}

export interface DailyLoginReward {
  day: number;
  rewardText: string;
  rewardCash: number;
  rewardXp: number;
  itemRewardId?: string; // gives collectible
}

// 7-day Login Rewards calendar
export const DAILY_LOGIN_CALENDAR: DailyLoginReward[] = [
  { day: 1, rewardText: 'Kit Inicial de Boas-vindas', rewardCash: 5000, rewardXp: 150 },
  { day: 2, rewardText: 'Vale-Alimentação de Cidadão', rewardCash: 12000, rewardXp: 250 },
  { day: 3, rewardText: 'Suprimento do Morro', rewardCash: 2500, rewardXp: 400 },
  { day: 4, rewardText: '🕶️ Juliet Ouro 24K (Item Raro!)', rewardCash: 15000, rewardXp: 500, itemRewardId: 'juliet_gold' },
  { day: 5, rewardText: 'Incentivo de Profissional', rewardCash: 5000, rewardXp: 750 },
  { day: 6, rewardText: 'Financiamento do Detran', rewardCash: 85000, rewardXp: 1200 },
  { day: 7, rewardText: '👑 Rolex Submariner (Item Lendário!)', rewardCash: 150000, rewardXp: 2500, itemRewardId: 'relogio_rolex' }
];

// Rare collectibles that apply massive passive statistical buffs if owned!
export const RARE_COLLECTIBLES: RareCollectible[] = [
  // Category 1: Kit Chavoso
  {
    id: 'juliet_gold',
    name: 'Juliet de Ouro 24k',
    description: 'Os óculos lendários mais cobiçados das avenidas cariocas. Brilha sob o sol do meio-dia.',
    category: 'chavoso',
    rarity: 'raro',
    icon: '🕶️',
    passiveBonusDesc: '+15% de salário extra em todos os trabalhos braçais (bicos).'
  },
  {
    id: 'bone_oakley',
    name: 'Boné de Metal Oakley',
    description: 'Chapa de ferro frontal com encaixe tático. Estilo inquebrável para dar um rolê.',
    category: 'chavoso',
    rarity: 'comum',
    icon: '🧢',
    passiveBonusDesc: '-10% de consumo de energia (Fatiga) ao trabalhar.'
  },
  {
    id: 'corrente_ouro',
    name: 'Correntão de Ouro 18k',
    description: 'Cordão banhado de 1.5kg, digno dos donos de morro e magnatas do funk.',
    category: 'chavoso',
    rarity: 'lendario',
    icon: '📿',
    passiveBonusDesc: '+25% de taxa de sucesso criminal no Submundo e dobro de respeito.'
  },

  // Category 2: Miniaturas Rio
  {
    id: 'miniatura_skyline',
    name: 'Miniatura Skyline GTR R34',
    description: 'Uma réplica perfeita do clássico japonês com tração integral e faróis de led.',
    category: 'miniaturas',
    rarity: 'raro',
    icon: '🚗',
    passiveBonusDesc: 'Seus veículos dão +10% de bônus salarial passivo adicionais.'
  },
  {
    id: 'placa_rio',
    name: 'Placa de Trânsito "Favela 5"',
    description: 'Arrancada diretamente de um cruzamento na Linha Vermelha. Relíquia decorativa.',
    category: 'miniaturas',
    rarity: 'comum',
    icon: '🛑',
    passiveBonusDesc: '+10% de bônus de ganho nos trabalhos de Uber e Táxi.'
  },
  {
    id: 'viatura_mini',
    name: 'Mini Viatura Tática do BOPE',
    description: 'Réplica de ferro blindada com sirene ativa que cabe perfeitamente na sua estante.',
    category: 'miniaturas',
    rarity: 'lendario',
    icon: '🚔',
    passiveBonusDesc: '+35% de recompensa salarial nas patrulhas de Polícia e Médico.'
  },

  // Category 3: Ostentação Pura
  {
    id: 'relogio_rolex',
    name: 'Rolex Submariner Luxo',
    description: 'Maquinário automático suíço banhado. Mostra aos rivais quem comanda o fluxo de capitais.',
    category: 'ostentacao',
    rarity: 'lendario',
    icon: '⌚',
    passiveBonusDesc: '+40% de rendimentos passivos gerados por TODAS as suas Empresas!'
  },
  {
    id: 'tenis_mizuno',
    name: 'Mizuno Wave Prophecy X',
    description: 'O famoso Mizuno de mola dourada. Corre como o vento pelas ladeiras cariocas.',
    category: 'ostentacao',
    rarity: 'comum',
    icon: '👟',
    passiveBonusDesc: 'Expande permanentemente as capacidades vitais dando +50 EP Máximo!'
  },
  {
    id: 'perfume_silver',
    name: 'Perfume Millionaire Gold',
    description: 'A fragrância importada que hipnotiza qualquer um. Perfuma toda a danceteria.',
    category: 'ostentacao',
    rarity: 'raro',
    icon: '🧪',
    passiveBonusDesc: '-15% de chance de ser pego ou apreendido pela Polícia no Submundo.'
  }
];

// Achievements roster
export const ACHIEVEMENTS_LIST: Achievement[] = [
  {
    id: 'ach_first_rg',
    name: 'Chegando na Cidade',
    description: 'Efetue sua imigração e tire seu primeiro passaporte no Rio de Janeiro.',
    category: 'Progresso',
    icon: '✈️',
    rewardCash: 2500,
    rewardXp: 100,
    check: (player) => player.level >= 1
  },
  {
    id: 'ach_level_five',
    name: 'Cidadão Respeitado',
    description: 'Suba o nível do seu personagem para o Nível 5.',
    category: 'Progresso',
    icon: '⭐',
    rewardCash: 15000,
    rewardXp: 500,
    check: (player) => player.level >= 5
  },
  {
    id: 'ach_level_ten',
    name: 'Lenda Urbana',
    description: 'Suba o nível do seu personagem para o Nível 10 para dominar as ruas.',
    category: 'Progresso',
    icon: '🔥',
    rewardCash: 100000,
    rewardXp: 1500,
    check: (player) => player.level >= 10
  },
  {
    id: 'ach_earn_fifty_k',
    name: 'Primeira Parcela',
    description: 'Acumule faturamento histórico acima de R$ 50.000.',
    category: 'Financeiro',
    icon: '💸',
    rewardCash: 10000,
    rewardXp: 300,
    check: (player) => player.stats.totalEarned >= 50000
  },
  {
    id: 'ach_earn_one_million',
    name: 'Milionário Carioca',
    description: 'Acumule faturamento histórico acima de R$ 1.000.000!',
    category: 'Financeiro',
    icon: '💰',
    rewardCash: 200000,
    rewardXp: 3000,
    check: (player) => player.stats.totalEarned >= 1000000
  },
  {
    id: 'ach_garage_upgrade',
    name: 'Estacionamento Cheio',
    description: 'Tenha 4 ou mais veículos desbloqueados em sua Garagem pessoal.',
    category: 'Frota',
    icon: '🛸',
    rewardCash: 25000,
    rewardXp: 600,
    check: (player) => player.ownedVehicles.length >= 4
  },
  {
    id: 'ach_imobiliaria',
    name: 'Corretor Supremo',
    description: 'Tenha 3 ou mais propriedades escrituradas e adquiridas.',
    category: 'Patrimônio',
    icon: '🏰',
    rewardCash: 3500,
    rewardXp: 800,
    check: (player) => player.ownedProperties.length >= 3
  },
  {
    id: 'ach_business_owner',
    name: 'Corporação Unificada',
    description: 'Ative e gerencie pelo menos 2 empresas simultaneamente.',
    category: 'Empresas',
    icon: '🏢',
    rewardCash: 75000,
    rewardXp: 1000,
    check: (player) => Object.keys(player.ownedBusinesses).length >= 2
  },
  {
    id: 'ach_robbery_survivor',
    name: 'Caminho Inviolável',
    description: 'Sobreviva com sucesso a 5 enquadros ou assaltos de rua no Rio.',
    category: 'Submundo',
    icon: '🔫',
    rewardCash: 30000,
    rewardXp: 900,
    check: (player) => (player.stats.streetRobberiesSurvived || 0) >= 5
  },
  {
    id: 'ach_rare_items',
    name: 'Super Colecionador',
    description: 'Colete pelo menos 3 itens raros na sua estante de coleções.',
    category: 'Coleções',
    icon: '🎨',
    rewardCash: 40000,
    rewardXp: 1200,
    check: (player) => (player.retention?.ownedCollections?.length || 0) >= 3
  }
];

// Instantiates standard templates of daily quests
export function generateDailyQuests(player: PlayerState): DailyQuest[] {
  // We formulate 3 random daily activities appropriate for current stats
  const templates: { desc: string; type: DailyQuest['type']; target: number; rewardC: number; rewardX: number }[] = [
    { desc: 'Faça 5 entregas como Motoboy / Delivery', type: 'deliveries', target: 5, rewardC: 800, rewardX: 250 },
    { desc: 'Trabalhe de Mecânico da Oficina AP 3 vezes', type: 'mechanic', target: 3, rewardC: 650, rewardX: 200 },
    { desc: 'Realize 4 viagens como Motorista de Uber', type: 'rides', target: 4, rewardC: 1200, rewardX: 300 },
    { desc: 'Complete 3 atividades de Racha ou Roubo no Submundo', type: 'crime', target: 3, rewardC: 1500, rewardX: 350 },
    { desc: 'Compre 4 Hambúgueres no bico de Lanchonete', type: 'burger', target: 4, rewardC: 450, rewardX: 150 },
    { desc: 'Fature R$ 30.000 em receitas limpas gerais', type: 'earn', target: 30000, rewardC: 1200, rewardX: 300 }
  ];

  // Pick 3 random quests
  const shuffled = [...templates].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3).map((t, idx) => {
    // Check current progress so we can preset count
    let currentCount = 0;
    if (t.type === 'deliveries') currentCount = 0; // Starts from 0 today
    return {
      id: `daily_${t.type}_${Date.now()}_${idx}`,
      description: t.desc,
      targetCount: t.target,
      currentCount: currentCount,
      rewardCash: t.rewardC,
      rewardXp: t.rewardX,
      completed: false,
      claimed: false,
      type: t.type
    };
  });
}

// Generates weekly objectives
export function generateWeeklyObjectives(): WeeklyObjective[] {
  return [
    {
      id: 'weekly_income',
      description: 'Acumule faturamento bruto de R$ 100.000 (Trabalho, Empresas, Racha, etc)',
      type: 'income',
      targetCount: 100000,
      currentCount: 0,
      rewardCash: 45000,
      rewardXp: 1200,
      completed: false,
      claimed: false
    },
    {
      id: 'weekly_xp',
      description: 'Acumule 2.500 XP de experiência civil em competências',
      type: 'xp',
      targetCount: 2500,
      currentCount: 0,
      rewardCash: 35000,
      rewardXp: 1500,
      completed: false,
      claimed: false
    },
    {
      id: 'weekly_vehicles',
      description: 'Adquira pelo menos 1 veículo novo para incrementar sua garagem',
      type: 'vehicles',
      targetCount: 1,
      currentCount: 0,
      rewardCash: 25000,
      rewardXp: 800,
      completed: false,
      claimed: false
    },
    {
      id: 'weekly_quests',
      description: 'Ganhe faturamento de bônus completando 5 missões diárias',
      type: 'quests',
      targetCount: 5,
      currentCount: 0,
      rewardCash: 50000,
      rewardXp: 2000,
      completed: false,
      claimed: false
    }
  ];
}

// Pre-filled simulated players for a hyper-realistic MMO/RP feels!
export interface SimulatedLeaderboardEntry {
  name: string;
  rank: number;
  cashEarned: number;
  vip: 'bronze' | 'prata' | 'ouro' | null;
  statusText: string;
  isPlayer?: boolean;
}

export const INITIAL_LEADERBOARD_COMPETITORS: SimulatedLeaderboardEntry[] = [
  { name: 'Corleone_RP', rank: 1, cashEarned: 24500000, vip: 'ouro', statusText: 'Dono de Concessionária' },
  { name: 'Nego_Dramma', rank: 2, cashEarned: 18450000, vip: 'ouro', statusText: 'Chefia Suprema' },
  { name: 'Doutor_Heitor_RP', rank: 3, cashEarned: 12900000, vip: 'prata', statusText: 'Diretor Geral SAMU' },
  { name: 'Pedrinho_AP', rank: 4, cashEarned: 8200000, vip: 'prata', statusText: 'Preparador de Gol AP' },
  { name: 'Sargento_Melo', rank: 5, cashEarned: 4580000, vip: 'bronze', statusText: 'Patrulheiro de Elite' },
  { name: 'Jessi_Correria', rank: 6, cashEarned: 2850000, vip: null, statusText: 'Uber Proativa' },
  { name: 'Vitor_Capone', rank: 7, cashEarned: 1540000, vip: 'bronze', statusText: 'Contrabandista' },
  { name: 'Leticia_Vapo', rank: 8, cashEarned: 950000, vip: null, statusText: 'Comedora de Coxinha' },
  { name: 'Marquinhos_do_Grau', rank: 9, cashEarned: 480000, vip: null, statusText: 'Vida Loka' },
  { name: 'Thiago_Zero1', rank: 10, cashEarned: 220000, vip: null, statusText: 'Novato das Viaturas' }
];

export function getPassiveBonusMultipliers(ownedItemIds: string[]) {
  let salaryMultiplier = 1.0;
  let energyCostReduction = 0; // percentage
  let crimeSuccessBonus = 0; // percentage
  let vehicleEarningsBonus = 0; // percentage
  let uberTaxiBonus = 0; // percentage
  let govtJobBonus = 0; // percentage
  let passiveIncomeMultiplier = 1.0;
  let maxEnergyBonus = 0;
  let copCaptureReduction = 0; // percentage

  ownedItemIds.forEach(id => {
    if (id === 'juliet_gold') salaryMultiplier += 0.15;
    if (id === 'bone_oakley') energyCostReduction += 10;
    if (id === 'corrente_ouro') crimeSuccessBonus += 25;
    if (id === 'miniatura_skyline') vehicleEarningsBonus += 0.10;
    if (id === 'placa_rio') uberTaxiBonus += 0.10;
    if (id === 'viatura_mini') govtJobBonus += 0.35;
    if (id === 'relogio_rolex') passiveIncomeMultiplier += 0.40;
    if (id === 'tenis_mizuno') maxEnergyBonus += 50;
    if (id === 'perfume_silver') copCaptureReduction += 15;
  });

  return {
    salaryMultiplier,
    energyCostReduction,
    crimeSuccessBonus,
    vehicleEarningsBonus,
    uberTaxiBonus,
    govtJobBonus,
    passiveIncomeMultiplier,
    maxEnergyBonus,
    copCaptureReduction
  };
}
