import { supabase } from './supabase';
import { PlayerState } from '../types';

const STORAGE_KEY = 'cidade_rp_tycoon_save_v1';
const PLAYER_ID_KEY = 'cidade_rp_player_id';
const SYNC_QUEUE_KEY = 'cidade_rp_sync_pending';

// Retorna o UUID do jogador na máquina. Se não existir, gera um.
export const getPlayerId = (): string => {
  let id = localStorage.getItem(PLAYER_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(PLAYER_ID_KEY, id);
  }
  return id;
};

// Salva o estado localmente como fallback (Modo Offline)
export const savePlayerStateLocal = (state: PlayerState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  localStorage.setItem(SYNC_QUEUE_KEY, 'true'); // Marca que há dados não enviados pro DB
};

// Tenta enviar os dados para o Supabase
export const savePlayerStateOnline = async (state: PlayerState): Promise<boolean> => {
  try {
    const id = getPlayerId();
    const { error } = await supabase
      .from('jogadores')
      .upsert({
        id,
        nome: state.name,
        nivel: state.level,
        xp: state.xp,
        cash: state.cash,
        dirty_cash: state.dirtyCash || 0,
        energia: state.energy,
        vip: state.vipLevel || null,
        inventario: state.inventory || {},
        veiculos: state.ownedVehicles || [],
        imoveis: state.ownedProperties || [],
        empresas: state.ownedBusinesses || {},
        reliquias: state.retention?.ownedCollections || [],
        missoes: state.retention?.dailyQuests || [],
        // raw_state armazena todos os outros dados (Faccoes, Bancos, Stats) para evitar perda de dados
        raw_state: state,
        ultima_atividade: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (error) {
      console.error('❌ Erro ao salvar no Supabase:', error);
      return false;
    }
    
    localStorage.removeItem(SYNC_QUEUE_KEY); // Sincronizado com sucesso
    return true;
  } catch (err) {
    console.error('❌ Erro de rede ao salvar no Supabase:', err);
    return false;
  }
};

// Função principal de save chamada pela aplicação
export const savePlayerState = async (state: PlayerState) => {
  // 1. Sempre salva localmente primeiro para segurança
  savePlayerStateLocal(state);
  
  // 2. Se tiver internet, envia para o banco
  if (navigator.onLine) {
    await savePlayerStateOnline(state);
  }
};

// Tenta reenviar os dados acumulados offline
export const syncPendingData = async (state: PlayerState) => {
  if (localStorage.getItem(SYNC_QUEUE_KEY) === 'true' && navigator.onLine) {
    await savePlayerStateOnline(state);
  }
};

// Carrega o jogador ao iniciar o jogo
export const loadPlayerState = async (): Promise<PlayerState | null> => {
  try {
    const id = getPlayerId();
    
    // Carregamento local (Instantâneo / Offline Fallback)
    const localData = localStorage.getItem(STORAGE_KEY);
    let localPlayer: PlayerState | null = null;
    if (localData) {
      localPlayer = JSON.parse(localData);
    }

    if (!navigator.onLine) {
      console.log('📡 Modo Offline: Carregando save local.');
      return localPlayer;
    }

    // Tenta carregar os dados mais recentes do Supabase
    const { data, error } = await supabase
      .from('jogadores')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Não encontrou linha, ou seja, é um novo jogador
        return null;
      }
      console.error('❌ Erro ao carregar do Supabase:', error);
      return localPlayer; // Fallback para o local se o banco falhar
    }

    if (data && data.raw_state) {
      // Sincroniza o save local com o que veio da nuvem
      const stateFromServer = data.raw_state as PlayerState;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateFromServer));
      return stateFromServer;
    }
    
  } catch (err) {
    console.error('❌ Erro ao carregar (Load):', err);
  }
  return null;
};
