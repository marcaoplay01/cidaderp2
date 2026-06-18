import React, { useState, useEffect, useRef } from 'react';
import { PlayerState, Vehicle, Property, VEHICLES, PROPERTIES } from '../types';
import { playSound } from '../utils/audio';
import { 
  Landmark, 
  PiggyBank, 
  LineChart as ChartIcon, 
  HandCoins, 
  Building2, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CircleDollarSign,
  TrendingUp, 
  TrendingDown, 
  Percent, 
  Calendar,
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight,
  Shield,
  HelpCircle,
  Coins,
  DollarSign
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';

interface BankSectionProps {
  player: PlayerState;
  updatePlayerState: (updater: (prev: PlayerState) => PlayerState, persist?: boolean) => void;
  showToast: (text: string, type: 'success' | 'info' | 'critical') => void;
}

// Fixed financial assets definitions
interface StockAsset {
  ticker: string;
  name: string;
  category: 'ações' | 'cripto';
  basePrice: number;
  volatility: number; // Max percentage swing per tick (decimal)
  trend: number; // Long-term trend bias
  description: string;
  color: string;
}

const STOCK_ASSETS: StockAsset[] = [
  {
    ticker: 'VALE3',
    name: 'Vale do Rio Doce S.A.',
    category: 'ações',
    basePrice: 65.50,
    volatility: 0.02,
    trend: 0.0005,
    description: 'Maior mineradora de ferro do Brasil. Fluxo de caixa forte, proventos garantidos e baixa volatilidade histórica.',
    color: '#0d9488'
  },
  {
    ticker: 'PETR4',
    name: 'Petrobras S.A. Preferencial',
    category: 'ações',
    basePrice: 38.20,
    volatility: 0.035,
    trend: 0.001,
    description: 'Gigante brasileira do petróleo. Sensível a variações do preço do barril Brent e mudanças políticas.',
    color: '#16a34a'
  },
  {
    ticker: 'ITUB4',
    name: 'Itaú Unibanco Holding SA',
    category: 'ações',
    basePrice: 34.10,
    volatility: 0.015,
    trend: 0.0008,
    description: 'Líder do setor financeiro privado nacional. Lucros astronômicos recorrentes e sólida governança.',
    color: '#ea580c'
  },
  {
    ticker: 'MGLU3',
    name: 'Magazine Luiza Ord',
    category: 'ações',
    basePrice: 2.15,
    volatility: 0.08,
    trend: -0.002,
    description: 'Ícone de varejo digital e alta volatilidade. Extremamente reativa aos ciclos das taxas de juros (Selic).',
    color: '#2563eb'
  },
  {
    ticker: 'BTC',
    name: 'Vira-Lata Caramelo Coin (Bitcoin)',
    category: 'cripto',
    basePrice: 380450.00,
    volatility: 0.05,
    trend: 0.002,
    description: 'A criptomoeda mãe do morro e das finanças, descentralizada e campeã contra a inflação urbana do Rio.',
    color: '#f59e0b'
  },
  {
    ticker: 'ETH',
    name: 'Rio Ether Network (Ethereum)',
    category: 'cripto',
    basePrice: 18500.00,
    volatility: 0.065,
    trend: 0.0015,
    description: 'Tokens inteligentes e gás do futuro da metrópole. Base de todos os contratos inteligentes e NFTs de arte urbana.',
    color: '#8b5cf6'
  },
  {
    ticker: 'SOL',
    name: 'Carioca Solana Network (SOL)',
    category: 'cripto',
    basePrice: 890.00,
    volatility: 0.09,
    trend: 0.003,
    description: 'A blockchain mais veloz e ensolarada das praias, ideal para micro-transações instantâneas de água de coco.',
    color: '#ec4899'
  },
  {
    ticker: 'DOGE',
    name: 'Doge Zueira Vira-Lata',
    category: 'cripto',
    basePrice: 0.72,
    volatility: 0.14,
    trend: -0.001,
    description: 'Memecoin puramente motivada pelo clamor dos memes das comunidades. Pode ir à lua ou desabar em minutos.',
    color: '#eab308'
  }
];

export default function BankSection({ player, updatePlayerState, showToast }: BankSectionProps) {
  const [activeSubTab, setActiveSubTab] = useState<'checking' | 'savings' | 'investments' | 'loans' | 'financing'>('checking');
  
  // Transaction lists
  const [transactions, setTransactions] = useState<Array<{ id: string; type: string; amount: number; date: string; tag: 'checking' | 'savings' | 'loan' | 'invest' }>>([
    { id: 't_init', type: 'Abertura de Conta Corrente', amount: 0, date: 'Hoje', tag: 'checking' }
  ]);

  // Current inputs
  const [checkingInput, setCheckingInput] = useState<string>('');
  const [savingsInput, setSavingsInput] = useState<string>('');
  
  // Dynamic market simulation state
  const [prices, setPrices] = useState<{ [ticker: string]: number }>(() => {
    const initial: { [ticker: string]: number } = {};
    STOCK_ASSETS.forEach(a => {
      initial[a.ticker] = a.basePrice;
    });
    return initial;
  });

  // Store price history: up to 15 points
  const [priceHistory, setPriceHistory] = useState<{ [ticker: string]: Array<{ name: string; preco: number }> }>(() => {
    const initial: { [ticker: string]: Array<{ name: string; preco: number }> } = {};
    STOCK_ASSETS.forEach(a => {
      // Seed with some random variations back in time
      const history: Array<{ name: string; preco: number }> = [];
      let tempPrice = a.basePrice * 0.9;
      for (let i = 1; i <= 12; i++) {
        tempPrice = tempPrice * (1 + (Math.random() * a.volatility * 2 - a.volatility) + a.trend);
        history.push({
          name: `T-${12 - i}`,
          preco: Math.max(0.01, Math.round(tempPrice * 100) / 100)
        });
      }
      initial[a.ticker] = history;
    });
    return initial;
  });

  const [selectedAsset, setSelectedAsset] = useState<StockAsset>(STOCK_ASSETS[0]);
  const [tradeAmount, setTradeAmount] = useState<string>('');
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');

  // Loans states
  const [borrowInput, setBorrowInput] = useState<string>('');
  const [loanDuration, setLoanDuration] = useState<number>(12); // months (installments)

  // Initialization states for Bank values if they do not exist
  const checkingBalance = player.bankChecking || 0;
  const savingsBalance = player.bankSavings || 0;
  const loans = player.bankLoans || [];
  const financings = player.bankFinancings || [];
  const investments = player.bankInvestments || { tesouro: 0, cdb: 0, stocks: {}, crypto: {} };

  // Run dynamic economy loop interval
  useEffect(() => {
    const interval = setInterval(() => {
      setPrices(prev => {
        const next = { ...prev };
        const nextHistory = { ...priceHistory };

        STOCK_ASSETS.forEach(asset => {
          const currentPrice = next[asset.ticker];
          // Fluctuation factors
          const changePercent = (Math.random() * asset.volatility * 2) - asset.volatility + asset.trend;
          const delta = currentPrice * changePercent;
          const nextPrice = Math.max(0.01, Math.round((currentPrice + delta) * 100) / 100);
          next[asset.ticker] = nextPrice;

          // History tracking
          const history = nextHistory[asset.ticker] || [];
          const nextPoints = [...history];
          if (nextPoints.length >= 15) {
            nextPoints.shift();
          }
          nextPoints.push({
            name: 'Agora',
            preco: nextPrice
          });
          nextHistory[asset.ticker] = nextPoints;
        });

        setPriceHistory(nextHistory);
        return next;
      });

      // Passive yield for Savings Account!
      // Earns 0.25% yield per game tick (balanced and steady)
      if (player.bankSavings && player.bankSavings > 0) {
        updatePlayerState(prev => {
          const savings = prev.bankSavings || 0;
          const yieldEarned = Math.round((savings * 0.0025) * 100) / 100;
          if (yieldEarned <= 0) return prev;

          // Add to savings
          return {
            ...prev,
            bankSavings: savings + yieldEarned,
          };
        }, false); // only temporal, persist can be triggered by work/crime/etc
      }
    }, 5000); // Ticks every 5 seconds! Highly active market.

    return () => clearInterval(interval);
  }, [priceHistory, player.bankSavings, updatePlayerState]);

  // General log transaction adder
  const addTransaction = (type: string, amount: number, tag: 'checking' | 'savings' | 'loan' | 'invest') => {
    setTransactions(prev => [
      {
        id: `t_${Date.now()}_${Math.random()}`,
        type,
        amount,
        date: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        tag
      },
      ...prev.slice(0, 50) // keep last 50
    ]);
  };

  // CHECKING TAB OPERATIONS
  const handleCheckingDeposit = () => {
    const amt = parseFloat(checkingInput);
    if (isNaN(amt) || amt <= 0) {
      playSound('error');
      alert('Por favor, informe um valor de depósito válido maior que zero R$.');
      return;
    }
    if (player.cash < amt) {
      playSound('error');
      alert(`Você não tem dinheiro na carteira suficiente! Você tem apenas R$ ${player.cash.toLocaleString('pt-BR')}.`);
      return;
    }

    playSound('cash');
    updatePlayerState(prev => {
      const currentChecking = prev.bankChecking || 0;
      return {
        ...prev,
        cash: Math.round((prev.cash - amt) * 100) / 100,
        bankChecking: Math.round((currentChecking + amt) * 100) / 100
      };
    }, true);

    addTransaction('Depósito em Conta Corrente', amt, 'checking');
    setCheckingInput('');
    showToast(`Depositado R$ ${amt.toLocaleString('pt-BR')} com sucesso na sua conta corrente!`, 'success');
  };

  const handleCheckingWithdraw = () => {
    const amt = parseFloat(checkingInput);
    if (isNaN(amt) || amt <= 0) {
      playSound('error');
      alert('Por favor, informe um valor de saque válido.');
      return;
    }
    if (checkingBalance < amt) {
      playSound('error');
      alert(`Saldo na Conta Corrente insuficiente! Seu saldo é de R$ ${checkingBalance.toLocaleString('pt-BR')}.`);
      return;
    }

    playSound('cash');
    updatePlayerState(prev => {
      const currentChecking = prev.bankChecking || 0;
      return {
        ...prev,
        cash: Math.round((prev.cash + amt) * 100) / 100,
        bankChecking: Math.round((currentChecking - amt) * 100) / 100
      };
    }, true);

    addTransaction('Saque de Conta Corrente', -amt, 'checking');
    setCheckingInput('');
    showToast(`Sacado R$ ${amt.toLocaleString('pt-BR')} para a sua carteira física!`, 'success');
  };

  // SAVINGS TAB OPERATIONS
  const handleSavingsDeposit = () => {
    const amt = parseFloat(savingsInput);
    if (isNaN(amt) || amt <= 0) {
      playSound('error');
      alert('Informe um valor de depósito válido.');
      return;
    }

    if (checkingBalance < amt) {
      playSound('error');
      alert(`Você não tem saldo na Conta Corrente para transferir para a Poupança! Deposite na corrente primeiro.`);
      return;
    }

    playSound('cash');
    updatePlayerState(prev => {
      const currentChecking = prev.bankChecking || 0;
      const currentSavings = prev.bankSavings || 0;
      return {
        ...prev,
        bankChecking: Math.round((currentChecking - amt) * 100) / 100,
        bankSavings: Math.round((currentSavings + amt) * 100) / 100
      };
    }, true);

    addTransaction('Aplicação em Poupança', amt, 'savings');
    setSavingsInput('');
    showToast(`R$ ${amt.toLocaleString('pt-BR')} aplicados na Poupança! Rendimentos ativos.`, 'success');
  };

  const handleSavingsWithdraw = () => {
    const amt = parseFloat(savingsInput);
    if (isNaN(amt) || amt <= 0) {
      playSound('error');
      alert('Informe um valor de resgate válido.');
      return;
    }

    if (savingsBalance < amt) {
      playSound('error');
      alert(`Saldo na Poupança insuficiente para essa retirada!`);
      return;
    }

    playSound('cash');
    updatePlayerState(prev => {
      const currentChecking = prev.bankChecking || 0;
      const currentSavings = prev.bankSavings || 0;
      return {
        ...prev,
        bankChecking: Math.round((currentChecking + amt) * 100) / 100,
        bankSavings: Math.round((currentSavings - amt) * 100) / 100
      };
    }, true);

    addTransaction('Resgate de Poupança', -amt, 'savings');
    setSavingsInput('');
    showToast(`R$ ${amt.toLocaleString('pt-BR')} resgatados da Poupança para sua conta corrente!`, 'success');
  };

  // INVESTMENT OPERATIONS: BUY & SELL STOCKS/CRYPTO/CDB/TESOURO
  const handleTradeAsset = () => {
    const qty = parseFloat(tradeAmount);
    if (isNaN(qty) || qty <= 0) {
      playSound('error');
      alert('Por favor, digite um valor ou quantidade válida do investimento.');
      return;
    }

    const currentPrice = prices[selectedAsset.ticker];
    const totalCost = qty * currentPrice;

    if (tradeType === 'buy') {
      if (checkingBalance < totalCost) {
        playSound('error');
        alert(`Saldo em Conta Corrente insuficiente! Total necessário: R$ ${totalCost.toLocaleString('pt-BR')}, saldo corrente: R$ ${checkingBalance.toLocaleString('pt-BR')}.`);
        return;
      }

      playSound('cash');
      updatePlayerState(prev => {
        const nextChecking = prev.bankChecking - totalCost;
        const currentInvest = prev.bankInvestments || { tesouro: 0, cdb: 0, stocks: {}, crypto: {} };
        const stocks = { ...currentInvest.stocks };
        const crypto = { ...currentInvest.crypto };

        if (selectedAsset.category === 'ações') {
          const portfolio = stocks[selectedAsset.ticker] || { shares: 0, avgPrice: 0 };
          const nextShares = portfolio.shares + qty;
          const nextAvg = ((portfolio.shares * portfolio.avgPrice) + totalCost) / nextShares;
          stocks[selectedAsset.ticker] = { shares: nextShares, avgPrice: nextAvg };
        } else {
          const portfolio = crypto[selectedAsset.ticker] || { amount: 0, avgPrice: 0 };
          const nextAmt = portfolio.amount + qty;
          const nextAvg = ((portfolio.amount * portfolio.avgPrice) + totalCost) / nextAmt;
          crypto[selectedAsset.ticker] = { amount: nextAmt, avgPrice: nextAvg };
        }

        return {
          ...prev,
          bankChecking: Math.round(nextChecking * 100) / 100,
          bankInvestments: { ...currentInvest, stocks, crypto }
        };
      }, true);

      addTransaction(`Compra de ${qty.toFixed(2)} ${selectedAsset.ticker}`, -totalCost, 'invest');
      setTradeAmount('');
      showToast(`Você comprou ${qty} unidades de ${selectedAsset.ticker} com sucesso por R$ ${totalCost.toLocaleString('pt-BR')}!`, 'success');
    } else {
      // Selling asset
      let userQty = 0;
      if (selectedAsset.category === 'ações') {
        userQty = investments.stocks[selectedAsset.ticker]?.shares || 0;
      } else {
        userQty = investments.crypto[selectedAsset.ticker]?.amount || 0;
      }

      if (userQty < qty) {
        playSound('error');
        alert(`Você não tem ações/tokens de ${selectedAsset.ticker} suficientes para vender essa quantia! Você possui apenas ${userQty.toFixed(4)}.`);
        return;
      }

      playSound('cash');
      updatePlayerState(prev => {
        const nextChecking = prev.bankChecking + totalCost;
        const currentInvest = prev.bankInvestments || { tesouro: 0, cdb: 0, stocks: {}, crypto: {} };
        const stocks = { ...currentInvest.stocks };
        const crypto = { ...currentInvest.crypto };

        if (selectedAsset.category === 'ações') {
          const portfolio = stocks[selectedAsset.ticker];
          const remainingShares = portfolio.shares - qty;
          if (remainingShares <= 0) {
            delete stocks[selectedAsset.ticker];
          } else {
            stocks[selectedAsset.ticker] = { ...portfolio, shares: remainingShares };
          }
        } else {
          const portfolio = crypto[selectedAsset.ticker];
          const remainingAmt = portfolio.amount - qty;
          if (remainingAmt <= 0) {
            delete crypto[selectedAsset.ticker];
          } else {
            crypto[selectedAsset.ticker] = { ...portfolio, amount: remainingAmt };
          }
        }

        return {
          ...prev,
          bankChecking: Math.round(nextChecking * 100) / 100,
          bankInvestments: { ...currentInvest, stocks, crypto }
        };
      }, true);

      addTransaction(`Venda de ${qty.toFixed(2)} ${selectedAsset.ticker}`, totalCost, 'invest');
      setTradeAmount('');
      showToast(`Você vendeu ${qty} unidades de ${selectedAsset.ticker} por R$ ${totalCost.toLocaleString('pt-BR')}!`, 'success');
    }
  };

  const handleSpecialInvest = (type: 'tesouro' | 'cdb', amt: number, action: 'apply' | 'recover') => {
    if (isNaN(amt) || amt <= 0) {
      playSound('error');
      alert('Digite um valor de aporte válido.');
      return;
    }

    if (action === 'apply') {
      if (checkingBalance < amt) {
        playSound('error');
        alert('Saldo na Conta Corrente insuficiente para esse investimento de renda fixa!');
        return;
      }

      playSound('cash');
      updatePlayerState(prev => {
        const nextChecking = prev.bankChecking - amt;
        const currentInvest = prev.bankInvestments || { tesouro: 0, cdb: 0, stocks: {}, crypto: {} };
        const updatedVal = (currentInvest[type] || 0) + amt;

        return {
          ...prev,
          bankChecking: Math.round(nextChecking * 100) / 100,
          bankInvestments: { ...currentInvest, [type]: updatedVal }
        };
      }, true);

      addTransaction(`Aporte Renda Fixa: ${type === 'tesouro' ? 'Tesouro Direto' : 'CDB Liquidez'}`, -amt, 'invest');
      showToast(`Aporte de R$ ${amt.toLocaleString('pt-BR')} realizado com sucesso!`, 'success');
    } else {
      const userAmount = investments[type] || 0;
      if (userAmount < amt) {
        playSound('error');
        alert(`Aporte insuficiente no investimento ${type} para resgatar R$ ${amt.toLocaleString('pt-BR')}!`);
        return;
      }

      playSound('cash');
      updatePlayerState(prev => {
        const nextChecking = prev.bankChecking + amt;
        const currentInvest = prev.bankInvestments || { tesouro: 0, cdb: 0, stocks: {}, crypto: {} };
        const updatedVal = (currentInvest[type] || 0) - amt;

        return {
          ...prev,
          bankChecking: Math.round(nextChecking * 100) / 100,
          bankInvestments: { ...currentInvest, [type]: updatedVal }
        };
      }, true);

      addTransaction(`Resgate Renda Fixa: ${type === 'tesouro' ? 'Tesouro Direto' : 'CDB Liquidez'}`, amt, 'invest');
      showToast(`Resgate de R$ ${amt.toLocaleString('pt-BR')} creditado na sua Conta Corrente!`, 'success');
    }
  };

  // LOANS: BORROWING AND REPAYING LIABILITIES
  const handleBorrowLoan = () => {
    const amt = parseFloat(borrowInput);
    if (isNaN(amt) || amt < 5000) {
      playSound('error');
      alert('O valor mínimo de aprovação de empréstimo online é R$ 5.000,00.');
      return;
    }

    // Limit credit: max 50% of player net worth (Total cash + owned houses + businesses value)
    const netAssets = (player.cash) + (player.bankSavings || 0) + (player.bankChecking || 0);
    const creditCap = Math.max(25000, netAssets * 1.5); // Allow up to 150% leverage or 25k for starters!

    if (amt > creditCap) {
      playSound('error');
      alert(`Empréstimo recusado pelo setor de análise de risco! Seu teto de crédito máximo com base em seus fundos integrados é R$ ${creditCap.toLocaleString('pt-BR')}.`);
      return;
    }

    // Interest rates vary by installment count: 12 months is 12% total, 24 is 20%, 36 is 30%
    const interestMapping: { [key: number]: number } = { 12: 0.12, 24: 0.20, 36: 0.28 };
    const rate = interestMapping[loanDuration] || 0.12;
    const totalToPay = amt * (1 + rate);
    const monthlyPayment = totalToPay / loanDuration;

    playSound('cash');
    updatePlayerState(prev => {
      const activeLoans = prev.bankLoans || [];
      const checking = prev.bankChecking || 0;

      const newLoan = {
        id: `loan_${Date.now()}`,
        amountBorrowed: amt,
        amountRemaining: totalToPay,
        interestRate: rate,
        totalInstallments: loanDuration,
        installmentsRemaining: loanDuration,
        paymentPerInstallment: Math.round(monthlyPayment * 100) / 100
      };

      return {
        ...prev,
        bankChecking: Math.round((checking + amt) * 100) / 100,
        bankLoans: [...activeLoans, newLoan]
      };
    }, true);

    addTransaction(`Empréstimo Aprovado Banco`, amt, 'loan');
    setBorrowInput('');
    showToast(`Empréstimo de R$ ${amt.toLocaleString('pt-BR')} creditado direto na Conta Corrente!`, 'success');
  };

  const handlePayLoanInstallment = (loanId: string) => {
    const currentLoans = player.bankLoans || [];
    const loan = currentLoans.find(l => l.id === loanId);
    if (!loan) return;

    if (checkingBalance < loan.paymentPerInstallment) {
      playSound('error');
      alert(`Saldo na Conta Corrente insuficiente para debitar a parcela de R$ ${loan.paymentPerInstallment.toLocaleString('pt-BR')}!`);
      return;
    }

    playSound('cash');
    updatePlayerState(prev => {
      const activeLoans = prev.bankLoans || [];
      const currentChecking = prev.bankChecking || 0;
      
      const updatedLoans = activeLoans.map(l => {
        if (l.id === loanId) {
          const remainingAmount = Math.max(0, l.amountRemaining - l.paymentPerInstallment);
          const remainingInstallments = l.installmentsRemaining - 1;
          return {
            ...l,
            amountRemaining: remainingAmount,
            installmentsRemaining: remainingInstallments
          };
        }
        return l;
      }).filter(l => l.amountRemaining > 0 && l.installmentsRemaining > 0);

      const stats = { ...prev.stats };
      stats.totalSpent += loan.paymentPerInstallment;

      return {
        ...prev,
        bankChecking: Math.round((currentChecking - loan.paymentPerInstallment) * 100) / 100,
        bankLoans: updatedLoans,
        stats
      };
    }, true);

    addTransaction(`Parcela de Empréstimo Paga`, -loan.paymentPerInstallment, 'loan');
    showToast(`Parcela paga com sucesso! Restam ${loan.installmentsRemaining - 1} de parcelas.`, 'success');
  };

  const handlePayOffLoanFull = (loanId: string) => {
    const currentLoans = player.bankLoans || [];
    const loan = currentLoans.find(l => l.id === loanId);
    if (!loan) return;

    // Apply slightly discounted payoff value
    const payoffCost = loan.amountRemaining * 0.96; // 4% discount on paying full ahead of time!

    if (checkingBalance < payoffCost) {
      playSound('error');
      alert(`Saldo in Conta Corrente insuficiente para pagar a vista e liquidar por R$ ${payoffCost.toLocaleString('pt-BR')}!`);
      return;
    }

    playSound('cash');
    updatePlayerState(prev => {
      const activeLoans = prev.bankLoans || [];
      const currentChecking = prev.bankChecking || 0;
      const filteredLoans = activeLoans.filter(l => l.id !== loanId);
      
      const stats = { ...prev.stats };
      stats.totalSpent += payoffCost;

      return {
        ...prev,
        bankChecking: Math.round((currentChecking - payoffCost) * 100) / 100,
        bankLoans: filteredLoans,
        stats
      };
    }, true);

    addTransaction(`Liquidação Integral de Empréstimo`, -payoffCost, 'loan');
    showToast(`Parabéns! Empréstimo quitado integralmente com desconto de antecipação!`, 'success');
  };

  // FINANCING SEC ACTIONS: FINANCE ASSET (PROPERTY OR VEHICLE)
  const handleFinanceAsset = (asset: Vehicle | Property, type: 'vehicle' | 'property', installmentChoice: number) => {
    // Requirements checks
    if (type === 'vehicle' && player.ownedVehicles.includes(asset.id)) {
      alert('Você já possui este veículo na sua garagem!');
      return;
    }
    if (type === 'property' && player.ownedProperties.includes(asset.id)) {
      alert('Você já possui este imóvel registrado!');
      return;
    }

    const price = asset.price;
    const downPayment = Math.floor(price * 0.20); // 20% down payment
    const financedAmount = price * 0.80;
    
    // Check if player has downpayment in checking account
    if (checkingBalance < downPayment) {
      playSound('error');
      alert(`Entrada mínima de 20% necessária na Conta Corrente! Custos de entrada: R$ ${downPayment.toLocaleString('pt-BR')}, seu saldo: R$ ${checkingBalance.toLocaleString('pt-BR')}`);
      return;
    }

    // Cost rates
    const installmentRates: { [key: number]: number } = { 24: 0.15, 36: 0.25, 48: 0.40 };
    const interestMultiplier = 1 + (installmentRates[installmentChoice] || 0.15);
    const finalAmountRemaining = financedAmount * interestMultiplier;
    const monthlyCost = finalAmountRemaining / installmentChoice;

    playSound('cash');
    updatePlayerState(prev => {
      const currentChecking = prev.bankChecking || 0;
      const ownedVehicles = [...prev.ownedVehicles];
      const ownedProperties = [...prev.ownedProperties];
      const currentFinancings = prev.bankFinancings || [];

      // Approve asset ownership instantly!
      if (type === 'vehicle') {
        ownedVehicles.push(asset.id);
      } else {
        ownedProperties.push(asset.id);
      }

      const nextFinancing = {
        id: `fin_${Date.now()}_${asset.id}`,
        assetId: asset.id,
        assetType: type,
        totalPrice: price,
        amountRemaining: Math.round(finalAmountRemaining * 100) / 100,
        totalInstallments: installmentChoice,
        installmentsRemaining: installmentChoice,
        paymentPerInstallment: Math.round(monthlyCost * 100) / 100
      };

      const stats = { ...prev.stats };
      stats.totalSpent += downPayment;

      return {
        ...prev,
        bankChecking: Math.round((currentChecking - downPayment) * 100) / 100,
        ownedVehicles,
        ownedProperties,
        bankFinancings: [...currentFinancings, nextFinancing],
        stats
      };
    }, true);

    addTransaction(`Entrada Financiamento: ${asset.name}`, -downPayment, 'checking');
    showToast(`Financiamento aprovado! Você recebeu o/a ${asset.name} com sucesso!`, 'success');
  };

  const handlePayFinancingInstallment = (financingId: string) => {
    const currentFinancings = player.bankFinancings || [];
    const fin = currentFinancings.find(f => f.id === financingId);
    if (!fin) return;

    if (checkingBalance < fin.paymentPerInstallment) {
      playSound('error');
      alert(`Saldo na Conta Corrente insuficiente para pagar parcela de R$ ${fin.paymentPerInstallment.toLocaleString('pt-BR')}!`);
      return;
    }

    playSound('cash');
    updatePlayerState(prev => {
      const activeFinancings = prev.bankFinancings || [];
      const currentChecking = prev.bankChecking || 0;

      const updatedFin = activeFinancings.map(f => {
        if (f.id === financingId) {
          return {
            ...f,
            amountRemaining: Math.max(0, f.amountRemaining - f.paymentPerInstallment),
            installmentsRemaining: f.installmentsRemaining - 1
          };
        }
        return f;
      }).filter(f => f.amountRemaining > 0 && f.installmentsRemaining > 0);

      const stats = { ...prev.stats };
      stats.totalSpent += fin.paymentPerInstallment;

      return {
        ...prev,
        bankChecking: Math.round((currentChecking - fin.paymentPerInstallment) * 100) / 100,
        bankFinancings: updatedFin,
        stats
      };
    }, true);

    addTransaction(`Prestação paga: Financiamento`, -fin.paymentPerInstallment, 'checking');
    showToast(`Prestação quitada de financiamento com sucesso!`, 'success');
  };

  return (
    <div className="space-y-6 font-sans text-left max-w-full overflow-hidden" id="bank-tab-pane">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-900 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2 uppercase tracking-tight">
            🏦 BANCO DO RIO FEDERAL S.A.
          </h2>
          <p className="text-zinc-500 text-xs mt-1">
            Seu portal financeiro seguro para depósitos, empréstimos, investimentos dinâmicos em bolsa/cripto e financiamento de bens.
          </p>
        </div>
        
        {/* Dynamic bank layout selector sub-tabs */}
        <div className="flex gap-1 overflow-x-auto bg-zinc-950 p-1 rounded-xl shrink-0">
          {[
            { id: 'checking', label: 'C. Corrente', icon: Landmark },
            { id: 'savings', label: 'Poupança', icon: PiggyBank },
            { id: 'investments', label: 'Investimentos', icon: ChartIcon },
            { id: 'loans', label: 'Empréstimos', icon: HandCoins },
            { id: 'financing', label: 'Financiar', icon: Building2 },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => { playSound('click'); setActiveSubTab(tab.id as any); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider cursor-pointer transition ${
                  activeSubTab === tab.id
                    ? 'bg-zinc-800 text-yellow-450 text-yellow-400' 
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* OVERALL QUICK SUMMARY STATS BAR */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-zinc-950/60 border border-zinc-900/80 p-3 rounded-xl font-mono text-left">
          <span className="text-[10px] text-zinc-500 uppercase block font-sans font-bold">Saldo Corrente</span>
          <strong className="text-lg text-emerald-400">R$ {checkingBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
        </div>
        <div className="bg-zinc-950/60 border border-zinc-900/80 p-3 rounded-xl font-mono text-left">
          <span className="text-[10px] text-zinc-500 uppercase block font-sans font-bold">Saldo Poupança</span>
          <strong className="text-lg text-yellow-500">R$ {savingsBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
          <span className="block text-[9px] text-emerald-500 font-sans font-bold mt-0.5">Rendendo +0.25% p/ tick</span>
        </div>
        <div className="bg-zinc-950/60 border border-zinc-900/80 p-3 rounded-xl font-mono text-left">
          <span className="text-[10px] text-zinc-500 uppercase block font-sans font-bold">Ativos Investidos</span>
          <strong className="text-lg text-blue-400">
            R$ {(
              (investments.tesouro || 0) + 
              (investments.cdb || 0) + 
              Object.keys(investments.stocks).reduce((sum, k) => sum + (investments.stocks[k].shares * prices[k]), 0) +
              Object.keys(investments.crypto).reduce((sum, k) => sum + (investments.crypto[k].amount * prices[k]), 0)
            ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </strong>
        </div>
        <div className="bg-zinc-950/60 border border-zinc-900/80 p-3 rounded-xl font-mono text-left">
          <span className="text-[10px] text-zinc-500 uppercase block font-sans font-bold">Dívidas Ativas</span>
          <strong className={`text-lg ${loans.length + financings.length > 0 ? 'text-red-400' : 'text-zinc-500'}`}>
            R$ {(
              loans.reduce((sum, l) => sum + l.amountRemaining, 0) +
              financings.reduce((sum, f) => sum + f.amountRemaining, 0)
            ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </strong>
        </div>
      </div>

      {/* SUB-TABS RENDERINGS */}
      {activeSubTab === 'checking' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in text-left">
          {/* Main Checking Interface */}
          <div className="lg:col-span-2 bg-zinc-950/40 p-5 rounded-2xl border border-zinc-900/80 space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              💳 OPERAÇÕES DA CONTA CORRENTE
            </h3>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Use a conta corrente para armazenar seus ganhos em segurança. O capital guardado no banco do Rio fica protegido de assaltos nas ruas e confiscos totais! É o motor para seus investimentos e financiamentos.
            </p>

            <div className="bg-zinc-900/30 p-4 rounded-xl border border-zinc-800/60 space-y-3">
              <label className="text-[10px] font-bold text-zinc-400 block uppercase">VALOR DA OPERAÇÃO (R$)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Ex: 5000"
                  value={checkingInput}
                  onChange={e => setCheckingInput(e.target.value)}
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-zinc-700"
                />
                <button
                  onClick={() => setCheckingInput(player.cash.toString())}
                  className="px-2.5 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 rounded text-[10px] font-mono font-bold uppercase transition border border-zinc-800 shrink-0"
                >
                  Tudo Carteira
                </button>
                <button
                  onClick={() => setCheckingInput(checkingBalance.toString())}
                  className="px-2.5 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 rounded text-[10px] font-mono font-bold uppercase transition border border-zinc-800 shrink-0"
                >
                  Tudo Banco
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={handleCheckingDeposit}
                  className="w-full py-3 bg-emerald-650 hover:bg-emerald-600 bg-emerald-600 cursor-pointer text-white rounded-lg text-xs uppercase font-extrabold tracking-wider transition-all flex items-center justify-center gap-1 text-center"
                >
                  <ArrowDownLeft className="h-4 w-4" /> Depositar no Banco
                </button>
                <button
                  onClick={handleCheckingWithdraw}
                  className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 cursor-pointer text-white rounded-lg text-xs uppercase font-extrabold tracking-wider transition-all flex items-center justify-center gap-1 border border-zinc-700"
                >
                  <ArrowUpRight className="h-4 w-4" /> Sacar p/ Carteira
                </button>
              </div>
            </div>

            {/* Quick pre-set chip values */}
            <div className="flex flex-wrap gap-1 items-center">
              <span className="text-[9px] text-zinc-500 uppercase font-black tracking-wider mr-2">Filtro rápido:</span>
              {[100, 500, 2000, 10000, 50000].map(val => (
                <button
                  key={val}
                  onClick={() => setCheckingInput(val.toString())}
                  className="px-2.5 py-1 bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 rounded font-mono text-[10px] text-zinc-400 transition"
                >
                  +R$ {val.toLocaleString('pt-BR')}
                </button>
              ))}
            </div>
          </div>

          {/* Feed and features info */}
          <div className="bg-zinc-950/40 p-4 rounded-2xl border border-zinc-900/80 flex flex-col justify-between">
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-900 pb-2 flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-emerald-400" /> EXTRATO HISTÓRICO
              </h4>
              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {transactions.length === 0 ? (
                  <p className="text-zinc-600 text-xs italic">Nenhuma movimentação bancária registrada ainda.</p>
                ) : (
                  transactions.slice(0, 5).map(t => (
                    <div key={t.id} className="flex justify-between items-center text-xs font-mono bg-zinc-950/50 p-2 rounded border border-zinc-900">
                      <div>
                        <span className="block text-zinc-200 font-bold leading-normal">{t.type}</span>
                        <span className="text-[10px] text-zinc-500">{t.date}</span>
                      </div>
                      <span className={`font-bold ${t.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {t.amount >= 0 ? '+' : ''} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-zinc-900/20 p-3 rounded-lg border border-zinc-900 text-[10px] text-zinc-500 leading-normal mt-4">
              🛡️ FGC Garantido: Seus montantes armazenados em Conta Corrente ou Poupança estão totalmente blindados contra desastres urbanos ou falências econômicas do estado. Seguro integral.
            </div>
          </div>
        </div>
      )}

      {/* SAVINGS TAB RENDERING */}
      {activeSubTab === 'savings' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in text-left">
          <div className="lg:col-span-2 bg-zinc-950/40 p-5 rounded-2xl border border-zinc-900/80 space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              🐷 CONTA POUPANÇA INTEGRADA
            </h3>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Trabalhe menos e deixe sua grana render! O capital aplicado na Poupança gera rendimentos passivos automáticos de **+0.25% a cada 5 segundos** em tempo real.
            </p>

            <div className="bg-zinc-900/30 p-4 rounded-xl border border-zinc-800/60 space-y-3">
              <label className="text-[10px] font-bold text-zinc-400 block uppercase">VALOR DO APORTE / RESGATE (R$)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Ex: 10000"
                  value={savingsInput}
                  onChange={e => setSavingsInput(e.target.value)}
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-zinc-700"
                />
                <button
                  onClick={() => setSavingsInput(checkingBalance.toString())}
                  className="px-2.5 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 rounded text-[10px] font-mono font-bold uppercase transition border border-zinc-800 shrink-0"
                >
                  Saldo Corrente
                </button>
                <button
                  onClick={() => setSavingsInput(savingsBalance.toString())}
                  className="px-2.5 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 rounded text-[10px] font-mono font-bold uppercase transition border border-zinc-800 shrink-0"
                >
                  Saldo Poupança
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={handleSavingsDeposit}
                  className="py-3 bg-yellow-600/90 hover:bg-yellow-650 cursor-pointer text-white rounded-lg text-xs uppercase font-extrabold tracking-wider transition-all flex items-center justify-center gap-1.5 text-center"
                >
                  <ArrowDownLeft className="h-4 w-4" /> Aplicar da Corrente
                </button>
                <button
                  onClick={handleSavingsWithdraw}
                  className="py-3 bg-zinc-800 hover:bg-zinc-700 cursor-pointer text-white rounded-lg text-xs uppercase font-extrabold tracking-wider transition-all flex items-center justify-center gap-1.5 border border-zinc-700"
                >
                  <ArrowUpRight className="h-4 w-4" /> Resgatar p/ Corrente
                </button>
              </div>
            </div>
          </div>

          <div className="bg-zinc-950/40 p-4 rounded-2xl border border-zinc-900/80 space-y-4">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-900 pb-2">
              💫 BENEFÍCIOS POUPANÇA
            </h4>
            <div className="space-y-4 text-xs font-mono text-zinc-300 leading-normal">
              <div className="p-3 bg-zinc-900/40 rounded-lg border border-zinc-900">
                <span className="block text-amber-500 font-bold mb-1">Rendimento Passivo</span>
                <span>Projeta ganhos recorrentes constantes sem trabalho braçal. R$ 50.000,00 aplicados rendem **R$ 125,00** por tick direto na sua conta!</span>
              </div>
              
              <div className="p-3 bg-zinc-900/40 rounded-lg border border-zinc-900">
                <span className="block text-emerald-400 font-bold mb-1">Livre de Fiança Fiscal</span>
                <span>Mesmo se você cometer delitos graves e for preso pela PM, os saldos mantidos sob aplicação de poupança no banco do Rio permanecem livres de multas judiciais diretas!</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INVESTMENTS SECTION: STOCK MARKET AND CRYPTO EXCHANGER WITH CHARTS */}
      {activeSubTab === 'investments' && (
        <div className="space-y-6 animate-fade-in text-left">
          {/* Top Panel: Split into Renda Fixa (Treasury/CDB) and Renda Variável (Stocks/Crypto Ticker Board) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Safe Fixed Income Products (Renda Fixa: Tesouro Direto and CDB) */}
            <div className="bg-zinc-950/40 p-5 rounded-2xl border border-zinc-900/80 space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                📂 RENDA FIXA (TESOURO & CDB LIQUIDEZ)
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Títulos de alta segurança. O Tesouro Direto possui proteção federal e o CDB é uma nota bancária corporativa com liquidez expressiva.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Tesouro card */}
                <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/80 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-extrabold text-teal-400 uppercase font-sans">Tesouro Direto</span>
                      <span className="text-[10px] bg-teal-500/10 text-teal-400 border border-teal-500/20 px-1.5 py-0.5 rounded font-mono">Guaranteed</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-1 leading-normal">Título público que recompensa sua paciência. Excelente estabilidade.</p>
                  </div>
                  
                  <div className="font-mono py-1">
                    <span className="text-[10px] text-zinc-500 block leading-none">Rendimento</span>
                    <strong className="text-emerald-400 text-sm">IPCA + 5.5% a.a.</strong>
                    <span className="text-[10px] text-zinc-400 block mt-2">Seu Investimento: <strong className="text-white">R$ {(investments.tesouro || 0).toLocaleString('pt-BR')}</strong></span>
                  </div>

                  <div className="flex gap-1.5 pt-1.5 border-t border-zinc-800">
                    <button
                      onClick={() => {
                        const amt = prompt('Quanto deseja aportar no Tesouro Direto?');
                        if (amt) handleSpecialInvest('tesouro', parseFloat(amt), 'apply');
                      }}
                      className="flex-1 py-1 px-1 bg-teal-950 hover:bg-teal-900 border border-teal-500/20 text-teal-400 hover:text-white rounded text-[10px] font-black uppercase tracking-wider transition cursor-pointer text-center"
                    >
                      Aportar
                    </button>
                    <button
                      onClick={() => {
                        const amt = prompt('Quanto deseja resgatar do Tesouro Direto?');
                        if (amt) handleSpecialInvest('tesouro', parseFloat(amt), 'recover');
                      }}
                      className="flex-1 py-1 px-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 text-zinc-400 hover:text-white rounded text-[10px] font-black uppercase tracking-wider transition cursor-pointer text-center"
                    >
                      Resgatar
                    </button>
                  </div>
                </div>

                {/* CDB Card */}
                <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/80 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-extrabold text-orange-400 uppercase font-sans">CDB Liquidez Diária</span>
                      <span className="text-[10px] bg-orange-500/10 text-orange-400 border border-orange-500/20 px-1.5 py-0.5 rounded font-mono">100% CDI</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-1 leading-normal">Certificado emitido pelo Banco Federal para captação comercial de alta liquidez.</p>
                  </div>

                  <div className="font-mono py-1">
                    <span className="text-[10px] text-zinc-500 block leading-none">Rendimento</span>
                    <strong className="text-orange-400 text-sm">11.15% ao Ano</strong>
                    <span className="text-[10px] text-zinc-400 block mt-2">Seu Investimento: <strong className="text-white">R$ {(investments.cdb || 0).toLocaleString('pt-BR')}</strong></span>
                  </div>

                  <div className="flex gap-1.5 pt-1.5 border-t border-zinc-800">
                    <button
                      onClick={() => {
                        const amt = prompt('Quanto deseja aportar no CDB?');
                        if (amt) handleSpecialInvest('cdb', parseFloat(amt), 'apply');
                      }}
                      className="flex-1 py-1 px-1 bg-orange-950 hover:bg-orange-900 border border-orange-500/20 text-orange-400 hover:text-white rounded text-[10px] font-black uppercase tracking-wider transition cursor-pointer text-center"
                    >
                      Aportar
                    </button>
                    <button
                      onClick={() => {
                        const amt = prompt('Quanto deseja resgatar do CDB?');
                        if (amt) handleSpecialInvest('cdb', parseFloat(amt), 'recover');
                      }}
                      className="flex-1 py-1 px-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 text-zinc-400 hover:text-white rounded text-[10px] font-black uppercase tracking-wider transition cursor-pointer text-center"
                    >
                      Resgatar
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* Variable Income Panel (Bolsa de Valores e Criptomoedas Tickers) */}
            <div className="bg-zinc-950/40 p-5 rounded-2xl border border-zinc-900/80 space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center justify-between">
                <span>📊 COTADOR EM TEMPO REAL (MARKET TICKER)</span>
                <span className="text-[10px] bg-red-500/10 text-red-450 text-red-500 px-2 py-0.5 rounded font-mono font-bold animate-pulse">● LIVE ATUALIZANDO</span>
              </h3>
              
              <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {STOCK_ASSETS.map(asset => {
                  const currentPrice = prices[asset.ticker];
                  const history = priceHistory[asset.ticker] || [];
                  const lastPrice = history.length > 1 ? history[history.length - 2].preco : currentPrice;
                  const pctChange = lastPrice !== 0 ? ((currentPrice - lastPrice) / lastPrice) * 100 : 0;
                  const isPositive = pctChange >= 0;

                  // Find how much player owns
                  let ownedCount = 0;
                  if (asset.category === 'ações') {
                    ownedCount = investments.stocks[asset.ticker]?.shares || 0;
                  } else {
                    ownedCount = investments.crypto[asset.ticker]?.amount || 0;
                  }

                  return (
                    <button
                      key={asset.ticker}
                      onClick={() => { playSound('click'); setSelectedAsset(asset); }}
                      className={`p-3.5 rounded-xl text-left border flex flex-col justify-between transition relative overflow-hidden ${
                        selectedAsset.ticker === asset.ticker
                          ? 'border-zinc-700 bg-zinc-900/80 shadow'
                          : 'border-zinc-900 bg-zinc-950 hover:bg-zinc-900/40'
                      }`}
                    >
                      <div className="flex justify-between items-start w-full">
                        <div>
                          <strong className="text-xs text-white font-mono block leading-none">{asset.ticker}</strong>
                          <span className="text-[9px] text-zinc-500 font-sans tracking-tight leading-normal">{asset.name}</span>
                        </div>
                        {ownedCount > 0 && (
                          <span className="text-[9px] bg-zinc-800 border border-zinc-700 px-1 py-0.2 rounded text-zinc-300 font-bold">
                            Own: {ownedCount.toFixed(selectedAsset.category === 'cripto' ? 4 : 2)}
                          </span>
                        )}
                      </div>

                      <div className="flex justify-between items-end w-full mt-4">
                        <span className="text-[11px] font-mono font-bold text-white leading-none">
                          R$ {currentPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                        <span className={`text-[10px] font-mono font-bold flex items-center leading-none ${isPositive ? 'text-emerald-450 text-emerald-400' : 'text-rose-400'}`}>
                          {isPositive ? <TrendingUp className="h-3 w-3 mr-0.5 shrink-0" /> : <TrendingDown className="h-3 w-3 mr-0.5 shrink-0" />}
                          {pctChange.toFixed(2)}%
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Bottom Interactive Block: Sleek Neon Graph & Trade Desk */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Neon AreaChart Visualizer (RECHARTS Professional Graphics) */}
            <div className="lg:col-span-2 bg-zinc-950/60 p-5 rounded-2xl border border-zinc-900/80 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                <div>
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest block leading-none">GRAFICO DE PERFORMANCE</h4>
                  <strong className="text-sm font-black text-white mt-1 block uppercase">Trendline: {selectedAsset.name} ({selectedAsset.ticker})</strong>
                </div>
                <div className="text-right font-mono">
                  <span className="text-zinc-500 block text-[9px] uppercase">Preço Atual</span>
                  <strong className="text-base text-sky-400">R$ {prices[selectedAsset.ticker].toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                </div>
              </div>

              {/* Chart container */}
              <div className="h-52 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={priceHistory[selectedAsset.ticker] || []}
                    margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id={`colorPrice-${selectedAsset.ticker}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={selectedAsset.color} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={selectedAsset.color} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#18181b" strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#52525b" 
                      fontSize={9} 
                      tickLine={false} 
                    />
                    <YAxis 
                      stroke="#52525b" 
                      fontSize={9} 
                      tickLine={false}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px' }}
                      labelStyle={{ color: '#a1a1aa', fontSize: '10px' }}
                      itemStyle={{ color: '#fff', fontSize: '11px', fontFamily: 'monospace' }}
                      formatter={(v: any) => [`R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Cotação']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="preco" 
                      stroke={selectedAsset.color} 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill={`url(#colorPrice-${selectedAsset.ticker})`} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <p className="text-[10px] text-zinc-500 leading-normal italic text-center">
                📊 Gráfico em tempo real de flutuações. Dados do pregão do Rio simulados de acordo com os ciclos econômicos correntes.
              </p>
            </div>

            {/* Trading Buy/Sell Panel desk */}
            <div className="bg-zinc-950/45 p-5 rounded-2xl border border-zinc-900/80 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex border border-zinc-900 rounded-lg p-0.5 bg-zinc-950">
                  <button
                    onClick={() => { playSound('click'); setTradeType('buy'); }}
                    className={`flex-1 py-1.5 rounded text-xs font-black uppercase tracking-wider transition ${tradeType === 'buy' ? 'bg-emerald-600 text-white' : 'text-zinc-500 hover:text-white'}`}
                  >
                    COMPRAR
                  </button>
                  <button
                    onClick={() => { playSound('click'); setTradeType('sell'); }}
                    className={`flex-1 py-1.5 rounded text-xs font-black uppercase tracking-wider transition ${tradeType === 'sell' ? 'bg-rose-600 text-white' : 'text-zinc-500 hover:text-white'}`}
                  >
                    VENDER
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-500 font-bold uppercase">Ativo</span>
                    <span className="text-zinc-300 font-bold">{selectedAsset.ticker}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-500 font-bold uppercase">Sua custódia</span>
                    <strong className="text-white font-mono">
                      {selectedAsset.category === 'ações' 
                        ? (investments.stocks[selectedAsset.ticker]?.shares || 0).toFixed(2)
                        : (investments.crypto[selectedAsset.ticker]?.amount || 0).toFixed(4)} {selectedAsset.ticker}
                    </strong>
                  </div>
                  {selectedAsset.category === 'ações' && investments.stocks[selectedAsset.ticker] && (
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-zinc-500">Preço Médio Compra</span>
                      <span className="text-zinc-300">R$ {investments.stocks[selectedAsset.ticker]?.avgPrice.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="space-y-1 pt-2">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase block">QUANTIDADE DE COTAS</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Ex: 5"
                        value={tradeAmount}
                        onChange={e => setTradeAmount(e.target.value)}
                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
                      />
                      <button
                        onClick={() => {
                          if (tradeType === 'buy') {
                            const maxShares = checkingBalance / prices[selectedAsset.ticker];
                            setTradeAmount(Math.floor(maxShares * 100) / 100 === 0 ? '' : (Math.floor(maxShares * 100) / 100).toString());
                          } else {
                            const owned = selectedAsset.category === 'ações' 
                              ? (investments.stocks[selectedAsset.ticker]?.shares || 0)
                              : (investments.crypto[selectedAsset.ticker]?.amount || 0);
                            setTradeAmount(owned.toString());
                          }
                        }}
                        className="px-2 py-1 bg-zinc-900 text-zinc-300 rounded text-[9px] font-mono font-bold uppercase tracking-wide border border-zinc-800"
                      >
                        MAX
                      </button>
                    </div>
                  </div>

                  {tradeAmount && !isNaN(parseFloat(tradeAmount)) && parseFloat(tradeAmount) > 0 && (
                    <div className="p-2.5 rounded bg-zinc-900/40 border border-zinc-900 text-xs text-zinc-400 space-y-1">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span>Preço Unitário</span>
                        <span>R$ {prices[selectedAsset.ticker].toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="flex justify-between font-bold text-white border-t border-zinc-900 pt-1 mt-1">
                        <span>Valor Estimado</span>
                        <span className="text-sky-400">R$ {(parseFloat(tradeAmount) * prices[selectedAsset.ticker]).toLocaleString('pt-BR')}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleTradeAsset}
                className={`w-full py-3 mt-4 rounded-xl text-xs uppercase font-extrabold tracking-wider transition ${
                  tradeType === 'buy'
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                    : 'bg-rose-600 hover:bg-rose-500 text-white cursor-pointer'
                }`}
              >
                {tradeType === 'buy' ? 'Confirmar Compra' : 'Confirmar Venda'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOANS SUB-TAB INTERFACES */}
      {activeSubTab === 'loans' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in text-left">
          
          {/* Apply panel */}
          <div className="lg:col-span-2 bg-zinc-950/40 p-5 rounded-2xl border border-zinc-900/80 space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              🤝 PLANO DE CRÉDITO E EMPRÉSTIMO ONLINE
            </h3>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Precisa de capital imediato para expandir uma empresa ou adquirir a casa de luxo dos seus sonhos? Peça micro-empréstimos ao banco! Os valores aprovados utilizam taxas controladas baseadas no seu nível de cidadania e histórico de grinding.
            </p>

            <div className="bg-zinc-900/30 p-4 rounded-xl border border-zinc-800/60 p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">VALOR DESEJADO (Min R$ 5.000)</label>
                  <input
                    type="number"
                    placeholder="Ex: 25000"
                    value={borrowInput}
                    onChange={e => setBorrowInput(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white font-mono focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">DURAÇÃO / PARCELAS</label>
                  <select
                    value={loanDuration}
                    onChange={e => setLoanDuration(parseInt(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 border-zinc-800 rounded px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value={12}>12 Meses (Juros 12% total)</option>
                    <option value={24}>24 Meses (Juros 20% total)</option>
                    <option value={36}>36 Meses (Juros 28% total)</option>
                  </select>
                </div>
              </div>

              {borrowInput && !isNaN(parseFloat(borrowInput)) && parseFloat(borrowInput) >= 5000 && (
                <div className="p-3.5 rounded bg-zinc-950/80 border border-zinc-900 grid grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-mono text-zinc-450 text-zinc-300">
                  <div>
                    <span className="text-zinc-500 text-[10px] uppercase block">A pagar por parcela</span>
                    <strong className="text-sm text-amber-500">
                      R$ {((parseFloat(borrowInput) * (1 + (loanDuration === 12 ? 0.12 : loanDuration === 24 ? 0.20 : 0.28))) / loanDuration).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                    </strong>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[10px] uppercase block">Total do Débito</span>
                    <strong className="text-sm text-white">
                      R$ {(parseFloat(borrowInput) * (1 + (loanDuration === 12 ? 0.12 : loanDuration === 24 ? 0.20 : 0.28))).toLocaleString('pt-BR')}
                    </strong>
                  </div>
                  <div className="col-span-2 lg:col-span-1">
                    <span className="text-zinc-500 text-[10px] uppercase block">Crédito Liberados p/ você</span>
                    <strong className="text-sm text-emerald-400">Aprovado Instantaneamente</strong>
                  </div>
                </div>
              )}

              <button
                onClick={handleBorrowLoan}
                className="w-full py-3.5 bg-indigo-700 hover:bg-indigo-650 cursor-pointer text-white font-extrabold uppercase text-xs tracking-widest rounded-lg transition"
              >
                Solicitar Aprovação e Receber Dinheiro
              </button>
            </div>
          </div>

          {/* Active loans panel */}
          <div className="bg-zinc-950/40 p-5 rounded-2xl border border-zinc-900/80 space-y-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-900 pb-2">
              📝 SEUS EMPRÉSTIMOS ATIVOS
            </h3>

            {loans.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 space-y-2 text-center">
                <CheckCircle2 className="h-8 w-8 text-zinc-600" />
                <p className="text-xs text-zinc-500 leading-normal">Nenhum empréstimo pendente! Seu escore de crédito nacional está impecável. Excelente!</p>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto max-h-[300px]">
                {loans.map(loan => (
                  <div key={loan.id} className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl space-y-2.5 font-mono text-xs">
                    <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                      <span className="text-indigo-400 font-bold">Crédito Online</span>
                      <span className="text-zinc-500">Restam {loan.installmentsRemaining} parcelas</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-zinc-400">
                      <div>
                        <span>Debito Restante:</span>
                        <strong className="block text-white">R$ {loan.amountRemaining.toLocaleString('pt-BR')}</strong>
                      </div>
                      <div>
                        <span>Valor Parcela:</span>
                        <strong className="block text-amber-500">R$ {loan.paymentPerInstallment.toLocaleString('pt-BR')}</strong>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handlePayLoanInstallment(loan.id)}
                        className="flex-1 py-1.5 bg-zinc-800 hover:bg-zinc-750 text-white rounded text-[10px] uppercase font-black transition cursor-pointer"
                      >
                        Pagar Parcela
                      </button>
                      <button
                        onClick={() => handlePayOffLoanFull(loan.id)}
                        className="flex-1 py-1.5 bg-emerald-950 border border-emerald-500/20 text-emerald-450 hover:bg-emerald-900 text-stone-200 rounded text-[10px] uppercase font-black transition cursor-pointer"
                      >
                        Quitar (-4% Desc.)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* FINANCING SUB-TAB INTERFACE */}
      {activeSubTab === 'financing' && (
        <div className="space-y-6 animate-fade-in text-left">
          <div className="bg-zinc-950/40 p-5 rounded-2xl border border-zinc-900/80 space-y-3">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              🚗 DEPARTAMENTO DE INCLUSÃO FINANCEIRA (FINANCIAMENTO DIRETO)
            </h3>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Não espere acumular milhões de reais à vista nas ruas do Rio! Financie garagens cheias de viaturas, motos velozes ou imóveis requintados pagando apenas uma **entrada mínima de 20%** em dinheiro corrente e parcelando o saldo devedor restante restantes em até 48 prestações!
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Catalog list block */}
            <div className="lg:col-span-2 bg-zinc-950/40 p-5 rounded-2xl border border-zinc-900/80 space-y-4">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-900 pb-2">
                CATÁLOGO DE CONCESSÕES FINANCIADAS
              </h4>

              {/* Grid of properties and vehicles that can be financed */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[350px] overflow-y-auto pr-1">
                
                {/* Vehicles for financing */}
                {VEHICLES.filter(v => v.price > 10000).map(vehicle => {
                  const alreadyOwns = player.ownedVehicles.includes(vehicle.id);
                  const downPaymentMin = Math.floor(vehicle.price * 0.20);
                  
                  return (
                    <div key={vehicle.id} className="p-3 bg-zinc-900/40 border border-zinc-900 rounded-xl flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex justify-between items-start">
                          <div>
                            <strong className="text-xs text-zinc-100">{vehicle.name}</strong>
                            <span className="block text-[9px] text-zinc-500 uppercase">{vehicle.type}</span>
                          </div>
                          <span className="text-[10px] bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded text-white font-mono">
                            R$ {vehicle.price.toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-400 leading-normal mt-1.5">{vehicle.description}</p>
                      </div>

                      <div className="border-t border-zinc-900/85 pt-2.5 font-mono text-[10.5px] text-zinc-400 space-y-1">
                        <div className="flex justify-between">
                          <span>Entrada Mínima (20%):</span>
                          <strong className="text-white">R$ {downPaymentMin.toLocaleString('pt-BR')}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Financiado (80%):</span>
                          <strong className="text-white">R$ {(vehicle.price - downPaymentMin).toLocaleString('pt-BR')}</strong>
                        </div>
                      </div>

                      {alreadyOwns ? (
                        <div className="text-[10px] text-center bg-zinc-950 border border-zinc-900 py-1 rounded text-zinc-500 font-bold">
                          JÁ COMPRADO E EMPLACADO
                        </div>
                      ) : (
                        <div className="flex gap-1.5 pt-1">
                          <button
                            onClick={() => handleFinanceAsset(vehicle, 'vehicle', 24)}
                            className="flex-1 py-1.5 bg-blue-900/60 hover:bg-blue-800 text-white rounded text-[9px] uppercase font-black transition cursor-pointer text-center"
                          >
                            24x Parc.
                          </button>
                          <button
                            onClick={() => handleFinanceAsset(vehicle, 'vehicle', 36)}
                            className="flex-1 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-[9px] uppercase font-black transition cursor-pointer text-center border border-zinc-700"
                          >
                            36x Parc.
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Properties for financing */}
                {PROPERTIES.filter(p => p.price > 25000).map(prop => {
                  const alreadyOwns = player.ownedProperties.includes(prop.id);
                  const downPaymentMin = Math.floor(prop.price * 0.20);

                  return (
                    <div key={prop.id} className="p-3 bg-zinc-900/40 border border-zinc-900 rounded-xl flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex justify-between items-start">
                          <div>
                            <strong className="text-xs text-zinc-100">{prop.name}</strong>
                            <span className="block text-[9px] text-zinc-500 uppercase">{prop.comfortLabel}</span>
                          </div>
                          <span className="text-[10px] bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded text-white font-mono">
                            R$ {prop.price.toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-400 leading-normal mt-1.5">{prop.description}</p>
                      </div>

                      <div className="border-t border-zinc-900/85 pt-2.5 font-mono text-[10.5px] text-zinc-400 space-y-1">
                        <div className="flex justify-between">
                          <span>Entrada Mínima (20%):</span>
                          <strong className="text-white">R$ {downPaymentMin.toLocaleString('pt-BR')}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Financiado (80%):</span>
                          <strong className="text-white">R$ {(prop.price - downPaymentMin).toLocaleString('pt-BR')}</strong>
                        </div>
                      </div>

                      {alreadyOwns ? (
                        <div className="text-[10px] text-center bg-zinc-950 border border-zinc-900 py-1 rounded text-zinc-500 font-bold">
                          IMÓVEL CONSTITUÍDO
                        </div>
                      ) : (
                        <div className="flex gap-1.5 pt-1">
                          <button
                            onClick={() => handleFinanceAsset(prop, 'property', 36)}
                            className="flex-1 py-1.5 bg-blue-900/60 hover:bg-blue-800 text-white rounded text-[9px] uppercase font-black transition cursor-pointer text-center"
                          >
                            36x Parc.
                          </button>
                          <button
                            onClick={() => handleFinanceAsset(prop, 'property', 48)}
                            className="flex-1 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-[9px] uppercase font-black transition cursor-pointer text-center border border-zinc-700"
                          >
                            48x Parc.
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

              </div>
            </div>

            {/* Selected active financings list */}
            <div className="bg-zinc-950/40 p-5 rounded-2xl border border-zinc-900/80 space-y-4">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-900 pb-2">
                🏠 FINANCIAMENTOS COM CONTRATO ATIVO
              </h4>

              {financings.length === 0 ? (
                <p className="text-xs text-zinc-500 italic font-mono leading-normal">
                  Sua certidão imobiliária e de propriedade móvel está completamente limpa de alienações ou hipotecas corporativas.
                </p>
              ) : (
                <div className="space-y-3 max-h-[350px] overflow-y-auto">
                  {financings.map(f => {
                    const vehicleObj = VEHICLES.find(v => v.id === f.assetId);
                    const propObj = PROPERTIES.find(p => p.id === f.assetId);
                    const name = vehicleObj ? vehicleObj.name : (propObj ? propObj.name : 'Bem Não Identificado');

                    return (
                      <div key={f.id} className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl space-y-2.5 font-mono text-xs">
                        <div className="flex justify-between border-b border-zinc-900 pb-1 w-full text-[11px]">
                          <strong className="text-white truncate max-w-[200px] sm:max-w-none">{name}</strong>
                          <span className="text-zinc-500 text-[9px] shrink-0">{f.installmentsRemaining} parcelas res.</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[10px] text-zinc-400">
                          <div>
                            <span>Principal Restante:</span>
                            <strong className="block text-zinc-300">R$ {f.amountRemaining.toLocaleString('pt-BR')}</strong>
                          </div>
                          <div>
                            <span>Prestação Mensal:</span>
                            <strong className="block text-amber-500">R$ {f.paymentPerInstallment.toLocaleString('pt-BR')}</strong>
                          </div>
                        </div>

                        <button
                          onClick={() => handlePayFinancingInstallment(f.id)}
                          className="w-full py-1.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white rounded text-[10px] uppercase font-bold tracking-wider transition cursor-pointer"
                        >
                          Pagar Prestação
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
