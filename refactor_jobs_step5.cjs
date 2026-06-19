const fs = require('fs');

let typesContent = fs.readFileSync('./src/types.ts', 'utf8');
if (!typesContent.includes('stressRestore?: number;')) {
  typesContent = typesContent.replace(/energyRestore: number;/, "energyRestore: number;\n  stressRestore?: number;");
}

// Add new food items
if (!typesContent.includes('cafe_premium')) {
  const newItems = `
  {
    id: 'cafe_premium',
    name: 'Café Premium Gourmet',
    price: 150,
    energyRestore: 10,
    stressRestore: 15,
    icon: 'Coffee',
    description: 'Café caro de franquia gringa. Reduz 15% de Estresse Mental.',
  },
  {
    id: 'balada_vip',
    name: 'Pulseira Camarote Balada VIP',
    price: 3000,
    energyRestore: 0,
    stressRestore: 100,
    icon: 'Sparkles',
    description: 'Noitada insana com os contatos. Zera TODO o seu Estresse Mental.',
  },`;
  typesContent = typesContent.replace(/export const FOOD_ITEMS: FoodItem\[\] = \[\n/, "export const FOOD_ITEMS: FoodItem[] = [\n" + newItems);
}
fs.writeFileSync('./src/types.ts', typesContent, 'utf8');

// Update StoreSection.tsx to apply stress reduction
let storeContent = fs.readFileSync('./src/components/StoreSection.tsx', 'utf8');

const onBuyFoodSearch = `    onBuyFood(food);
    playSound('cash');
    showToast(\`Comprou \${food.name} por R$ \${food.price}\`, 'success');`;
// Wait, the StoreSection does NOT update player state directly, it passes onBuyFood to App.tsx.
fs.writeFileSync('./src/components/StoreSection.tsx', storeContent, 'utf8');

// Update App.tsx handleBuyFood
let appContent = fs.readFileSync('./src/App.tsx', 'utf8');
const handleBuyFoodSearch = `      return {
        ...prev,
        cash: prev.cash - food.price,
        energy: Math.min(prev.maxEnergy, prev.energy + food.energyRestore),
      };
    });`;
const handleBuyFoodReplace = `      return {
        ...prev,
        cash: prev.cash - food.price,
        energy: Math.min(prev.maxEnergy, prev.energy + food.energyRestore),
        stress: Math.max(0, (prev.stress || 0) - (food.stressRestore || 0)),
      };
    });`;
appContent = appContent.replace(handleBuyFoodSearch, handleBuyFoodReplace);
fs.writeFileSync('./src/App.tsx', appContent, 'utf8');

console.log('Types and App updated for Stress relief foods');
