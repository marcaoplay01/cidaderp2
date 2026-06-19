const fs = require('fs');
const path = './src/types.ts';
let content = fs.readFileSync(path, 'utf8');

// Interface
content = content.replace(/baseIncomePerSecond: number;/, 'productionCycleTime: number; // in seconds\n  revenuePerCycle: number;');

// Replacements
// Lava jato: 5 mins (300s) -> 0.5 * 300 = 150 (let's make it 180)
content = content.replace(/baseIncomePerSecond: 0.5, \/\/ ~ R\$ 90 por minuto/, 'productionCycleTime: 300,\n    revenuePerCycle: 200,');

// Oficina: 15 mins (900s) -> 1.5 * 900 = 1350
content = content.replace(/baseIncomePerSecond: 1.5, \/\/ ~ R\$ 270 por minuto/, 'productionCycleTime: 900,\n    revenuePerCycle: 1500,');

// Mercado: 1 hora (3600s) -> 5.0 * 3600 = 18000
content = content.replace(/baseIncomePerSecond: 5.0, \/\/ ~ R\$ 900 por minuto/, 'productionCycleTime: 3600,\n    revenuePerCycle: 20000,');

// Posto: 4 horas (14400s) -> 12.0 * 14400 = 172800
content = content.replace(/baseIncomePerSecond: 12.0, \/\/ ~ R\$ 3.000 por minuto/, 'productionCycleTime: 14400,\n    revenuePerCycle: 180000,');

// Transportadora: 12 horas (43200s) -> 25.0 * 43200 = 1080000
content = content.replace(/baseIncomePerSecond: 25.0, \/\/ ~ R\$ 6.900 por minuto/, 'productionCycleTime: 43200,\n    revenuePerCycle: 1000000,');

// Concessionaria: 24 horas (86400s) -> 45.0 * 86400 = 3888000
content = content.replace(/baseIncomePerSecond: 45.0, \/\/ ~ R\$ 16.800 por minuto/, 'productionCycleTime: 86400,\n    revenuePerCycle: 3500000,');

fs.writeFileSync(path, content, 'utf8');
console.log('Businesses refactored in types.ts');
