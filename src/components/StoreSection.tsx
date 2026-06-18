import React, { useState } from 'react';
import { FOOD_ITEMS, FoodItem, PlayerState } from '../types';
import { playSound } from '../utils/audio';
import { 
  ShoppingBag, 
  Check, 
  Zap, 
  Coffee, 
  IdCard, 
  Sparkles, 
  Crown, 
  CreditCard, 
  QrCode, 
  Award, 
  TrendingUp, 
  Home, 
  Flame, 
  Coins,
  ArrowRight
} from 'lucide-react';

interface StoreSectionProps {
  player: PlayerState;
  onBuyFood: (food: FoodItem) => void;
  onBuyDriversLicense: (price: number) => void;
  onBuyTruckLicense: (price: number) => void;
  onBuyVip: (tier: 'bronze' | 'prata' | 'ouro', paymentMethod: 'cash' | 'pix' | 'card') => void;
}

export default function StoreSection({
  player,
  onBuyFood,
  onBuyDriversLicense,
  onBuyTruckLicense,
  onBuyVip,
}: StoreSectionProps) {
  const [subTab, setSubTab] = useState<'convenience' | 'vip'>('convenience');
  
  // Checkout overlay/wizard state
  const [checkoutPkg, setCheckoutPkg] = useState<'bronze' | 'prata' | 'ouro' | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutComplete, setCheckoutComplete] = useState(false);

  // Card input form state
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Licenses pricing
  const PRICE_DRIVERS_LICENSE = 1500;
  const PRICE_TRUCK_LICENSE = 6200;

  // VIP cash rates
  const VIP_CASH_PRICES = {
    bronze: 5000,
    prata: 15000,
    ouro: 50000,
  };

  const VIP_REAL_VALS = {
    bronze: 'R$ 9,90',
    prata: 'R$ 19,90',
    ouro: 'R$ 34,90',
  };

  const activeVipLevel = player.vipLevel;

  const handleBuyFood = (food: FoodItem) => {
    if (player.cash < food.price) {
      playSound('error');
      alert(`Você não tem dinheiro suficiente! Esse rango custa R$ ${food.price.toFixed(2)}, mas você só tem R$ ${player.cash.toFixed(2)}.`);
      return;
    }
    if (player.energy >= player.maxEnergy) {
      playSound('error');
      alert(`Você já está estufado e com energia máxima! Não gaste grana à toa.`);
      return;
    }
    playSound('cash');
    onBuyFood(food);
  };

  const handleBuyDriversLicense = () => {
    if (player.cash < PRICE_DRIVERS_LICENSE) {
      playSound('error');
      alert(`Você não tem grana para pagar as taxas do DETRAN! Valor necessário: R$ ${PRICE_DRIVERS_LICENSE.toLocaleString('pt-BR')}`);
      return;
    }
    playSound('cash');
    onBuyDriversLicense(PRICE_DRIVERS_LICENSE);
  };

  const handleBuyTruckLicense = () => {
    if (player.cash < PRICE_TRUCK_LICENSE) {
      playSound('error');
      alert(`Você não tem grana para pagar as taxas de CNH E! Valor necessário: R$ ${PRICE_TRUCK_LICENSE.toLocaleString('pt-BR')}`);
      return;
    }
    playSound('cash');
    onBuyTruckLicense(PRICE_TRUCK_LICENSE);
  };

  // Direct purchase with in-game cash
  const purchaseVipWithCash = (tier: 'bronze' | 'prata' | 'ouro') => {
    const cost = VIP_CASH_PRICES[tier];
    if (player.cash < cost) {
      playSound('error');
      alert(`Você não possui saldo em conta suficiente! Você precisa de R$ ${cost.toLocaleString('pt-BR')} do jogo.`);
      return;
    }
    if (window.confirm(`Confirmar contratação do plano VIP ${tier.toUpperCase()} por R$ ${cost.toLocaleString('pt-BR')} dinheiros de jogo?`)) {
      onBuyVip(tier, 'cash');
    }
  };

  // Trigger simulated credit/pix checkout modal
  const openCheckout = (tier: 'bronze' | 'prata' | 'ouro') => {
    playSound('click');
    setCheckoutPkg(tier);
    setPaymentMethod(null);
    setCheckoutComplete(false);
    setIsProcessing(false);
    // Autofill credit credentials to make testing extremely fast and enjoyable
    setCardNumber('4556 7890 1234 5678');
    setCardName(player.name.toUpperCase());
    setCardExpiry('12/30');
    setCardCvv('982');
  };

  const startSimulationPayment = () => {
    if (paymentMethod === 'card') {
      if (!cardName.trim() || cardNumber.length < 10) {
        playSound('error');
        alert('Por favor, preencha os dados do cartão para testar o simulador.');
        return;
      }
    }
    playSound('click');
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setCheckoutComplete(true);
      playSound('levelUp');
      if (checkoutPkg) {
        onBuyVip(checkoutPkg, paymentMethod === 'pix' ? 'pix' : 'card');
      }
    }, 2500);
  };

  const closeCheckout = () => {
    playSound('click');
    setCheckoutPkg(null);
  };

  return (
    <div id="store-section-container" className="w-full space-y-8 font-sans">
      
      {/* Top Banner Tab Control Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-zinc-900 pb-4">
        <div className="flex bg-zinc-950 p-1 rounded-xl gap-2 w-full sm:w-auto border border-zinc-900 overflow-x-auto whitespace-nowrap [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <button
            id="subtab-convenience"
            onClick={() => {
              playSound('click');
              setSubTab('convenience');
            }}
            className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-lg text-xs font-bold leading-none tracking-wider uppercase transition-all duration-300 ${
              subTab === 'convenience'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-500 hover:text-white'
            }`}
          >
            🍿 Conveniência & Detran
          </button>
          
          <button
            id="subtab-vip"
            onClick={() => {
              playSound('click');
              setSubTab('vip');
            }}
            className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-lg text-xs font-bold leading-none tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-1.5 relative overflow-hidden ${
              subTab === 'vip'
                ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-black shadow-lg shadow-yellow-500/10 font-extrabold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            💎 LOJA VIP PREMIUM
            <span className="absolute right-0 top-0 h-2 w-2 bg-rose-500 rounded-full animate-ping mr-1 mt-1" />
          </button>
        </div>

        <div className="text-right hidden md:block">
          {activeVipLevel ? (
            <span className="text-xs bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 font-extrabold px-3 py-1.5 rounded-xl uppercase tracking-wider">
              👑 Assinante VIP {activeVipLevel.toUpperCase()} Ativo
            </span>
          ) : (
            <span className="text-xs text-zinc-500">
              Desbloqueie benefícios lendários e aumente seu progresso financeiro!
            </span>
          )}
        </div>
      </div>

      {subTab === 'convenience' ? (
        /* STANDARD CONVENIENCE & CNH SECTIONS */
        <div className="space-y-8 animate-fade-in text-white">
          {/* SECTION 1: LANCHONETE */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-extrabold text-white uppercase tracking-tight flex items-center gap-1.5 font-display">
                🍿 Lanchonete de Garagem & Conveniência
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Compre salgados típicos de estufas brasileiras e bebidas energéticas de padaria para recuperar energia instantaneamente.
              </p>
            </div>

            <div id="store-food-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
              {FOOD_ITEMS.map(food => {
                const isFullEnergy = player.energy >= player.maxEnergy;
                const canAfford = player.cash >= food.price;

                return (
                  <div 
                    key={food.id}
                    className="rounded-xl border border-zinc-900 bg-zinc-950/60 p-4 flex flex-col justify-between hover:border-zinc-800 hover:bg-zinc-900/10 transition duration-300"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-2xl">
                          {food.id === 'cafesinho' && '☕'}
                          {food.id === 'pastel_caldo' && '🥟'}
                          {food.id === 'marmita' && '🍱'}
                          {food.id === 'energetico' && '🥤'}
                        </span>
                        <span className="font-mono text-emerald-400 font-extrabold text-xs">
                          R$ {food.price.toFixed(2)}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-bold text-white text-xs uppercase tracking-wider">{food.name}</h4>
                        <p className="text-[11px] text-zinc-400 mt-1 min-h-[32px]">{food.description}</p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-zinc-900 space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                        <span>Recupera</span>
                        <span className="text-emerald-400 font-bold">+{food.energyRestore} EP</span>
                      </div>
                      <button
                        id={`btn-buy-food-${food.id}`}
                        onClick={() => handleBuyFood(food)}
                        className={`w-full cursor-pointer rounded-lg py-2 text-center text-xs font-bold uppercase transition duration-200 ${
                          canAfford && !isFullEnergy
                            ? 'bg-zinc-800 text-white hover:bg-zinc-700 hover:text-white border border-zinc-700'
                            : 'bg-zinc-900 border border-zinc-850 text-zinc-500'
                        }`}
                      >
                        Comer Rango
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: DETRAN / AUTOESCOLA */}
          <div id="dmv-section" className="rounded-2xl border border-zinc-800/80 bg-zinc-950/80 p-6 shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 p-4 sm:p-8 text-4xl sm:text-7xl opacity-5 pointer-events-none">
              🎴
            </div>
            
            <div>
              <span className="text-[10px] bg-sky-500/10 border border-sky-500/20 px-2.5 py-1 rounded-full text-sky-400 font-bold uppercase tracking-widest leading-none">
                Autoescola & Legislação
              </span>
              <h3 className="text-lg font-extrabold text-white uppercase tracking-tight mt-2 flex items-center gap-2 font-display">
                <IdCard className="h-5 w-5 text-sky-400" /> CET / Escola de Habilitação RP
              </h3>
              <p className="text-zinc-300 text-xs mt-1">
                Emitir habilitações profissionais no Detran da Cidade RP para ter autorização de conduzir veículos pesados e de transporte por aplicativo legalmente.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* CNH CARS (CLASS B) */}
              <div className="rounded-xl bg-zinc-900/60 border border-zinc-800/80 p-5 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase font-bold block font-mono">Categoria Profissional B</span>
                      <h4 className="font-bold text-white text-base">CNH Especial Paulista (Carros)</h4>
                    </div>
                    {player.hasDriversLicense ? (
                      <span className="bg-sky-500/20 text-sky-400 border border-sky-500/20 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                        Emitida
                      </span>
                    ) : (
                      <span className="bg-zinc-800 text-zinc-500 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                        Pendente
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Autorização obrigatória que te permite trabalhar legalmente como <strong>Motorista do Ube de Aplicativo</strong> e como <strong>Taxista</strong> com táxi amarelo nas ruas.
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-zinc-900 flex justify-between items-center">
                  <span className="font-mono text-sm text-yellow-500 font-bold">
                    Taxa DETRAN: R$ {PRICE_DRIVERS_LICENSE.toLocaleString('pt-BR')}
                  </span>

                  {player.hasDriversLicense ? (
                    <div className="text-xs font-semibold text-sky-400 flex items-center gap-1">
                      <Check className="h-4 w-4" /> Licenciado ativo!
                    </div>
                  ) : (
                    <button
                      id="btn-buy-license-b"
                      onClick={handleBuyDriversLicense}
                      className="bg-sky-600 cursor-pointer hover:bg-sky-500 text-white font-bold py-2 px-4 rounded-lg text-xs transition duration-200"
                    >
                      Matricular CNH B
                    </button>
                  )}
                </div>
              </div>

              {/* CNH CARS (CLASS E) */}
              <div className="rounded-xl bg-zinc-900/60 border border-zinc-800/80 p-5 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase font-bold block font-mono">Categoria Profissional E</span>
                      <h4 className="font-bold text-white text-base">CNH Especial Rodovias (Pesados)</h4>
                    </div>
                    {player.hasTruckLicense ? (
                      <span className="bg-sky-500/20 text-sky-400 border border-sky-500/20 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                        Emitida
                      </span>
                    ) : (
                      <span className="bg-zinc-800 text-zinc-500 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                        Pendente
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Autorização pesada obrigatória exigida pela ANTT para fretes de longa distância como <strong>Caminhoneiro de Scania</strong> em todo o estado brasileiro.
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-zinc-900 flex justify-between items-center">
                  <span className="font-mono text-sm text-yellow-500 font-bold">
                    Taxa DETRAN: R$ {PRICE_TRUCK_LICENSE.toLocaleString('pt-BR')}
                  </span>

                  {player.hasTruckLicense ? (
                    <div className="text-xs font-semibold text-sky-400 flex items-center gap-1">
                      <Check className="h-4 w-4" /> Licenciado ativo!
                    </div>
                  ) : (
                    <button
                      id="btn-buy-license-e"
                      onClick={handleBuyTruckLicense}
                      className="bg-sky-600 cursor-pointer hover:bg-sky-500 text-white font-bold py-2 px-4 rounded-lg text-xs transition duration-200"
                    >
                      Matricular CNH E
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* PREMIUM MONETIZATION SYSTEM TAB */
        <div className="space-y-6 animate-fade-in text-white text-zinc-300">
          
          {/* Promotional Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-yellow-500/20 p-6 md:p-8 shadow-xl">
            <div className="absolute right-0 top-0 h-full w-1/3 bg-[radial-gradient(circle_at_top_right,rgba(234,179,8,0.06),transparent)] pointer-events-none" />
            <div className="space-y-3 max-w-xl">
              <span className="inline-flex items-center gap-1 bg-yellow-400/10 text-yellow-400 text-[10px] font-black uppercase px-2.5 py-1 rounded-full border border-yellow-400/20 tracking-wider">
                👑 LANÇAMENTO COMERCIAL PREPARADO
              </span>
              <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-white font-display">
                PASSE DE ENTRADA VIP CLUB RP
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Nossos pacotes VIP são focados em acelerar sua trajetória financeira, oferecendo privilégios mecânicos automáticos de bônus, garagens de carros velozes grátis e propriedades completas residenciais sem pagar taxas em reais fictícios!
              </p>
            </div>
          </div>

          {/* Plan Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* 1. VIP BRONZE CARD */}
            <div className="rounded-2xl border border-amber-600/20 bg-zinc-950/60 p-6 flex flex-col justify-between hover:border-amber-500/40 hover:shadow-lg transition-all duration-300">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex justify-between items-center bg-amber-700/10 border border-amber-600/20 p-3 rounded-xl">
                  <div className="flex items-center gap-1.5">
                    <Flame className="h-5 w-5 text-amber-500" />
                    <h4 className="font-extrabold text-white text-base">VIP BRONZE</h4>
                  </div>
                  <span className="text-[10px] bg-amber-500/10 text-amber-500 font-bold px-2 py-0.5 rounded uppercase">
                    Starter
                  </span>
                </div>

                <div className="py-2 border-b border-zinc-900">
                  <span className="text-zinc-400 text-xs block">Assinatura mensal regulada:</span>
                  <div className="flex items-baseline flex-wrap gap-1 mt-1 font-mono">
                    <strong className="text-3xl font-extrabold text-white">{VIP_REAL_VALS.bronze}</strong>
                    <span className="text-xs text-zinc-500">/mês real (ou R$ 5k RP)</span>
                  </div>
                </div>

                {/* Benefits list */}
                <ul className="space-y-2.5 text-xs text-zinc-400 pt-2 min-h-[190px]">
                  <li className="flex items-start gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>+15% Dinheiro</strong> em todos os trabalhos.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Award className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
                    <span><strong>+15% Experiência (XP)</strong> acelerada.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <span><strong>+20% Velocidade</strong> de recarga de Energia vital.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Flame className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                    <span><strong>Moto Grátis:</strong> BMW S1000RR M-Sport (299 km/h).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Home className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                    <span><strong>Casa Grátis:</strong> Loft Premium nos Jardins (+R$ 510/m passive aluguel!).</span>
                  </li>
                </ul>
              </div>

              {/* Action buttons */}
              <div className="mt-6 pt-4 border-t border-zinc-900 space-y-2.5">
                <button
                  id="btn-vip-checkout-bronze"
                  onClick={() => openCheckout('bronze')}
                  className={`w-full cursor-pointer py-3 rounded-xl text-xs font-extrabold uppercase transition duration-200 tracking-wider flex items-center justify-center gap-1.5 ${
                    activeVipLevel === 'bronze'
                      ? 'bg-amber-600/20 text-amber-400 border border-amber-600/30'
                      : 'bg-gradient-to-r from-amber-600 to-amber-700 text-white hover:from-amber-500 hover:to-amber-600 shadow-md shadow-amber-600/10'
                  }`}
                >
                  <CreditCard className="h-4 w-4" />
                  {activeVipLevel === 'bronze' ? '🏆 Seu Plano Ativo' : 'Adquirir via Pix/Cartão'}
                </button>

                <button
                  id="btn-vip-cash-bronze"
                  onClick={() => purchaseVipWithCash('bronze')}
                  disabled={player.cash < VIP_CASH_PRICES.bronze}
                  className={`w-full cursor-pointer py-2 px-3 rounded-xl text-[10px] uppercase font-bold tracking-tight border text-center transition duration-200 ${
                    player.cash >= VIP_CASH_PRICES.bronze
                      ? 'border-emerald-600/30 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10'
                      : 'border-zinc-900 bg-zinc-950/20 text-zinc-600 cursor-not-allowed'
                  }`}
                >
                  <Coins className="inline h-3.5 w-3.5 mr-1" />
                  Comprar por R$ {VIP_CASH_PRICES.bronze.toLocaleString('pt-BR')} (Cash Jogo)
                </button>
              </div>
            </div>

            {/* 2. VIP PRATA CARD */}
            <div className="rounded-2xl border border-zinc-500/20 bg-zinc-950/60 p-6 flex flex-col justify-between hover:border-zinc-400 hover:shadow-lg transition-all duration-300">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex justify-between items-center bg-zinc-800/20 border border-zinc-750 p-3 rounded-xl">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-5 w-5 text-zinc-300" />
                    <h4 className="font-extrabold text-white text-base">VIP PRATA</h4>
                  </div>
                  <span className="text-[10px] bg-sky-500/10 text-sky-400 font-bold px-2 py-0.5 rounded uppercase">
                    Popular
                  </span>
                </div>

                <div className="py-2 border-b border-zinc-900">
                  <span className="text-zinc-400 text-xs block">Assinatura mensal regulada:</span>
                  <div className="flex items-baseline flex-wrap gap-1 mt-1 font-mono">
                    <strong className="text-3xl font-extrabold text-white">{VIP_REAL_VALS.prata}</strong>
                    <span className="text-xs text-zinc-500">/mês real (ou R$ 15k RP)</span>
                  </div>
                </div>

                {/* Benefits list */}
                <ul className="space-y-2.5 text-xs text-zinc-400 pt-2 min-h-[190px]">
                  <li className="flex items-start gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>+30% Dinheiro</strong> de bônus em bicos e trabalhos.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Award className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
                    <span><strong>+30% Experiência (XP)</strong> nos níveis de carreira.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <span><strong>+40% Velocidade</strong> para regeneração de fadiga.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-zinc-300 shrink-0 mt-0.5" />
                    <span><strong>Carro Grátis:</strong> Audi RS6 Avant Super (305 km/h, 5.5x bônus).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Home className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                    <span><strong>Casa Grátis:</strong> Cobertura Penthouse Barra (+R$ 2.700/min passive aluguel!).</span>
                  </li>
                </ul>
              </div>

              {/* Action buttons */}
              <div className="mt-6 pt-4 border-t border-zinc-900 space-y-2.5">
                <button
                  id="btn-vip-checkout-prata"
                  onClick={() => openCheckout('prata')}
                  className={`w-full cursor-pointer py-3 rounded-xl text-xs font-extrabold uppercase transition duration-200 tracking-wider flex items-center justify-center gap-1.5 ${
                    activeVipLevel === 'prata'
                      ? 'bg-zinc-600/20 text-zinc-300 border border-zinc-550/30'
                      : 'bg-gradient-to-r from-zinc-500 to-zinc-600 text-white hover:from-zinc-400 hover:to-zinc-500 shadow-md shadow-zinc-600/10'
                  }`}
                >
                  <CreditCard className="h-4 w-4" />
                  {activeVipLevel === 'prata' ? '🏆 Seu Plano Ativo' : 'Adquirir via Pix/Cartão'}
                </button>

                <button
                  id="btn-vip-cash-prata"
                  onClick={() => purchaseVipWithCash('prata')}
                  disabled={player.cash < VIP_CASH_PRICES.prata}
                  className={`w-full cursor-pointer py-2 px-3 rounded-xl text-[10px] uppercase font-bold tracking-tight border text-center transition duration-200 ${
                    player.cash >= VIP_CASH_PRICES.prata
                      ? 'border-emerald-600/30 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10'
                      : 'border-zinc-900 bg-zinc-950/20 text-zinc-600 cursor-not-allowed'
                  }`}
                >
                  <Coins className="inline h-3.5 w-3.5 mr-1" />
                  Comprar por R$ {VIP_CASH_PRICES.prata.toLocaleString('pt-BR')} (Cash Jogo)
                </button>
              </div>
            </div>

            {/* 3. VIP OURO CARD */}
            <div className="rounded-2xl border border-yellow-500/30 bg-zinc-950/80 p-6 flex flex-col justify-between hover:border-yellow-500/60 hover:shadow-[0_0_25px_rgba(234,179,8,0.05)] transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-1.5 bg-gradient-to-l from-yellow-500 to-amber-500 text-black text-[8px] font-black uppercase tracking-wider rounded-bl-lg select-none">
                👑 RECOMENDADO
              </div>
              
              <div className="space-y-4">
                {/* Header */}
                <div className="flex justify-between items-center bg-yellow-500/10 border border-yellow-500/30 p-3 rounded-xl">
                  <div className="flex items-center gap-1.5">
                    <Crown className="h-5 w-5 text-yellow-400" />
                    <h4 className="font-extrabold text-white text-base">VIP OURO</h4>
                  </div>
                  <span className="text-[10px] bg-yellow-400/20 text-yellow-400 font-extrabold px-2.5 py-0.5 rounded uppercase tracking-wider animate-pulse">
                    Elite
                  </span>
                </div>

                <div className="py-2 border-b border-zinc-900">
                  <span className="text-zinc-400 text-xs block font-bold text-yellow-500/90">VIP Absoluto do Servidor:</span>
                  <div className="flex items-baseline flex-wrap gap-1 mt-1 font-mono">
                    <strong className="text-3xl font-extrabold text-yellow-400 drop-shadow-[0_2px_10px_rgba(234,179,8,0.2)]">{VIP_REAL_VALS.ouro}</strong>
                    <span className="text-xs text-zinc-500">/mês real (ou R$ 50k RP)</span>
                  </div>
                </div>

                {/* Benefits list */}
                <ul className="space-y-2.5 text-xs text-zinc-350 pt-2 min-h-[190px]">
                  <li className="flex items-start gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>+50% Dinheiro</strong> em todos os fretes e trabalhos.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Award className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
                    <span><strong>+50% Experiência (XP)</strong> geral e de carreira.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <span><strong>+60% Descanso de cansaço</strong> passivo em casas.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                    <span><strong>+25% Rendimento</strong> de lucro passivo em todas as Empresas.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>+50 Max EP:</strong> Capacidade de vitalidade estendida!</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Crown className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <span><strong>Hipercarro Grátis:</strong> Ferrari SF90 V8 Híbrida (340km/h, 8.5x).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Home className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                    <span><strong>Mansão Suprema Grátis:</strong> Ilha Angra (+R$ 10.800/min passive!).</span>
                  </li>
                </ul>
              </div>

              {/* Action buttons */}
              <div className="mt-6 pt-4 border-t border-zinc-900 space-y-2.5">
                <button
                  id="btn-vip-checkout-ouro"
                  onClick={() => openCheckout('ouro')}
                  className={`w-full cursor-pointer py-3 rounded-xl text-xs font-black uppercase transition duration-200 tracking-wider flex items-center justify-center gap-1.5 ${
                    activeVipLevel === 'ouro'
                      ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      : 'bg-gradient-to-r from-yellow-500 to-amber-500 text-black hover:from-yellow-400 hover:to-amber-400 shadow-md shadow-yellow-500/20 animate-duration-1000'
                  }`}
                >
                  <Crown className="h-4 w-4" />
                  {activeVipLevel === 'ouro' ? '🏆 Seu Passe Supremo' : 'Adquirir via Pix/Cartão'}
                </button>

                <button
                  id="btn-vip-cash-ouro"
                  onClick={() => purchaseVipWithCash('ouro')}
                  disabled={player.cash < VIP_CASH_PRICES.ouro}
                  className={`w-full cursor-pointer py-2 px-3 rounded-xl text-[10px] uppercase font-bold tracking-tight border text-center transition duration-200 ${
                    player.cash >= VIP_CASH_PRICES.ouro
                      ? 'border-emerald-600/30 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10'
                      : 'border-zinc-900 bg-zinc-950/20 text-zinc-600 cursor-not-allowed'
                  }`}
                >
                  <Coins className="inline h-3.5 w-3.5 mr-1" />
                  Comprar por R$ {VIP_CASH_PRICES.ouro.toLocaleString('pt-BR')} (Cash Jogo)
                </button>
              </div>
            </div>

          </div>

          {/* Money Disclaimer Note */}
          <div className="rounded-xl border border-zinc-900 bg-zinc-950/30 px-4 py-3 text-center text-[10px] text-zinc-500 tracking-tight leading-relaxed max-w-2xl mx-auto">
            🛡️ <strong>Simulador Educativo Comercial Integrado:</strong> A compra via Pix/Cartão utiliza portais integrados simulados (fictícios) e não desconta valores em dinheiro real do seu cartão bancário. Todas as ativações ocorrem de forma 100% gratuita neste ecossistema de testes do RP.
          </div>

        </div>
      )}

      {/* CHECKOUT SIMULATION OVERLAY WIZARD */}
      {checkoutPkg && (
        <div id="checkout-gateway-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/90 p-4 animate-fade-in backdrop-blur-md text-white">
          <div className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 md:p-8 shadow-2xl space-y-6">
            
            {/* Close */}
            <button
              onClick={closeCheckout}
              className="absolute right-4 top-4 text-zinc-400 hover:text-white transition cursor-pointer font-bold text-sm"
              title="Fechar"
            >
              ✕
            </button>

            {/* Step 1: Not complete yet */}
            {!checkoutComplete ? (
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-2.5 py-0.5 rounded font-black tracking-widest uppercase">
                    Checkout Seguro 🔒
                  </span>
                  <h3 className="text-xl font-extrabold uppercase mt-2 font-display">
                    Finalizar Assinatura VIP {checkoutPkg.toUpperCase()}
                  </h3>
                  <p className="text-zinc-400 text-xs mt-1">
                    Adquira seu passe para obter os bônus automáticos de rendimento de RP.
                  </p>
                </div>

                <div className="bg-zinc-950/80 border border-zinc-850 p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-zinc-500 text-[10px] block font-semibold uppercase leading-none">Plano Selecionado</span>
                    <strong className="text-white text-sm font-extrabold uppercase mt-1 inline-block">Clube VIP {checkoutPkg}</strong>
                  </div>
                  <div className="font-mono text-right">
                    <span className="text-zinc-500 text-[10px] block font-semibold uppercase leading-none">Preço Simulado</span>
                    <strong className="text-yellow-400 text-lg font-bold">{VIP_REAL_VALS[checkoutPkg]}</strong>
                  </div>
                </div>

                {/* Choose Method */}
                {!paymentMethod ? (
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-zinc-400 block">Escolha o método de pagamento para simulação:</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      
                      {/* Pix Option */}
                      <button
                        onClick={() => { playSound('click'); setPaymentMethod('pix'); }}
                        className="rounded-xl border border-zinc-800 bg-zinc-950 hover:border-emerald-500/40 p-4 font-bold text-xs uppercase flex flex-col items-center justify-center gap-2 transition"
                      >
                        <QrCode className="h-6 w-6 text-emerald-400" />
                        Pagar com PIX
                      </button>

                      {/* Card Option */}
                      <button
                        onClick={() => { playSound('click'); setPaymentMethod('card'); }}
                        className="rounded-xl border border-zinc-800 bg-zinc-950 hover:border-indigo-500/40 p-4 font-bold text-xs uppercase flex flex-col items-center justify-center gap-2 transition"
                      >
                        <CreditCard className="h-6 w-6 text-indigo-400" />
                        Cartão de Crédito
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 animate-fade-in">
                    
                    {/* Return back button */}
                    <button
                      onClick={() => setPaymentMethod(null)}
                      className="text-indigo-400 text-xs hover:underline cursor-pointer flex items-center gap-1 font-semibold block mb-2"
                    >
                      ← Mudar Forma de Pagamento
                    </button>

                    {paymentMethod === 'pix' ? (
                      /* PIX OPTION WINDOW */
                      <div className="space-y-4 text-center">
                        <div className="mx-auto h-36 w-36 bg-white rounded-xl p-2 flex items-center justify-center shadow-lg shadow-black/30">
                          {/* Elegant QR Code Mock representing pixel grid */}
                          <div className="grid grid-cols-6 grid-rows-6 gap-1 w-full h-full bg-zinc-100 p-1 rounded-sm">
                            {[...Array(36)].map((_, i) => (
                              <div 
                                key={i} 
                                className={`rounded-sm ${(i % 3 === 0 || i % 7 === 0 || i < 8 || i > 28) ? 'bg-zinc-950' : 'bg-transparent'}`} 
                              />
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-zinc-400 text-xs font-bold block">Código Pix Copia e Cola:</label>
                          <div className="bg-zinc-950 border border-zinc-850 p-2 text-[10px] font-mono text-zinc-500 truncate rounded flex items-center justify-between">
                            <span>00020126750014br.gov.bcb.pix0140{checkoutPkg}vipgameappletpreviewfake052</span>
                            <span 
                              onClick={() => showToast('Código copiado para teste!', 'info')}
                              className="text-indigo-450 hover:text-indigo-400 font-bold ml-1.5 cursor-pointer uppercase text-[9px]"
                            >
                              Copiar
                            </span>
                          </div>
                        </div>

                        <p className="text-[11px] text-zinc-500">
                          Copie o código acima ou escaneie o código QR fictício para simular o recebimento bancário do gateway de pagamento instantâneo do mercado brasileiro.
                        </p>
                      </div>
                    ) : (
                      /* CREDIT CARD MOCKUP FORM */
                      <div className="space-y-3.5 text-left text-xs animate-fade-in">
                        {/* Mock Up Front Container */}
                        <div className="p-4 bg-gradient-to-tr from-indigo-900 to-slate-800 rounded-xl border border-indigo-700/30 text-white font-mono flex flex-col justify-between shadow-lg h-28">
                          <span className="text-[10px] tracking-wider font-extrabold uppercase text-indigo-300">PREMIUM CREDIT CARD</span>
                          <span className="text-sm font-bold tracking-widest block text-zinc-350">{cardNumber || '•••• •••• •••• ••••'}</span>
                          <div className="flex justify-between items-end text-[9px]">
                            <div>
                              <span className="text-indigo-400 text-[8px] block leading-none">PORTADOR</span>
                              <strong className="text-[10px] uppercase">{cardName || 'SEU NOME NO CARTÃO'}</strong>
                            </div>
                            <div className="flex gap-3">
                              <div>
                                <span className="text-indigo-400 text-[8px] block leading-none">EXPIRA</span>
                                <strong>{cardExpiry || 'MM/AA'}</strong>
                              </div>
                              <div>
                                <span className="text-indigo-400 text-[8px] block leading-none">CVV</span>
                                <strong>{cardCvv || '•••'}</strong>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div>
                            <label className="text-zinc-500 text-[10px] block uppercase font-bold leading-none mb-1">Nome Completo</label>
                            <input
                              type="text"
                              value={cardName}
                              onChange={e => setCardName(e.target.value)}
                              placeholder="FUTURO VIP DO RP"
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 outline-none focus:border-indigo-500 font-mono text-zinc-200"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-zinc-500 text-[10px] block uppercase font-bold leading-none mb-1">Data Validade</label>
                              <input
                                type="text"
                                value={cardExpiry}
                                onChange={e => setCardExpiry(e.target.value)}
                                placeholder="MM/AA"
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 outline-none focus:border-indigo-500 font-mono text-zinc-200"
                              />
                            </div>
                            <div>
                              <label className="text-zinc-500 text-[10px] block uppercase font-bold leading-none mb-1">Cód. Segurança (CVV)</label>
                              <input
                                type="text"
                                value={cardCvv}
                                onChange={e => setCardCvv(e.target.value)}
                                placeholder="123"
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 outline-none focus:border-indigo-500 font-mono text-zinc-200"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Master Action Trigger Button simulation */}
                    <button
                      onClick={startSimulationPayment}
                      disabled={isProcessing}
                      className="w-full bg-emerald-500 text-black hover:bg-emerald-400 font-black py-3 rounded-xl text-xs uppercase tracking-wide transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/10 active:scale-[0.98]"
                    >
                      {isProcessing ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Processando Pagamento...
                        </>
                      ) : (
                        `Simular Pagamento Seguro 🔒`
                      )}
                    </button>
                    
                  </div>
                )}
              </div>
            ) : (
              /* Step 2: Payment simulation success state receipt */
              <div className="space-y-6 text-center animate-fade-in py-4">
                <div className="mx-auto h-16 w-16 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/10">
                  <Check className="h-8 w-8 animate-bounce" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-xl font-extrabold uppercase font-display text-emerald-400">PAGAMENTO CONFIRMADO!</h3>
                  <p className="text-zinc-300 text-xs">Assinatura licenciada e habilitada na rede RP.</p>
                </div>

                <div className="bg-zinc-950/80 border border-zinc-850 p-4 rounded-xl text-xs font-mono text-left space-y-1 text-zinc-400">
                  <div>• ID Transação: <span className="text-zinc-200">pay_9x8d7f2v3h-simulated</span></div>
                  <div>• Produto: <span className="text-zinc-200">Plano VIP {checkoutPkg?.toUpperCase()}</span></div>
                  <div>• Portador: <span className="text-zinc-200">{player.name.toUpperCase()}</span></div>
                  <div>• Status Network: <span className="text-emerald-400 font-bold">Ativo Autorizado</span></div>
                </div>

                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  Os multiplicadores de rendimentos, bônus de XP, e limites máximos de vida já foram reajustados. O Veículo Premium e Imóvel Premium exclusivos do seu plano já estão desbloqueados inteiramente grátis para resgate na Concessionária e Imobiliária!
                </p>

                <button
                  onClick={closeCheckout}
                  className="w-full cursor-pointer bg-zinc-800 hover:bg-zinc-700 text-white font-extrabold py-3 rounded-xl text-xs uppercase transition tracking-wider"
                >
                  Entrar no Jogo Club ➔
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}

// Global mockup notification toaster helper
function showToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
  const container = document.getElementById('toast-root') || createToastRoot();
  const toast = document.createElement('div');
  
  toast.className = `flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs text-white border font-bold shadow-2xl transition duration-500 translate-x-12 opacity-0 shrink-0 ${
    type === 'success' 
      ? 'bg-emerald-950/95 border-emerald-500/20 text-emerald-400' 
      : type === 'error'
      ? 'bg-red-950/95 border-red-500/20 text-rose-450'
      : 'bg-zinc-900 border-zinc-800 text-zinc-300'
  }`;

  toast.innerHTML = `
    <span>${type === 'success' ? '👑' : type === 'error' ? '❌' : 'ℹ️'}</span>
    <span className="truncate">${message}</span>
  `;

  container.appendChild(toast);

  // Animate Entrance
  setTimeout(() => {
    toast.className = toast.className.replace('translate-x-12 opacity-0', 'translate-x-0 opacity-100');
  }, 10);

  // Dismiss
  setTimeout(() => {
    toast.className = toast.className.replace('translate-x-0 opacity-100', 'translate-x-12 opacity-0');
    setTimeout(() => toast.remove(), 500);
  }, 3500);
}

function createToastRoot(): HTMLElement {
  const root = document.createElement('div');
  root.id = 'toast-root';
  root.className = 'fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm overflow-hidden pointer-events-none';
  document.body.appendChild(root);
  return root;
}
