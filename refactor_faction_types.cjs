const fs = require('fs');
let typesContent = fs.readFileSync('./src/types.ts', 'utf8');

// 1. Update PlayerState to include ammo and faction points
if (!typesContent.includes('ammo?: number;')) {
    typesContent = typesContent.replace(/factionXp\?: number;/, "factionXp?: number;\n  ammo?: number; // Poder de Fogo (Munição)\n  donatedToFaction?: { cash: number; ammo: number; };");
}

// 2. Insert new Job 'armeiro_clandestino'
if (!typesContent.includes("id: 'armeiro_clandestino'")) {
    const newJob = `
  {
    id: 'armeiro_clandestino',
    name: 'Armeiro Clandestino',
    description: 'Funda sucatas de chumbo para fabricar munição e armas no porão. O produto pode ser vendido ou doado para facções.',
    baseReward: 1200,
    xpReward: 100,
    energyCost: 40,
    requiredVehicleId: null,
    requiredLicense: null,
    xpRequired: 1500,
    levelRequired: 6,
    icon: 'Hammer',
    activeMinigameTitle: 'Prensando Pólvora',
    executionTime: 8,
    bonusChance: 0,
  },
`;
    typesContent = typesContent.replace(/export const JOBS: Job\[\] = \[\n/, "export const JOBS: Job[] = [\n" + newJob);
}

fs.writeFileSync('./src/types.ts', typesContent, 'utf8');
console.log('Types updated with Faction War specs!');
