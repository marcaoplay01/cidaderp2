const fs = require('fs');
const path = './src/components/CrimeSection.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Reduce Crime Rewards
const crimes = [
  {
    id: 'furto_celular',
    min: 200, max: 450
  },
  {
    id: 'trafico_esquinas',
    min: 800, max: 1500
  },
  {
    id: 'racha_rua',
    min: 1600, max: 3200
  },
  {
    id: 'roubo_loja_conveniencias',
    min: 1500, max: 3500
  },
  {
    id: 'roubo_veiculo_desmanche',
    min: 4500, max: 8000
  },
  {
    id: 'trafico_armamento_pesado',
    min: 8500, max: 15000
  }
];

for (const crime of crimes) {
  const regexMin = new RegExp(`id: '${crime.id}',[\\s\\S]*?minReward: [\\d\\.]+`);
  content = content.replace(regexMin, match => match.replace(/minReward: [\d\.]+/, `minReward: ${crime.min}`));
  
  const regexMax = new RegExp(`id: '${crime.id}',[\\s\\S]*?maxReward: [\\d\\.]+`);
  content = content.replace(regexMax, match => match.replace(/maxReward: [\d\.]+/, `maxReward: ${crime.max}`));
}

// 2. Reduce Criminal Reputation Bonus (from 1.25% per rep to 0.5% per rep)
content = content.replace(
  /const repRewardMultiplier = 1 \+ \(reputation \* 0\.0125\); \/\/ \+1\.25% per rep point/,
  "const repRewardMultiplier = 1 + (reputation * 0.005); // +0.5% per rep point (max 30%)"
);

fs.writeFileSync(path, content, 'utf8');
console.log('Rebalance completed on CrimeSection.tsx!');
