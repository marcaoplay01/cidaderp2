const fs = require('fs');
let propsContent = fs.readFileSync('./src/components/PropertiesSection.tsx', 'utf8');

const sleepSearch = `          ...prev,
          energy: newEnergy,
        };
      });

      playSound('cash');
      showToast('Vitalidade e Energia restauradas com sucesso!', 'success');`;

const sleepReplace = `          ...prev,
          energy: newEnergy,
          stress: Math.max(0, (prev.stress || 0) - 30), // Resting reduces stress by 30%
        };
      });

      playSound('cash');
      showToast('Vitalidade restaurada e Estresse reduzido em 30%!', 'success');`;

propsContent = propsContent.replace(sleepSearch, sleepReplace);
fs.writeFileSync('./src/components/PropertiesSection.tsx', propsContent, 'utf8');

console.log('PropertiesSection updated to relieve stress');
