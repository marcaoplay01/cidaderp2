const fs = require('fs');
const path = './src/components/JobsSection.tsx';
let content = fs.readFileSync(path, 'utf8');

// We need to limit the multiplied reward
const regex = /const fuelCost = carDetails \? carDetails\.consumption \* 15 : 0;/;
const limitLogic = `
      const fuelCost = carDetails ? carDetails.consumption * 15 : 0;
      // Global limit on base job earning (prevent broken modifiers)
      multipliedReward = Math.min(multipliedReward, 8000);
`;
content = content.replace(regex, limitLogic);

fs.writeFileSync(path, content, 'utf8');
console.log('JobsSection earnings limited');
