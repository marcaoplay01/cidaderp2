const fs = require('fs');
let jobsContent = fs.readFileSync('./src/components/JobsSection.tsx', 'utf8');

// Add new states for random events
const stateInjectionPoint = `  const [deliveryFinished, setDeliveryFinished] = useState(false);`;
const stateNew = `  const [deliveryFinished, setDeliveryFinished] = useState(false);
  const [activeRandomEvent, setActiveRandomEvent] = useState<any>(null);
  const [showEventModal, setShowEventModal] = useState(false);`;
jobsContent = jobsContent.replace(stateInjectionPoint, stateNew);

// Add random event logic on key press
const keyPressSearch = `        if (nextIndex >= gpsSequence.length) {
          // Route complete! Successfully delivered!
          handleJobSuccess();
        }`;
const keyPressReplace = `        if (nextIndex >= gpsSequence.length) {
          // Route complete! Successfully delivered!
          handleJobSuccess();
        } else if (Math.random() < 0.05 && !showEventModal) { // 5% chance per step to trigger event
          setActiveRandomEvent({
             title: 'Passageiro Apressado',
             desc: 'O passageiro oferece +R$ 800 de caixinha se você furar o sinal vermelho à frente.',
             riskDesc: '75% de sucesso | 25% de R$ 1.500 de multa + 10% Estresse',
             onAccept: () => {
                setShowEventModal(false);
                if (Math.random() < 0.75) {
                  showToast('Você acelerou e deu certo! +R$ 800 de caixinha extra garantida.', 'success');
                  // Need a way to inject extra cash. For MVP, we'll just give it directly to player state.
                  updatePlayerState(p => ({ ...p, cash: p.cash + 800 }));
                  // Fake X Alert
                  alert('FAKE-X: @cidade_alerta: "Mano, o carro placa final 4 acaba de voar num sinal vermelho aqui no Centro kkkkkkk achei que ia de arrasta pra cima 🚀 #TransitoMaluco"');
                } else {
                  showToast('O guarda viu! Você tomou R$ 1.500 de multa e ficou estressado.', 'critical');
                  updatePlayerState(p => ({ ...p, cash: Math.max(0, p.cash - 1500), stress: Math.min(100, (p.stress || 0) + 10) }));
                }
             },
             onDecline: () => {
                setShowEventModal(false);
                showToast('Você recusou e seguiu a lei.', 'info');
             }
          });
          setShowEventModal(true);
        }`;
jobsContent = jobsContent.replace(keyPressSearch, keyPressReplace);

// Add modal UI
const modalInjectionPoint = `      {/* Background/Current job status */}`;
const modalNew = `      {showEventModal && activeRandomEvent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-sm w-full p-6 text-center animate-bounce-in">
            <h2 className="text-xl font-black text-amber-500 mb-2">⚠️ EVENTO ALEATÓRIO!</h2>
            <p className="text-zinc-300 text-sm mb-4">{activeRandomEvent.desc}</p>
            <div className="bg-red-500/10 border border-red-500/20 rounded p-2 mb-6">
               <p className="text-xs font-mono text-red-400">{activeRandomEvent.riskDesc}</p>
            </div>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => activeRandomEvent.onAccept()} 
                className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-xl transition"
              >
                Aceitar o Risco
              </button>
              <button 
                onClick={() => activeRandomEvent.onDecline()} 
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-3 rounded-xl transition"
              >
                Recusar e seguir seguro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Background/Current job status */}`;
jobsContent = jobsContent.replace(modalInjectionPoint, modalNew);

fs.writeFileSync('./src/components/JobsSection.tsx', jobsContent, 'utf8');
console.log('JobsSection.tsx updated for Random Events');
