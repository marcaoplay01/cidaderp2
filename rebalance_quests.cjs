const fs = require('fs');
const path = './src/utils/retentionData.ts';
let content = fs.readFileSync(path, 'utf8');

const replacements = [
  { t: 'rewardC: 15000', r: 'rewardC: 800' },
  { t: 'rewardC: 12000', r: 'rewardC: 650' },
  { t: 'rewardC: 18000', r: 'rewardC: 1200' },
  { t: 'rewardC: 22000', r: 'rewardC: 1500' },
  { t: 'rewardC: 8000', r: 'rewardC: 450' },
  { t: 'rewardC: 20000', r: 'rewardC: 1200' },
  { t: 'rewardCash: 45000', r: 'rewardCash: 5000' },
  { t: 'rewardCash: 35000', r: 'rewardCash: 3500' },
  { t: 'rewardCash: 25000', r: 'rewardCash: 2500' }
];

for (const rep of replacements) {
  content = content.replace(rep.t, rep.r);
}

fs.writeFileSync(path, content, 'utf8');
console.log('Rebalance quests completed!');
