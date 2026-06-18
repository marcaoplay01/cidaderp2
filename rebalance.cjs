const fs = require('fs');
const path = './src/types.ts';
let content = fs.readFileSync(path, 'utf8');

// Replace Jobs
content = content.replace(/id: 'delivery_job',[\s\S]*?baseReward: \d+,/, match => match.replace(/baseReward: \d+,/, 'baseReward: 65,'));
content = content.replace(/id: 'app_driver_job',[\s\S]*?baseReward: \d+,/, match => match.replace(/baseReward: \d+,/, 'baseReward: 120,'));
content = content.replace(/id: 'mechanic_job',[\s\S]*?baseReward: \d+,/, match => match.replace(/baseReward: \d+,/, 'baseReward: 180,'));
content = content.replace(/id: 'taxi_job',[\s\S]*?baseReward: \d+,/, match => match.replace(/baseReward: \d+,/, 'baseReward: 250,'));
content = content.replace(/id: 'police_job',[\s\S]*?baseReward: \d+,/, match => match.replace(/baseReward: \d+,/, 'baseReward: 400,'));
content = content.replace(/id: 'trucker_job',[\s\S]*?baseReward: \d+,/, match => match.replace(/baseReward: \d+,/, 'baseReward: 600,'));
content = content.replace(/id: 'doctor_job',[\s\S]*?baseReward: \d+,/, match => match.replace(/baseReward: \d+,/, 'baseReward: 900,'));

// Vehicles Multipliers Map
const vehicleMultipliers = {
  'fiat_uno': '1.3',
  'gol_quadrado': '1.4',
  'celta': '1.35',
  'gol_g4': '1.35',
  'voyage': '1.5',
  'spin_taxi': '1.45',
  'corolla': '1.7',
  'civic_g10': '1.9',
  'jetta_gli': '2.1',
  'porsche_911': '2.4',
  'bmw_m3': '2.6',
  'gtr_r35': '2.8',
  'bugatti_chiron': '3.0',
  'vw_delivery_truck': '1.6',
  'scania_113': '2.2',
  'volvo_fh': '2.8',
  'scania_s770': '3.5',
  'vip_rs6': '2.2',
  'vip_sf90': '2.7',
  'honda_hornet': '1.4',
  'xre300': '1.5',
  's1000rr': '2.5'
};

for (const [id, mult] of Object.entries(vehicleMultipliers)) {
  const regex = new RegExp(`id: '${id}',[\\s\\S]*?multiplier: [\\d\\.]+,`);
  content = content.replace(regex, match => match.replace(/multiplier: [\d\.]+/, `multiplier: ${mult}`));
}

// Properties Passive Income Map
const propertiesIncome = {
  'kitnet_centro': '0.05',
  'casa_simples': '0.15',
  'sobrado_bairro': '0.5',
  'mansao_alphaville': '3.5',
  'cobertura_luxo': '15.0',
  'vip_loft': '1.5',
  'vip_cobertura': '6.0',
  'vip_island': '25.0'
};

for (const [id, inc] of Object.entries(propertiesIncome)) {
  const regex = new RegExp(`id: '${id}',[\\s\\S]*?passiveIncome: [\\d\\.]+,`);
  content = content.replace(regex, match => match.replace(/passiveIncome: [\d\.]+/, `passiveIncome: ${inc}`));
}

// Businesses Passive Income Map
const businessesIncome = {
  'lava_jato': '0.5',
  'oficina': '1.5',
  'mercado_bairro': '5.0',
  'posto_combustivel': '12.0',
  'transportadora': '25.0',
  'concessionaria': '45.0'
};

for (const [id, inc] of Object.entries(businessesIncome)) {
  const regex = new RegExp(`id: '${id}',[\\s\\S]*?baseIncomePerSecond: [\\d\\.]+,`);
  content = content.replace(regex, match => match.replace(/baseIncomePerSecond: [\d\.]+/, `baseIncomePerSecond: ${inc}`));
}

fs.writeFileSync(path, content, 'utf8');
console.log('Rebalance completed on types.ts!');
