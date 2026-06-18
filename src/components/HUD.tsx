import { 
  Coins, 
  Zap, 
  Award, 
  Volume2, 
  VolumeX, 
  User,
  Clock,
  CloudSun,
  Crown,
  TrendingUp,
  Skull
} from 'lucide-react';
import { PlayerState, getXpForNextLevel } from '../types';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface HUDProps {
  player: PlayerState;
  onMuteToggle: () => void;
  isMuted: boolean;
}

export default function HUD({ player, onMuteToggle, isMuted }: HUDProps) {
  const [currentTime, setCurrentTime] = useState('');
  const [prevCash, setPrevCash] = useState(player.cash);
  const [cashDifference, setCashDifference] = useState<number | null>(null);

  // Monitor cash changes to show a GTA-like +/- overlay! This is so high-quality!
  useEffect(() => {
    if (player.cash !== prevCash) {
      const diff = player.cash - prevCash;
      setCashDifference(diff);
      const timer = setTimeout(() => {
        setCashDifference(null);
      }, 3000);
      setPrevCash(player.cash);
      return () => clearTimeout(timer);
    }
  }, [player.cash, prevCash]);

  // Update RP virtual clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${hh}:${mm}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const xpNeeded = getXpForNextLevel(player.level);
  const xpPercentage = Math.min(100, Math.floor((player.xp / xpNeeded) * 100));
  const energyPercentage = Math.min(100, Math.floor((player.energy / player.maxEnergy) * 100));

  // Determine energy level color helper
  const getEnergyColor = () => {
    if (energyPercentage > 50) return 'from-emerald-500 to-green-400 shadow-emerald-500/20';
    if (energyPercentage > 20) return 'from-amber-500 to-yellow-400 shadow-yellow-500/20';
    return 'from-rose-600 to-red-500 shadow-red-600/20';
  };

  return (
    <div id="game-hud-container" className="w-full space-y-4 font-sans text-white">
      {/* Top Server Panel info */}
      <motion.div 
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-900 bg-zinc-950/80 p-5 md:p-6 backdrop-blur-md shadow-2xl shadow-black/80 overflow-hidden"
      >
        {/* Subtle decorative futuristic corner bar */}
        <div className="absolute top-0 left-0 w-24 h-[2px] bg-gradient-to-r from-yellow-500 to-amber-500" />
        <div className="absolute top-0 right-0 w-24 h-[2px] bg-gradient-to-l from-emerald-500 to-green-500" />

        {/* Left: Avatar info & Level */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="relative flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-tr from-zinc-900 to-zinc-800 border-2 border-zinc-700/60 text-2xl font-bold shadow-lg shadow-black/50"
            >
              {player.gender === 'M' ? '🧔' : '👩'}
              {/* Pulsing neon background behind level ring */}
              <div className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-lg bg-black border border-zinc-700 text-[11px] font-black text-yellow-400 font-orbitron shadow-inner">
                {player.level}
              </div>
            </motion.div>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span id="hud-player-name" className="text-xl font-extrabold tracking-tight text-white font-display">
                {player.name}
              </span>
              {player.vipLevel ? (
                <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black tracking-wider uppercase font-orbitron flex items-center gap-1 shadow-lg border ${
                  player.vipLevel === 'bronze'
                    ? 'bg-amber-950/40 text-amber-400 border-amber-600/30'
                    : player.vipLevel === 'prata'
                    ? 'bg-zinc-800/40 text-zinc-300 border-zinc-400/30'
                    : 'bg-yellow-500/10 text-yellow-405 border-yellow-400/40 animate-pulse text-yellow-400'
                }`}>
                  <Crown className="h-3 w-3 shrink-0" />
                  VIP {player.vipLevel.toUpperCase()}
                </span>
              ) : (
                <span className="rounded-md bg-green-500/10 px-2.5 py-0.5 text-[9px] font-black tracking-widest uppercase text-emerald-400 border border-green-500/20 font-orbitron">
                  Cidadão
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400">
              <span className="flex items-center gap-1.5 bg-zinc-900/60 px-2 py-0.5 rounded border border-zinc-800/40">
                <Clock className="h-3.5 w-3.5 text-zinc-500" />
                <span className="font-mono text-zinc-300 font-bold tracking-wider">{currentTime}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 bg-zinc-900/60 px-2 py-0.5 rounded border border-zinc-800/40">
                <CloudSun className="h-3.5 w-3.5 text-yellow-500" />
                <span className="font-semibold text-zinc-300">Rio de Janeiro (Sol)</span>
              </span>
            </div>
          </div>
        </div>

        {/* Center: Financials Indicator (GTA V green style) */}
        <div className="flex flex-col md:flex-row items-end md:items-center gap-4 md:gap-8 shrink-0 relative">
          <div className="text-right">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block leading-none mb-1 font-orbitron">
              Faturamento Líquido
            </span>
            <div id="hud-cash-amount" className="flex items-center justify-end gap-1.5 text-2xl md:text-3xl font-black tracking-wider text-green-400 font-orbitron drop-shadow-[0_0_12px_rgba(46,204,113,0.3)]">
              R$ {player.cash.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>

          {/* GTA cash differences floating on top */}
          <AnimatePresence>
            {cashDifference !== null && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, y: -25, scale: 1.1 }}
                exit={{ opacity: 0, y: -40 }}
                transition={{ duration: 0.6 }}
                className={`absolute right-0 bottom-full mb-2 font-black font-orbitron text-sm md:text-base tracking-widest leading-none ${
                  cashDifference >= 0 ? 'text-green-400 drop-shadow-[0_0_8px_rgba(46,204,113,0.6)]' : 'text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]'
                }`}
              >
                {cashDifference >= 0 ? `+ R$ ${cashDifference.toLocaleString('pt-BR')}` : `- R$ ${Math.abs(cashDifference).toLocaleString('pt-BR')}`}
              </motion.div>
            )}
          </AnimatePresence>

          {(player.dirtyCash || 0) > 0 && (
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: [0.95, 1.03, 0.95] }}
              transition={{ repeat: Infinity, duration: 2.5 }}
              className="text-right"
            >
              <span className="text-[10px] font-black uppercase tracking-widest text-red-500 block leading-none mb-1 flex items-center justify-end gap-1 select-none font-orbitron">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
                DINHEIRO SUJO
              </span>
              <div id="hud-dirty-cash" className="flex items-center justify-end gap-1 text-xl font-bold tracking-wider text-rose-500 font-orbitron drop-shadow-[0_0_10px_rgba(239,68,68,0.25)]">
                R$ {player.dirtyCash?.toLocaleString('pt-BR')}
              </div>
            </motion.div>
          )}
        </div>

        {/* Right: Sound Controls and Server Stats */}
        <div className="flex items-center gap-3">
          <motion.button
            id="btn-toggle-sound"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onMuteToggle}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:border-zinc-700 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer shadow-md"
            title={isMuted ? 'Ativar som' : 'Mutar som'}
          >
            {isMuted ? <VolumeX className="h-5 w-5 text-rose-450" /> : <Volume2 className="h-5 w-5 text-amber-500" />}
          </motion.button>
        </div>
      </motion.div>

      {/* Level and Energy Status Grid styled like tactical progress panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* XP Progress Card */}
        <motion.div 
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-2xl border border-zinc-900 bg-zinc-950/80 p-5 shadow-xl relative overflow-hidden"
        >
          {/* Subtle blueprint grid behind */}
          <div className="absolute inset-0 bg-[radial-gradient(#1c1c1f_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />
          
          <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-zinc-400 mb-2 relative z-10 font-orbitron">
            <span className="flex items-center gap-1.5 text-zinc-300">
              <Award className="h-4 w-4 text-amber-400" />
              NÍVEL {player.level} <span className="text-[10px] text-zinc-500 font-sans tracking-normal font-bold">({player.xp} XP)</span>
            </span>
            <span className="font-mono text-amber-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.2)]">
              REQUER {xpNeeded} XP ({xpPercentage}%)
            </span>
          </div>

          <div className="w-full h-4 rounded-lg bg-zinc-900/50 overflow-hidden border border-zinc-850 p-1 relative z-10">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${xpPercentage}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full rounded-md bg-gradient-to-r from-yellow-500 via-amber-500 to-amber-600 shadow-md relative"
            >
              {/* Highlight slash effect */}
              <div className="absolute inset-x-0 top-0 bottom-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[size:10px_10px] animate-[pulse_1.5s_infinite_linear]" />
            </motion.div>
          </div>
        </motion.div>

        {/* Energy Card */}
        <motion.div 
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="rounded-2xl border border-zinc-900 bg-zinc-950/80 p-5 shadow-xl relative overflow-hidden"
        >
          {/* Subtle blueprint grid behind */}
          <div className="absolute inset-0 bg-[radial-gradient(#1c1c1f_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />
          
          <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-zinc-400 mb-2 relative z-10 font-orbitron">
            <span className="flex items-center gap-1.5 text-zinc-300 animate-pulse">
              <Zap className="h-4 w-4 text-emerald-400" />
              STATUS VITAL (ENERGIA)
            </span>
            <span className="font-mono text-emerald-400 drop-shadow-[0_0_6px_rgba(46,204,113,0.2)]">
              {player.energy} / {player.maxEnergy} EP ({energyPercentage}%)
            </span>
          </div>

          <div className="w-full h-4 rounded-lg bg-zinc-900/50 overflow-hidden border border-zinc-850 p-1 relative z-10">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${energyPercentage}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className={`h-full rounded-md bg-gradient-to-r relative ${getEnergyColor()}`}
            >
              {/* Highlight slash effect */}
              <div className="absolute inset-x-0 top-0 bottom-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[size:10px_10px]" />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
