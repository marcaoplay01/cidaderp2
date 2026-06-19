const fs = require('fs');

// 1. Fix BankSection.tsx (Saldo Corrente overflow)
let bankContent = fs.readFileSync('./src/components/BankSection.tsx', 'utf8');
bankContent = bankContent.replace(/<strong className="text-lg text-emerald-400">/g, '<strong className="text-sm sm:text-lg text-emerald-400 truncate block">');
bankContent = bankContent.replace(/<strong className="text-lg text-yellow-500">/g, '<strong className="text-sm sm:text-lg text-yellow-500 truncate block">');
bankContent = bankContent.replace(/<strong className="text-lg text-blue-400">/g, '<strong className="text-sm sm:text-lg text-blue-400 truncate block">');
bankContent = bankContent.replace(/<strong className=\{\`text-lg \$\{loans\.length/g, '<strong className={`text-sm sm:text-lg truncate block ${loans.length');
// Also fix the "Rendendo +0.25% p/ tick" because it's no longer 0.25%, it's whatever we set. But I won't touch the text for now unless needed. Wait, I should fix it to not say +0.25% if we changed it.
bankContent = bankContent.replace(/Rendendo \+0\.25% p\/ tick/g, 'Rendendo ativamente');
fs.writeFileSync('./src/components/BankSection.tsx', bankContent, 'utf8');

// 2. Fix JobsSection.tsx (Buttons cutoff and Cancelar Entrega)
let jobsContent = fs.readFileSync('./src/components/JobsSection.tsx', 'utf8');
// The sequence arrow boxes:
jobsContent = jobsContent.replace(/className=\{\`h-11 w-11 md:h-14 md:w-14 rounded-lg flex items-center justify-center font-bold text-xl md:text-2xl transition-all border duration-200 \$\{/g, 'className={`h-9 w-9 sm:h-11 sm:w-11 md:h-14 md:w-14 shrink-0 rounded-lg flex items-center justify-center font-bold text-lg sm:text-xl md:text-2xl transition-all border duration-200 ${');
// The container of the sequence:
jobsContent = jobsContent.replace(/<div className="flex justify-center gap-1\.5 md:gap-3 flex-wrap bg-zinc-900\/50 p-4 rounded-xl border border-zinc-800">/g, '<div className="flex justify-center gap-1 sm:gap-1.5 md:gap-3 flex-wrap bg-zinc-900/50 p-2 sm:p-4 rounded-xl border border-zinc-800">');
// The interactive buttons:
jobsContent = jobsContent.replace(/className="h-12 w-16 bg-zinc-800/g, 'className="h-10 w-14 sm:h-12 sm:w-16 bg-zinc-800');
// The Cancel button is fine, but maybe add margin top to separate from buttons
jobsContent = jobsContent.replace(/<div className="flex justify-end pt-2 border-t border-zinc-900">/g, '<div className="flex justify-end pt-2 mt-2 border-t border-zinc-900">');
fs.writeFileSync('./src/components/JobsSection.tsx', jobsContent, 'utf8');

// 3. Fix RetentionSection.tsx (Tabs not scrollable)
let retContent = fs.readFileSync('./src/components/RetentionSection.tsx', 'utf8');
retContent = retContent.replace(/<div className="flex border-b border-zinc-900">/g, '<div className="flex border-b border-zinc-900 overflow-x-auto whitespace-nowrap scrollbar-hide pb-1">');
fs.writeFileSync('./src/components/RetentionSection.tsx', retContent, 'utf8');

console.log('UI Fixes Applied');
