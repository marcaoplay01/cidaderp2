const fs = require('fs');
let typesContent = fs.readFileSync('./src/types.ts', 'utf8');

const careerSearch = `  careers?: Record<string, { level: number; xp: number }>;`;
const careerReplace = `  careers?: Record<string, { level: number; xp: number; unlockedPerks?: string[] }>;`;

typesContent = typesContent.replace(careerSearch, careerReplace);
fs.writeFileSync('./src/types.ts', typesContent, 'utf8');
console.log('Types updated for career perks');
