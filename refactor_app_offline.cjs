const fs = require('fs');
const pathApp = './src/App.tsx';
let appContent = fs.readFileSync(pathApp, 'utf8');

// Remove business passive income from offline calculation
const offlineRegex = /let businessPassivePerSec = 0;[\s\S]*?const totalPassiveRate = propertyPassivePerSec \+ businessPassivePerSec;/;
appContent = appContent.replace(offlineRegex, 'const totalPassiveRate = propertyPassivePerSec;');

fs.writeFileSync(pathApp, appContent, 'utf8');
console.log('App.tsx offline business passive removed');
