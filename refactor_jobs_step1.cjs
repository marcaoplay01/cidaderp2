const fs = require('fs');

// 1. types.ts - Add stress
let typesContent = fs.readFileSync('./src/types.ts', 'utf8');
if (!typesContent.includes('stress?: number;')) {
  typesContent = typesContent.replace(/energy: number;/, "energy: number;\n  stress?: number;");
}
// Add permits/alvaras array and daily contracts array
if (!typesContent.includes('workPermits?: string[];')) {
  typesContent = typesContent.replace(/licenses: \(\'driver\' \| \'truck\'\)\[\];/, "licenses: ('driver' | 'truck')[];\n  workPermits?: string[];\n  dailyContracts?: any[];");
}

fs.writeFileSync('./src/types.ts', typesContent, 'utf8');
console.log('types.ts updated for Step 1');
