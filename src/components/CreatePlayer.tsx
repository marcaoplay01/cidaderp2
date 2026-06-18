import React, { useState } from 'react';
import { playSound } from '../utils/audio';
import { motion, AnimatePresence } from 'motion/react';
import { User, Shield, Compass, Sparkles, HelpCircle, Coins, Heart } from 'lucide-react';

interface CreatePlayerProps {
  onCreate: (name: string, gender: 'M' | 'F') => void;
}

const PRESETS_M = [
  'Marquinhos_do_Grau',
  'Pedrinho_AP',
  'Nego_Dramma',
  'Thiago_Zero1',
  'Vitor_Capone',
];

const PRESETS_F = [
  'Jessi_Correrria',
  'Aninha_Juliet',
  'Leticia_Vapo',
  'Mari_Do_Grau',
  'Cris_Imperatriz',
];

export default function CreatePlayer({ onCreate }: CreatePlayerProps) {
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'M' | 'F'>('M');
  const [errorString, setErrorString] = useState('');

  const handleRandomPreset = () => {
    playSound('click');
    const list = gender === 'M' ? PRESETS_M : PRESETS_F;
    const randomIndex = Math.floor(Math.random() * list.length);
    setName(list[randomIndex]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim().replace(/\s+/g, '_');
    if (!cleanName) {
      playSound('error');
      setErrorString('Digite um nome de respeito para a cidade!');
      return;
    }
    if (cleanName.length < 3 || cleanName.length > 20) {
      playSound('error');
      setErrorString('O nome deve ter entre 3 e 20 caracteres.');
      return;
    }
    playSound('success');
    onCreate(cleanName, gender);
  };

  return (
    <div 
      id="create-player-container" 
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/98 p-4 font-sans text-white overflow-y-auto fivem-scanlines"
    >
      {/* Immersive high contrast top glowing beam */}
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-yellow-500 via-orange-500 to-green-500 shadow-[0_0_15px_rgba(234,179,8,0.5)]" />

      {/* Decorative large background wireframe letters */}
      <div className="absolute hidden lg:block select-none pointer-events-none -bottom-8 -left-12 opacity-5 text-[15rem] font-black tracking-tighter text-zinc-500 font-orbitron">
        FIVEM
      </div>
      <div className="absolute hidden lg:block select-none pointer-events-none -top-12 -right-12 opacity-5 text-[15rem] font-black tracking-tighter text-zinc-500 font-orbitron">
        GTARP
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        id="creation-card" 
        className="relative w-full max-w-4xl rounded-3xl border border-zinc-900 bg-zinc-950/90 p-6 md:p-10 shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl grid grid-cols-1 md:grid-cols-12 gap-8"
      >
        
        {/* Left Side: Creation details & Form (7 cols) */}
        <div className="md:col-span-7 space-y-6 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-1.5">
              <span className="inline-block rounded-md bg-yellow-500/10 px-3 py-1 text-[10px] font-black tracking-widest text-yellow-500 uppercase border border-yellow-500/20 font-orbitron glowing-badge-gold">
                REGISTRO DE MORADOR
              </span>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white font-display uppercase leading-none">
              CRIAR NOVO <span className="text-yellow-500">CIDADÃO</span>
            </h1>
            <p className="text-xs text-zinc-400 max-w-md">
              Bem-vindo ao despachante civil de imigração do Cidade RP. Insira informações reais para emitir sua ficha policial e licença de residência primária.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Gender Selection */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 font-orbitron">Selecione a Identidade de Gênero</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  id="select-gender-m"
                  onClick={() => {
                    playSound('click');
                    setGender('M');
                  }}
                  className={`flex items-center justify-center gap-3 rounded-2xl border py-4 transition-all duration-300 relative overflow-hidden cursor-pointer ${
                    gender === 'M'
                      ? 'border-yellow-500 bg-yellow-500/10 text-white shadow-xl shadow-yellow-500/5'
                      : 'border-zinc-900 bg-zinc-900/40 text-zinc-400 hover:border-zinc-800 hover:bg-zinc-900/40'
                  }`}
                >
                  <span className="text-2xl">🧔</span>
                  <span className="text-xs font-bold uppercase tracking-wider font-orbitron">MASCULINO</span>
                  {gender === 'M' && (
                    <div className="absolute top-0 right-0 h-4 w-4 bg-yellow-500 rounded-bl-lg" />
                  )}
                </button>
                <button
                  type="button"
                  id="select-gender-f"
                  onClick={() => {
                    playSound('click');
                    setGender('F');
                  }}
                  className={`flex items-center justify-center gap-3 rounded-2xl border py-4 transition-all duration-300 relative overflow-hidden cursor-pointer ${
                    gender === 'F'
                      ? 'border-yellow-500 bg-yellow-500/10 text-white shadow-xl shadow-yellow-500/5'
                      : 'border-zinc-900 bg-zinc-900/40 text-zinc-400 hover:border-zinc-800 hover:bg-zinc-900/40'
                  }`}
                >
                  <span className="text-2xl">👩</span>
                  <span className="text-xs font-bold uppercase tracking-wider font-orbitron">FEMININO</span>
                  {gender === 'F' && (
                    <div className="absolute top-0 right-0 h-4 w-4 bg-yellow-500 rounded-bl-lg" />
                  )}
                </button>
              </div>
            </div>

            {/* Name Input */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="player-name-input" className="text-[10px] font-black uppercase tracking-wider text-zinc-500 font-orbitron">
                  RG / NOME COMPLETO RP (USAR SUBLINHADO "_")
                </label>
                <button
                  type="button"
                  id="btn-random-name"
                  onClick={handleRandomPreset}
                  className="text-[10px] font-black text-yellow-500 hover:text-yellow-400 uppercase font-orbitron flex items-center gap-1 cursor-pointer"
                >
                  🎰 Sorteador
                </button>
              </div>
              
              <div className="relative">
                <input
                  id="player-name-input"
                  type="text"
                  placeholder="Ex: Marquinhos_do_Grau"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setErrorString('');
                  }}
                  className="w-full rounded-2xl border border-zinc-900 bg-zinc-950 px-4 py-4 text-white text-sm placeholder-zinc-700 transition-all focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 font-mono tracking-wider"
                />
              </div>
              {errorString && (
                <p id="name-error-msg" className="text-xs text-rose-500 font-bold flex items-center gap-1">⚠️ {errorString}</p>
              )}
            </div>

            {/* Submitting character */}
            <button
              type="submit"
              id="btn-create-character"
              className="w-full cursor-pointer rounded-2xl bg-gradient-to-r from-yellow-500 to-amber-500 text-black py-4.5 font-black text-xs tracking-widest uppercase transition-all shadow-xl shadow-yellow-500/10 hover:from-yellow-400 hover:to-amber-400 active:scale-[0.98] font-orbitron"
            >
              EMITIR PROTOCOLO DE ENTRADA ➔
            </button>
          </form>
        </div>

        {/* Right Side: Passport Preview & Tutorial Information (5 cols) */}
        <div className="md:col-span-5 rounded-2xl bg-zinc-900/40 border border-zinc-900 p-5 md:p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest font-orbitron border-b border-zinc-800 pb-2">
              📂 PASSAPORTE CRIMINAL RP
            </h3>

            {/* Passport card mockup */}
            <div className="relative overflow-hidden rounded-xl bg-zinc-950 border border-zinc-850 p-4 space-y-4 shadow-lg text-xs leading-relaxed font-mono">
              <div className="absolute top-0 right-0 p-3 text-3xl opacity-20 select-none">
                🇧🇷
              </div>
              <div className="space-y-2">
                <div>
                  <span className="text-zinc-650 text-[9px] block uppercase font-sans font-bold">Estado Emissor</span>
                  <span className="text-zinc-300 font-bold uppercase tracking-wider font-orbitron">REPÚBLICA DE SÃO PAULO / RJ</span>
                </div>

                <div>
                  <span className="text-zinc-650 text-[9px] block uppercase font-sans font-bold">Identidade Nacional</span>
                  <span className="text-white font-extrabold tracking-wider truncate block">
                    {name ? name.toUpperCase() : 'AGUARDANDO RG...'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-900/80">
                  <div>
                    <span className="text-zinc-650 text-[8px] block uppercase font-sans font-bold">Gênero</span>
                    <span className="text-zinc-300 font-bold">{gender === 'M' ? 'MASCULINO (🧔)' : 'FEMININO (👩)'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-650 text-[8px] block uppercase font-sans font-bold">Residência Primária</span>
                    <span className="text-zinc-300 font-bold">BANCO DA PRACA</span>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900/60 p-2.5 rounded border border-zinc-900/80 text-[11px] space-y-1 text-zinc-400">
                <div className="flex justify-between">
                  <span>💰 Capital Inicial:</span>
                  <strong className="text-emerald-400 font-bold">R$ 2.500,00</strong>
                </div>
                <div className="flex justify-between">
                  <span>🚲 Garagem Inicial:</span>
                  <strong className="text-zinc-200">Bike Caloi Velha</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Guide tips */}
          <div className="space-y-3 pt-4 border-t border-zinc-800/80">
            <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider font-orbitron block">REPLAY DE REGRAS</span>
            <div className="space-y-2 text-[11px] text-zinc-400 font-sans leading-snug">
              <div className="flex gap-2">
                <Shield className="h-4 w-4 text-yellow-500 shrink-0" />
                <span>Cumpra bicos de motoboy e entregas para obter seu primeiro capital limpo.</span>
              </div>
              <div className="flex gap-2">
                <Coins className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Compre um carro na concessionária e retire cartas de habilitação profissional no Detran para aumentar seus bônus salariais.</span>
              </div>
            </div>
          </div>
        </div>

      </motion.div>
    </div>
  );
}
