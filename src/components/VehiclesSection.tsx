import { useState } from 'react';
import { VEHICLES, Vehicle, PlayerState } from '../types';
import { playSound } from '../utils/audio';
import { 
  Check, 
  Lock, 
  Gauge, 
  TrendingUp, 
  Bike, 
  Car, 
  Truck,
  Trash2,
  Sparkles
} from 'lucide-react';

interface VehiclesSectionProps {
  player: PlayerState;
  onBuyVehicle: (vehicle: Vehicle) => void;
  onSelectVehicle: (vehicleId: string) => void;
  onSellVehicle: (vehicle: Vehicle) => void;
}

export default function VehiclesSection({ 
  player, 
  onBuyVehicle, 
  onSelectVehicle, 
  onSellVehicle 
}: VehiclesSectionProps) {
  const [activeTab, setActiveTab] = useState<'dealership' | 'garage'>('dealership');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'moto' | 'car' | 'sport' | 'truck'>('all');

  const isVipEligible = (playerVip?: 'bronze' | 'prata' | 'ouro' | null, requiredVip?: 'bronze' | 'prata' | 'ouro' | null) => {
    if (!requiredVip) return true;
    if (!playerVip) return false;
    const tiers = { bronze: 1, prata: 2, ouro: 3 };
    return tiers[playerVip] >= tiers[requiredVip];
  };

  const handleBuy = (vehicle: Vehicle) => {
    if (vehicle.vipRequired) {
      if (!isVipEligible(player.vipLevel, vehicle.vipRequired)) {
        playSound('error');
        alert(`Este veículo é exclusivo da assinatura VIP ${vehicle.vipRequired.toUpperCase()} ou superior! Visite a Loja Premium VIP para assinar.`);
        return;
      }
    } else {
      if (player.cash < vehicle.price) {
        playSound('error');
        alert(`Você não tem dinheiro suficiente! Você precisa de R$ ${vehicle.price.toLocaleString('pt-BR')} para levar este veículo.`);
        return;
      }
    }
    onBuyVehicle(vehicle);
  };

  const handleSelect = (id: string) => {
    playSound('click');
    onSelectVehicle(id);
  };

  const handleSell = (vehicle: Vehicle) => {
    onSellVehicle(vehicle);
  };

  // Filter vehicles in Dealership including VIPs
  const filteredDealershipVehicles = VEHICLES.filter(v => {
    if (categoryFilter === 'all') return true;
    return v.type === categoryFilter;
  });

  // Filter owned vehicles
  const ownedVehiclesList = VEHICLES.filter(v => player.ownedVehicles.includes(v.id));

  // Category labels and emojis helper
  const getCategoryTheme = (type: string) => {
    switch (type) {
      case 'moto': return { bg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400', label: 'Moto / Duas Rodas' };
      case 'car': return { bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400', label: 'Carro Popular' };
      case 'sport': return { bg: 'bg-rose-500/10 border-rose-500/20 text-rose-400', label: 'Esportivo Premium' };
      case 'truck': return { bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400', label: 'Caminhão de Carga' };
      default: return { bg: 'bg-zinc-500/10 border-zinc-500/20 text-zinc-400', label: 'Veículo' };
    }
  };

  return (
    <div id="vehicles-section-container" className="w-full space-y-6 font-sans">
      
      {/* Switch Hub Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-zinc-900 pb-4">
        <div className="flex bg-zinc-950 p-1 rounded-xl gap-2 w-full sm:w-auto border border-zinc-900 overflow-x-auto whitespace-nowrap [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <button
            id="tab-dealership"
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
            🏪 Concessionária RP
          </button>
          <button
            id="tab-garage"
            onClick={() => {
              playSound('click');
              setActiveTab('garage');
            }}
            className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-lg text-xs font-bold leading-none tracking-wider uppercase transition-all duration-300 relative ${
              activeTab === 'garage'
                ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-black shadow-lg shadow-green-500/10'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            🔑 Minha Garagem
            <span className="ml-1.5 rounded bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 text-[9px] font-mono text-zinc-300">
              {player.ownedVehicles.length}
            </span>
          </button>
        </div>

        {/* Dynamic Context Description */}
        <div className="text-right hidden md:block">
          <p className="text-xs text-zinc-400 tracking-tight">
            Compre veículos especiais para expandir o salário e os ganhos nas profissões RP da cidade.
          </p>
        </div>
      </div>

      {activeTab === 'dealership' ? (
        /* DEALERSHIP PANEL */
        <div className="space-y-6">
          {/* Quick Category filter buttons */}
          <div className="flex flex-wrap items-center gap-2 bg-zinc-900/40 p-2 border border-zinc-900 rounded-xl">
            <button
              onClick={() => { playSound('click'); setCategoryFilter('all'); }}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-tight uppercase transition ${
                categoryFilter === 'all' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Todos ({VEHICLES.length})
            </button>
            <button
              onClick={() => { playSound('click'); setCategoryFilter('moto'); }}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-tight uppercase transition flex items-center gap-1.5 ${
                categoryFilter === 'moto' ? 'bg-zinc-800 text-indigo-400' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              🏍️ Motos / Bicicletas
            </button>
            <button
              onClick={() => { playSound('click'); setCategoryFilter('car'); }}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-tight uppercase transition flex items-center gap-1.5 ${
                categoryFilter === 'car' ? 'bg-zinc-800 text-emerald-400' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              🚗 Carros Populares
            </button>
            <button
              onClick={() => { playSound('click'); setCategoryFilter('sport'); }}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-tight uppercase transition flex items-center gap-1.5 ${
                categoryFilter === 'sport' ? 'bg-zinc-800 text-rose-400' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              🏎️ Carros Esportivos
            </button>
            <button
              onClick={() => { playSound('click'); setCategoryFilter('truck'); }}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-tight uppercase transition flex items-center gap-1.5 ${
                categoryFilter === 'truck' ? 'bg-zinc-800 text-amber-400' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              🚚 Caminhões
            </button>
          </div>

          {/* DEALERSHIP VEHICLES LIST SHIELD */}
          <div id="vehicles-dealership-list" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {filteredDealershipVehicles.map(vehicle => {
              const alreadyOwned = player.ownedVehicles.includes(vehicle.id);
              const isVipAsset = !!vehicle.vipRequired;
              const hasVipAccess = isVipAsset && isVipEligible(player.vipLevel, vehicle.vipRequired);
              const canAfford = isVipAsset ? hasVipAccess : (player.cash >= vehicle.price);
              const theme = getCategoryTheme(vehicle.type);

              return (
                <div
                  key={vehicle.id}
                  className={`relative overflow-hidden rounded-2xl border bg-zinc-950/75 p-5 flex flex-col justify-between transition-all duration-300 ${
                    alreadyOwned
                      ? 'border-emerald-500/20 bg-emerald-500/[0.01]'
                      : isVipAsset
                      ? 'border-yellow-500/20 shadow-[0_0_20px_rgba(234,179,8,0.03)] hover:border-yellow-500/40 hover:bg-zinc-900/10'
                      : 'border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/10'
                  }`}
                >
                  {/* Glowing decorative indicator for VIP assets */}
                  {isVipAsset && (
                    <div className="absolute top-0 right-0 h-16 w-16 bg-gradient-to-bl from-yellow-500/10 to-transparent pointer-events-none rounded-bl-full" />
                  )}

                  <div className="space-y-4">
                    {/* Header tags */}
                    <div className="flex justify-between items-center">
                      <span className={`text-[10px] border px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider font-mono ${theme.bg}`}>
                        {theme.label}
                      </span>
                      {isVipAsset ? (
                        <span className="bg-yellow-400/15 border border-yellow-400/30 text-yellow-400 text-[10px] uppercase font-black px-2 py-0.5 rounded-md tracking-wider">
                          👑 {vehicle.vipRequired?.toUpperCase()} perk
                        </span>
                      ) : (
                        <strong className="text-emerald-400 font-mono font-bold text-sm">
                          R$ {vehicle.price.toLocaleString('pt-BR')}
                        </strong>
                      )}
                    </div>

                    {/* Name */}
                    <div>
                      <h4 className="text-base font-extrabold text-white tracking-tight leading-tight flex items-center gap-1.5">
                        {vehicle.name}
                      </h4>
                    </div>

                    <p className="text-xs text-zinc-400 min-h-[48px] leading-relaxed">
                      {vehicle.description}
                    </p>

                    {/* Vehicle Statistics displays */}
                    <div className="space-y-3 font-mono text-xs border-t border-zinc-900 pt-4">
                      
                      {/* Lucro de Trabalho */}
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500 text-[10px] uppercase font-sans font-bold flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-emerald-400" /> Bônus de Trabalho
                        </span>
                        <strong className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          +{Math.round((vehicle.multiplier - 1) * 100)}% Salário
                        </strong>
                      </div>

                      {/* Velocidade Máxima */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-zinc-500 text-[10px] uppercase font-sans">
                          <span>Velocidade Máxima</span>
                          <span className="text-zinc-200 font-bold">{vehicle.speed} km/h</span>
                        </div>
                        <div className="w-full h-1.5 rounded bg-zinc-900 overflow-hidden">
                          <div 
                            style={{ width: `${Math.min(100, (vehicle.speed / 320) * 100)}%` }}
                            className="h-full rounded bg-emerald-500 transition-all duration-500"
                          />
                        </div>
                      </div>

                      {/* Consumo Combustível */}
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500 text-[10px] uppercase font-sans">Consumo Estimado</span>
                        <div className="flex items-center gap-1.5">
                          <strong className="text-zinc-300">{vehicle.consumption} L/100km</strong>
                          <span className="text-[10px] text-zinc-500">
                            ({vehicle.consumption <= 3 ? 'Econômico' : vehicle.consumption <= 8 ? 'Moderado' : 'Consumo Alto'})
                          </span>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Dealership Action Button */}
                  <div className="mt-6 pt-3 border-t border-zinc-900">
                    {alreadyOwned ? (
                      <div className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl py-3 text-xs text-center font-bold text-zinc-500 flex items-center justify-center gap-1.5">
                        <Check className="h-4 w-4 text-emerald-400" /> Adquirido (Em sua garagem)
                      </div>
                    ) : isVipAsset ? (
                      hasVipAccess ? (
                        <button
                          id={`btn-buy-vehicle-${vehicle.id}`}
                          onClick={() => handleBuy(vehicle)}
                          className="w-full cursor-pointer rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 text-black hover:from-yellow-400 hover:to-amber-400 font-black py-3 text-xs tracking-wider uppercase transition duration-200 shadow-lg shadow-yellow-500/10 active:scale-[0.98]"
                        >
                          🎁 Resgatar Veículo (Grátis VIP)
                        </button>
                      ) : (
                        <button
                          disabled
                          className="w-full rounded-xl bg-zinc-900 border border-zinc-950/40 text-zinc-500 font-semibold py-3 text-xs tracking-wider uppercase cursor-not-allowed flex items-center justify-center gap-1"
                        >
                          🔒 Bloqueado (Requer VIP {vehicle.vipRequired?.toUpperCase()})
                        </button>
                      )
                    ) : (
                      <button
                        id={`btn-buy-vehicle-${vehicle.id}`}
                        onClick={() => handleBuy(vehicle)}
                        className={`w-full cursor-pointer rounded-xl py-3 font-extrabold text-xs tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-1.5 ${
                          canAfford
                            ? 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-md shadow-emerald-500/10 active:scale-[0.98]'
                            : 'bg-zinc-900/40 border border-zinc-800/80 text-zinc-500 cursor-not-allowed'
                        }`}
                      >
                        {canAfford ? `Comprar por R$ ${vehicle.price.toLocaleString('pt-BR')}` : `R$ ${vehicle.price.toLocaleString('pt-BR')} (Sem Grana)`}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* GARAGE PANEL */
        <div id="vehicles-garage-list" className="space-y-6 animate-fade-in">
          {ownedVehiclesList.length === 0 ? (
            <div id="garage-empty" className="text-center py-16 border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/20">
              <span className="text-5xl text-zinc-600 block mb-3">🚲</span>
              <h5 className="text-base font-bold text-zinc-300 uppercase tracking-tight">Sua Garagem de Chaves está Vazia!</h5>
              <p className="text-xs text-zinc-500 mt-1.5 max-w-xs mx-auto">Visite a nossa Concessionária e adquira sua primeira bike ou automóvel nacional para iniciar o seu RP.</p>
              <button
                id="btn-goto-dealership"
                onClick={() => {
                  playSound('click');
                  setActiveTab('dealership');
                }}
                className="mt-5 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 font-bold px-5 py-2.5 text-xs rounded-xl transition-all"
              >
                Ver Concessionária de Veículos ➔
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-zinc-950 px-4 py-3 border border-zinc-900 rounded-xl text-xs">
                <span className="text-zinc-400">Veículo ativo para trabalho atualmente:</span>
                <strong className="text-green-400 font-mono uppercase">
                  {player.currentVehicleId ? VEHICLES.find(v => v.id === player.currentVehicleId)?.name : 'Nenhum (Trabalhando a Pé)'}
                </strong>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {ownedVehiclesList.map(v => {
                  const isActive = player.currentVehicleId === v.id;
                  const theme = getCategoryTheme(v.type);
                  const refundCash = Math.floor(v.price * 0.70);

                  return (
                    <div
                      key={v.id}
                      className={`relative rounded-2xl border p-5 flex flex-col justify-between transition-all duration-300 ${
                        isActive
                          ? 'border-emerald-500 bg-emerald-500/[0.03] shadow-xl shadow-emerald-500/5'
                          : 'border-zinc-850 bg-zinc-950/70 hover:bg-zinc-900/40 hover:border-zinc-700'
                      }`}
                    >
                      {/* Badge and Details */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <span className={`text-[9px] font-black uppercase tracking-wider font-mono border px-2 py-0.5 rounded-full ${theme.bg}`}>
                            {theme.label}
                          </span>
                          {isActive && (
                            <span className="flex items-center gap-1 text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded px-2 py-0.5 font-bold uppercase tracking-wider">
                              Equipado
                            </span>
                          )}
                        </div>

                        <div>
                          <h5 className="font-extrabold text-white text-base leading-tight">{v.name}</h5>
                          <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{v.description}</p>
                        </div>

                        {/* Specs grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-3 border-t border-b border-zinc-900/60 text-[11px] font-mono">
                          <div>
                            <span className="text-[9px] text-zinc-500 font-sans block uppercase">Bonus</span>
                            <strong className="text-emerald-400">+{Math.round((v.multiplier - 1) * 100)}%</strong>
                          </div>
                          <div>
                            <span className="text-[9px] text-zinc-500 font-sans block uppercase">Máx Speed</span>
                            <strong className="text-zinc-300">{v.speed} km/h</strong>
                          </div>
                          <div>
                            <span className="text-[9px] text-zinc-500 font-sans block uppercase">Consumo</span>
                            <strong className="text-zinc-350">{v.consumption} L</strong>
                          </div>
                        </div>
                      </div>

                      {/* Garage Action Buttons */}
                      <div className="flex items-center gap-2 mt-5 pt-3 border-t border-zinc-900/60">
                        {isActive ? (
                          <button
                            disabled
                            className="flex-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1 font-sans"
                          >
                            <Check className="h-3.5 w-3.5" /> Equipado Ativo
                          </button>
                        ) : (
                          <button
                            id={`btn-drive-vehicle-${v.id}`}
                            onClick={() => handleSelect(v.id)}
                            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:border-zinc-650 transition-all cursor-pointer font-sans"
                          >
                            Equipar Chaves
                          </button>
                        )}

                        {/* Sell system button (Monark is free/starting, let people sell other vehicles) */}
                        <button
                          id={`btn-sell-vehicle-${v.id}`}
                          onClick={() => handleSell(v)}
                          className="px-3.5 py-2.5 bg-red-950/20 hover:bg-red-950 hover:text-red-400 text-red-500/70 border border-red-950 rounded-xl transition duration-200"
                          title={`Vender por R$ ${refundCash.toLocaleString('pt-BR')}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
