const fs = require('fs');

// 1. Update types.ts
let typesContent = fs.readFileSync('./src/types.ts', 'utf8');
if (!typesContent.includes('criminalReputationRequired?: number')) {
  typesContent = typesContent.replace(/levelRequired: number;/, "levelRequired: number;\n  criminalReputationRequired?: number;");
}
typesContent = typesContent.replace(/id: 'armeiro_clandestino',[\s\S]*?levelRequired: 6,/, match => match + "\n    criminalReputationRequired: 200,");
fs.writeFileSync('./src/types.ts', typesContent, 'utf8');

// 2. Update JobsSection.tsx
let jobsContent = fs.readFileSync('./src/components/JobsSection.tsx', 'utf8');

const oldSearch = `            const levelLocked = player.level < job.levelRequired;
            const targetVehicle = VEHICLES.find(v => v.id === job.requiredVehicleId);
            const needsVehicle = job.requiredVehicleId && !player.ownedVehicles.includes(job.requiredVehicleId);
            const needsLicense = job.requiredLicense !== 'none' && 
              ((job.requiredLicense === 'driver' && !player.hasDriversLicense) ||
               (job.requiredLicense === 'truck' && !player.hasTruckLicense));

            const isLocked = levelLocked || needsVehicle || needsLicense;`;

const newReplace = `            const levelLocked = player.level < job.levelRequired;
            const repLocked = job.criminalReputationRequired ? (player.criminalReputation || 0) < job.criminalReputationRequired : false;
            const targetVehicle = VEHICLES.find(v => v.id === job.requiredVehicleId);
            const needsVehicle = job.requiredVehicleId && !player.ownedVehicles.includes(job.requiredVehicleId);
            const needsLicense = job.requiredLicense !== 'none' && 
              ((job.requiredLicense === 'driver' && !player.hasDriversLicense) ||
               (job.requiredLicense === 'truck' && !player.hasTruckLicense));

            const isLocked = levelLocked || repLocked || needsVehicle || needsLicense;`;

jobsContent = jobsContent.replace(oldSearch, newReplace);

// Add missing requirement UI
const oldSearchReq = `Requisitos: LVL {job.levelRequired} • {job.requiredLicense === 'none' ? 'Sem CNH' : job.requiredLicense === 'driver' ? 'CNH B' : 'CNH E'}`;
const newReplaceReq = `Requisitos: LVL {job.levelRequired} {job.criminalReputationRequired ? '\u2022 Rep. ' + job.criminalReputationRequired : ''} \u2022 {job.requiredLicense === 'none' ? 'Sem CNH' : job.requiredLicense === 'driver' ? 'CNH B' : 'CNH E'}`;

jobsContent = jobsContent.replace(oldSearchReq, newReplaceReq);

fs.writeFileSync('./src/components/JobsSection.tsx', jobsContent, 'utf8');
console.log('Armeiro Clandestino reputation requirement added!');
