const fs = require('fs');
const pathApp = './src/App.tsx';
let appContent = fs.readFileSync(pathApp, 'utf8');

const oldRest = /const handleRestFinished = \(amountToRestore: number\) => \{\s*updatePlayerState\(prev => \{\s*const finalEnergy = Math\.min\(prev\.maxEnergy, prev\.energy \+ amountToRestore\);\s*return \{\s*\.\.\.prev,\s*energy: finalEnergy,\s*\};\s*\}, true\);\s*showToast\('Fadiga recarregada! Você está pronto para acelerar\.', 'success'\);\s*\};/;
const newRest = `  const handleRestFinished = useCallback((amountToRestore: number) => {
    updatePlayerState(prev => {
      const finalEnergy = Math.min(prev.maxEnergy, prev.energy + amountToRestore);
      return {
        ...prev,
        energy: finalEnergy,
      };
    }, true);
    showToast('Fadiga recarregada! Você está pronto para acelerar.', 'success');
  }, [updatePlayerState]);`;
appContent = appContent.replace(oldRest, newRest);

fs.writeFileSync(pathApp, appContent, 'utf8');
console.log('App.tsx handleRestFinished fixed');
