const fs = require('fs');
const path = './src/types.ts';
let content = fs.readFileSync(path, 'utf8');

// Add new vehicles
const newVehicles = `
  {
    id: 'iate_luxo',
    name: 'Iate de Luxo Monaco',
    price: 50000000,
    description: 'Um palácio flutuante. O custo de tripulação, ancoragem e seguro é astronômico.',
    speed: 80,
    consumption: 1500, // Custo altíssimo por viagem
    multiplier: 1.0,
    type: 'sport',
    icon: 'Ship',
    vipRequired: 'ouro'
  },
  {
    id: 'jatinho_particular',
    name: 'Jatinho Gulfstream G650',
    price: 150000000,
    description: 'Voe acima das nuvens e do trânsito. O custo de hangar, piloto e querosene de aviação drena a conta.',
    speed: 950,
    consumption: 3000,
    multiplier: 1.0,
    type: 'sport',
    icon: 'Plane',
    vipRequired: 'ouro'
  },
];`;

content = content.replace(/];\s*export const PROPERTIES/, newVehicles + '\n\nexport const PROPERTIES');

// Add new properties
const newProperties = `
  {
    id: 'mansao_suspensa',
    name: 'Mansão Suspensa Leblon',
    price: 250000000,
    description: 'A joia do Rio. O IPTU e condomínio cobram o preço desse privilégio.',
    energyRegenRate: 100,
    maxEnergyBonus: 800,
    comfortLabel: 'Apex Predador',
    icon: 'Castle',
    passiveIncome: -1500, // Drena R$ 1.500 por segundo (manutenção)
    vipRequired: 'ouro'
  }
];`;

content = content.replace(/];\s*export const BUSINESSES/, newProperties + '\n\nexport const BUSINESSES');

fs.writeFileSync(path, content, 'utf8');
console.log('Luxury items added!');
