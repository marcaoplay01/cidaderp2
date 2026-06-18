import React, { useState, useEffect } from 'react';
import { PROPERTIES, Property, PlayerState, EconomyEvent } from '../types';
import { playSound } from '../utils/audio';
import { 
  Building, 
  Home, 
  Bed, 
  Check, 
  Zap, 
  Clock, 
  Hourglass,
  Coins,
  TrendingUp,
  Trash2,
  Sparkles,
  Lock,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface PropertiesSectionProps {
  player: PlayerState;
  activeEvent?: EconomyEvent | null;
  onBuyProperty: (property: Property) => void;
  onSelectProperty: (propertyId: string) => void;
  onRestComplete: (energyRestored: number) => void;
  onSellProperty: (property: Property) => void;
}

export default function PropertiesSection({ 
  player, 
  activeEvent,
  onBuyProperty, 
  onSelectProperty, 
  onRestComplete,
  onSellProperty
}: PropertiesSectionProps) {
  const [activeTab, setActiveTab] = useState<'dealership' | 'portfolio'>('dealership');
  const [sleepingMode, setSleepingMode] = useState<'none' | 'nap' | 'deep'>('none');
  const [sleepSecondsLeft, setSleepSecondsLeft] = useState(0);

  const isVipEligible = (playerVip?: 'bronze' | 'prata' | 'ouro' | null, requiredVip?: 'bronze' | 'prata' | 'ouro' | null) => {
    if (!requiredVip) return true;
    if (!playerVip) return false;
    const tiers = { bronze: 1, prata: 2, ouro: 3 };
    return tiers[playerVip] >= tiers[requiredVip];
  };

  const handleBuy = (property: Property) => {
    if (property.vipRequired) {
      if (!isVipEligible(player.vipLevel, property.vipRequired)) {
        playSound('error');
        alert(`Este imóvel é exclusivo da assinatura VIP ${property.vipRequired.toUpperCase()} ou superior! Visite a Loja Premium VIP para assinar.`);
        return;
      }
    } else {
      let finalPrice = property.price;
      if (activeEvent?.id === 'promocao_imoveis') {
        finalPrice = Math.floor(finalPrice * 0.75); // 25% discount
      }
      if (player.cash < finalPrice) {
        playSound('error');
        alert(`Capital insuficiente! Você precisa de R$ ${finalPrice.toLocaleString('pt-BR')} para faturar essa escritura.`);
        return;
      }
    }
    playSound('cash');
    onBuyProperty(property);
  };

  const handleSelectHome = (id: string) => {
    playSound('click');
    onSelectProperty(id);
  };

  const handleSell = (property: Property) => {
    onSellProperty(property);
  };

  // Rest actions
  const triggerRest = (type: 'nap' | 'deep') => {
    if (player.energy >= player.maxEnergy) {
      playSound('error');
      alert('Sua energia já está no máximo! Pronto para a correria.');
      return;
    }
    
    playSound('click');
    setSleepingMode(type);
    
    const seconds = type === 'nap' ? 3 : 7;
    setSleepSecondsLeft(seconds);
  };

  // Sleeping countdown timer
  useEffect(() => {
    if (sleepingMode === 'none') return;

    if (sleepSecondsLeft <= 0) {
      // Resting completed!
      const currentProp = PROPERTIES.find(p => p.id === player.currentPropertyId) || PROPERTIES[0];
      const maxEnergyAllowed = player.maxEnergy;
      
      let amountToRestore = 35; // nap base
      if (sleepingMode === 'deep') {
        amountToRestore = maxEnergyAllowed; // fill to full
      }

      playSound('success');
      onRestComplete(amountToRestore);
      setSleepingMode('none');
      return;
    }

    const timer = setTimeout(() => {
      setSleepSecondsLeft(prev => prev - 1);
      playSound('work'); // sound heartbeat sleep beep
    }, 1000);

    return () => clearTimeout(timer);
  }, [sleepSecondsLeft, sleepingMode, player.currentPropertyId, player.maxEnergy, onRestComplete]);

  const activeProperty = PROPERTIES.find(p => p.id === player.currentPropertyId) || PROPERTIES[0];

  // Calculate sum of passive income from owned properties
  const totalOwnedPassiveIncomePerMin = player.ownedProperties.reduce((sum, id) => {
    const prop = PROPERTIES.find(p => p.id === id);
    return sum + (prop && prop.passiveIncome ? prop.passiveIncome * 60 : 0);
  }, 0);

  return (
    <div id="properties-section-container" className="w-full space-y-6 font-sans">
      
      {/* Portfolio Rent Banner */}
      <div id="portfolio-rent-billboard" className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full text-indigo-400 font-bold uppercase tracking-widest leading-none">
            Rendimentos Imobiliários
          </span>
          <h3 className="text-xl font-extrabold text-white uppercase tracking-tight mt-2 font-display">
            🏠 Sistema de Habitação & Aluguéis
          </h3>
          <p className="text-zinc-500 text-xs">
            Compre kitnets, casas e sobrados para aumentar permanentemente sua energia máxima, dormir confortavelmente e faturar renda de aluguel por segundo!
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 px-5 py-4 rounded-xl font-mono text-right shrink-0">
          <span className="text-[10px] text-zinc-400 block font-sans uppercase">Total de Aluguéis Ganhos</span>
          <strong className="text-2xl font-bold text-emerald-400">
            + R$ {totalOwnedPassiveIncomePerMin.toLocaleString('pt-BR')}/min
          </strong>
        </div>
      </div>

      {/* Dormitory & Rest Cabin */}
      <div id="resting-cabin-card" className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 p-8 text-7xl opacity-[0.02] pointer-events-none">
          🛏️
        </div>
        
        <div>
          <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full text-indigo-400 font-bold uppercase tracking-widest leading-none">
            Estação de Descanso • Residência Ativa: {activeProperty.name}
          </span>
          <h3 className="text-lg font-extrabold text-white uppercase tracking-tight mt-2 flex items-center gap-1.5 font-display">
            <Bed className="h-5 w-5 text-indigo-400" /> Dormitório e Repouso
          </h3>
          <p className="text-zinc-400 text-xs mt-1">
            Descanse no seu imóvel ativo para recarregar sua vitalidade e energia de trabalho rapidamente.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          {/* Quick Nap */}
          <div className="rounded-xl bg-zinc-900/40 border border-zinc-850 p-4 space-y-3">
            <div>
              <h5 className="font-bold text-white text-sm">Cochilo Veloz</h5>
              <p className="text-zinc-400 text-[11px] mt-0.5">Recupera 35 EP. Leva 3 segundos de descanso.</p>
            </div>
            <button
              id="btn-rest-nap"
              disabled={sleepingMode !== 'none'}
              onClick={() => triggerRest('nap')}
              className="w-full bg-zinc-800 cursor-pointer hover:bg-zinc-700 text-white font-bold py-2 px-4 rounded-md text-xs transition duration-200 disabled:opacity-50"
            >
              ☕ Tirar Cochilo
            </button>
          </div>

          {/* Deep Sleep */}
          <div className="rounded-xl bg-zinc-900/40 border border-zinc-850 p-4 space-y-3">
            <div>
              <h5 className="font-bold text-white text-sm font-display flex items-center gap-1">
                Sono Pesado <span className="text-[10px] bg-yellow-500/10 text-yellow-500 border border-yellow-550/20 px-1 py-0.5 rounded uppercase font-bold">Eficiente</span>
              </h5>
              <p className="text-zinc-400 text-[11px] mt-0.5">Restaura 100% da sua energia máxima. Leva 7 segundos de descanso.</p>
            </div>
            <button
              id="btn-rest-deep"
              disabled={sleepingMode !== 'none'}
              onClick={() => triggerRest('deep')}
              className="w-full bg-indigo-600 cursor-pointer hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-md text-xs shadow-md shadow-indigo-600/15 transition duration-200 disabled:opacity-50"
            >
              💤 Sono Profundo
            </button>
          </div>
        </div>

        {/* Home Comfort Metrics display */}
        <div className="mt-4 pt-3 border-t border-zinc-900 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
          <div>
            <span className="text-zinc-500 text-[10px] block font-sans uppercase">Multiplicador Energia</span>
            <strong className="text-indigo-400">+{activeProperty.energyRegenRate} EP/min</strong>
          </div>
          <div>
            <span className="text-zinc-500 text-[10px] block font-sans uppercase">Bônus Capacidade</span>
            <strong className="text-yellow-400">+{activeProperty.maxEnergyBonus} Max EP</strong>
          </div>
          <div>
            <span className="text-zinc-500 text-[10px] block font-sans uppercase">Renda Passiva</span>
            <strong className="text-emerald-400">+ R$ {(activeProperty.passiveIncome * 60).toFixed(0)}/min</strong>
          </div>
        </div>
      </div>

      {/* Switch Hub Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-zinc-900 pb-4">
        <div className="flex bg-zinc-950 p-1 rounded-xl gap-2 w-full sm:w-auto border border-zinc-900 overflow-x-auto whitespace-nowrap [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <button
            id="tab-immobiliaria"
            onClick={() => {
              playSound('click');
              setActiveTab('dealership');
            }}
            className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-lg text-xs font-bold leading-none tracking-wider uppercase transition-all duration-300 ${
              activeTab === 'dealership'
                ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-black shadow-lg shadow-green-500/10'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            🏪 Imobiliária do Rio
          </button>
          <button
            id="tab-portfolio"
            onClick={() => {
              playSound('click');
              setActiveTab('portfolio');
            }}
            className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-lg text-xs font-bold leading-none tracking-wider uppercase transition-all duration-300 relative ${
              activeTab === 'portfolio'
                ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-black shadow-lg shadow-green-500/10'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            🔑 Minhas Escrituras
            <span className="ml-1.5 rounded bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 text-[9px] font-mono text-zinc-300">
              {player.ownedProperties.length}
            </span>
          </button>
        </div>

        <div className="text-right hidden md:block">
          <p className="text-xs text-zinc-500 tracking-tight">
            Compre imóveis para alugar e ganhar dinheiro passivo a cada segundo!
          </p>
        </div>
      </div>

      {activeTab === 'dealership' ? (
        /* IMMOBILIARY CATALOG PANEL */
        <div id="properties-dealership-container" className="space-y-4">
          {activeEvent && activeEvent.id === 'promocao_imoveis' && (
            <div id="properties-promo-alert" className="p-4 rounded-xl border border-emerald-900/50 bg-emerald-950/40 text-emerald-350 text-xs leading-relaxed shadow-lg flex items-center gap-3 animate-pulse">
              <span className="text-xl">🏠</span>
              <div>
                <strong className="uppercase font-extrabold text-white">{activeEvent.name}</strong>
                <p className="text-zinc-300 mt-0.5">{activeEvent.description}</p>
                <p className="font-bold text-emerald-450 mt-1">{activeEvent.effectsDescription}</p>
              </div>
            </div>
          )}
          <div id="properties-dealership-list" className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in text-white">
          {PROPERTIES.map(prop => {
            const alreadyOwned = player.ownedProperties.includes(prop.id);
            const isActiveHome = player.currentPropertyId === prop.id;
            const isVipProp = !!prop.vipRequired;
            const hasVipAccess = isVipProp && isVipEligible(player.vipLevel, prop.vipRequired);
            
            let displayPrice = prop.price;
            let displayOriginalPrice = 0;
            if (activeEvent?.id === 'promocao_imoveis' && prop.price > 0) {
              displayOriginalPrice = prop.price;
              displayPrice = Math.floor(displayPrice * 0.75); // 25% discount
            }
            
            const canAfford = isVipProp ? hasVipAccess : (player.cash >= displayPrice);

            return (
              <div 
                key={prop.id}
                className={`rounded-2xl border p-5 flex flex-col justify-between transition-all duration-300 relative overflow-hidden ${
                  isActiveHome
                    ? 'border-indigo-500 bg-indigo-500/[0.01]'
                    : alreadyOwned
                    ? 'border-emerald-500/40 bg-zinc-950/80 shadow-md'
                    : isVipProp
                    ? 'border-yellow-500/20 shadow-[0_0_20px_rgba(234,179,8,0.02)] hover:border-yellow-500/40 hover:bg-zinc-900/10 bg-zinc-950/80'
                    : 'border-zinc-850 hover:border-zinc-700 hover:bg-zinc-900/10 bg-zinc-950/60'
                }`}
              >
                {/* Visual decoration for premium properties */}
                {isVipProp && (
                  <div className="absolute top-0 right-0 h-16 w-16 bg-gradient-to-bl from-yellow-500/10 to-transparent pointer-events-none rounded-bl-full" />
                )}

                <div className="space-y-4">
                  {/* Title & Comfort label */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className={`h-11 w-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                        isActiveHome ? 'bg-indigo-600 shadow-md shadow-indigo-600/20' : alreadyOwned ? 'bg-emerald-600 text-white' : 'bg-zinc-900 border border-zinc-800 text-zinc-300'
                      }`}>
                        {prop.id === 'street_bench' && '🪵'}
                        {prop.id === 'kitnet_centro' && '🏠'}
                        {prop.id === 'casa_simples' && '🏡'}
                        {prop.id === 'sobrado_bairro' && '🏢'}
                        {prop.id === 'mansao_alphaville' && '🏰'}
                        {prop.id === 'cobertura_luxo' && '🌇'}
                        {prop.id === 'vip_loft' && '🌇'}
                        {prop.id === 'vip_cobertura' && '🏢'}
                        {prop.id === 'vip_island' && '🏝️'}
                      </div>
                      <div>
                        <h5 className="font-extrabold text-white text-base tracking-tight leading-tight">{prop.name}</h5>
                        <span className="text-[10px] px-2 py-0.5 mt-1 block border border-zinc-800 inline-block rounded bg-zinc-900/40 font-mono text-zinc-400 uppercase tracking-tight">
                          Nível: {prop.comfortLabel}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 px-1 font-mono">
                      {isVipProp ? (
                        <span className="bg-yellow-400/15 border border-yellow-400/30 text-yellow-400 text-[10px] uppercase font-black px-2 py-0.5 rounded-md tracking-wider font-mono">
                          👑 VIP {prop.vipRequired?.toUpperCase()}
                        </span>
                      ) : displayPrice > 0 ? (
                        <div className="text-right">
                          {displayOriginalPrice > 0 && (
                            <span className="text-[10px] text-zinc-500 line-through block leading-none mb-0.5">R$ {displayOriginalPrice.toLocaleString('pt-BR')}</span>
                          )}
                          <strong className="text-emerald-400 font-extrabold text-sm block">
                            R$ {displayPrice.toLocaleString('pt-BR')}
                          </strong>
                          {displayOriginalPrice > 0 && (
                            <span className="text-[9px] text-orange-400 font-bold block bg-orange-500/10 px-1 py-0.5 rounded mt-0.5 leading-none">-25% OFF</span>
                          )}
                        </div>
                      ) : (
                        <strong className="text-zinc-500 uppercase text-[10px] bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded font-black">
                          Gratuito
                        </strong>
                      )}
                      
                      {isActiveHome && (
                        <span className="bg-indigo-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider mt-1">
                          Lar Ativo
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed min-h-[40px]">
                    {prop.description}
                  </p>

                  {/* Properties Metrics block */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-3 px-3 bg-zinc-900/40 border border-zinc-900 rounded-xl text-center text-xs font-mono">
                    <div>
                      <span className="text-[9px] text-zinc-500 font-sans block uppercase font-bold text-zinc-400">Energia</span>
                      <strong className="text-indigo-400">+{prop.energyRegenRate} EP/m</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-zinc-500 font-sans block uppercase font-bold text-zinc-400">Max Cap</span>
                      <strong className="text-yellow-400 font-bold">+{prop.maxEnergyBonus} Max</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-zinc-500 font-sans block uppercase font-bold text-zinc-400">Renda Aluguel</span>
                      <strong className="text-emerald-400">R$ {prop.passiveIncome > 0 ? `+${(prop.passiveIncome * 60).toFixed(0)}/m` : 'R$ 0' }</strong>
                    </div>
                  </div>

                  {/* Unlock company notification message if exists */}
                  {prop.unlocksBusinessName && (
                    <div className="flex items-center gap-1.5 px-3 py-2 border border-emerald-950 bg-emerald-500/[0.01] rounded-xl text-[10px]">
                      <Sparkles className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <span className="text-emerald-300">
                        Benefício de Expansão: Desbloqueia compra de <b className="font-extrabold text-white">{prop.unlocksBusinessName}</b>
                      </span>
                    </div>
                  )}
                </div>

                {/* Purchase Button Catalog option */}
                <div className="mt-5 pt-3 border-t border-zinc-900 font-sans">
                  {isActiveHome ? (
                    <div className="text-center font-bold text-xs text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-xl py-3 select-none uppercase tracking-wide">
                      🏠 Seu Lar Ativo Atualmente
                    </div>
                  ) : alreadyOwned ? (
                    <button
                      id={`btn-select-home-${prop.id}`}
                      onClick={() => handleSelectHome(prop.id)}
                      className="w-full cursor-pointer bg-zinc-800 text-zinc-100 hover:bg-zinc-750 font-bold text-xs py-3 rounded-xl border border-zinc-700 uppercase tracking-widest transition duration-200"
                    >
                      🚪 Mudar-se para este Imóvel
                    </button>
                  ) : isVipProp ? (
                    hasVipAccess ? (
                      <button
                        id={`btn-buy-property-${prop.id}`}
                        onClick={() => handleBuy(prop)}
                        className="w-full cursor-pointer rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 text-black hover:from-yellow-400 hover:to-amber-400 font-black py-3 text-xs tracking-wider uppercase transition duration-200 shadow-lg shadow-yellow-500/10 active:scale-[0.98]"
                      >
                        🎁 Resgatar Imóvel VIP (Grátis)
                      </button>
                    ) : (
                      <button
                        disabled
                        className="w-full rounded-xl bg-zinc-900 border border-zinc-950/40 text-zinc-500 font-semibold py-3 text-xs tracking-wider uppercase cursor-not-allowed flex items-center justify-center gap-1"
                      >
                        🔒 Bloqueado (Requer VIP {prop.vipRequired?.toUpperCase()})
                      </button>
                    )
                  ) : (
                    <button
                      id={`btn-buy-property-${prop.id}`}
                      onClick={() => handleBuy(prop)}
                      className={`w-full cursor-pointer rounded-xl py-3 font-extrabold text-xs tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-1.5 ${
                        canAfford
                          ? 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-md shadow-emerald-500/10 active:scale-[0.98]'
                          : 'bg-zinc-900 border border-zinc-800 text-zinc-500 cursor-not-allowed'
                      }`}
                    >
                      {canAfford ? `Comprar por R$ ${displayPrice.toLocaleString('pt-BR')}` : `R$ ${displayPrice.toLocaleString('pt-BR')} (Saldo Insuficiente)`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        </div>
      ) : (
        /* OWNED PROPERTIES (PORTFOLIO) PANEL */
        <div id="properties-portfolio-list" className="space-y-6 animate-fade-in text-white">
          <div className="flex justify-between items-center bg-zinc-950 px-4 py-3.5 border border-zinc-900 rounded-xl text-xs font-sans">
            <span className="text-zinc-400">Total de residências de sua posse:</span>
            <strong className="text-indigo-400 font-mono text-xs font-black uppercase">
              {player.ownedProperties.length} Imóveis Escriturados
            </strong>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PROPERTIES.filter(p => player.ownedProperties.includes(p.id)).map(prop => {
              const isActiveHome = player.currentPropertyId === prop.id;
              const refundCash = Math.floor(prop.price * 0.70);

              return (
                <div 
                  key={prop.id}
                  className={`rounded-2xl border p-5 flex flex-col justify-between transition-all duration-300 ${
                    isActiveHome
                      ? 'border-indigo-500 bg-indigo-500/[0.03] shadow-lg shadow-indigo-500/5'
                      : 'border-zinc-850 bg-zinc-950/70 hover:bg-zinc-900/40 hover:border-zinc-700'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Header values */}
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">
                          {prop.id === 'street_bench' && '🪵'}
                          {prop.id === 'kitnet_centro' && '🏠'}
                          {prop.id === 'casa_simples' && '🏡'}
                          {prop.id === 'sobrado_bairro' && '🏢'}
                          {prop.id === 'mansao_alphaville' && '🏰'}
                          {prop.id === 'cobertura_luxo' && '🌇'}
                        </span>
                        <div>
                          <h5 className="font-extrabold text-white text-base leading-none">{prop.name}</h5>
                          <span className="text-[9px] text-zinc-500 font-mono mt-1 block">CONFORTO: {prop.comfortLabel}</span>
                        </div>
                      </div>

                      {isActiveHome && (
                        <span className="flex items-center gap-1 text-[9px] text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded px-2.5 py-0.5 font-extrabold uppercase tracking-wider">
                          🏠 Equipado Ativo
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-zinc-400">{prop.description}</p>

                    {/* Specs display */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-3 border-t border-b border-zinc-900/60 text-center font-mono text-[11px]">
                      <div>
                        <span className="text-[9px] text-zinc-500 block">Regen EP</span>
                        <strong className="text-indigo-400">+{prop.energyRegenRate} EP</strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-zinc-500 block">Capacidade</span>
                        <strong className="text-yellow-400">+{prop.maxEnergyBonus} Max</strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-zinc-500 block">Aluguel Passivo</span>
                        <strong className="text-emerald-400">R$ {prop.passiveIncome > 0 ? `+${(prop.passiveIncome * 60).toFixed(0)}/min` : 'R$ 0'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Actions for portfolio items */}
                  <div className="flex items-center gap-2 mt-5 pt-3 border-t border-zinc-900/60">
                    {isActiveHome ? (
                      <button
                        disabled
                        className="flex-1 bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1 select-none"
                      >
                        <Check className="h-3.5 w-3.5" /> Lar ativo no GPS
                      </button>
                    ) : (
                      <button
                        id={`btn-equip-home-${prop.id}`}
                        onClick={() => handleSelectHome(prop.id)}
                        className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer hover:border-zinc-650"
                      >
                        Mudar-se para Ca
                      </button>
                    )}

                    {/* Sell button (except starting park bench) */}
                    {prop.id !== 'street_bench' && (
                      <button
                        id={`btn-sell-property-${prop.id}`}
                        onClick={() => handleSell(prop)}
                        className="px-3.5 py-2.5 bg-red-950/20 hover:bg-red-950 hover:text-red-400 text-red-500 border border-red-950 rounded-xl transition duration-200"
                        title={`Vender Escritura por R$ ${refundCash.toLocaleString('pt-BR')} (70% do custo original)`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SLEEP COZY SPELL OVERLAY */}
      {sleepingMode !== 'none' && (
        <div id="sleep-overlay" className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950/95 p-4 animate-fade-in backdrop-blur-sm select-none">
          <div className="absolute top-1/4 animate-bounce">
            <span className="text-5xl text-indigo-400 font-extrabold font-mono block animate-pulse">Zzz... ZzZ</span>
          </div>

          <div className="text-center space-y-4 max-w-sm">
            <h3 className="text-2xl font-black text-white uppercase tracking-tight">Dormindo e Recuperando...</h3>
            <p className="text-sm text-zinc-400">
              {sleepingMode === 'nap' 
                ? 'Você resolveu deitar para um cochilo rápido no sofá...' 
                : 'Seu personagem deitou na cama macia para recuperar a fadiga acumulada...'}
            </p>

            <div className="flex justify-center items-center gap-2 font-mono text-5xl font-black text-indigo-400 py-3 animate-pulse">
              <Hourglass className="h-10 w-10 text-indigo-400 animate-spin animate-duration-1000" />
              {sleepSecondsLeft}s
            </div>

            <div className="w-full h-2 rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden">
              <div 
                style={{ width: `${((sleepingMode === 'nap' ? 3 : 7) - sleepSecondsLeft) / (sleepingMode === 'nap' ? 3 : 7) * 100}%` }}
                className="h-full bg-indigo-500 transition-all duration-1000"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
