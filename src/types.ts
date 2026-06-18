export type FactionType = 'cv' | 'pcc' | 'milicia' | 'cartel';
export type FactionRole = 'soldado' | 'gerente' | 'frente' | 'chefe';

export interface FactionMission {
  id: string;
  title: string;
  description: string;
  factionXpReward: number;
  vaultCashReward: number;
  personalCashReward: number;
  durationSeconds: number;
}

export interface FactionState {
  id: FactionType;
  name: string;
  vaultCash: number;
  influence: number; // 0 to 100 percentage
}

export interface DailyQuest {
  id: string;
  description: string;
  targetCount: number;
  currentCount: number;
  rewardCash: number;
  rewardXp: number;
  completed: boolean;
  claimed: boolean;
  type: 'deliveries' | 'rides' | 'mechanic' | 'crime' | 'burger' | 'earn';
}

export interface WeeklyObjective {
  id: string;
  description: string;
  targetCount: number;
  currentCount: number;
  rewardCash: number;
  rewardXp: number;
  completed: boolean;
  claimed: boolean;
  type: 'income' | 'xp' | 'vehicles' | 'quests';
}

export interface PlayerState {
  name: string;
  gender: 'M' | 'F';
  cash: number;
  level: number;
  xp: number;
  energy: number;
  maxEnergy: number;
  currentVehicleId: string | null;
  currentPropertyId: string;
  ownedVehicles: string[];
  ownedProperties: string[];
  ownedBusinesses: { [id: string]: { level: number; employeesCount?: number; lastCollected: number } };
  hasDriversLicense: boolean;
  hasTruckLicense: boolean;
  dirtyCash?: number;
  criminalReputation?: number;
  vipLevel?: 'bronze' | 'prata' | 'ouro' | null;
  stats: {
    totalEarned: number;
    totalSpent: number;
    deliveriesCompleted: number;
    ridesCompleted: number;
    taxiCompleted: number;
    truckRunsCompleted: number;
    timesPMEncountered: number;
    streetRobberiesSurvived: number;
    mechanicJobsCompleted?: number;
    policeJobsCompleted?: number;
    doctorJobsCompleted?: number;
    totalOfflineEarningsClaimed?: number; // Offline earnings tracking
  };
  careers?: { [jobId: string]: { level: number; xp: number } };
  retention?: {
    lastLoginDate?: string; // YYYY-MM-DD
    loginStreak?: number; // 0-7
    claimedDailyToday?: boolean;
    dailyQuests?: DailyQuest[];
    weeklyObjectives?: WeeklyObjective[];
    ownedCollections?: string[]; // list of item IDs
    unlockedAchievements?: string[]; // list of unlocked achievement IDs
    completedQuestsTotal?: number;
    specialEventBonusTime?: number; // timestamp when bonus expires
    specialEventBonusType?: 'double_salary' | 'free_energy' | 'double_crime' | null;
  };
  bankChecking?: number; // Checking balance
  bankSavings?: number; // Savings balance
  bankLoans?: BankLoan[];
  bankFinancings?: BankFinancing[];
  bankInvestments?: InvestmentPortfolio;
  lastBankInterestTick?: number; // timestamp of last savings interest yield
  faction?: FactionType | null;
  factionRole?: FactionRole | null;
  factionXp?: number;
}

export interface BankLoan {
  id: string;
  amountBorrowed: number;
  amountRemaining: number;
  interestRate: number;
  totalInstallments: number;
  installmentsRemaining: number;
  paymentPerInstallment: number;
}

export interface BankFinancing {
  id: string;
  assetId: string;
  assetType: 'vehicle' | 'property';
  totalPrice: number;
  amountRemaining: number;
  totalInstallments: number;
  installmentsRemaining: number;
  paymentPerInstallment: number;
}

export interface InvestmentPortfolio {
  tesouro: number;
  cdb: number;
  stocks: { [ticker: string]: { shares: number; avgPrice: number } };
  crypto: { [ticker: string]: { amount: number; avgPrice: number } };
}

export interface Job {
  id: string;
  name: string;
  description: string;
  baseReward: number;
  xpReward: number;
  energyCost: number;
  requiredVehicleId: string | null;
  requiredLicense: 'none' | 'driver' | 'truck';
  xpRequired: number;
  levelRequired: number;
  icon: string; // Lucide icon alias
  activeMinigameTitle: string;
  executionTime: number; // base seconds available for minigame
  bonusChance: number; // percentage (0-100) of double reward opportunity
}

export interface Vehicle {
  id: string;
  name: string;
  price: number;
  description: string;
  speed: number; // max velocity km/h
  consumption: number; // L/100km or general fuel/fatigue cost
  multiplier: number; // multiplier on job earnings
  type: 'moto' | 'car' | 'sport' | 'truck';
  icon: string;
  vipRequired?: 'bronze' | 'prata' | 'ouro' | null;
}

export interface Property {
  id: string;
  name: string;
  price: number;
  description: string;
  energyRegenRate: number; // extra energy regenerated per minute
  maxEnergyBonus: number; // adds to max energy
  comfortLabel: string;
  icon: string;
  passiveIncome: number; // passive income generated per second (R$)
  unlocksBusinessName?: string; // name of business unlocked by this property
  vipRequired?: 'bronze' | 'prata' | 'ouro' | null;
}

export interface Business {
  id: string;
  name: string;
  price: number;
  baseIncomePerSecond: number;
  upgradeCostFactor: number; // cost multiplier for upgrading
  description: string;
  icon: string;
  color: string; // Tailwind border/glowing color
  requiredPropertyId?: string; // Property ID needed to buy this business
}

export interface FoodItem {
  id: string;
  name: string;
  price: number;
  energyRestore: number;
  icon: string;
  description: string;
}

// Global Static Data
export const VEHICLES: Vehicle[] = [
  // --- MOTOS (4 models) ---
  {
    id: 'bike_delivery',
    name: 'Bicicleta de Carga Monark',
    price: 180,
    description: 'Bicicleta clássica de carga. Ganhos extras em entregas rápidos sem gastar combustível.',
    speed: 25,
    consumption: 1, // extremely low fatigue/fuel consumption
    multiplier: 1.25,
    type: 'moto',
    icon: 'Bike',
  },
  {
    id: 'honda_pop',
    name: 'Honda Pop 110i Flex',
    price: 6400,
    description: 'Famosa por rodar 50 quilômetros com um único litro. A queridinha dos entregadores do Ifood.',
    speed: 85,
    consumption: 2, 
    multiplier: 1.5,
    type: 'moto',
    icon: 'Motorcycle',
  },
  {
    id: 'cg160',
    name: 'Honda CG 160 Titan',
    price: 18000,
    description: 'A companheira perfeita dos entregadores da cidade.',
    speed: 140,
    consumption: 3, 
    multiplier: 1.3,
    type: 'moto',
    icon: 'Motorcycle',
  },
  {
    id: 'yamaha_fazer',
    name: 'Yamaha Fazer 250cc',
    price: 16500,
    description: 'Uma moto confortável, segura, muito rápida e ideal para entregas distantes exigentes.',
    speed: 135,
    consumption: 4, 
    multiplier: 1.85,
    type: 'moto',
    icon: 'Motorcycle',
  },
  {
    id: 'xre300',
    name: 'Honda XRE 300',
    price: 65000,
    description: 'A melhor moto para trabalhos na cidade e na estrada.',
    speed: 175,
    consumption: 4, 
    multiplier: 1.5,
    type: 'moto',
    icon: 'Motorcycle',
    vipRequired: 'bronze'
  },
  {
    id: 's1000rr',
    name: 'BMW S1000RR',
    price: 240000,
    description: 'Tecnologia de pista disponível para as ruas.',
    speed: 330,
    consumption: 10, 
    multiplier: 2.5,
    type: 'moto',
    icon: 'Motorcycle',
    vipRequired: 'ouro'
  },
  {
    id: 'honda_hornet',
    name: 'Honda Hornet 600cc (Sem Placa)',
    price: 36000,
    description: 'O ronco ensurdecedor de 4 cilindros. Ostente na quebrada com velocidade insana e o maior bônus de duas rodas.',
    speed: 210,
    consumption: 8, 
    multiplier: 1.4,
    type: 'moto',
    icon: 'Gauge',
  },

  // --- CARROS POPULARES (3 models) ---
  {
    id: 'fiat_uno',
    name: 'Fiat Uno com Escada da Firma',
    price: 9500,
    description: 'Lenda nacional. Equipado com a escada de firma no teto, que desbloqueia velocidade e fôlego extras de trabalho.',
    speed: 130,
    consumption: 5,
    multiplier: 1.3,
    type: 'car',
    icon: 'Car',
  },
  {
    id: 'gol_quadrado',
    name: 'Gol Quadrado AP 1.8 Turbo',
    price: 30000,
    description: 'Motor AP turbinado que espirra forte. Excelente torque para atuar como motorista de aplicativo.',
    speed: 160,
    consumption: 8,
    multiplier: 1.4,
    type: 'car',
    icon: 'Car',
  },
  {
    id: 'celta',
    name: 'Chevrolet Celta VHC 1.0',
    price: 35000,
    description: 'Compacto, econômico e fácil de estacionar.',
    speed: 145,
    consumption: 5,
    multiplier: 1.35,
    type: 'car',
    icon: 'Car',
  },
  {
    id: 'gol_g4',
    name: 'Volkswagen Gol G4 1.0',
    price: 55000,
    description: 'Um clássico nacional confiável para qualquer trabalho.',
    speed: 145,
    consumption: 5,
    multiplier: 1.35,
    type: 'car',
    icon: 'Car',
  },
  {
    id: 'voyage',
    name: 'Volkswagen Voyage',
    price: 85000,
    description: 'Ótima escolha para motoristas de aplicativo.',
    speed: 185,
    consumption: 8,
    multiplier: 1.5,
    type: 'car',
    icon: 'Car',
  },
  {
    id: 'spin_taxi',
    name: 'Chevrolet Spin Táxi GNV',
    price: 90000,
    description: 'Automóvel espaçoso e com KIT GNV cilindro duplo. O campeão imbatível dos taxistas de aeroporto.',
    speed: 145,
    consumption: 4, // super efficient on GNV!
    multiplier: 1.45,
    type: 'car',
    icon: 'CarFront',
  },
  {
    id: 'corolla',
    name: 'Toyota Corolla',
    price: 180000,
    description: 'Conforto, confiabilidade e status em um único veículo.',
    speed: 230,
    consumption: 10,
    multiplier: 1.7,
    type: 'car',
    icon: 'Car',
  },

  // --- CARROS ESPORTIVOS (3 models) ---
  {
    id: 'civic_g10',
    name: 'Honda Civic G10 Sport 2.0',
    price: 180000,
    description: 'Visual agressivo, rodas escurecidas e design de nave. Chama muita atenção de passageiros VIP.',
    speed: 240,
    consumption: 11,
    multiplier: 1.9,
    type: 'sport',
    icon: 'Car',
    vipRequired: 'bronze'
  },
  {
    id: 'jetta_gli',
    name: 'VW Jetta GLI 350 TSI Stage 2',
    price: 280000,
    description: 'Sublime esportivo com ronco direto e câmbio DSG dupla embreagem. Despenha velocidade extrema.',
    speed: 260,
    consumption: 13,
    multiplier: 2.1,
    type: 'sport',
    icon: 'Gauge',
    vipRequired: 'bronze'
  },
  {
    id: 'porsche_911',
    name: 'Porsche 911 Carrera GTS',
    price: 490000,
    description: 'A máquina de asfalto definitiva. Ostentação milionária pura, acelerando de 0 a 100 km/h em 3 segundos.',
    speed: 315,
    consumption: 13,
    multiplier: 2.4,
    type: 'sport',
    icon: 'Gauge',
  },
  {
    id: 'bmw_m3',
    name: 'BMW M3 Competition',
    price: 850000,
    description: 'Sedã premium com alma de carro de corrida.',
    speed: 330,
    consumption: 18,
    multiplier: 2.6,
    type: 'sport',
    icon: 'Gauge',
    },
  {
    id: 'gtr_r35',
    name: 'Nissan GTR R35',
    price: 0,
    description: 'Conhecido como Godzilla, domina qualquer arrancada.',
    speed: 350,
    consumption: 20,
    multiplier: 2.8,
    type: 'sport',
    icon: 'Gauge',
    vipRequired: 'ouro'
  },
  {
    id: 'bugatti_chiron',
    name: 'Bugatti Chiron Super Sport',
    price: 0,
    description: 'O ápice da engenharia automotiva moderna.',
    speed: 350,
    consumption: 20,
    multiplier: 3.0,
    type: 'sport',
    icon: 'Gauge',
    vipRequired: 'ouro'
  },

  // --- CAMINHÕES (2 models) ---
  {
    id: 'vw_delivery_truck',
    name: 'VW Delivery 9.170 Cargo',
    price: 89000,
    description: 'Caminhão leve excelente para entregas intermunicipais de médio porte e frete urbano rápido.',
    speed: 120,
    consumption: 14,
    multiplier: 1.6,
    type: 'truck',
    icon: 'Truck',
  },
  {
    id: 'scania_113',
    name: 'Scania 113H de Cabine Bicuda',
    price: 135000,
    description: 'A lenda indestrutível das estradas da BR-116. Perfeito para transportes interestaduais de cargas maciças.',
    speed: 130,
    consumption: 17,
    multiplier: 2.2,
    type: 'truck',
    icon: 'Truck',
  },
  {
    id: 'volvo_fh',
    name: 'Volvo FH 540 6x4',
    price: 650000,
    description: 'Sem dúvida, o melhor caminhão do Brasil! Conforto, potência e robustez definem essa máquina.',
    speed: 140,
    consumption: 22,
    multiplier: 2.8,
    type: 'truck',
    icon: 'Truck',
  },
  {
    id: 'scania_s770',
    name: 'Scania S770 8x4',
    price: 0,
    description: 'O rei das estradas e sonho de qualquer caminhoneiro.',
    speed: 155,
    consumption: 28,
    multiplier: 3.5,
    type: 'truck',
    icon: 'Truck',
    vipRequired: 'ouro'
  },
  {
    id: 'vip_rs6',
    name: 'Audi RS6 Avant Quattro (VIP Prata)',
    price: 0,
    description: 'A wagon de luxo superesportiva definitiva. Máxima sofisticação urbana e velocidade reservada para VIP Prata.',
    speed: 305,
    consumption: 5,
    multiplier: 2.2,
    type: 'sport',
    icon: 'Sparkles',
    vipRequired: 'prata',
  },
  {
    id: 'vip_sf90',
    name: 'Ferrari SF90 Assetto (VIP Ouro)',
    price: 0,
    description: 'Hipercarro com 1000cv híbridos. O topo absoluto da performance e status reservado para VIP Ouro.',
    speed: 340,
    consumption: 6,
    multiplier: 2.7,
    type: 'sport',
    icon: 'Crown',
    vipRequired: 'ouro',
  },

  {
    id: 'iate_luxo',
    name: 'Iate de Luxo Monaco',
    price: 50000000,
    description: 'Um palácio flutuante. O custo de tripulação, ancoragem e seguro é astronômico.',
    speed: 80,
    consumption: 1500, // Custo altíssimo por viagem
    multiplier: 1.0,
    type: 'sport',
    icon: 'Ship',
    vipRequired: 'ouro'
  },
  {
    id: 'jatinho_particular',
    name: 'Jatinho Gulfstream G650',
    price: 150000000,
    description: 'Voe acima das nuvens e do trânsito. O custo de hangar, piloto e querosene de aviação drena a conta.',
    speed: 950,
    consumption: 3000,
    multiplier: 1.0,
    type: 'sport',
    icon: 'Plane',
    vipRequired: 'ouro'
  },
];

export const PROPERTIES: Property[] = [
  {
    id: 'street_bench',
    name: 'Banco da Praça',
    price: 0,
    description: 'Dormindo de graça ao relento nas praças da cidade. Regeneração extremamente lenta.',
    energyRegenRate: 1,
    maxEnergyBonus: 0,
    comfortLabel: 'Desconfortável',
    icon: 'MapPin',
    passiveIncome: 0,
  },
  {
    id: 'kitnet_centro',
    name: 'Kitnet Compacta Centro',
    price: 8500,
    description: 'Um teto confortável no centro comercial. Ideal para quem está no começo da carreira e busca praticidade.',
    energyRegenRate: 3,
    maxEnergyBonus: 20,
    comfortLabel: 'Compacto',
    icon: 'Home',
    passiveIncome: 0.05, // R$ 12 por minuto
    unlocksBusinessName: 'Pastelaria & Caldo de Cana',
  },
  {
    id: 'casa_simples',
    name: 'Casa Simples de Bairro',
    price: 24000,
    description: 'Residência aconchegante com quintal pequeno em bairro residencial. Ótima ventilação e conforto aprimorado.',
    energyRegenRate: 6,
    maxEnergyBonus: 45,
    comfortLabel: 'Acolhedor',
    icon: 'Home',
    passiveIncome: 0.15, // R$ 54 por minuto
    unlocksBusinessName: 'Adega & Distribuidora 24h',
  },
  {
    id: 'sobrado_bairro',
    name: 'Sobrado Moderno Duplex',
    price: 85000,
    description: 'Sobrado com sacada, área de lazer equipada com churrasqueira e cômodos amplos de alto conforto.',
    energyRegenRate: 10,
    maxEnergyBonus: 85,
    comfortLabel: 'Confortável',
    icon: 'Building',
    passiveIncome: 0.5, // R$ 210 por minuto
    unlocksBusinessName: 'Eletro-Smuggling & Peças (RP)',
  },
  {
    id: 'mansao_alphaville',
    name: 'Mansão Alphaville Residencial',
    price: 450000,
    description: 'Piscina aquecida, heliponto particular, segurança privada 24 horas e acabamento refinado em mármore.',
    energyRegenRate: 18,
    maxEnergyBonus: 150,
    comfortLabel: 'Alto Padrão',
    icon: 'Castle',
    passiveIncome: 3.5, // R$ 1.320 por minuto
    unlocksBusinessName: 'Concessionária de Importados',
  },
  {
    id: 'cobertura_luxo',
    name: 'Cobertura Luxuosa de Copacabana',
    price: 1350000,
    description: 'O topo absoluto do mercado imobiliário. Vista 360º para a orla, hidromassagem gigante e status inigualável.',
    energyRegenRate: 30,
    maxEnergyBonus: 250,
    comfortLabel: 'Ostentação Imperador',
    icon: 'Building',
    passiveIncome: 15.0, // R$ 5.100 por minuto
  },
  {
    id: 'vip_loft',
    name: 'Loft Premium nos Jardins (VIP Bronze)',
    price: 0,
    description: 'Apartamento de designer superconfortável e espaçoso. Gratuito para membros VIP Bronze+. Unlocked de cara.',
    energyRegenRate: 15,
    maxEnergyBonus: 120,
    comfortLabel: 'VIP Bronze Line',
    icon: 'Home',
    passiveIncome: 1.5, // R$ 510 por minuto
    vipRequired: 'bronze',
  },
  {
    id: 'vip_cobertura',
    name: 'Cobertura Penthouse Barra (VIP Prata)',
    price: 0,
    description: 'Triplex luxuoso com piscina com borda infinita na Barra. Gratuito para membros VIP Prata+.',
    energyRegenRate: 28,
    maxEnergyBonus: 220,
    comfortLabel: 'VIP Prata Prestige',
    icon: 'Building',
    passiveIncome: 6.0, // R$ 2.700 por minuto
    vipRequired: 'prata',
  },
  {
    id: 'vip_island',
    name: 'Ilha Imperial Angra dos Reis (VIP Ouro)',
    price: 0,
    description: 'Oásis supremo de tranquilidade, heliporto, praia exclusiva e segurança fortificada. Gratuito para VIP Ouro.',
    energyRegenRate: 50,
    maxEnergyBonus: 400,
    comfortLabel: 'VIP Ouro Sovereignty',
    icon: 'Castle',
    passiveIncome: 25.0, // R$ 10.800 por minuto
    vipRequired: 'ouro',
  },

  {
    id: 'mansao_suspensa',
    name: 'Mansão Suspensa Leblon',
    price: 250000000,
    description: 'A joia do Rio. O IPTU e condomínio cobram o preço desse privilégio.',
    energyRegenRate: 100,
    maxEnergyBonus: 800,
    comfortLabel: 'Apex Predador',
    icon: 'Castle',
    passiveIncome: -1500, // Drena R$ 1.500 por segundo (manutenção)
    vipRequired: 'ouro'
  }
];

export const BUSINESSES: Business[] = [
  {
    id: 'lava_jato',
    name: 'Lava Jato',
    price: 18000,
    baseIncomePerSecond: 0.5, // ~ R$ 90 por minuto
    upgradeCostFactor: 1.4,
    description: 'Lave os importados e motos esportivas da quebrada. Seu primeiro negócio próprio na Cidade RP.',
    icon: 'Droplet',
    color: 'border-cyan-500 shadow-cyan-500/20 text-cyan-400',
    requiredPropertyId: 'kitnet_centro',
  },
  {
    id: 'oficina',
    name: 'Oficina Custom',
    price: 45000,
    baseIncomePerSecond: 1.5, // ~ R$ 270 por minuto
    upgradeCostFactor: 1.5,
    description: 'Faça revisões mecânicas, upgrades de turbo de corrida e pintura neon em carros nacionais e importados.',
    icon: 'Wrench',
    color: 'border-amber-500 shadow-amber-500/20 text-amber-400',
    requiredPropertyId: 'casa_simples',
  },
  {
    id: 'mercado_bairro',
    name: 'Mercado Express',
    price: 120000,
    baseIncomePerSecond: 5.0, // ~ R$ 900 por minuto
    upgradeCostFactor: 1.6,
    description: 'Gerencie o comércio local, as prateleiras de mantimentos e atenda os moradores do bairro.',
    icon: 'ShoppingBag',
    color: 'border-purple-500 shadow-purple-500/20 text-purple-400',
    requiredPropertyId: 'sobrado_bairro',
  },
  {
    id: 'posto_combustivel',
    name: 'Posto de Combustível',
    price: 350000,
    baseIncomePerSecond: 12.0, // ~ R$ 3.000 por minuto
    upgradeCostFactor: 1.7,
    description: 'O ponto de reabastecimento mais movimentado da rodovia de acesso à cidade grande.',
    icon: 'Fuel',
    color: 'border-blue-500 shadow-blue-500/20 text-blue-400',
    requiredPropertyId: 'sobrado_bairro',
  },
  {
    id: 'transportadora',
    name: 'Transportadora Express',
    price: 720000,
    baseIncomePerSecond: 25.0, // ~ R$ 6.900 por minuto
    upgradeCostFactor: 1.8,
    description: 'Opere frotas logísticas de pesados e lidere o escoamento de cargas interestaduais de alta periculosidade.',
    icon: 'Truck',
    color: 'border-emerald-500 shadow-emerald-500/20 text-emerald-400',
    requiredPropertyId: 'mansao_alphaville',
  },
  {
    id: 'concessionaria',
    name: 'Concessionária de Importados',
    price: 1500000,
    baseIncomePerSecond: 45.0, // ~ R$ 16.800 por minuto
    upgradeCostFactor: 2.0,
    description: 'Comande a venda de carros esportivos de luxo exóticos e domine o ecossistema de alto rendimento do RP.',
    icon: 'Store',
    color: 'border-rose-500 shadow-rose-500/20 text-rose-400',
    requiredPropertyId: 'cobertura_luxo',
  },
];

export const FOOD_ITEMS: FoodItem[] = [
  {
    id: 'cafesinho',
    name: 'Pingado com Pão na Chapa',
    price: 6,
    energyRestore: 20,
    icon: 'Coffee',
    description: 'Clássico de padaria paulistana. Energia rápida.',
  },
  {
    id: 'pastel_caldo',
    name: 'Pastel de Carne + Caldo de Cana',
    price: 15,
    energyRestore: 50,
    icon: 'Ticket',
    description: 'Combinação perfeita das feiras de rua brasileiras.',
  },
  {
    id: 'marmita',
    name: 'Marmitex Comercial Completo',
    price: 28,
    energyRestore: 100,
    icon: 'Soup',
    description: 'Arroz, feijão, fritas e bife acebolado. Sustenta demais.',
  },
  {
    id: 'energetico',
    name: 'Lata de Energético "Vapo"',
    price: 18,
    energyRestore: 65,
    icon: 'Zap',
    description: 'Te dá asas temporárias para trabalhar sem parar.',
  },
];

export const JOBS: Job[] = [
  {
    id: 'delivery_job',
    name: 'Entregador de Aplicativo',
    description: 'Suba na bicicleta ou na moto e faça entregas de hambúrguer e lanches.',
    baseReward: 65,
    xpReward: 15,
    energyCost: 10,
    requiredVehicleId: null, // can play with bare feet, but upgraded if has bike/moto
    requiredLicense: 'none',
    xpRequired: 0,
    levelRequired: 1,
    icon: 'Bike',
    activeMinigameTitle: 'Desviar do Trânsito & Entregar',
    executionTime: 12,
    bonusChance: 10,
  },
  {
    id: 'app_driver_job',
    name: 'Motorista de Aplicativo (Uber)',
    description: 'Rode de carro atendendo passageiros apressados na zona sul e centro.',
    baseReward: 120,
    xpReward: 35,
    energyCost: 15,
    requiredVehicleId: 'voyage', // Requires Gol or better
    requiredLicense: 'driver',
    xpRequired: 150,
    levelRequired: 2,
    icon: 'Car',
    activeMinigameTitle: 'Rota Dinâmica do GPS',
    executionTime: 11,
    bonusChance: 15,
  },
  {
    id: 'mechanic_job',
    name: 'Mecânico de Garagem',
    description: 'Faça alinhamento, troque o óleo e prepare motores AP turbinados na oficina local.',
    baseReward: 180,
    xpReward: 55,
    energyCost: 18,
    requiredVehicleId: null,
    requiredLicense: 'none',
    xpRequired: 350,
    levelRequired: 3,
    icon: 'Wrench',
    activeMinigameTitle: 'Consertar Motores & Alinhamento',
    executionTime: 11,
    bonusChance: 18,
  },
  {
    id: 'taxi_job',
    name: 'Taxista do Ponto Central',
    description: 'Trabalhe no ponto de táxi central levando executivos e turistas no táxi amarelo.',
    baseReward: 250,
    xpReward: 70,
    energyCost: 20,
    requiredVehicleId: 'spin_taxi', // Requires Taxi or better
    requiredLicense: 'driver',
    xpRequired: 600,
    levelRequired: 4,
    icon: 'CarFront',
    activeMinigameTitle: 'Bandeira 2 a Mil',
    executionTime: 10,
    bonusChance: 22,
  },
  {
    id: 'police_job',
    name: 'Policial Militar',
    description: 'Faça patrulhamento preventivo, atenda ocorrências de rádio e persiga infratores.',
    baseReward: 400,
    xpReward: 130,
    energyCost: 25,
    requiredVehicleId: null,
    requiredLicense: 'driver',
    xpRequired: 1200,
    levelRequired: 5,
    icon: 'Shield',
    activeMinigameTitle: 'Perseguir Infratores na Via',
    executionTime: 9,
    bonusChance: 25,
  },
  {
    id: 'trucker_job',
    name: 'Caminhoneiro Autônomo',
    description: 'Transporte cargas pesadas pelas rodovias estaduais, escapando de buracos e pedágios.',
    baseReward: 600,
    xpReward: 190,
    energyCost: 35,
    requiredVehicleId: 'scania_113', // Requires Truck
    requiredLicense: 'truck',
    xpRequired: 2000,
    levelRequired: 6,
    icon: 'Truck',
    activeMinigameTitle: 'Controle de Carga nas Curvas',
    executionTime: 8,
    bonusChance: 30,
  },
  {
    id: 'doctor_job',
    name: 'Médico do SAMU',
    description: 'Atenda chamados de urgência e realize reanimações cardíacas rápidas para salvar pacientes.',
    baseReward: 900,
    xpReward: 380,
    energyCost: 40,
    requiredVehicleId: null,
    requiredLicense: 'driver',
    xpRequired: 4500,
    levelRequired: 8,
    icon: 'Heart',
    activeMinigameTitle: 'Reanimar Paciente Cardíaco',
    executionTime: 7,
    bonusChance: 35,
  },
];

export function getXpForNextLevel(lvl: number): number {
  return lvl * 180 + Math.pow(lvl, 2) * 80;
}

export interface EconomyEvent {
  id: 'crise_economica' | 'greve_caminhoneiros' | 'aumento_combustivel' | 'promocao_imoveis' | 'corridas_ilegais' | 'operacao_policial';
  name: string;
  description: string;
  durationSeconds: number;
  maxDurationSeconds: number;
  effectsDescription: string;
  colorClass: string;
  icon: string;
}

export const ECONOMY_EVENTS: EconomyEvent[] = [
  {
    id: 'crise_economica',
    name: 'Crise Econômica',
    description: 'A inflação disparou e os mercados de ações despencaram na capital.',
    durationSeconds: 120,
    maxDurationSeconds: 120,
    effectsDescription: '📉 -30% em TODOS os Salários e -30% nos Rendimentos Passivos de Empresas.',
    colorClass: 'red',
    icon: '📉'
  },
  {
    id: 'greve_caminhoneiros',
    name: 'Greve dos Caminhoneiros',
    description: 'Bloqueio nacional das estradas cortou o abastecimento industrial!',
    durationSeconds: 120,
    maxDurationSeconds: 120,
    effectsDescription: '🚛 +100% de Salário para Caminhoneiro • -40% de Salário em outras Profissões devido à quebra logística.',
    colorClass: 'amber',
    icon: '🚛'
  },
  {
    id: 'aumento_combustivel',
    name: 'Tarifaço de Combustíveis',
    description: 'Os preços da Gasolina e Diesel dispararam nos postos de combustíveis.',
    durationSeconds: 120,
    maxDurationSeconds: 120,
    effectsDescription: '⛽ Profissões de veículo (exceto entrega de bike) consomem +5 Fadiga e recebem -20% de Salário devido ao combustível caro.',
    colorClass: 'orange',
    icon: '⛽'
  },
  {
    id: 'promocao_imoveis',
    name: 'Mega Feirão Imobiliário',
    description: 'Construtoras e corretores do Rio lançaram feirões com isenção fiscal!',
    durationSeconds: 120,
    maxDurationSeconds: 120,
    effectsDescription: '🏠 Desconto de -25% em DINHEIRO em todas as compras de Escrituras e Propriedades na Imobiliária.',
    colorClass: 'emerald',
    icon: '🏠'
  },
  {
    id: 'corridas_ilegais',
    name: 'Rachas e Corridas Ilegais',
    description: 'Corredores clandestinos fecharam vias públicas para realizar disputas motorizadas.',
    durationSeconds: 120,
    maxDurationSeconds: 120,
    effectsDescription: '🏎️ Lucros dobrados (+100%) no Racha de Rua • Chance de sucesso criminal expandida em +15% para todas as atividades.',
    colorClass: 'purple',
    icon: '🏎️'
  },
  {
    id: 'operacao_policial',
    name: 'Operação Policial da PMERJ',
    description: 'Intervenções táticas massivas e batidas de segurança em todas as divisões do Rio.',
    durationSeconds: 120,
    maxDurationSeconds: 120,
    effectsDescription: '👮‍♂️ Saldo de planta-extra duplicado (+100%) para Polícia • Atividades de crime sofrem penalidade de -25% de sucesso, com multas e sentenças de prisão duplicadas!',
    colorClass: 'blue',
    icon: '👮‍♂️'
  }
];

export interface NewsComment {
  id: string;
  authorName: string;
  authorHandle: string;
  authorAvatar: string;
  content: string;
  timestamp: string;
}

export interface NewsPost {
  id: string;
  author: {
    name: string;
    handle: string;
    avatar: string;
    verified: boolean;
    role: 'prefeito' | 'pm' | 'banco' | 'imobiliaria' | 'cidadao' | 'submundo' | 'imprensa';
  };
  title: string;
  content: string;
  category: 'noticias' | 'eventos' | 'prisoes' | 'promocoes' | 'acidentes' | 'crises';
  timestamp: string;
  likes: number;
  comments: NewsComment[];
  hasLiked?: boolean;
  economyImpact?: {
    eventId?: string;
    description: string;
  };
  promoted?: boolean;
}

