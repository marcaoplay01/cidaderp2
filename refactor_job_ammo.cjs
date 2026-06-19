const fs = require('fs');
let appContent = fs.readFileSync('./src/App.tsx', 'utf8');

const searchBlock = `
      return {
        ...prev,
        cash: newCash,
        xp: finalXp,
        level: finalLevel,
        energy: newEnergy,
        maxEnergy: activeMaxEnergy,
        stats: updatedStats,
        careers: nextCareers,
      };
    }, true); // Save instantly
`;

const replaceBlock = `
      let addedAmmo = 0;
      if (job.id === 'armeiro_clandestino') {
        addedAmmo = Math.floor(Math.random() * 3) + 1; // 1 to 3 ammo
        results.ammoDropped = addedAmmo;
      }

      return {
        ...prev,
        cash: newCash,
        xp: finalXp,
        level: finalLevel,
        energy: newEnergy,
        maxEnergy: activeMaxEnergy,
        stats: updatedStats,
        careers: nextCareers,
        ammo: (prev.ammo || 0) + addedAmmo,
      };
    }, true); // Save instantly
`;

appContent = appContent.replace(searchBlock, replaceBlock);

// We also need to add ammoDropped to the interface of onResult in handleCompleteActiveJob
const interfaceSearch = `
    onResult: (res: {
      baseCash: number;
      vehicleBonusCash: number;
      bonusCash: number;
      totalCash: number;
      isBonusTriggered: boolean;
      newCareerLevel: number;
      newCareerXp: number;
      careerLeveledUp: boolean;
      careerXpNeeded: number;
    }) => void
`;

const interfaceReplace = `
    onResult: (res: {
      baseCash: number;
      vehicleBonusCash: number;
      bonusCash: number;
      totalCash: number;
      isBonusTriggered: boolean;
      newCareerLevel: number;
      newCareerXp: number;
      careerLeveledUp: boolean;
      careerXpNeeded: number;
      ammoDropped?: number;
    }) => void
`;

appContent = appContent.replace(interfaceSearch, interfaceReplace);

fs.writeFileSync('./src/App.tsx', appContent, 'utf8');
console.log('App.tsx ammo updated!');
