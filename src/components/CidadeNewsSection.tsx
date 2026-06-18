import { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Heart, 
  Share2, 
  TrendingUp, 
  AlertTriangle, 
  ShieldAlert, 
  DollarSign, 
  Megaphone, 
  UserCheck, 
  Award, 
  Search, 
  MessageCircle, 
  PlusCircle, 
  Calendar, 
  Flame, 
  Zap, 
  Eye, 
  Sparkles,
  Lock,
  Compass,
  CornerDownRight,
  RefreshCw,
  Send
} from 'lucide-react';
import { PlayerState, EconomyEvent, NewsPost, NewsComment, ECONOMY_EVENTS } from '../types';
import { playSound } from '../utils/audio';

interface CidadeNewsSectionProps {
  player: PlayerState;
  updatePlayerState: (cb: (prev: PlayerState) => PlayerState, saveAfterUpdate?: boolean) => void;
  showToast: (text: string, type?: 'success' | 'info' | 'critical') => void;
  activeEvent?: EconomyEvent | null;
  triggerEconomyEvent?: (eventId: 'crise_economica' | 'greve_caminhoneiros' | 'aumento_combustivel' | 'promocao_imoveis' | 'corridas_ilegais' | 'operacao_policial') => void;
  newsList: NewsPost[];
  setNewsList: React.Dispatch<React.SetStateAction<NewsPost[]>>;
}



export default function CidadeNewsSection({
  player,
  updatePlayerState,
  showToast,
  activeEvent,
  triggerEconomyEvent,
  newsList,
  setNewsList
}: CidadeNewsSectionProps) {
  // Tabs within Cidade News social network
  const [newsTab, setNewsTab] = useState<'geral' | 'noticias' | 'eventos' | 'prisoes' | 'promocoes' | 'economicas'>('geral');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Custom user posting state
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostCategory, setNewPostCategory] = useState<'noticias' | 'eventos' | 'promocoes'>('noticias');
  const [promotePost, setPromotePost] = useState(false);
  const [showPostingForm, setShowPostingForm] = useState(false);
  
  // Custom commentary state
  const [expandedCommentsPostId, setExpandedCommentsPostId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({});

  const handleLike = (postId: string) => {
    playSound('click');
    setNewsList(prev => prev.map(post => {
      if (post.id === postId) {
        const hasLikedCur = post.hasLiked || false;
        return {
          ...post,
          likes: hasLikedCur ? Math.max(0, post.likes - 1) : post.likes + 1,
          hasLiked: !hasLikedCur
        };
      }
      return post;
    }));
  };

  const handleAddComment = (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    playSound('click');
    const newComment: NewsComment = {
      id: `comment_${Date.now()}`,
      authorName: `${player.name} (Você)`,
      authorHandle: `@${player.name.toLowerCase().replace(/\s+/g, '_')}`,
      authorAvatar: player.gender === 'M' ? '🧔' : '👩',
      content: text,
      timestamp: 'Agora mesmo'
    };

    setNewsList(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: [...post.comments, newComment]
        };
      }
      return post;
    }));

    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    showToast('Comentário publicado com sucesso!', 'success');
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      showToast('Preencha o título e o conteúdo da postagem!', 'critical');
      return;
    }

    const promoteCost = 500;
    if (promotePost && player.cash < promoteCost) {
      playSound('error');
      showToast('Saldo insuficiente em mãos para impulsionar a publicação! Custa R$ 500.', 'critical');
      return;
    }

    playSound('cash');
    
    // Deduct money if promoted
    if (promotePost) {
      updatePlayerState(prev => {
        const stats = { ...prev.stats };
        stats.totalSpent += promoteCost;
        return {
          ...prev,
          cash: prev.cash - promoteCost,
          xp: prev.xp + 100, // Reward extra XP for marketing presence!
          stats
        };
      }, true);
      showToast('Publicação patrocinada com sucesso! Você ganhou +100 XP.', 'success');
    } else {
      updatePlayerState(prev => ({
        ...prev,
        xp: prev.xp + 25 // Small activity bonus
      }), true);
      showToast('Mensagem enviada no feed! +25 XP.', 'success');
    }

    // Build the post
    const customPost: NewsPost = {
      id: `post_${Date.now()}`,
      author: {
        name: `${player.name} (Você)`,
        handle: `@${player.name.toLowerCase().replace(/\s+/g, '_')}`,
        avatar: player.gender === 'M' ? '🧔' : '👩',
        verified: promotePost, // give them a verified batch if they pay
        role: 'cidadao'
      },
      title: newPostTitle.trim(),
      content: newPostContent.trim(),
      category: newPostCategory,
      timestamp: 'Agora mesmo',
      likes: promotePost ? 15 : 0,
      promoted: promotePost,
      comments: []
    };

    setNewsList(prev => [customPost, ...prev]);

    // Reset input states
    setNewPostTitle('');
    setNewPostContent('');
    setPromotePost(false);
    setShowPostingForm(false);
  };

  // Economy event activator from social media panel (allows user to trigger events if they wish, like a real news anchor)
  const handleTriggerImpact = (eventId: 'crise_economica' | 'greve_caminhoneiros' | 'aumento_combustivel' | 'promocao_imoveis' | 'corridas_ilegais' | 'operacao_policial') => {
    if (!triggerEconomyEvent) return;
    playSound('levelUp');
    triggerEconomyEvent(eventId);
    showToast(`Economia impactada via Cidade News social booster!`, 'success');
  };

  // Filter posts based on tab and searching
  const filteredPosts = newsList.filter(post => {
    // 1. Tab filter
    if (newsTab !== 'geral') {
      const matchMap: { [key: string]: string } = {
        'noticias': 'noticias',
        'eventos': 'eventos',
        'prisoes': 'prisoes',
        'promocoes': 'promocoes',
        'economicas': 'crises'
      };
      if (post.category !== matchMap[newsTab]) return false;
    }

    // 2. Search term filter
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      const matchTitle = post.title.toLowerCase().includes(query);
      const matchContent = post.content.toLowerCase().includes(query);
      const matchAuthor = post.author.name.toLowerCase().includes(query) || post.author.handle.toLowerCase().includes(query);
      return matchTitle || matchContent || matchAuthor;
    }

    return true;
  });

  return (
    <div id="cidade-news-container" className="w-full space-y-6 animate-fade-in text-sans">
      
      {/* Brand Header Display */}
      <div className="relative rounded-2xl bg-zinc-950 border border-zinc-900 p-6 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-8 text-9xl leading-none opacity-5 font-black pointer-events-none select-none">
          📰
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <span className="text-[10px] bg-red-500/15 border border-red-500/30 text-red-500 px-3 py-1 rounded-full font-bold uppercase tracking-widest leading-none">
              Rede Social Oficial do Município
            </span>
            <h1 className="text-3xl font-black text-white uppercase tracking-tight font-display font-orbitron">
              🔊 CIDADE <span className="bg-gradient-to-r from-red-500 to-rose-600 bg-clip-text text-transparent">NEWS</span>
            </h1>
            <p className="text-zinc-400 text-xs max-w-xl">
              Compartilhe conquistas, assista prisões, denuncie acidentes nas avenidas e acompanhe as flutuações de mercado que impactam de verdade seus trabalhos e carteiras.
            </p>
          </div>

          <div className="flex gap-2 flex-wrap sm:flex-nowrap">
            <button
              onClick={() => { playSound('click'); setShowPostingForm(!showPostingForm); }}
              className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold rounded-xl transition-all shadow-lg shadow-red-600/10 flex items-center gap-2 text-xs uppercase tracking-wider cursor-pointer active:scale-95"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Fazer Publicação</span>
            </button>
          </div>
        </div>
      </div>

      {/* Posting Form Area */}
      {showPostingForm && (
        <form 
          onSubmit={handleCreatePost}
          className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 shadow-xl space-y-4 animate-fade-in"
        >
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="text-sm font-black text-white uppercase flex items-center gap-2">
              <PlusCircle className="h-4 w-4 text-red-500" /> Escrever Novo Post
            </h3>
            <button 
              type="button"
              onClick={() => { playSound('click'); setShowPostingForm(false); }}
              className="text-xs text-zinc-500 hover:text-white"
            >
              Fechar
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-400 font-bold uppercase">Título Curto do Post</label>
              <input
                type="text"
                value={newPostTitle}
                onChange={e => setNewPostTitle(e.target.value)}
                placeholder="Exemplo: Preciso de carona na zona sul!"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
                maxLength={45}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-zinc-400 font-bold uppercase">Categoria da Notícia</label>
              <select
                value={newPostCategory}
                onChange={e => setNewPostCategory(e.target.value as 'noticias' | 'eventos' | 'promocoes')}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
              >
                <option value="noticias">📰 Canal de Boatos Geral</option>
                <option value="eventos">🎈 Eventos & Ostentação</option>
                <option value="promocoes">🏷️ Promoções / Anúncios / Vendas</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-zinc-400 font-bold uppercase">O que está acontecendo na quebrada?</label>
            <textarea
              value={newPostContent}
              onChange={e => setNewPostContent(e.target.value)}
              placeholder="Digite aqui o seu depoimento ou anúncio que todos os moradores da cidade vão ver..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500 min-h-[60px] sm:min-h-[80px]"
              maxLength={220}
            />
          </div>

          {/* Social Sponsorship Option / Economic Boost */}
          <div className="p-3 bg-zinc-950/80 border border-zinc-900 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <p className="font-extrabold text-yellow-400 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                <Megaphone className="h-3.5 w-3.5" /> Impulsionar Post com R$ 500 (Verificado)
              </p>
              <p className="text-[11px] text-zinc-400">
                Seu post ganha um selo azul de verificado, 15 Likes imediatos, maior engajamento de NPCs, além de te dar <strong className="text-yellow-400">+100 XP</strong>.
              </p>
            </div>
            
            <button
              type="button"
              onClick={() => { playSound('click'); setPromotePost(!promotePost); }}
              className={`px-4 py-2 border rounded-lg transition-all font-bold min-w-[100px] sm:min-w-[100px] sm:min-w-[120px] text-center cursor-pointer ${
                promotePost 
                  ? 'bg-yellow-500 border-yellow-400 text-black shadow-lg shadow-yellow-500/10' 
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              {promotePost ? '✓ IMPULSIONADO' : 'IMPULSIONAR'}
            </button>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-extrabold rounded-lg text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Send className="h-3.5 w-3.5" /> Publicar Notícia Social
            </button>
          </div>
        </form>
      )}

      {/* Categories Filtering Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Input widget */}
        <div className="relative w-full md:max-w-xs">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por tag, post ou autor..."
            className="w-full bg-zinc-950 border border-zinc-900 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
          />
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-600" />
        </div>

        {/* Categories Tab selectors */}
        <div id="news-categories-filter" className="flex items-center gap-1 border-b border-zinc-900 overflow-x-auto pb-1 max-w-full">
          {[
            { id: 'geral', label: 'Feed Geral', icon: '🌍' },
            { id: 'noticias', label: 'Notícias', icon: '📰' },
            { id: 'eventos', label: 'Eventos', icon: '🎈' },
            { id: 'prisoes', label: 'Prisões', icon: '🚨' },
            { id: 'promocoes', label: 'Promoções', icon: '🏷️' },
            { id: 'economicas', label: 'Crises Econômicas', icon: '📉' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { playSound('click'); setNewsTab(tab.id as any); }}
              className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                newsTab === tab.id
                  ? 'bg-red-950/40 border border-red-500/20 text-red-400'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Active Event/Economic Booster Connection Warning */}
      {activeEvent && (
        <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{activeEvent.icon}</span>
            <div className="space-y-0.5">
              <span className="text-[10px] text-amber-500 font-extrabold uppercase tracking-wider block">Impacto Econômico de Notícia Canal</span>
              <h4 className="text-sm font-black text-white uppercase">{activeEvent.name} Ativo no Rio</h4>
              <p className="text-zinc-400 text-[11px] leading-snug">{activeEvent.effectsDescription}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg font-mono text-xs">
            <span className="text-zinc-500 uppercase text-[9px] font-sans">Normalização em:</span>
            <strong className="text-amber-400 font-extrabold">{activeEvent.durationSeconds}s</strong>
          </div>
        </div>
      )}

      {/* Feed Area */}
      <div id="cidade-news-articles" className="space-y-4">
        {filteredPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-500 space-y-2 border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/20">
            <p className="text-3xl">📭</p>
            <p className="text-xs font-semibold uppercase">Nenhum post encontrado nesta categoria</p>
            <p className="text-[11px] text-zinc-600 max-w-xs leading-relaxed">Tente digitar outra palavra-chave ou escolha outras categorias de notícias!</p>
          </div>
        ) : (
          filteredPosts.map(post => {
            const hasLiked = post.hasLiked || false;
            const commentsList = post.comments || [];
            const isExpanded = expandedCommentsPostId === post.id;
            
            // Style color tags based on category
            let badgeStyle = 'bg-zinc-800 text-zinc-300 border-zinc-700';
            let categoryName = 'Geral';
            if (post.category === 'noticias') { badgeStyle = 'bg-blue-500/10 text-blue-400 border-blue-500/20'; categoryName = 'Notícia'; }
            if (post.category === 'eventos') { badgeStyle = 'bg-purple-500/10 text-purple-400 border-purple-500/20'; categoryName = 'Evento'; }
            if (post.category === 'prisoes') { badgeStyle = 'bg-red-500/10 text-red-400 border-red-500/20'; categoryName = 'Prisões'; }
            if (post.category === 'promocoes') { badgeStyle = 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'; categoryName = 'Promoção'; }
            if (post.category === 'acidentes') { badgeStyle = 'bg-orange-500/10 text-orange-400 border-orange-500/20'; categoryName = 'Acidente'; }
            if (post.category === 'crises') { badgeStyle = 'bg-red-950/40 text-red-300 border-red-900/40'; categoryName = 'Economia'; }

            return (
              <div 
                key={post.id}
                id={`news-post-${post.id}`}
                className={`flex flex-col rounded-2xl border bg-zinc-950/40 hover:bg-zinc-950/70 hover:border-zinc-800 transition-all duration-300 overflow-hidden ${
                  post.promoted 
                    ? 'border-yellow-500/30 bg-gradient-to-br from-yellow-500/[0.02] to-zinc-950' 
                    : 'border-zinc-900'
                }`}
              >
                {/* Promoted Top Bar */}
                {post.promoted && (
                  <div className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border-b border-yellow-500/10 px-4 py-1.5 flex items-center justify-between text-[9px] font-mono font-bold text-yellow-500 uppercase tracking-widest">
                    <span className="flex items-center gap-1">⚡ PUBLICIDADE PATROCINADA</span>
                    <span className="bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded text-[8px]">VERIFICADO</span>
                  </div>
                )}

                {/* Article Header */}
                <div className="p-5 pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xl shadow-inner select-none">
                        {post.author.avatar}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-extrabold text-white leading-none">
                            {post.author.name}
                          </h4>
                          {post.author.verified && (
                            <span className="inline-flex h-3.5 w-3.5 rounded-full bg-sky-500 text-zinc-950 flex items-center justify-center font-bold text-[8px]" title="Verificado Oficial">
                              ✓
                            </span>
                          )}
                          {post.author.role === 'prefeito' && (
                            <span className="bg-red-500/20 text-red-400 rounded px-1 text-[8px] font-mono uppercase font-bold border border-red-500/10">PREFEITURA</span>
                          )}
                          {post.author.role === 'pm' && (
                            <span className="bg-sky-500/20 text-sky-400 rounded px-1 text-[8px] font-mono uppercase font-bold border border-sky-500/10">POLÍCIA PM</span>
                          )}
                        </div>
                        <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">{post.author.handle} • {post.timestamp}</span>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold border ${badgeStyle} uppercase text-center`}>
                      {categoryName}
                    </span>
                  </div>

                  {/* Article Contents */}
                  <div className="space-y-2 mt-3.5">
                    <h3 className="text-sm font-black text-white hover:text-red-400 cursor-pointer transition-colors leading-tight">
                      {post.title}
                    </h3>
                    <p className="text-zinc-300 text-xs leading-relaxed break-words font-sans">
                      {post.content}
                    </p>
                  </div>

                  {/* Economy Linkage / Active Economic Trigger */}
                  {post.economyImpact && (
                    <div className="p-3 bg-zinc-900/60 border border-zinc-850 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-zinc-300 mt-4">
                      <div className="space-y-0.5">
                        <p className="font-extrabold text-amber-500 uppercase text-[9px] tracking-wider flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" /> EFEITO ECONÔMICO ASSOCIADO
                        </p>
                        <p className="text-[11px] leading-snug">{post.economyImpact.description}</p>
                      </div>

                      {triggerEconomyEvent && post.economyImpact.eventId && (
                        <button
                          onClick={() => handleTriggerImpact(post.economyImpact!.eventId as any)}
                          className="px-3 py-1.5 bg-red-950/60 hover:bg-red-900/60 border border-red-500/20 hover:border-red-500/40 rounded-lg text-[10px] font-extrabold uppercase text-red-400 transition-all shrink-0 cursor-pointer active:scale-95"
                        >
                          Aplicar este Evento
                        </button>
                      )}
                    </div>
                  )}

                  {/* Action row (Likes, Comments, Share) */}
                  <div className="flex items-center gap-4 border-t border-zinc-900/60 pt-3.5 mt-4 text-xs select-none">
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-1.5 transition-all cursor-pointer font-bold ${
                        hasLiked 
                          ? 'text-red-500 scale-105 filter drop-shadow-[0_0_8px_rgba(239,68,68,0.2)]'
                          : 'text-zinc-500 hover:text-red-400'
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${hasLiked ? 'fill-red-500' : ''}`} />
                      <span>{post.likes}</span>
                    </button>

                    <button
                      onClick={() => { playSound('click'); setExpandedCommentsPostId(isExpanded ? null : post.id); }}
                      className={`flex items-center gap-1.5 transition-colors cursor-pointer font-bold ${
                        isExpanded ? 'text-zinc-100' : 'text-zinc-500 hover:text-white'
                      }`}
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>{commentsList.length}</span>
                    </button>

                    <button
                      onClick={() => {
                        playSound('click');
                        navigator.clipboard.writeText(`"${post.title}" - Li isso no Cidade News do RP Tycoon!`);
                        showToast('Link da postagem copiado para sua área de transferência!', 'success');
                      }}
                      className="flex items-center gap-1.5 text-zinc-500 hover:text-white transition-colors cursor-pointer font-bold ml-auto"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Compartilhar</span>
                    </button>
                  </div>
                </div>

                {/* Expanded Comments container */}
                {isExpanded && (
                  <div className="bg-zinc-950 border-t border-zinc-900 p-5 space-y-4">
                    <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500">Mural de Comentários</h4>
                    
                    {commentsList.length === 0 ? (
                      <p className="text-[11px] text-zinc-650 italic text-center py-2">Seja o primeiro a deixar um comentário sobre essa notícia!</p>
                    ) : (
                      <div className="space-y-3.5 max-h-[180px] overflow-y-auto pr-1">
                        {commentsList.map(comm => (
                          <div key={comm.id} className="flex gap-2.5 items-start text-xs border-b border-zinc-900 pb-3 last:border-0 last:pb-0">
                            <span className="text-lg bg-zinc-900 border border-zinc-800 h-7 w-7 rounded-lg flex items-center justify-center shrink-0 select-none">
                              {comm.avatar || comm.authorAvatar || '👤'}
                            </span>
                            <div className="space-y-0.5 w-full">
                              <div className="flex justify-between items-center w-full">
                                <span className="font-bold text-zinc-200">{comm.authorName}</span>
                                <span className="text-[9px] text-zinc-650 font-mono">{comm.timestamp}</span>
                              </div>
                              <p className="text-zinc-400 text-[11px] leading-relaxed break-words">{comm.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* New comment input area */}
                    <div className="flex gap-2 border-t border-zinc-900 pt-3">
                      <input
                        type="text"
                        value={commentInputs[post.id] || ''}
                        onChange={e => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                        placeholder="Reagir e mandar resposta no chat..."
                        className="w-full bg-zinc-900/60 border border-zinc-850 rounded-lg py-2 px-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleAddComment(post.id);
                        }}
                      />
                      <button
                        onClick={() => handleAddComment(post.id)}
                        className="px-3 bg-red-650 text-white rounded-lg flex items-center justify-center cursor-pointer hover:bg-red-500 transition-colors"
                      >
                        <Send className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
