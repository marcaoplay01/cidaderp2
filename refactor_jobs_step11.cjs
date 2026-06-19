const fs = require('fs');
let appContent = fs.readFileSync('./src/App.tsx', 'utf8');

const finalReturnSearch = `      let newStress = Math.min(100, (prev.stress || 0) + 2); // +2% stress per job
      return {
        ...prev,
        cash: newCash,
        stress: newStress,`;

const finalReturnReplace = `      let newStress = Math.min(100, (prev.stress || 0) + 2); // +2% stress per job

      // Process Daily Contracts
      let extraCash = 0;
      const updatedContracts = (prev.dailyContracts || []).map(contract => {
        if (!contract.completed && contract.targetJob === job.id) {
          const newProgress = contract.progress + 1;
          const justCompleted = newProgress >= contract.goal;
          if (justCompleted && contract.rewardType === 'cash') {
            extraCash += contract.rewardValue;
            showToast(\`Contrato concluído! Você recebeu R$ \${contract.rewardValue}\`, 'success');
          }
          return { ...contract, progress: newProgress, completed: contract.completed || justCompleted };
        }
        return contract;
      });

      return {
        ...prev,
        cash: newCash + extraCash,
        stress: newStress,
        dailyContracts: updatedContracts,`;

appContent = appContent.replace(finalReturnSearch, finalReturnReplace);
fs.writeFileSync('./src/App.tsx', appContent, 'utf8');
console.log('App.tsx updated for Daily Contracts progress');
