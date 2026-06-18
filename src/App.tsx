import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Briefcase, 
  Key, 
  Home as HomeIcon, 
  TrendingUp, 
  ShoppingBag, 
  BarChart2, 
  Coins, 
  Zap, 
  Award, 
  ShieldAlert, 
  Undo,
  Volume2, 
  VolumeX,
  Sparkles,
  Info,
  Skull,
  Landmark,
  Swords,
  Newspaper
} from 'lucide-react';

import { 
  PlayerState, 
  Vehicle, 
  Property, 
  Business, 
  FoodItem, 
  Job, 
  VEHICLES, 
  PROPERTIES, 
  BUSINESSES, 
  FOOD_ITEMS, 
  getXpForNextLevel,
  JOBS,
  EconomyEvent,
  ECONOMY_EVENTS,
  DailyQuest,
  WeeklyObjective,
  NewsPost,
  NewsComment
} from './types';

import { 
  DAILY_LOGIN_CALENDAR, 
  RARE_COLLECTIBLES, 
  ACHIEVEMENTS_LIST, 
  generateDailyQuests, 
  generateWeeklyObjectives, 
  getPassiveBonusMultipliers,
  SimulatedLeaderboardEntry
} from './utils/retentionData';

import CreatePlayer from './components/CreatePlayer';
import HUD from './components/HUD';
import JobsSection from './components/JobsSection';
import VehiclesSection from './components/VehiclesSection';
import PropertiesSection from './components/PropertiesSection';
import BusinessesSection from './components/BusinessesSection';
import StoreSection from './components/StoreSection';
import CrimeSection from './components/CrimeSection';
import FactionsSection from './components/FactionsSection';
import RetentionSection from './components/RetentionSection';
import BankSection from './components/BankSection';
import CidadeNewsSection, { NPC_NAMES, NPC_HANDLES, NPC_AVATARS, COMMENT_RESPONSES } from './components/CidadeNewsSection';
import RandomEvents, { RPRandomEvent, EVENTS_POOL } from './components/RandomEvents';
import { playSound, toggleMute, getMutedState } from './utils/audio';
import { savePlayerState, loadPlayerState, syncPendingData } from './lib/persistence';
import { supabase } from './lib/supabase';



const STORAGE_KEY = 'cidade_rp_tycoon_save_v1';

export default function App() {
  const [player, setPlayer] = useState<PlayerState | null>(null);
  const [activeTab, setActiveTab] = useState<'jobs' | 'vehicles' | 'properties' | 'businesses' | 'store' | 'stats' | 'crime' | 'factions' | 'bank' | 'news'>('jobs');
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [jobMinigameState, setJobMinigameState] = useState<'idle' | 'playing' | 'success' | 'failure'>('idle');
  const [jailTimer, setJailTimer] = useState(0);
  const [activeBoosterType, setActiveBoosterType] = useState<'double_salary' | 'free_energy' | 'double_crime' | null>(null);
  const [boosterTimeRemaining, setBoosterTimeRemaining] = useState<number>(0);
  const [globalLeaderboard, setGlobalLeaderboard] = useState<SimulatedLeaderboardEntry[]>([]);
  
  // Real-time Business Vaults / Accumulated passive cash state
  const [accumulatedProfits, setAccumulatedProfits] = useState<{ [id: string]: number }>({});
  
  // Random event state
  const [activeStreetEvent, setActiveStreetEvent] = useState<RPRandomEvent | null>(null);
  const [eventOutcomeMsg, setEventOutcomeMsg] = useState<string | null>(null);

  // General Notification feedback banner
  const [appNotification, setAppNotification] = useState<{ text: string; type: 'success' | 'info' | 'critical' } | null>(null);

  // Dynamic economy events systems
  const [activeEvent, setActiveEvent] = useState<EconomyEvent | null>(null);
  const [nextEventInSeconds, setNextEventInSeconds] = useState<number>(90); // 90 seconds countdown to first event

  // Time ticks trackers
  const lastPassiveTick = useRef<number>(Date.now());

  // Show a visual game feedback toast
  const showToast = (text: string, type: 'success' | 'info' | 'critical' = 'info') => {
    setAppNotification({ text, type });
    setTimeout(() => {
      setAppNotification(prev => prev?.text === text ? null : prev);
    }, 4500);
  };

  // Pre-initialize retention fields and reward offline profits
  const initializeRetentionAndOfflineEarnings = useCallback((loaded: PlayerState): PlayerState => {
    const todayStr = new Date().toISOString().split('T')[0];
    const prevRetention = loaded.retention || {};
    let currentStreak = prevRetention.loginStreak ?? 0;
    let claimedToday = prevRetention.claimedDailyToday ?? false;
    let dailyQuests = prevRetention.dailyQuests || [];
    let weeklyObjectives = prevRetention.weeklyObjectives || [];
    let notificationsToShow: (() => void)[] = [];

    if (prevRetention.lastLoginDate) {
      if (prevRetention.lastLoginDate !== todayStr) {
        const lastDate = new Date(prevRetention.lastLoginDate);
        const todayDate = new Date(todayStr);
        const diffDays = Math.ceil((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          if (claimedToday) {
            currentStreak = currentStreak >= 7 ? 1 : currentStreak + 1;
          }
        } else if (diffDays > 1) {
          currentStreak = 1;
        }

        claimedToday = false;
        dailyQuests = generateDailyQuests(loaded);
        notificationsToShow.push(() => {
          showToast('🌞 NOVO DIA! Suas Missões Diárias foram redefinidas!', 'info');
        });
      }
    } else {
      currentStreak = 1;
      claimedToday = false;
      dailyQuests = generateDailyQuests(loaded);
    }

    if (dailyQuests.length === 0) {
      dailyQuests = generateDailyQuests(loaded);
    }
    if (weeklyObjectives.length === 0) {
      weeklyObjectives = generateWeeklyObjectives();
    }

    // Offline income calculations
    let updatedCash = loaded.cash;
    let totalStatsEarned = loaded.stats.totalEarned;
    let elapsedSeconds = 0;
    let totalOfflineEarningsSum = 0;

    const lastSavedTime = (loaded as any).lastSavedTime || Date.now();
    elapsedSeconds = Math.max(0, Math.floor((Date.now() - lastSavedTime) / 1000));

    if (elapsedSeconds > 30) {
      let propertyPassivePerSec = 0;
      loaded.ownedProperties.forEach(id => {
        const prop = PROPERTIES.find(p => p.id === id);
        if (prop && prop.passiveIncome) {
          propertyPassivePerSec += prop.passiveIncome;
        }
      });

      let businessPassivePerSec = 0;
      Object.keys(loaded.ownedBusinesses).forEach(id => {
        const biz = BUSINESSES.find(b => b.id === id);
        const playerBiz = loaded.ownedBusinesses[id];
        if (biz && playerBiz) {
          const employees = playerBiz.employeesCount || 0;
          const employeeMult = 1 + (employees * 0.20);
          businessPassivePerSec += biz.baseIncomePerSecond * playerBiz.level * employeeMult;
        }
      });

      const ownedItems = prevRetention.ownedCollections || [];
      const { passiveIncomeMultiplier } = getPassiveBonusMultipliers(ownedItems);
      businessPassivePerSec = businessPassivePerSec * passiveIncomeMultiplier;

      const totalPassiveRate = propertyPassivePerSec + businessPassivePerSec;
      const cappedSeconds = Math.min(43200, elapsedSeconds); // cap at 12 hours max offline idle
      totalOfflineEarningsSum = Math.round((totalPassiveRate * cappedSeconds) * 100) / 100;

      if (totalOfflineEarningsSum > 0) {
        updatedCash += totalOfflineEarningsSum;
        totalStatsEarned += totalOfflineEarningsSum;
        
        notificationsToShow.push(() => {
          playSound('success');
          // Smooth alert layout
          alert(`📊 BEM-VINDO DE VOLTA! \n\nSeus sonegamentos e empresas geraram R$ ${totalOfflineEarningsSum.toLocaleString('pt-BR')} enquanto esteve fora!\n(Tempo decorrido: ${Math.floor(cappedSeconds / 60)} min)`);
        });
      }
    }

    if (notificationsToShow.length > 0) {
      setTimeout(() => {
        notificationsToShow.forEach(fn => fn());
      }, 1500);
    }

    const updatedStats = {
      ...loaded.stats,
      totalEarned: totalStatsEarned,
      totalOfflineEarningsClaimed: (loaded.stats.totalOfflineEarningsClaimed || 0) + totalOfflineEarningsSum
    };

    return {
      ...loaded,
      cash: Math.round(updatedCash * 100) / 100,
      stats: updatedStats,
      retention: {
        ...prevRetention,
        lastLoginDate: todayStr,
        loginStreak: currentStreak,
        claimedDailyToday: claimedToday,
        dailyQuests,
        weeklyObjectives,
        ownedCollections: prevRetention.ownedCollections || [],
        unlockedAchievements: prevRetention.unlockedAchievements || []
      },
      lastSavedTime: Date.now()
    } as any;
  }, []);

  // Dynamic achievements checker
  const checkAndUnlockAchievements = useCallback((prev: PlayerState): PlayerState => {
    const unlocked = prev.retention?.unlockedAchievements || [];
    let nextUnlocked = [...unlocked];
    let changed = false;
    let earnedCashBonus = 0;
    let earnedXpBonus = 0;

    ACHIEVEMENTS_LIST.forEach(ach => {
      if (!nextUnlocked.includes(ach.id) && ach.check(prev)) {
        nextUnlocked.push(ach.id);
        changed = true;
        earnedCashBonus += ach.rewardCash;
        earnedXpBonus += ach.rewardXp;
        
        setTimeout(() => {
          playSound('levelUp');
          showToast(`🏆 CONQUISTA ALCANÇADA: "${ach.name}"! +R$ ${ach.rewardCash.toLocaleString('pt-BR')}`, 'success');
        }, 1000);
      }
    });

    if (!changed) return prev;

    let finalLevel = prev.level;
    let finalXp = prev.xp + earnedXpBonus;
    const nextLevelNeededXp = getXpForNextLevel(prev.level);
    let finalMaxEnergy = prev.maxEnergy;

    if (finalXp >= nextLevelNeededXp) {
      finalXp -= nextLevelNeededXp;
      finalLevel += 1;
      finalMaxEnergy += 10;
      setTimeout(() => {
        playSound('levelUp');
        alert(`🎉 PARABÉNS! Você subiu de nível geral para o nível ${finalLevel}! Sua capacidade de energia aumentou para ${finalMaxEnergy} EP.`);
      }, 1500);
    }

    return {
      ...prev,
      cash: prev.cash + earnedCashBonus,
      xp: finalXp,
      level: finalLevel,
      maxEnergy: finalMaxEnergy,
      stats: {
        ...prev.stats,
        totalEarned: prev.stats.totalEarned + earnedCashBonus
      },
      retention: {
        ...(prev.retention || {}),
        unlockedAchievements: nextUnlocked
      }
    };
  }, []);

  // Load state from local storage on bootstrap
  useEffect(() => {
    const bootstrap = async () => {
      const loaded = await loadPlayerState();
      if (loaded && loaded.name) {
        const processed = initializeRetentionAndOfflineEarnings(loaded);
        setPlayer(processed);
        // Auto backup the computed processed state right away
        savePlayerState(processed);
      }
      setIsAudioMuted(getMutedState());
    };
    bootstrap();
  }, [initializeRetentionAndOfflineEarnings]);

  // Safe Core Game state updates and LocalStorage backup
  const updatePlayerState = useCallback((updater: (prev: PlayerState) => PlayerState, instantSave = false) => {
    setPlayer(prev => {
      if (!prev) return prev;
      let next = updater(prev);
      
      // Run achievement checking
      next = checkAndUnlockAchievements(next);

      const nextWithTime = {
        ...next,
        lastSavedTime: Date.now()
      };

      if (instantSave) {
        savePlayerState(nextWithTime);
      }
      return nextWithTime;
    });
  }, [checkAndUnlockAchievements]);

  // Save progress periodically every 30 seconds without resetting interval on player state change
  useEffect(() => {
    const interval = setInterval(() => {
      setPlayer(currentPlayer => {
        if (currentPlayer) {
          savePlayerState(currentPlayer);
          syncPendingData(currentPlayer);
        }
        return currentPlayer;
      });
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Save on beforeunload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      setPlayer(currentPlayer => {
        if (currentPlayer) savePlayerState(currentPlayer);
        return currentPlayer;
      });
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Fetch Global Leaderboard from Supabase
  useEffect(() => {
    if (!player) return;
    const fetchLeaderboard = async () => {
      try {
        const { data, error } = await supabase
          .from('jogadores')
          .select('nome, cash, vip')
          .order('cash', { ascending: false })
          .limit(15);
        
        if (error) {
          console.error('Error fetching leaderboard', error);
          return;
        }

        if (data) {
          const formatted = data.map((d, i) => {
            const isMe = d.nome === player.name;
            // Use live local cash for the current player to avoid lag in the UI
            const displayCash = isMe ? Math.max(d.cash, player.cash) : d.cash;
            return {
              name: isMe ? `${d.nome} (Você)` : d.nome,
              rank: i + 1,
              cashEarned: displayCash,
              vip: d.vip || null,
              statusText: 'Cidadão Oficial',
              isPlayer: isMe
            };
          });
          // Re-sort in case the live cash changes the order slightly in the frontend
          formatted.sort((a, b) => b.cashEarned - a.cashEarned);
          // Fix ranks after re-sort
          formatted.forEach((item, index) => item.rank = index + 1);
          setGlobalLeaderboard(formatted);
        }
      } catch (err) {
        console.error('Failed to load leaderboard', err);
      }
    };
    
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [player?.name, player?.cash]);

  // Jail timer ticker countdown
  useEffect(() => {
    if (jailTimer <= 0) return;
    const interval = setInterval(() => {
      setJailTimer(prev => {
        if (prev <= 1) {
          playSound('success');
          showToast('Você cumpriu sua pena e agora é um homem livre! Reintegre-se à sociedade com cuidado.', 'success');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [jailTimer]);

  // Booster timer countdown ticker
  useEffect(() => {
    if (boosterTimeRemaining <= 0) {
      if (activeBoosterType) {
        showToast(`⌛ O efeito do seu Booster de ${activeBoosterType === 'double_salary' ? 'Salário Duplo' : activeBoosterType === 'free_energy' ? 'Fadiga Reduzida' : 'Crime'} terminou.`, 'info');
        setActiveBoosterType(null);
      }
      return;
    }
    const interval = setInterval(() => {
      setBoosterTimeRemaining(prev => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [boosterTimeRemaining, activeBoosterType]);

  // Dynamic Economy Events Lifecycle Scheduler
  useEffect(() => {
    const timer = setInterval(() => {
      if (activeEvent) {
        // Countdown active event duration
        setActiveEvent(prev => {
          if (!prev) return null;
          const remaining = prev.durationSeconds - 1;
          if (remaining <= 0) {
            showToast(`📉 O evento "${prev.name}" terminou. A economia normalizou!`, 'info');
            playSound('success');
            setNextEventInSeconds(120); // 120s (2 minutes) until next event triggers
            return null;
          }
          return { ...prev, durationSeconds: remaining };
        });
      } else {
        // Countdown to next event
        setNextEventInSeconds(prev => {
          const nextVal = prev - 1;
          if (nextVal <= 0) {
            // Trigger a random economic event from ECONOMY_EVENTS
            const randomEvt = ECONOMY_EVENTS[Math.floor(Math.random() * ECONOMY_EVENTS.length)];
            const chosenEvent = { ...randomEvt, durationSeconds: randomEvt.maxDurationSeconds };
            setActiveEvent(chosenEvent);
            showToast(`🚨 EVENTO ECONÔMICO: "${chosenEvent.name}" acaba de iniciar!`, 'critical');
            playSound('levelUp');
            return 0;
          }
          return nextVal;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [activeEvent]);

  // Main 1-second passive business tycoon ticker & Energy slow regeneration
  useEffect(() => {
    if (!player) return;

    const gameTick = setInterval(() => {
      const now = Date.now();
      const deltaSec = (now - lastPassiveTick.current) / 1000;
      lastPassiveTick.current = now;

      // 1. Calculate and update business profits vault
      setAccumulatedProfits(prevVaults => {
        const updated = { ...prevVaults };
        Object.keys(player.ownedBusinesses).forEach(id => {
          const biz = BUSINESSES.find(b => b.id === id);
          const level = player.ownedBusinesses[id].level;
          const employees = player.ownedBusinesses[id].employeesCount || 0;
          if (biz) {
            const employeeMultiplier = 1 + (employees * 0.20); // +20% output per employee
            let incomePerSec = biz.baseIncomePerSecond * level * employeeMultiplier;
            
            // Adjust for Crise Econômica!
            if (activeEvent?.id === 'crise_economica') {
              incomePerSec = incomePerSec * 0.7; // -30% lower profit speed
            }
            
            const currentAmount = updated[id] || 0;
            updated[id] = currentAmount + (incomePerSec * deltaSec);
          }
        });
        return updated;
      });

      // 2. Slow energy regeneration based on Home Property & Property Passive Income
      const activeProp = PROPERTIES.find(p => p.id === player.currentPropertyId) || PROPERTIES[0];
      const regenRatePerMinute = activeProp.energyRegenRate;
      const regenRatePerSecond = regenRatePerMinute / 60;

      updatePlayerState(prev => {
        // Sum up passive income from all owned properties
        let propertyPassivePerSec = 0;
        prev.ownedProperties.forEach(id => {
          const prop = PROPERTIES.find(p => p.id === id);
          if (prop && prop.passiveIncome) {
            propertyPassivePerSec += prop.passiveIncome;
          }
        });

        
        // Taxas (IPTU, IPVA, Seguros) - O "Leão" cobra 0.2% do patrimônio a cada 60s (0.0033% ao segundo)
        let totalNetWorth = 0;
        prev.ownedVehicles.forEach(id => { const v = VEHICLES.find(x => x.id === id); if(v) totalNetWorth += v.price; });
        prev.ownedProperties.forEach(id => { const p = PROPERTIES.find(x => x.id === id); if(p) totalNetWorth += p.price; });
        Object.keys(prev.ownedBusinesses).forEach(id => { const b = BUSINESSES.find(x => x.id === id); if(b) totalNetWorth += b.price; });

        const taxDrainPerSec = (totalNetWorth * 0.002) / 60;
        const cashGained = (propertyPassivePerSec - taxDrainPerSec) * deltaSec;


        // Return early if no updates are needed
        if (cashGained === 0 && prev.energy >= prev.maxEnergy) {
          return prev;
        }

        const nextCash = prev.cash + cashGained;
        const nextEnergy = prev.energy >= prev.maxEnergy 
          ? prev.energy 
          : Math.min(prev.maxEnergy, prev.energy + (regenRatePerSecond * deltaSec));

        const stats = { ...prev.stats };
        if (cashGained > 0) {
          stats.totalEarned += cashGained;
        }

        // Only update state if there is any actual fractional jump to prevent unnecessary lag
        return {
          ...prev,
          cash: Math.round(nextCash * 100) / 100,
          energy: Math.floor(nextEnergy),
          stats,
        };
      });

    }, 1000);

    return () => clearInterval(gameTick);
  }, [player, updatePlayerState, activeEvent]);

  // Handle Character Initial creation
  const handleCreateCharacter = (name: string, gender: 'M' | 'F') => {
    const defaultState: PlayerState = {
      name,
      gender,
      cash: 50, // Starts poor
      level: 1,
      xp: 0,
      energy: 100,
      maxEnergy: 100,
      currentVehicleId: null, // No car yet
      currentPropertyId: 'street_bench', // Sleeps on park bench
      ownedVehicles: [],
      ownedProperties: ['street_bench'],
      ownedBusinesses: {},
      hasDriversLicense: false,
      hasTruckLicense: false,
      stats: {
        totalEarned: 50,
        totalSpent: 0,
        deliveriesCompleted: 0,
        ridesCompleted: 0,
        taxiCompleted: 0,
        truckRunsCompleted: 0,
        timesPMEncountered: 0,
        streetRobberiesSurvived: 0,
      },
    };

    setPlayer(defaultState);
    savePlayerState(defaultState);
    showToast(`Bem-vindo à cidade, ${name}! Seu objetivo é conquistar o topo.`, 'success');
  };

  // Mute toggle callback
  const handleAudioMuteToggle = () => {
    const nextMuted = toggleMute();
    setIsAudioMuted(nextMuted);
    playSound('click');
  };

  // Progress active daily and weekly quests
  const progressQuests = useCallback((type: 'deliveries' | 'rides' | 'mechanic' | 'crime' | 'burger' | 'earn', amount: number) => {
    updatePlayerState(prev => {
      const retention = prev.retention || {};
      const dailyQuests = retention.dailyQuests || [];
      const weeklyObjectives = retention.weeklyObjectives || [];
      let questsChanged = false;
      let weeklyChanged = false;

      const updatedQuests = dailyQuests.map(q => {
        if (!q.completed && q.type === type) {
          questsChanged = true;
          const nextCount = q.currentCount + amount;
          const completed = nextCount >= q.targetCount;
          if (completed) {
            setTimeout(() => {
              playSound('success');
              showToast(`🎯 CONCLUÍDO! Missão Diária: "${q.description}" pronta para resgate!`, 'success');
            }, 500);
          }
          return {
            ...q,
            currentCount: Math.min(q.targetCount, nextCount),
            completed
          };
        }
        return q;
      });

      const updatedWeekly = weeklyObjectives.map(w => {
        if (!w.completed) {
          if (w.type === 'income' && type === 'earn') {
            weeklyChanged = true;
            const nextCount = w.currentCount + amount;
            const completed = nextCount >= w.targetCount;
            if (completed) {
              setTimeout(() => {
                playSound('levelUp');
                showToast(`🏆 META SEMANAL ALCANÇADA: "${w.description}"`, 'success');
              }, 600);
            }
            return {
              ...w,
              currentCount: Math.min(w.targetCount, nextCount),
              completed
            };
          }
        }
        return w;
      });

      if (!questsChanged && !weeklyChanged) return prev;

      return {
        ...prev,
        retention: {
          ...retention,
          dailyQuests: updatedQuests,
          weeklyObjectives: updatedWeekly
        }
      };
    });
  }, [updatePlayerState]);

  // Roll rare item find chance (usually between 8% to 15%)
  const rollCollectibleDrop = useCallback((chancePercent: number) => {
    if (Math.random() * 100 < chancePercent) {
      updatePlayerState(prev => {
        const owned = prev.retention?.ownedCollections || [];
        const available = RARE_COLLECTIBLES.filter(c => !owned.includes(c.id));
        if (available.length === 0) return prev;

        const picked = available[Math.floor(Math.random() * available.length)];
        const nextOwned = [...owned, picked.id];

        setTimeout(() => {
          playSound('levelUp');
          alert(`✨ ACHADO EXTRAORDINÁRIO! ✨\n\nVocê encontrou o item colecionável raro:\n\n${picked.icon} ${picked.name} (${picked.rarity.toUpperCase()})\n\n"${picked.description}"\n\nEfeito Ativo: ${picked.passiveBonusDesc}`);
        }, 800);

        return {
          ...prev,
          retention: {
            ...(prev.retention || {}),
            ownedCollections: nextOwned
          }
        };
      }, true);
    }
  }, [updatePlayerState]);

  const handleClaimDailyReward = () => {
    playSound('cash');
    updatePlayerState(prev => {
      const retention = prev.retention || {};
      const streak = retention.loginStreak ?? 1;
      const config = DAILY_LOGIN_CALENDAR.find(c => c.day === streak) || DAILY_LOGIN_CALENDAR[0];

      let updatedCash = prev.cash + config.rewardCash;
      let updatedXp = prev.xp + config.rewardXp;
      const nextLevelNeededXp = getXpForNextLevel(prev.level);
      let finalLevel = prev.level;
      let finalXp = updatedXp;
      let finalMaxEnergy = prev.maxEnergy;

      if (finalXp >= nextLevelNeededXp) {
        finalXp -= nextLevelNeededXp;
        finalLevel += 1;
        finalMaxEnergy += 10;
        setTimeout(() => {
          playSound('levelUp');
          alert(`🎉 PARABÉNS! Você subiu de nível geral para o nível ${finalLevel}! Sua capacidade de energia aumentou para ${finalMaxEnergy} EP.`);
        }, 600);
      }

      const ownedCollections = [...(retention.ownedCollections || [])];
      
      if (config.itemRewardId && !ownedCollections.includes(config.itemRewardId)) {
        ownedCollections.push(config.itemRewardId);
        const itemObj = RARE_COLLECTIBLES.find(r => r.id === config.itemRewardId);
        setTimeout(() => {
          alert(`✨ RELÍQUIA GANHA: ${itemObj?.name}! \nEfeito Passivo Ativado: ${itemObj?.passiveBonusDesc}`);
        }, 1000);
      }

      const updatedStats = {
        ...prev.stats,
        totalEarned: prev.stats.totalEarned + config.rewardCash
      };

      showToast(`🎁 Recompensa do Dia ${streak} resgatada! +R$ ${config.rewardCash.toLocaleString('pt-BR')}`, 'success');

      return {
        ...prev,
        cash: Math.round(updatedCash * 105) / 105,
        xp: finalXp,
        level: finalLevel,
        maxEnergy: finalMaxEnergy,
        stats: updatedStats,
        retention: {
          ...retention,
          claimedDailyToday: true,
          ownedCollections
        }
      };
    }, true);
  };

  const handleClaimQuestReward = (questId: string) => {
    playSound('cash');
    updatePlayerState(prev => {
      const retention = prev.retention || {};
      const dailyQuests = retention.dailyQuests || [];
      const quest = dailyQuests.find(q => q.id === questId);
      
      if (!quest || !quest.completed || quest.claimed) return prev;

      let updatedCash = prev.cash + quest.rewardCash;
      let updatedXp = prev.xp + quest.rewardXp;
      const nextLevelNeededXp = getXpForNextLevel(prev.level);
      let finalLevel = prev.level;
      let finalXp = updatedXp;
      let finalMaxEnergy = prev.maxEnergy;

      if (finalXp >= nextLevelNeededXp) {
        finalXp -= nextLevelNeededXp;
        finalLevel += 1;
        finalMaxEnergy += 10;
        setTimeout(() => {
          playSound('levelUp');
          alert(`🎉 PARABÉNS! Você subiu de nível geral para o nível ${finalLevel}! Sua capacidade de energia aumentou para ${finalMaxEnergy} EP.`);
        }, 600);
      }

      const updatedQuests = dailyQuests.map(q => q.id === questId ? { ...q, claimed: true } : q);

      // Advance weekly objectives quests count of CLAIMED quests!
      const weeklyObjectives = (retention.weeklyObjectives || []).map(w => {
        if (!w.completed && w.type === 'quests') {
          const nextCount = w.currentCount + 1;
          const completed = nextCount >= w.targetCount;
          if (completed) {
            setTimeout(() => {
              playSound('levelUp');
              showToast(`🏆 META SEMANAL ALCANÇADA: "${w.description}"`, 'success');
            }, 600);
          }
          return { ...w, currentCount: Math.min(w.targetCount, nextCount), completed };
        }
        return w;
      });

      const updatedStats = {
        ...prev.stats,
        totalEarned: prev.stats.totalEarned + quest.rewardCash
      };

      return {
        ...prev,
        cash: Math.round(updatedCash * 100) / 100,
        xp: finalXp,
        level: finalLevel,
        maxEnergy: finalMaxEnergy,
        stats: updatedStats,
        retention: {
          ...retention,
          dailyQuests: updatedQuests,
          weeklyObjectives,
          completedQuestsTotal: (retention.completedQuestsTotal || 0) + 1
        }
      };
    }, true);
  };

  const handleClaimWeeklyReward = (objectiveId: string) => {
    playSound('cash');
    updatePlayerState(prev => {
      const retention = prev.retention || {};
      const weeklyObjectives = retention.weeklyObjectives || [];
      const objective = weeklyObjectives.find(w => w.id === objectiveId);

      if (!objective || !objective.completed || objective.claimed) return prev;

      let updatedCash = prev.cash + objective.rewardCash;
      let updatedXp = prev.xp + objective.rewardXp;
      const nextLevelNeededXp = getXpForNextLevel(prev.level);
      let finalLevel = prev.level;
      let finalXp = updatedXp;
      let finalMaxEnergy = prev.maxEnergy;

      if (finalXp >= nextLevelNeededXp) {
        finalXp -= nextLevelNeededXp;
        finalLevel += 1;
        finalMaxEnergy += 10;
        setTimeout(() => {
          playSound('levelUp');
          alert(`🎉 PARABÉNS! Você subiu de nível geral para o nível ${finalLevel}! Sua capacidade de energia aumentou para ${finalMaxEnergy} EP.`);
        }, 650);
      }

      const updatedWeeklyObj = weeklyObjectives.map(w => w.id === objectiveId ? { ...w, claimed: true } : w);

      const updatedStats = {
        ...prev.stats,
        totalEarned: prev.stats.totalEarned + objective.rewardCash
      };

      showToast(`🏆 Recompensa Semanal obtida! +R$ ${objective.rewardCash.toLocaleString('pt-BR')}`, 'success');

      return {
        ...prev,
        cash: Math.round(updatedCash * 100) / 100,
        xp: finalXp,
        level: finalLevel,
        maxEnergy: finalMaxEnergy,
        stats: updatedStats,
        retention: {
          ...retention,
          weeklyObjectives: updatedWeeklyObj
        }
      };
    }, true);
  };

  const handleBuyMysteryBox = (price: number) => {
    updatePlayerState(prev => {
      const owned = prev.retention?.ownedCollections || [];
      const available = RARE_COLLECTIBLES.filter(c => !owned.includes(c.id));
      
      const stats = { ...prev.stats };
      stats.totalSpent += price;

      if (available.length === 0) {
        setTimeout(() => {
          alert('Você já possui TODOS os itens colecionáveis raros do servidor!');
        }, 500);
        return prev;
      }

      // Roll chance (35% lucky factor)
      const isLucky = Math.random() < 0.35;
      if (isLucky) {
        const picked = available[Math.floor(Math.random() * available.length)];
        const nextOwned = [...owned, picked.id];

        setTimeout(() => {
          playSound('levelUp');
          alert(`🎁 CAIXA SUPREMA DESTRAVADA! \n\nVocê tirou:\n${picked.icon} ${picked.name} (${picked.rarity.toUpperCase()})!\n\n"${picked.description}"\n\nBônus Ativado: ${picked.passiveBonusDesc}`);
        }, 600);

        return {
          ...prev,
          cash: prev.cash - price,
          stats,
          retention: {
            ...(prev.retention || {}),
            ownedCollections: nextOwned
          }
        };
      } else {
        const cashRefund = Math.floor(price * 0.35); // partially refund tycoon capital
        setTimeout(() => {
          playSound('error');
          alert(`😢 Puxa... A caixa veio estragada! Mas consolamos você com um estorno de R$ ${cashRefund.toLocaleString('pt-BR')} do seguro.`);
        }, 600);

        return {
          ...prev,
          cash: prev.cash - price + cashRefund,
          stats
        };
      }
    }, true);
  };

  const handleTriggerBooster = (type: 'double_salary' | 'free_energy' | 'double_crime') => {
    playSound('levelUp');
    setActiveBoosterType(type);
    setBoosterTimeRemaining(180); // 180 seconds = 3 minutes of awesome high-grind boosters!

    if (type === 'free_energy') {
      updatePlayerState(prev => ({
        ...prev,
        energy: Math.min(prev.maxEnergy + 50, prev.energy + 100) // instantly recharge energy reserves
      }), true);
    }

    showToast(`⚡ BOOSTER DE EVENTO INICIADO! Aproveite sonegamentos dobrados por 3 minutos!`, 'success');
  };

  // Leaderboard fetcher (Prepared for Database Integration)
  const getLeaderboardList = (): SimulatedLeaderboardEntry[] => {
    if (!player) return [];
    if (globalLeaderboard.length > 0) return globalLeaderboard;
    
    // Fallback if offline or loading
    return [{
      name: `${player.name} (Você)`,
      rank: 1,
      cashEarned: player.stats.totalEarned,
      vip: player.vipLevel || null,
      statusText: 'Modo Offline (Aguardando Sync)',
      isPlayer: true
    }];
  };

  // COMPLETE ACTIVE JOB (Called from active minigame)
  const handleCompleteActiveJob = (
    job: Job, 
    rewardMultiplier: number, 
    onResult: (res: {
      baseCash: number;
      vehicleBonusCash: number;
      bonusCash: number;
      totalCash: number;
      isBonusTriggered: boolean;
      newCareerLevel: number;
      newCareerXp: number;
      careerLeveledUp: boolean;
      careerXpNeeded: number;
    }) => void
  ) => {
    let results: any = null;
    let finalEarnedTotal = 0;

    updatePlayerState(prev => {
      // 1. Initialize Careers & Level
      const nextCareers = { ...(prev.careers || {}) };
      const currentCareer = nextCareers[job.id] || { level: 1, xp: 0 };

      // 2. Earnings and Bonus calculations
      let vipCashMultiplier = 1.0;
      let vipXpMultiplier = 1.0;
      if (prev.vipLevel === 'bronze') {
        vipCashMultiplier = 1.15;
        vipXpMultiplier = 1.15;
      } else if (prev.vipLevel === 'prata') {
        vipCashMultiplier = 1.30;
        vipXpMultiplier = 1.30;
      } else if (prev.vipLevel === 'ouro') {
        vipCashMultiplier = 1.50;
        vipXpMultiplier = 1.50;
      }

      // Fetch passive collectible drops multipliers and apply them in addition!
      const ownedItems = prev.retention?.ownedCollections || [];
      const { salaryMultiplier, vehicleEarningsBonus, uberTaxiBonus, govtJobBonus, energyCostReduction } = getPassiveBonusMultipliers(ownedItems);

      let customCollectibleMult = salaryMultiplier; // increases with Juliet de Ouro (+15%)
      
      // If uses any active vehicle (not walking/biking)
      if (prev.currentVehicleId) {
        customCollectibleMult += vehicleEarningsBonus; // Mini Skyline (+10%)
      }
      // If Uber/Taxi or App driver
      if (job.id === 'app_driver_job' || job.id === 'taxi_job') {
        customCollectibleMult += uberTaxiBonus; // Placa Rio (+10%)
      }
      // If Government officer (Police/SAMU Doctor)
      if (job.id === 'police_job' || job.id === 'doctor_job') {
        customCollectibleMult += govtJobBonus; // Mini Viatura (+35%)
      }

      // Apply active event booster if double salary is active!
      if (activeBoosterType === 'double_salary') {
        customCollectibleMult *= 2;
      }

      const careerMultiplier = 1.0 + (currentCareer.level - 1) * 0.15; // +15% pay per Career level
      let baselineSalary = Math.floor(job.baseReward * careerMultiplier * vipCashMultiplier * customCollectibleMult);

      // Apply economic event modifiers onto base salaries:
      if (activeEvent) {
        if (activeEvent.id === 'crise_economica') {
          baselineSalary = Math.floor(baselineSalary * 0.7); // -30%
        } else if (activeEvent.id === 'greve_caminhoneiros') {
          if (job.id === 'trucker_job') {
            baselineSalary = Math.floor(baselineSalary * 2.0); // +100% pay for heavy cargo
          } else {
            baselineSalary = Math.floor(baselineSalary * 0.6); // -40% pay elsewhere due to stock shortages
          }
        } else if (activeEvent.id === 'aumento_combustivel') {
          const usesVehicle = job.requiredVehicleId || job.id === 'app_driver_job' || job.id === 'taxi_job' || job.id === 'trucker_job' || job.id === 'doctor_job' || job.id === 'police_job';
          const isGasAffected = usesVehicle && prev.currentVehicleId && prev.currentVehicleId !== 'bike_delivery';
          if (isGasAffected) {
            baselineSalary = Math.floor(baselineSalary * 0.82); // -18% earnings due to gas prices
          }
        } else if (activeEvent.id === 'operacao_policial') {
          if (job.id === 'police_job') {
            baselineSalary = Math.floor(baselineSalary * 2.0); // +100% overtime hazard pay
          }
        }
      }

      const vehicleBonusCash = Math.floor(baselineSalary * (rewardMultiplier - 1.0));
      const preBonusCash = baselineSalary + vehicleBonusCash;

      // Bonus chance formula (increased by career level)
      const bonusChanceTotal = Math.min(75, job.bonusChance + (currentCareer.level - 1) * 2);
      const isBonusTriggered = (Math.random() * 100) < bonusChanceTotal;
      const bonusCash = isBonusTriggered ? preBonusCash : 0; // double cash if bonus triggers
      const totalEarnedCash = preBonusCash + bonusCash;
      finalEarnedTotal = totalEarnedCash;

      // 3. State update calculations
      const newCash = prev.cash + totalEarnedCash;
      const newXp = prev.xp + Math.floor(job.xpReward * vipXpMultiplier);

      // Calculate state energy cost including fuel spike modifier & fatigue reduction:
      let boosterReductionFactor = 1.0;
      if (activeBoosterType === 'free_energy') {
        boosterReductionFactor = 0.5; // -50% energy consumption
      }

      let energyDeduction = job.energyCost;
      if (energyCostReduction > 0 || boosterReductionFactor < 1.0) {
        energyDeduction = Math.floor(energyDeduction * (1 - (energyCostReduction / 100)) * boosterReductionFactor);
        energyDeduction = Math.max(1, energyDeduction);
      }

      if (activeEvent?.id === 'aumento_combustivel') {
        const usesVehicle = job.requiredVehicleId || job.id === 'app_driver_job' || job.id === 'taxi_job' || job.id === 'trucker_job' || job.id === 'doctor_job' || job.id === 'police_job';
        const isGasAffected = usesVehicle && prev.currentVehicleId && prev.currentVehicleId !== 'bike_delivery';
        if (isGasAffected) {
          energyDeduction += 5; // +5 fuel exertion
        }
      }
      const newEnergy = Math.max(0, prev.energy - energyDeduction);
      const nextLevelNeededXp = getXpForNextLevel(prev.level);

      let finalLevel = prev.level;
      let finalXp = newXp;
      let hasLeveledUp = false;

      // General Player Level Up handler
      if (finalXp >= nextLevelNeededXp) {
        finalXp -= nextLevelNeededXp;
        finalLevel += 1;
        hasLeveledUp = true;
      }

      // 4. Career level XP up
      let newCareerXp = currentCareer.xp + 10;
      let newCareerLevel = currentCareer.level;
      let careerLeveledUp = false;
      const careerXpNeeded = currentCareer.level * 30 + 20; // XP curve for career levels (50, 80, 110...)
      if (newCareerXp >= careerXpNeeded) {
        newCareerXp -= careerXpNeeded;
        newCareerLevel += 1;
        careerLeveledUp = true;
      }
      nextCareers[job.id] = { level: newCareerLevel, xp: newCareerXp };

      // Update statistics counters
      const updatedStats = { ...prev.stats };
      updatedStats.totalEarned += totalEarnedCash;
      if (job.id === 'delivery_job') updatedStats.deliveriesCompleted += 1;
      if (job.id === 'app_driver_job') updatedStats.ridesCompleted += 1;
      if (job.id === 'mechanic_job') updatedStats.mechanicJobsCompleted = (updatedStats.mechanicJobsCompleted || 0) + 1;
      if (job.id === 'taxi_job') updatedStats.taxiCompleted += 1;
      if (job.id === 'police_job') updatedStats.policeJobsCompleted = (updatedStats.policeJobsCompleted || 0) + 1;
      if (job.id === 'trucker_job') updatedStats.truckRunsCompleted += 1;
      if (job.id === 'doctor_job') updatedStats.doctorJobsCompleted = (updatedStats.doctorJobsCompleted || 0) + 1;

      // Level-up alerts
      let activeMaxEnergy = prev.maxEnergy;
      if (hasLeveledUp) {
        activeMaxEnergy += 10; // increases maximum vital energy capacity
        setTimeout(() => {
          playSound('levelUp');
          alert(`🎉 PARABÉNS! Você subiu de nível geral para o nível ${finalLevel}! Sua capacidade de energia aumentou para ${activeMaxEnergy} EP.`);
        }, 600);
      }

      if (careerLeveledUp) {
        setTimeout(() => {
          playSound('levelUp');
          showToast(`🌟 PROMOÇÃO! Sua carreira de ${job.name} subiu para o Nível ${newCareerLevel}!`, 'success');
        }, 1200);
      }

      results = {
        baseCash: baselineSalary,
        vehicleBonusCash,
        bonusCash,
        totalCash: totalEarnedCash,
        isBonusTriggered,
        newCareerLevel,
        newCareerXp,
        careerLeveledUp,
        careerXpNeeded
      };

      return {
        ...prev,
        cash: newCash,
        xp: finalXp,
        level: finalLevel,
        energy: newEnergy,
        maxEnergy: activeMaxEnergy,
        stats: updatedStats,
        careers: nextCareers,
      };
    }, true); // Save instantly

    // Let the callback execute with results
    if (results && onResult) {
      onResult(results);
    }

    // Progress daily quests progress metrics
    setTimeout(() => {
      if (job.id === 'delivery_job') progressQuests('deliveries', 1);
      if (job.id === 'app_driver_job' || job.id === 'taxi_job') progressQuests('rides', 1);
      if (job.id === 'mechanic_job') progressQuests('mechanic', 1);
      progressQuests('earn', finalEarnedTotal);

      // Roll rare item finding drop chance (typically around 6%-14% depending on VIP stage!)
      let rareItemChance = 6;
      if (player && player.vipLevel === 'ouro') rareItemChance = 14;
      else if (player && player.vipLevel === 'prata') rareItemChance = 10;

      rollCollectibleDrop(rareItemChance);
    }, 150);

    // Trigger Random event chance after work shifts (35% chance)
    setTimeout(() => {
      if (Math.random() < 0.35) {
        triggerRandomRPEvent();
      }
    }, 1200);
  };

  // Trigger random RP event on streets
  const triggerRandomRPEvent = () => {
    playSound('pm_siren');
    const randEvent = EVENTS_POOL[Math.floor(Math.random() * EVENTS_POOL.length)];
    setActiveStreetEvent(randEvent);
  };

  const handleResolveEvent = (updatedPlayer: PlayerState, outcomeMessage: string) => {
    setPlayer(updatedPlayer);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPlayer));
    setActiveStreetEvent(null);
    setEventOutcomeMsg(outcomeMessage);
  };

  // BUY AND SELECT VEHICLE
  const handleBuyVehicle = (vehicle: Vehicle) => {
    updatePlayerState(prev => {
      const nextCash = prev.cash - vehicle.price;
      const nextOwned = [...prev.ownedVehicles, vehicle.id];
      const stats = { ...prev.stats };
      stats.totalSpent += vehicle.price;

      return {
        ...prev,
        cash: nextCash,
        ownedVehicles: nextOwned,
        stats,
        // Auto-select newly bought keys!
        currentVehicleId: vehicle.id,
      };
    }, true);

    showToast(`Parabéns! Chave do ${vehicle.name} adicionada ao seu bolso.`, 'success');
  };

  const handleSelectVehicle = (vehicleId: string) => {
    updatePlayerState(prev => ({
      ...prev,
      currentVehicleId: vehicleId,
    }), true);
    showToast(`Você pegou as chaves do seu veículo ativo.`, 'success');
  };

  const handleSellVehicle = (vehicle: Vehicle) => {
    const refundCash = Math.floor(vehicle.price * 0.70); // 70% refund rate
    const confirmed = window.confirm(`Deseja realmente vender seu ${vehicle.name} por R$ ${refundCash.toLocaleString('pt-BR')}? (70% do valor de mercado)`);
    
    if (!confirmed) return;

    updatePlayerState(prev => {
      const nextOwned = prev.ownedVehicles.filter(id => id !== vehicle.id);
      const nextActiveId = prev.currentVehicleId === vehicle.id ? null : prev.currentVehicleId;
      const nextCash = prev.cash + refundCash;

      return {
        ...prev,
        cash: nextCash,
        ownedVehicles: nextOwned,
        currentVehicleId: nextActiveId,
      };
    }, true);

    playSound('cash');
    showToast(`Vendido! R$ ${refundCash.toLocaleString('pt-BR')} adicionados à sua carteira.`, 'info');
  };

  // BUY AND SELECT PROPERTY
  const handleBuyProperty = (property: Property) => {
    updatePlayerState(prev => {
      const nextCash = prev.cash - property.price;
      const nextOwned = [...prev.ownedProperties, property.id];
      const stats = { ...prev.stats };
      stats.totalSpent += property.price;

      // Update max energy based on property buy
      const oldPropertyInfo = PROPERTIES.find(p => p.id === prev.currentPropertyId) || PROPERTIES[0];
      const currentEnergyBonusDifference = property.maxEnergyBonus - oldPropertyInfo.maxEnergyBonus;

      return {
        ...prev,
        cash: nextCash,
        ownedProperties: nextOwned,
        stats,
        // Auto-select new home
        currentPropertyId: property.id,
        maxEnergy: prev.maxEnergy + currentEnergyBonusDifference,
      };
    }, true);

    showToast(`Escritura registrada! Nova residência ativa: ${property.name}`, 'success');
  };

  const handleSelectProperty = (propertyId: string) => {
    updatePlayerState(prev => {
      const oldPropertyInfo = PROPERTIES.find(p => p.id === prev.currentPropertyId) || PROPERTIES[0];
      const nextPropertyInfo = PROPERTIES.find(p => p.id === propertyId) || PROPERTIES[0];
      const currentEnergyBonusDifference = nextPropertyInfo.maxEnergyBonus - oldPropertyInfo.maxEnergyBonus;

      return {
        ...prev,
        currentPropertyId: propertyId,
        maxEnergy: prev.maxEnergy + currentEnergyBonusDifference,
      };
    }, true);

    showToast(`Você se mudou de residência.`, 'success');
  };

  const handleSellProperty = (property: Property) => {
    if (property.id === 'street_bench') {
      playSound('error');
      alert(`Você não pode vender o Banco da Praça! Ele é público de graça.`);
      return;
    }

    const refundCash = Math.floor(property.price * 0.70); // 70% refund rate
    const confirmed = window.confirm(`Deseja realmente vender a escritura de "${property.name}" por R$ ${refundCash.toLocaleString('pt-BR')}? (70% do valor de mercado)`);
    
    if (!confirmed) return;

    updatePlayerState(prev => {
      const nextOwned = prev.ownedProperties.filter(id => id !== property.id);
      
      // If we are selling the CURRENTLY active property, we fallback
      let nextActiveId = prev.currentPropertyId;
      let nextMaxEnergy = prev.maxEnergy;

      if (prev.currentPropertyId === property.id) {
        // Fallback to another owned property, or street_bench
        const remainingOwned = nextOwned.filter(id => id !== 'street_bench');
        if (remainingOwned.length > 0) {
          nextActiveId = remainingOwned[remainingOwned.length - 1];
        } else {
          nextActiveId = 'street_bench';
        }
        
        // Adjust max energy
        const nextPropertyInfo = PROPERTIES.find(p => p.id === nextActiveId) || PROPERTIES[0];
        nextMaxEnergy = Math.max(100, prev.maxEnergy - property.maxEnergyBonus + nextPropertyInfo.maxEnergyBonus);
      }

      const nextCash = prev.cash + refundCash;

      return {
        ...prev,
        cash: Math.round(nextCash * 100) / 100,
        ownedProperties: nextOwned,
        currentPropertyId: nextActiveId,
        maxEnergy: nextMaxEnergy,
        energy: Math.min(nextMaxEnergy, prev.energy),
      };
    }, true);

    playSound('cash');
    showToast(`Escritura vendida! R$ ${refundCash.toLocaleString('pt-BR')} creditados no seu saldo corporativo.`, 'info');
  };

  const handleRestFinished = (amountToRestore: number) => {
    updatePlayerState(prev => {
      const finalEnergy = Math.min(prev.maxEnergy, prev.energy + amountToRestore);
      return {
        ...prev,
        energy: finalEnergy,
      };
    }, true);
    showToast('Fadiga recarregada! Você está pronto para acelerar.', 'success');
  };

  // BUY AND UPGRADE COMPANIES (BUSINESSES)
  const handleBuyBusiness = (business: Business) => {
    updatePlayerState(prev => {
      const nextCash = prev.cash - business.price;
      const nextOwned = { ...prev.ownedBusinesses };
      nextOwned[business.id] = { level: 1, lastCollected: Date.now() };

      const stats = { ...prev.stats };
      stats.totalSpent += business.price;

      return {
        ...prev,
        cash: nextCash,
        ownedBusinesses: nextOwned,
        stats,
      };
    }, true);

    showToast(`Franquia de ${business.name} inaugurada com sucesso!`, 'success');
  };

  const handleUpgradeBusiness = (businessId: string, cost: number) => {
    updatePlayerState(prev => {
      const nextCash = prev.cash - cost;
      const nextOwned = { ...prev.ownedBusinesses };
      if (nextOwned[businessId]) {
        nextOwned[businessId].level += 1;
      }
      
      const stats = { ...prev.stats };
      stats.totalSpent += cost;

      return {
        ...prev,
        cash: nextCash,
        ownedBusinesses: nextOwned,
        stats,
      };
    }, true);

    showToast(`Instalações reformadas! Produção e vendas expandidas.`, 'success');
  };

  const handleHireEmployee = (businessId: string, cost: number) => {
    updatePlayerState(prev => {
      const nextCash = prev.cash - cost;
      const nextOwned = { ...prev.ownedBusinesses };
      if (nextOwned[businessId]) {
        const currentEmployees = nextOwned[businessId].employeesCount || 0;
        nextOwned[businessId] = {
          ...nextOwned[businessId],
          employeesCount: currentEmployees + 1
        };
      }
      
      const stats = { ...prev.stats };
      stats.totalSpent += cost;

      return {
        ...prev,
        cash: nextCash,
        ownedBusinesses: nextOwned,
        stats,
      };
    }, true);

    showToast(`Profissional contratado e treinado para o negócio! +20% bônus de lucro cooperativo.`, 'success');
  };

  const handleCollectBusinessProfits = (businessId: string, amount: number) => {
    updatePlayerState(prev => {
      const stats = { ...prev.stats };
      stats.totalEarned += amount;
      return {
        ...prev,
        cash: prev.cash + amount,
        stats,
      };
    }, true);

    setAccumulatedProfits(prev => ({
      ...prev,
      [businessId]: 0, // Reset safety register vault
    }));

    showToast(`R$ ${amount.toFixed(2)} retirados do caixa e adicionados à sua carteira!`, 'success');
  };

  // BUY LICENSES & CONVENIENCE SNACKS
  const handleBuyFood = (food: FoodItem) => {
    updatePlayerState(prev => {
      const nextCash = prev.cash - food.price;
      const nextEnergy = Math.min(prev.maxEnergy, prev.energy + food.energyRestore);
      const stats = { ...prev.stats };
      stats.totalSpent += food.price;

      return {
        ...prev,
        cash: nextCash,
        energy: nextEnergy,
        stats,
      };
    }, true);

    setTimeout(() => {
      progressQuests('burger', 1);
    }, 150);

    showToast(`Você consumiu ${food.name}! (+${food.energyRestore} Energia)`, 'success');
  };

  const handleBuyDriversLicense = (price: number) => {
    updatePlayerState(prev => {
      const nextCash = prev.cash - price;
      const stats = { ...prev.stats };
      stats.totalSpent += price;

      return {
        ...prev,
        cash: nextCash,
        hasDriversLicense: true,
        stats,
      };
    }, true);

    showToast('CNH Categoria B emitida com sucesso no DETRAN!', 'success');
  };

  const handleBuyTruckLicense = (price: number) => {
    updatePlayerState(prev => {
      const nextCash = prev.cash - price;
      const stats = { ...prev.stats };
      stats.totalSpent += price;

      return {
        ...prev,
        cash: nextCash,
        hasTruckLicense: true,
        stats,
      };
    }, true);

    showToast('CNH Categoria E emitida com sucesso no DETRAN!', 'success');
  };

  const handleBuyVip = (tier: 'bronze' | 'prata' | 'ouro', paymentMethod: 'cash' | 'pix' | 'card') => {
    const pricesInCash = {
      bronze: 5000,
      prata: 15000,
      ouro: 50000,
    };

    updatePlayerState(prev => {
      let nextCash = prev.cash;
      const stats = { ...prev.stats };

      if (paymentMethod === 'cash') {
        const cashCost = pricesInCash[tier];
        if (prev.cash < cashCost) {
          return prev; // Safety guard
        }
        nextCash = prev.cash - cashCost;
        stats.totalSpent += cashCost;
      }

      let nextMaxEnergy = prev.maxEnergy;
      // Special permanent max energy bonus for VIP Ouro (+50 max energy!)
      if (tier === 'ouro' && prev.vipLevel !== 'ouro') {
        nextMaxEnergy = prev.maxEnergy + 50;
      }

      return {
        ...prev,
        cash: Math.round(nextCash * 100) / 100,
        vipLevel: tier,
        maxEnergy: nextMaxEnergy,
        stats,
      };
    }, true);

    const names = { bronze: 'Bronze', prata: 'Prata', ouro: 'Ouro' };
    playSound('levelUp');
    showToast(`👑 SUCESSO! Plano VIP ${names[tier]} ativado! Super bônus e regalias desbloqueadas no seu RP.`, 'success');
  };

  // CRIMINAL SUBMUND INTEGRATION DRIVERS
  const handleCommitCrimeSuccess = (dirtyCashEarned: number, repEarned: number, energyCost: number, logMessage: string) => {
    let finalDirtyEarned = dirtyCashEarned;
    // Check active events double crime booster
    if (activeBoosterType === 'double_crime') {
      finalDirtyEarned *= 2;
    }

    updatePlayerState(prev => {
      const currentDirty = prev.dirtyCash || 0;
      const currentRep = prev.criminalReputation || 0;
      const nextEnergy = Math.max(0, prev.energy - energyCost);
      const stats = { ...prev.stats };
      stats.totalEarned += finalDirtyEarned;

      return {
        ...prev,
        dirtyCash: currentDirty + finalDirtyEarned,
        criminalReputation: currentRep + repEarned,
        energy: nextEnergy,
        stats,
      };
    }, true);

    // Progress active criminal quests & drop roles
    setTimeout(() => {
      progressQuests('crime', 1);
      progressQuests('earn', finalDirtyEarned);
      rollCollectibleDrop(18); // 18% finding chance on succesful felonies!
    }, 150);
  };

  const handleCommitCrimeFailure = (finePaid: number, jailDurationSeconds: number, repLost: number, energyCost: number, logMessage: string) => {
    updatePlayerState(prev => {
      const nextCash = prev.cash - finePaid;
      const nextRep = Math.max(0, (prev.criminalReputation || 0) - repLost);
      const nextEnergy = Math.max(10, Math.floor(prev.energy / 2));
      
      const stats = { ...prev.stats };
      stats.totalSpent += finePaid;

      return {
        ...prev,
        cash: nextCash,
        criminalReputation: nextRep,
        energy: nextEnergy,
        stats,
      };
    }, true);

    setJailTimer(jailDurationSeconds);
  };

  const handleLaunderMoney = (dirtyAmount: number, cleanAmountReceived: number, feePaid: number, isSeized: boolean, logMessage: string) => {
    updatePlayerState(prev => {
      const currentDirty = prev.dirtyCash || 0;
      const stats = { ...prev.stats };

      if (isSeized) {
        const fineValue = Math.floor(dirtyAmount * 0.35);
        stats.totalSpent += fineValue;
        return {
          ...prev,
          dirtyCash: Math.max(0, currentDirty - dirtyAmount),
          cash: prev.cash - fineValue,
          stats,
        };
      } else {
        stats.totalEarned += cleanAmountReceived;
        stats.totalSpent += feePaid;
        return {
          ...prev,
          dirtyCash: Math.max(0, currentDirty - dirtyAmount),
          cash: prev.cash + cleanAmountReceived,
          stats,
        };
      }
    }, true);

    setTimeout(() => {
      if (!isSeized) {
        progressQuests('earn', cleanAmountReceived);
      }
    }, 150);
  };

  // FULL STORAGE GAME WIPE
  const handleWipeSave = () => {
    const confirmWipe = window.confirm('Deseja REALMENTE resetar seu personagem? Tudo voltará ao zero absoluto. Esta ação não poderá ser desfeita!');
    if (confirmWipe) {
      playSound('error');
      localStorage.removeItem(STORAGE_KEY);
      setPlayer(null);
      setAccumulatedProfits({});
      setEventOutcomeMsg(null);
      setActiveStreetEvent(null);
      setActiveTab('jobs');
      showToast('Personagem resetado com sucesso.', 'info');
    }
  };

  // If new player, show Creation Board Screen
  if (!player) {
    return <CreatePlayer onCreate={handleCreateCharacter} />;
  }

  return (
    <div className="min-h-screen text-zinc-100 font-sans p-3 md:p-6 pb-24 overflow-x-hidden relative">
      
      {/* Background neon ambient shapes */}
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-yellow-500/[0.02] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-green-500/[0.02] rounded-full blur-3xl pointer-events-none" />

      <main className="max-w-6xl mx-auto space-y-6 relative">
        
        {/* HUD Stats Panel */}
        <HUD 
          player={player} 
          onMuteToggle={handleAudioMuteToggle} 
          isMuted={isAudioMuted} 
        />

        {/* Floating Quick Action Toast Notifications */}
        {appNotification && (
          <div id="toast-banner" className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50 rounded-xl border border-zinc-800 bg-zinc-900/90 py-3.5 px-4 shadow-2xl backdrop-blur flex items-center gap-3 animate-slide-in">
            <span className="flex h-7 w-7 items-center justify-center rounded bg-green-500/10 text-green-400 font-bold shrink-0">
              <Sparkles className="h-4 w-4" />
            </span>
            <p className="text-xs text-zinc-300 font-medium">{appNotification.text}</p>
          </div>
        )}

        {/* Navigation Tabs Bar */}
        <nav id="navbar-dashboard" className="grid grid-cols-4 lg:grid-cols-8 gap-2 bg-zinc-950/90 backdrop-blur-2xl border border-zinc-900 rounded-2xl p-1.5 shadow-2xl sticky top-2 z-[60]">
          
                  <button
                    id="btn-jail-cleanup"
                    onClick={() => {
                      if (player.energy < 15) {
                        playSound('error');
                        alert('Energia insuficiente para a faxina pesada!');
                        return;
                      }
                      playSound('click');
                      updatePlayerState(prev => ({
                        ...prev,
                        energy: Math.max(0, prev.energy - 15)
                      }));
                      setJailTimer(prev => Math.max(0, prev - 4));
                      showToast('Faxina concluída! -4 segundos de pena.', 'success');
                    }}
                    className="bg-zinc-900 hover:bg-zinc-850 text-zinc-350 hover:text-white font-bold py-3.5 px-3 rounded-xl border border-zinc-800 uppercase tracking-tight flex flex-col items-center justify-center gap-1 cursor-pointer transition active:scale-95"
                  >
                    🧹 Limpar Cela
                    <span className="text-[9px] text-zinc-500 font-bold font-mono">-15 EP / -4s Pena</span>
                  </button>

                  <button
                    id="btn-jail-lawyer"
                    onClick={() => {
                      const lawyerCost = jailTimer * 2000;
                      if (player.cash < lawyerCost) {
                        playSound('error');
                        alert('Você não tem dinheiro para pagar o advogado (R$ ' + lawyerCost.toLocaleString('pt-BR') + ')!');
                        return;
                      }
                      playSound('cash');
                      updatePlayerState(prev => ({
                        ...prev,
                        cash: prev.cash - lawyerCost
                      }));
                      setJailTimer(0);
                      showToast('Habeas Corpus concedido! Você está solto.', 'success');
                    }}
                    className="bg-zinc-900 hover:bg-zinc-850 text-amber-500 hover:text-amber-400 font-bold py-3.5 px-3 rounded-xl border border-zinc-800 uppercase tracking-tight flex flex-col items-center justify-center gap-1 cursor-pointer transition active:scale-95 col-span-full"
                  >
                    ⚖️ Pagar Advogado
                    <span className="text-[9px] text-amber-600/70 font-bold font-mono">-R$ {(jailTimer * 2000).toLocaleString('pt-BR')} / Soltura Imediata</span>
                  </button>

                </div>
              </div>

              <div className="pt-2">
                <span className="text-[9px] text-zinc-650 uppercase font-mono block select-none">Detento n° #{player.name.substring(0, 3).toUpperCase()}-{player.level * 9}</span>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
