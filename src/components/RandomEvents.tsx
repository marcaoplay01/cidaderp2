import { playSound } from '../utils/audio';
import { PlayerState, VEHICLES, Vehicle } from '../types';
import { ShieldAlert, AlertTriangle, Dice5, HelpCircle, UserCheck } from 'lucide-react';

export interface RPRandomEvent {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'high' | 'lucky';
  options: {
    id: string;
    text: string;
    action: (player: PlayerState, activeVehicle: Vehicle | null) => {
      success: boolean;
      updatedPlayer: PlayerState;
      resultMessage: string;
      sound: 'success' | 'error' | 'cash' | 'pm_siren' | 'click' | 'work';
    };
  }[];
}

interface RandomEventsProps {
  event: RPRandomEvent;
  player: PlayerState;
  onResolve: (updatedPlayer: PlayerState, outcomeMessage: string) => void;
}

// Global list of fully pre-programmed modular events!
export const EVENTS_POOL: RPRandomEvent[] = [
  {
    id: 'pm_blitz',
    title: '🚨 BLITZ DA POLÍCIA MILITAR',
    description: 'A viatura da PM parou você na avenida principal para verificar habilitações e escapamento de moto!',
    severity: 'high',
    options: [
      {
        id: 'pm_docs',
        text: 'Apresentar Documentos da Categoria',
        action: (player) => {
          // If has driver license
          if (player.hasDriversLicense) {
            return {
              success: true,
              updatedPlayer: {
                ...player,
                xp: player.xp + 45,
              },
              resultMessage: 'Tudo legal! O cabo verificou sua CNH B ativa e te liberou com um aperto de mãos. Você ganhou +45 XP por cidadania.',
              sound: 'success',
            };
          } else {
            const fine = Math.min(player.cash, 650);
            return {
              success: false,
              updatedPlayer: {
                ...player,
                cash: player.cash - fine,
                energy: Math.max(5, player.energy - 15),
              },
              resultMessage: `Sem habilitação na carteira! O sargento reteve sua chave. Você foi multado em R$ ${fine.toFixed(2)} e passou nervoso (-15 Energia).`,
              sound: 'error',
            };
          }
        },
      },
      {
        id: 'pm_flee',
        text: 'Dar FUGA no grau! (Depende da Velocidade)',
        action: (player, activeVehicle) => {
          const speed = activeVehicle ? activeVehicle.speed : 5; // slow if bare feet
          const successChance = Math.min(0.9, speed / 115); // e.g. Porsche 911 (100) has near guaranteed success (~87%), Bike (15) fails

          if (Math.random() < successChance) {
            const xpReward = 150;
            return {
              success: true,
              updatedPlayer: {
                ...player,
                xp: player.xp + xpReward,
                stats: {
                  ...player.stats,
                  streetRobberiesSurvived: player.stats.streetRobberiesSurvived + 1,
                },
              },
              resultMessage: `CORTOU DE GIRO E SUMIU! Você passou no vão dos cones e deixou a viatura para trás. Ganhou +${xpReward} XP pela perícia insana!`,
              sound: 'success',
            };
          } else {
            const fine = Math.min(player.cash, 1100);
            return {
              success: false,
              updatedPlayer: {
                ...player,
                cash: player.cash - fine,
                energy: Math.max(0, player.energy - 35),
              },
              resultMessage: `RODOU NO GRAU! A viatura te cercou na curva. Você perdeu R$ ${fine.toLocaleString('pt-BR')} em propina e guincho, e ficou exausto do quiproquó (-35 Energia).`,
              sound: 'error',
            };
          }
        },
      },
    ],
  },
  {
    id: 'esquina_assalto',
    title: '🔫 DOIS CARAS NUMA BIZ PRETA',
    description: 'Dois caras usando capacete com viseira escura subiram na calçada e anunciaram o assalto!',
    severity: 'high',
    options: [
      {
        id: 'rob_cooperar',
        text: 'Entregar o celular e notas trocadas',
        action: (player) => {
          const lost = Math.min(player.cash, 180);
          return {
            success: true,
            updatedPlayer: {
              ...player,
              cash: Math.max(0, player.cash - lost),
            },
            resultMessage: `Você entregou R$ ${lost.toFixed(2)} da carteira rápida. Eles guardaram as peças e sumiram em direção à rodovia. Pelo menos saiu ileso.`,
            sound: 'error',
          };
        },
      },
      {
        id: 'rob_run',
        text: 'Dar uma rasteira e picar mula correndo! (40% de Chance)',
        action: (player) => {
          if (Math.random() < 0.4) {
            return {
              success: true,
              updatedPlayer: {
                ...player,
                xp: player.xp + 80,
              },
              resultMessage: 'ESCAPOU CORRENDO! Os meliantes se atrapalharam para tombar a Biz e você se infiltrou nas escadas da viela. +80 XP pelo susto.',
              sound: 'success',
            };
          } else {
            const lost = Math.floor(player.cash * 0.2); // loses 20%
            return {
              success: false,
              updatedPlayer: {
                ...player,
                cash: player.cash - lost,
                energy: Math.max(10, player.energy - 25),
              },
              resultMessage: `ENTROU NUMA FRASCRUTA! Te derrubaram na calçada. Eles levaram 20% do seu saldo total (R$ ${lost.toFixed(2)}) e te agrediram nas pernas (-25 Energia).`,
              sound: 'error',
            };
          }
        },
      },
    ],
  },
  {
    id: 'mega_sena',
    title: '🍀 SORTEIO DA SORTE',
    description: 'Um ambulante simpático na passarela te convenceu a comprar um bilhete da sorte especial por R$ 10.',
    severity: 'lucky',
    options: [
      {
        id: 'mega_buy',
        text: 'Comprar Bilhete (R$ 10)',
        action: (player) => {
          if (player.cash < 10) {
            return {
              success: false,
              updatedPlayer: player,
              resultMessage: 'Você checou os bolsos, mas não tinha sequer R$ 10 para tentar a sorte hoje.',
              sound: 'error',
            };
          }

          const hasWon = Math.random() < 0.12; // 12% win rate
          if (hasWon) {
            const winAmount = 1200;
            return {
              success: true,
              updatedPlayer: {
                ...player,
                cash: player.cash + winAmount - 10,
                xp: player.xp + 90,
              },
              resultMessage: `O BILHETE ESTAVA PREMIADO! Você raspou e faturou R$ ${winAmount.toLocaleString('pt-BR')} na lotérica do centro! +90 XP de sorte.`,
              sound: 'cash',
            };
          } else {
            return {
              success: false,
              updatedPlayer: {
                ...player,
                cash: player.cash - 10,
              },
              resultMessage: 'Deu ruim. O bilhete continha "Não foi desta vez". Menos R$ 10 do seu bolso.',
              sound: 'error',
            };
          }
        },
      },
      {
        id: 'mega_skip',
        text: 'Não obrigado, prefiro o suor do trabalho',
        action: (player) => {
          return {
            success: true,
            updatedPlayer: player,
            resultMessage: 'Você guardou sua grana e seguiu firme rumo ao seu próximo expediente diário.',
            sound: 'click',
          };
        },
      },
    ],
  },
];

export default function RandomEvents({ event, player, onResolve }: RandomEventsProps) {
  const activeVehicle = player.currentVehicleId 
    ? VEHICLES.find(v => v.id === player.currentVehicleId) || null
    : null;

  const handleOptionSelect = (optionId: string) => {
    const option = event.options.find(o => o.id === optionId);
    if (!option) return;

    // Execute the effect
    const res = option.action(player, activeVehicle);
    
    // Play sound from response trigger
    playSound(res.sound);

    // Callback up
    onResolve(res.updatedPlayer, res.resultMessage);
  };

  return (
    <div id="random-event-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 font-sans text-white backdrop-blur-md">
      <div 
        id="event-card"
        className={`relative w-full max-w-xl rounded-2xl border bg-zinc-900 p-8 shadow-2xl ${
          event.severity === 'high' 
            ? 'border-red-500/40 shadow-red-500/5' 
            : event.severity === 'lucky'
            ? 'border-yellow-500/40 shadow-yellow-500/5'
            : 'border-zinc-800'
        }`}
      >
        <div className="absolute top-0 right-0 p-4 opacity-5 text-8xl pointer-events-none select-none">
          🚨
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className={`h-8 w-8 rounded-lg flex items-center justify-center ${
              event.severity === 'high' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'
            }`}>
              <ShieldAlert className="h-5 w-5 animate-pulse" />
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Evento de Rua Súbito</span>
          </div>

          <h2 className="text-2xl font-black text-white leading-tight uppercase font-display">
            {event.title}
          </h2>

          <p className="text-sm text-zinc-300 leading-relaxed bg-zinc-950 p-4 border border-zinc-900 rounded-xl">
            {event.description}
          </p>

          <p className="text-xs text-zinc-500 italic mt-1 bg-zinc-900/40 px-3 py-2 rounded">
            Veículo que você está conduzindo atual: <strong className="text-zinc-300">{activeVehicle ? activeVehicle.name : 'A pé sem veículo'}</strong>
          </p>
        </div>

        <div className="space-y-3 mt-6">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-400">Qual vai ser sua jogada?</h4>
          
          <div id="event-options-list" className="flex flex-col gap-3">
            {event.options.map(opt => (
              <button
                key={opt.id}
                id={`btn-event-option-${opt.id}`}
                onClick={() => handleOptionSelect(opt.id)}
                className="w-full text-left rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 hover:border-zinc-600 hover:bg-zinc-800 hover:text-white transition-all text-xs font-semibold cursor-pointer flex items-center justify-between"
              >
                <span>{opt.text}</span>
                <span className="text-zinc-500">➔</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
