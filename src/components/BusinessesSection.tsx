import React, { useState } from 'react';
import { BUSINESSES, PROPERTIES, Business, PlayerState, EconomyEvent } from '../types';
import { playSound } from '../utils/audio';
import { 
  Plus, 
  TrendingUp, 
  Sparkles, 
  Lock, 
  Droplet, 
  Wrench,
  ShoppingBag, 
  Fuel, 
  Truck, 
  Store,
  Coins,
  Users,
  Briefcase,
  ArrowUpRight,
  Activity,
  Award,
  Info,
  DollarSign
} from 'lucide-react';

interface BusinessesSectionProps {
  player: PlayerState;
  activeEvent?: EconomyEvent | null;
  onBuyBusiness: (business: Business) => void;
  onUpgradeBusiness: (businessId: string, upgradeCost: number) => void;
  onCollectBusinessProfits: (businessId: string, amount: number) => void;
  onHireEmployee: (businessId: string, cost: number) => void;
  accumulatedProfits: { [id: string]: number };
}

export default function BusinessesSection({
  player,
  activeEvent,
  onBuyBusiness,
  onUpgradeBusiness,
  onCollectBusinessProfits,
  onHireEmployee,
  accumulatedProfits,
}: BusinessesSectionProps) {
  // Use active tab within Businesses: catalog of investable business vs admin console
  const [panelView, setPanelView] = useState<'admin' | 'catalog'>('admin');

  // Helper to calculate upgrade cost
  const getUpgradeCost = (business: Business, currentLvl: number) => {
    return Math.floor(business.price * 0.7 * Math.pow(business.upgradeCostFactor, currentLvl));
  };

  // Helper to calculate employee cost
  const getEmployeeHireCost = (business: Business, currentEmployees: number) => {
    return Math.floor(business.price * 0.35 * Math.pow(1.35, currentEmployees));
  };

  // Helper to calculate current income per minute
  const getIncomePerMinute = (business: Business, currentLvl: number, employeesCount: number) => {
    const employeeMultiplier = 1 + (employeesCount * 0.20); // +20% bonus per worker
    
    let income = Math.floor(business.revenuePerCycle * currentLvl * employeeMultiplier);

    if (activeEvent?.id === 'crise_economica') {
      income = Math.floor(income * 0.7); // reduced by 30% during crisis
    }
    return income;
  };

  const handleBuy = (business: Business) => {
    if (player.cash < business.price) {
      playSound('error');
      alert(`Capital insuficiente para investir nesta empresa! Você precisa de R$ ${business.price.toLocaleString('pt-BR')} para começar.`);
      return;
    }
    playSound('cash');
    onBuyBusiness(business);
  };

  const handleUpgrade = (business: Business, currentLvl: number) => {
    const cost = getUpgradeCost(business, currentLvl);
    if (player.cash < cost) {
      playSound('error');
      alert(`Você não tem dinheiro suficiente para esta reforma! Custo: R$ ${cost.toLocaleString('pt-BR')}`);
      return;
    }
    playSound('success');
    onUpgradeBusiness(business.id, cost);
  };

  const handleHire = (business: Business, employeesCount: number) => {
    const cost = getEmployeeHireCost(business, employeesCount);
    if (player.cash < cost) {
      playSound('error');
      alert(`Capital insuficiente para recrutar e treinar! Custo: R$ ${cost.toLocaleString('pt-BR')}`);
      return;
    }
    playSound('success');
    onHireEmployee(business.id, cost);
  };

  const handleCollect = (id: string, amount: number) => {
    if (amount <= 0.05) {
      playSound('error');
      alert('Aguarde o caixa acumular um valor relevante para coletar!');
      return;
    }
    playSound('cash');
    onCollectBusinessProfits(id, amount);
  };

  const handleCollectAll = () => {
    let collectedSomething = false;
    Object.keys(player.ownedBusinesses).forEach(id => {
      const amount = accumulatedProfits[id] || 0;
      if (amount > 0.05) {
        onCollectBusinessProfits(id, amount);
        collectedSomething = true;
      }
    });

    if (collectedSomething) {
      playSound('cash');
    } else {
      playSound('error');
      alert('Não há lucros suficientes a serem recolhidos em nenhuma empresa no momento.');
    }
  };

  const getBusinessIcon = (id: string) => {
    switch (id) {
      case 'lava_jato': return <Droplet className="h-5 w-5 text-cyan-400" />;
      case 'oficina': return <Wrench className="h-5 w-5 text-amber-500" />;
      case 'mercado_bairro': return <ShoppingBag className="h-5 w-5 text-purple-400" />;
      case 'posto_combustivel': return <Fuel className="h-5 w-5 text-blue-400" />;
      case 'transportadora': return <Truck className="h-5 w-5 text-emerald-400" />;
      case 'concessionaria': return <Store className="h-5 w-5 text-rose-400" />;
      default: return <Briefcase className="h-5 w-5 text-zinc-400" />;
    }
  };

  const getBusinessEmoji = (id: string) => {
    switch (id) {
      case 'lava_jato': return '🧼';
      case 'oficina': return '🔧';
      case 'mercado_bairro': return '🛒';
      case 'posto_combustivel': return '⛽';
      case 'transportadora': return '🚚';
      case 'concessionaria': return '🏎️';
      default: return '💼';
    }
  };

  // State calculations
  const ownedCount = Object.keys(player.ownedBusinesses).length;

  let totalIncomePerMin = 0;
  let totalEmployees = 0;
  let totalPendingCollectable = 0;

  Object.keys(player.ownedBusinesses).forEach(id => {
    const b = BUSINESSES.find(item => item.id === id);
    const ownedData = player.ownedBusinesses[id];
    const lvl = ownedData.level;
    const eps = ownedData.employeesCount || 0;
    if (b) {
      totalIncomePerMin += getIncomePerMinute(b, lvl, eps);
      totalEmployees += eps;
    }
    totalPendingCollectable += accumulatedProfits[id] || 0;
  });

  return (
    <div id="businesses-section-container" className="w-full space-y-6 font-sans">

      {/* ACTIVE EVENT SYSTEM NOTIFICATION */}
      {activeEvent && activeEvent.id === 'crise_economica' && (
        <div id="businesses-crisis-alert" className="p-4 rounded-xl border border-red-900/50 bg-red-950/40 text-red-300 text-xs leading-relaxed shadow-lg flex items-center gap-3 animate-pulse">
          <span className="text-xl">📉</span>
          <div>
            <strong className="uppercase font-extrabold text-white">{activeEvent.name}</strong>
            <p className="text-zinc-350 mt-0.5">{activeEvent.description}</p>
            <p className="font-bold text-red-400 mt-1">{activeEvent.effectsDescription}</p>
          </div>
        </div>
      )}
      
      {/* Dynamic Header Metrics Dashboard */}
      <div id="company-main-display" className="rounded-2xl border border-zinc-800 bg-zinc-950/85 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1">
          <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full text-emerald-400 font-bold uppercase tracking-widest leading-none">
            Sistema de Empresas Cidade RP
          </span>
          <h3 className="text-xl font-extrabold text-white uppercase tracking-tight mt-2 font-display">
            🏢 Painel Diretor de Corporações
          </h3>
          <p className="text-zinc-400 text-xs mt-1">
            Reúna capitais de rua e de frete e invista em negócios de escala. Compre franquias, contrate profissionais e faça reformas para expandir permanentemente a sua fortuna.
          </p>
        </div>

        <div className="grid grid-cols-2 md:flex md:items-center gap-4 shrink-0">
          <div className="bg-zinc-900 border border-zinc-850 px-4 py-3.5 rounded-xl font-mono text-center md:text-right shrink-0">
            <span className="text-[10px] text-zinc-500 block font-sans uppercase">Fluxo Acumulado</span>
            <strong className="text-xl font-bold text-emerald-400">
              R$ {totalIncomePerMin.toLocaleString('pt-BR')}/min
            </strong>
          </div>

          <div className="bg-zinc-900 border border-zinc-850 px-4 py-3.5 rounded-xl font-mono text-center md:text-right shrink-0">
            <span className="text-[10px] text-zinc-500 block font-sans uppercase">Funcionários Ativos</span>
            <strong className="text-xl font-bold text-zinc-100">
              {totalEmployees} profissionais
            </strong>
          </div>
        </div>
      </div>

      {/* Control Switcher panel */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-zinc-850 pb-4">
        <div className="flex bg-zinc-950 p-1 rounded-xl gap-2 w-full sm:w-auto border border-zinc-900 overflow-x-auto whitespace-nowrap [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <button
            id="panel-btn-admin"
            onClick={() => {
              playSound('click');
              setPanelView('admin');
            }}
            className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-lg text-xs font-bold leading-none tracking-wider uppercase transition-all duration-300 ${
              panelView === 'admin'
                ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-black shadow-lg shadow-green-500/10'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            📊 Painel de Gestão ({ownedCount})
          </button>
          <button
            id="panel-btn-catalog"
            onClick={() => {
              playSound('click');
              setPanelView('catalog');
            }}
            className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-lg text-xs font-bold leading-none tracking-wider uppercase transition-all duration-300 ${
              panelView === 'catalog'
                ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-black shadow-lg shadow-green-500/10'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            🏪 Adquirir Empresas
          </button>
        </div>

        {panelView === 'admin' && ownedCount > 0 && (
          <button
            id="btn-collect-all-profits"
            onClick={handleCollectAll}
            className="w-full sm:w-auto bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-extrabold text-[11px] uppercase tracking-wider py-2 px-4 rounded-xl shadow-md shadow-amber-500/10 transition hover:from-yellow-400 hover:to-amber-400 flex items-center justify-center gap-1.5 cursor-pointer leading-none"
          >
            <Coins className="h-4 w-4" /> Recolher Lucro Geral: R$ {totalPendingCollectable.toFixed(2)}
          </button>
        )}
      </div>

      {panelView === 'admin' ? (
        /* ======================== 1. ADMINISTRATIVE DASHBOARD PANEL ======================== */
        <div id="admin-dashboard-container" className="space-y-6">
          {ownedCount === 0 ? (
            /* Empty State for Admin Tab */
            <div className="rounded-2xl border border-dashed border-zinc-850 p-12 text-center max-w-lg mx-auto space-y-4">
              <div className="mx-auto h-12 w-12 rounded-full bg-zinc-905 border border-zinc-800 text-zinc-500 flex items-center justify-center text-xl">
                ⚙️
              </div>
              <div className="space-y-1">
                <h4 className="text-zinc-200 font-bold text-sm uppercase">Nenhum Registro de Propriedade Comercial</h4>
                <p className="text-zinc-500 text-xs leading-relaxed">
                  Para gerenciar frotas, equipes de lava-jatos ou estoques de supermercados, você precisará arrematar a escritura e o contrato de uma empresa disponível.
                </p>
              </div>
              <button
                onClick={() => {
                  playSound('click');
                  setPanelView('catalog');
                }}
                className="inline-flex bg-emerald-500 text-black font-extrabold text-[11px] uppercase tracking-widest px-4 py-2.5 rounded-lg hover:bg-emerald-400 transition"
              >
                Inaugurar Minha Primeira Empresa
              </button>
            </div>
          ) : (
            /* List of Owned Companies with Advanced Administrative controls */
            <div id="owned-companies-admin-grid" className="grid grid-cols-1 gap-6">
              {BUSINESSES.filter(b => !!player.ownedBusinesses[b.id]).map(b => {
                const ownedData = player.ownedBusinesses[b.id];
                const currentLvl = ownedData.level;
                const epsCount = ownedData.employeesCount || 0;
                
                const upgradeCost = getUpgradeCost(b, currentLvl);
                const employeeCost = getEmployeeHireCost(b, epsCount);
                const currentIncome = getIncomePerMinute(b, currentLvl, epsCount);
                const baseIncome = getIncomePerMinute(b, 1, 0);

                const accumulatedInSafe = accumulatedProfits[b.id] || 0;

                const canAffordUpgrade = player.cash >= upgradeCost;
                const canAffordEmployee = player.cash >= employeeCost;

                return (
                  <div 
                    key={b.id} 
                    className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 flex flex-col xl:flex-row gap-6 justify-between transition-all hover:bg-zinc-950/90"
                  >
                    
                    {/* Brand Status & General stats */}
                    <div className="space-y-4 flex-1">
                      <div className="flex items-start gap-3.5">
                        <div className="h-12 w-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-2xl shadow-inner shrink-0">
                          {getBusinessEmoji(b.id)}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-lg font-black text-white leading-tight uppercase tracking-tight">{b.name}</h4>
                            <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                              Inaugurada Ativa
                            </span>
                          </div>
                          
                          <p className="text-zinc-500 text-xs mt-0.5 leading-relaxed">
                            {b.description}
                          </p>
                        </div>
                      </div>

                      {/* Financial statistics dashboard widgets */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="rounded-xl bg-zinc-900/40 border border-zinc-900 px-4 py-3 font-mono">
                          <span className="text-[9px] text-zinc-500 block uppercase font-sans">Nível Local</span>
                          <strong className="text-zinc-100 flex items-center gap-1">
                            <Award className="h-3.5 w-3.5 text-amber-500" /> Lvl {currentLvl}
                          </strong>
                        </div>

                        <div className="rounded-xl bg-zinc-900/40 border border-zinc-900 px-4 py-3 font-mono">
                          <span className="text-[9px] text-zinc-500 block uppercase font-sans">Equipe Contratada</span>
                          <strong className="text-zinc-100 flex items-center gap-1">
                            <Users className="h-3.5 w-3.5 text-indigo-400" /> {epsCount} funcs
                          </strong>
                        </div>

                        <div className="rounded-xl bg-zinc-900/40 border border-zinc-900 px-4 py-3 font-mono">
                          <span className="text-[9px] text-zinc-500 block uppercase font-sans">Receita Passiva</span>
                          <strong className="text-emerald-400 flex items-center gap-1">
                            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" /> R$ {currentIncome.toLocaleString('pt-BR')}/m
                          </strong>
                        </div>

                        <div className="rounded-xl bg-zinc-900/40 border border-zinc-900 px-4 py-3 font-mono text-right relative overflow-hidden">
                          <span className="text-[9px] text-zinc-500 block uppercase font-sans">Caixa Forte</span>
                          <strong className="text-yellow-400 block break-all text-xs sm:text-sm">
                            R$ {accumulatedInSafe.toFixed(2)}
                          </strong>
                        </div>
                      </div>

                      {/* Bonus breakdown guide */}
                      <div className="rounded-xl bg-zinc-950 border border-zinc-900 px-3 py-2 text-[10px] text-zinc-500 flex items-center gap-1.5">
                        <Info className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                        <span>
                          Faturamento Base: <b className="font-extrabold text-zinc-300">R$ {baseIncome.toFixed(0)}/min</b> • Bônus de Empresa Nível {currentLvl}: <b className="font-extrabold text-zinc-300">+{currentLvl * 100}%</b> • Funcionários (+20% cada): <b className="font-extrabold text-green-400">+{epsCount * 20}%</b>
                        </span>
                      </div>
                    </div>

                    {/* Operational controls */}
                    <div className="flex flex-col justify-end gap-3 w-full xl:w-72 shrink-0 border-t xl:border-t-0 xl:border-l border-zinc-900 pt-4 xl:pt-0 xl:pl-6">
                      
                      {/* Individual collect option */}
                      <button
                        id={`btn-collect-each-${b.id}`}
                        onClick={() => handleCollect(b.id, accumulatedInSafe)}
                        disabled={accumulatedInSafe <= 0.05}
                        className={`w-full py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition ${
                          accumulatedInSafe > 0.05
                            ? 'bg-yellow-500 hover:bg-yellow-450 text-black cursor-pointer shadow-md'
                            : 'bg-zinc-900 text-zinc-600 border border-zinc-850 cursor-not-allowed'
                        }`}
                      >
                        <Coins className="h-4 w-4" /> Sacar Cofre: R$ {accumulatedInSafe.toFixed(2)}
                      </button>

                      
                      <div className="mt-2">
                        <button
                          onClick={() => handleCollect(business.id)}
                          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition active:scale-95 mb-2"
                        >
                          💰 Coletar Faturamento
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-sans">

                        {/* Upgrade/Reforma section */}
                        <div className="space-y-1.5">
                          <span className="text-[9px] text-zinc-500 font-mono uppercase block">Sede Comercial</span>
                          <button
                            id={`btn-upgrade-admin-${b.id}`}
                            onClick={() => handleUpgrade(b, currentLvl)}
                            className={`w-full py-2.5 px-2 rounded-xl border font-bold text-[10px] uppercase tracking-wider flex flex-col items-center justify-center gap-1 transition ${
                              canAffordUpgrade
                                ? 'border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 cursor-pointer'
                                : 'border-zinc-900 bg-zinc-950 text-zinc-600 cursor-not-allowed'
                            }`}
                          >
                            <span className="text-[9px] text-zinc-400 block font-normal leading-none mb-0.5">Reformar Sede</span>
                            <span className="text-amber-500 font-mono">R$ {upgradeCost.toLocaleString('pt-BR')}</span>
                          </button>
                        </div>

                        {/* Hire employee section */}
                        <div className="space-y-1.5">
                          <span className="text-[9px] text-zinc-500 font-mono uppercase block">Contratações</span>
                          <button
                            id={`btn-hire-employee-${b.id}`}
                            onClick={() => handleHire(b, epsCount)}
                            className={`w-full py-2.5 px-2 rounded-xl border font-bold text-[10px] uppercase tracking-wider flex flex-col items-center justify-center gap-1 transition ${
                              canAffordEmployee
                                ? 'border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 cursor-pointer'
                                : 'border-zinc-900 bg-zinc-950 text-zinc-600 cursor-not-allowed'
                            }`}
                          >
                            <span className="text-[9px] text-zinc-400 block font-normal leading-none mb-0.5">Contratar Staff</span>
                            <span className="text-indigo-400 font-mono">R$ {employeeCost.toLocaleString('pt-BR')}</span>
                          </button>
                        </div>
                      </div>

                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ======================== 2. GENERAL REGISTER & PURCHASE CATALOG ======================== */
        <div id="businesses-catalog-grid" className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in text-white">
          {BUSINESSES.map(b => {
            const ownedData = player.ownedBusinesses[b.id];
            const isOwned = !!ownedData;
            const currentLvl = isOwned ? ownedData.level : 0;
            const epsCount = isOwned ? ownedData.employeesCount || 0 : 0;
            
            const upgradeCost = isOwned ? getUpgradeCost(b, currentLvl) : b.price;
            const incomePerMin = getIncomePerMinute(b, isOwned ? currentLvl : 1, epsCount);
            const canAfford = player.cash >= (isOwned ? upgradeCost : b.price);
            
            const isLockedByProperty = b.requiredPropertyId ? !player.ownedProperties.includes(b.requiredPropertyId) : false;
            const requiredPropertyDetails = b.requiredPropertyId ? PROPERTIES.find(p => p.id === b.requiredPropertyId) : null;

            return (
              <div
                key={b.id}
                className={`rounded-2xl border bg-zinc-950/75 p-5 flex flex-col justify-between transition-all duration-300 ${
                  isOwned
                    ? `border-l-4 ${b.color}`
                    : isLockedByProperty
                    ? 'border-zinc-900 bg-zinc-950/15 opacity-80'
                    : 'border-zinc-850 hover:border-zinc-700 hover:bg-zinc-900/10'
                }`}
              >
                <div className="space-y-4">
                  {/* Business Header visual */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-xl bg-zinc-900 border border-zinc-850 flex items-center justify-center text-xl shrink-0">
                        {getBusinessIcon(b.id)}
                      </div>
                      <div>
                        <h4 className="text-base font-extrabold text-white leading-tight flex items-center gap-1.5 font-display">
                          {b.name}
                          {isLockedByProperty && <Lock className="h-3.5 w-3.5 text-rose-500 shrink-0" />}
                        </h4>
                        {isOwned ? (
                          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-mono">
                            Comprada • Nível <strong className="text-emerald-400 leading-none">{currentLvl}</strong>
                          </span>
                        ) : isLockedByProperty ? (
                          <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider flex items-center gap-1">
                            🔒 Requer {requiredPropertyDetails?.name}
                          </span>
                        ) : (
                          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                            À Venda para Investimento
                          </span>
                        )}
                      </div>
                    </div>

                    {isOwned ? (
                      <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-555/20 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                        Adquirida
                      </span>
                    ) : isLockedByProperty ? (
                      <span className="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                        Bloqueado
                      </span>
                    ) : (
                      <strong className="text-emerald-400 font-bold text-sm font-mono">
                        R$ {b.price.toLocaleString('pt-BR')}
                      </strong>
                    )}
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed min-h-[36px]">
                    {b.description}
                  </p>

                  {/* Pricing or Income Projections display */}
                  {isOwned ? (
                    <div className="grid grid-cols-2 gap-4 py-2.5 px-3 bg-zinc-900/40 border border-zinc-900 rounded-xl font-mono text-[11px]">
                      <div>
                        <span className="text-[8px] text-zinc-500 block uppercase">Nível / Staff</span>
                        <strong className="text-zinc-100">Lvl {currentLvl} ({epsCount} funcs)</strong>
                      </div>
                      <div className="text-right">
                        <span className="text-[8px] text-zinc-500 block uppercase">Faturamento Passivo</span>
                        <strong className="text-emerald-400">R$ {incomePerMin.toFixed(0)}/min</strong>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 py-2.5 px-3 bg-zinc-900/20 border border-zinc-900/60 rounded-xl font-mono text-[11px] text-zinc-400">
                      <div>
                        <span className="text-[8px] block uppercase text-zinc-500 font-sans">Retorno por minuto</span>
                        <strong className="text-emerald-400">R$ {b.revenuePerCycle).toFixed(0)}/ciclo</strong>
                      </div>
                      <div>
                        <span className="text-[8px] block uppercase text-zinc-500 font-sans">Reforma Multiplicadora</span>
                        <strong className="text-amber-500">+{Math.floor(b.upgradeCostFactor * 100)}% Lvl</strong>
                      </div>
                    </div>
                  )}

                  {/* Unlock company notification message if exists */}
                  {b.requiredPropertyId && !isOwned && (
                    <div className="flex items-center gap-1.5 px-2 py-1.5 border border-zinc-900 bg-zinc-950 rounded-xl text-[10px]">
                      <Briefcase className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                      <span className="text-zinc-400">
                        Liberação com escritura do imóvel de: <b className="font-extrabold text-white">{requiredPropertyDetails?.name || 'Imóvel'}</b>
                      </span>
                    </div>
                  )}
                </div>

                {/* Buy Button inside footer */}
                <div className="mt-5 pt-3 border-t border-zinc-900">
                  {isOwned ? (
                    <button
                      id={`btn-go-admin-${b.id}`}
                      onClick={() => {
                        playSound('click');
                        setPanelView('admin');
                      }}
                      className="w-full bg-zinc-900 cursor-pointer text-zinc-300 hover:text-white hover:bg-zinc-850 font-bold text-xs py-3 rounded-xl border border-zinc-800 uppercase tracking-wider flex items-center justify-center gap-1.5 transition"
                    >
                      <Plus className="h-4 w-4 text-emerald-400" /> Ir para Painel Administrativo
                    </button>
                  ) : isLockedByProperty ? (
                    <div className="w-full bg-red-950/20 border border-red-900/30 text-rose-400/95 rounded-lg py-3 px-4 text-xs font-bold flex items-center justify-center gap-2 font-sans select-none pb-3">
                      <Lock className="h-4 w-4 text-rose-500 shrink-0" />
                      Requer imóvel: {requiredPropertyDetails?.name}
                    </div>
                  ) : (
                    <button
                      id={`btn-buy-catalog-${b.id}`}
                      onClick={() => handleBuy(b)}
                      className={`w-full cursor-pointer rounded-xl py-3 font-extrabold text-[11px] tracking-wider uppercase transition-all duration-350 flex items-center justify-center gap-1.5 ${
                        canAfford
                          ? 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-md shadow-emerald-500/10 active:scale-[0.98]'
                          : 'bg-zinc-900 border border-zinc-850 text-zinc-500 cursor-not-allowed'
                      }`}
                    >
                      {canAfford ? `Adquirir por R$ ${b.price.toLocaleString('pt-BR')}` : `R$ ${b.price.toLocaleString('pt-BR')} (Capital Insuficiente)`}
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
