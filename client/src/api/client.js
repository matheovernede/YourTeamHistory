/**
 * Adresse de l'API.
 *
 * Par défaut le front et l'API sont servis par le même serveur, d'où le chemin
 * relatif `/api`. Si les deux sont hébergés séparément — par exemple le front
 * en statique chez un hébergeur mutualisé et l'API sur un serveur Node — il
 * suffit de définir VITE_API_URL au moment du build :
 *
 *   VITE_API_URL=https://api.mondomaine.com npm run build
 *
 * Le serveur autorise déjà les requêtes d'origine croisée (cors).
 */
const API_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}/api`
  : import.meta.env.DEV
    ? 'http://localhost:3001/api'
    : '/api';

/**
 * Langue courante, lue directement dans le stockage local.
 *
 * Ce module n'est pas un composant React : il ne peut pas consulter le
 * contexte de traduction. Il lit donc la même clé que lui, ce qui évite d'avoir
 * à passer la langue en paramètre à chaque appel de l'API.
 */
function langueCourante() {
  try {
    return localStorage.getItem('yth_langue') || 'fr';
  } catch {
    return 'fr';
  }
}

async function request(path, options = {}) {
  // La langue accompagne chaque requête : événements, dialogues et messages
  // d'erreur sont produits par le serveur, qui doit savoir dans quelle langue
  // les rendre.
  const separateur = path.includes('?') ? '&' : '?';
  const url = `${API_URL}${path}${separateur}lang=${langueCourante()}`;

  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erreur serveur');
  return data;
}

export const api = {
  register: (username) => request('/manager/register', { method: 'POST', body: JSON.stringify({ username }) }),
  resetManager: (managerId) => request('/manager/reset', { method: 'POST', body: JSON.stringify({ managerId }) }),
  getManager: (id) => request(`/manager/${id}`),
  getManagerTeam: (id) => request(`/manager/${id}/team`),
  exportSave: (id) => request(`/manager/${id}/save`),
  importSave: (id, saveData) => request(`/manager/${id}/load`, { method: 'POST', body: JSON.stringify({ saveData }) }),

  // Classement de tous les managers humains, avec leur statut de présence.
  getPlayersRanking: () => request('/leaderboard/players'),
  getPlayerProfile: (teamId) => request(`/leaderboard/players/${teamId}`),

  createTeam: (managerId, teamName, difficulty) => request('/team/create', { method: 'POST', body: JSON.stringify({ managerId, teamName, difficulty }) }),
  getPlayers: (teamId) => request(`/team/${teamId}/players`),
  setFormation: (teamId, formation) => request(`/team/${teamId}/formation`, { method: 'PUT', body: JSON.stringify({ formation }) }),
  // `slots` : tableau de 11 identifiants indexé par emplacement de la formation.
  setLineup: (teamId, starterIds, slots) => request(`/team/${teamId}/lineup`, { method: 'PUT', body: JSON.stringify({ starterIds, slots }) }),
  train: (teamId) => request(`/team/${teamId}/train`, { method: 'POST' }),

  playMatch: (teamId) => request('/match/play', { method: 'POST', body: JSON.stringify({ teamId }) }),
  getMatchHistory: (teamId) => request(`/match/history/${teamId}`),

  getMarket: () => request('/transfer/market'),
  buyPlayer: (playerId, teamId, managerId) => request('/transfer/buy', { method: 'POST', body: JSON.stringify({ playerId, teamId, managerId }) }),
  sellPlayer: (playerId, managerId) => request('/transfer/sell', { method: 'POST', body: JSON.stringify({ playerId, managerId }) }),

  getLeaderboard: () => request('/leaderboard'),

  getDraftPlayers: (division, reputation, teamId, difficulty) => request(`/draft/available?division=${division || 1}&reputation=${reputation || 50}&teamId=${teamId || ''}&difficulty=${difficulty || 'normal'}`),
  draftBuy: (managerId, teamId, player) => request('/draft/buy', { method: 'POST', body: JSON.stringify({ managerId, teamId, player }) }),
  draftFinish: (managerId, teamId) => request('/draft/finish', { method: 'POST', body: JSON.stringify({ managerId, teamId }) }),

  getSeasonStatus: (teamId) => request(`/season/${teamId}/status`),
  playMatchday: (teamId, difficulty) => request(`/season/${teamId}/play-matchday`, { method: 'POST', body: JSON.stringify({ difficulty }) }),
  getSponsors: (teamId) => request(`/season/${teamId}/sponsors`),
  chooseSponsor: (teamId, sponsorId, managerId) => request(`/season/${teamId}/choose-sponsor`, { method: 'POST', body: JSON.stringify({ sponsorId, managerId }) }),
  // La difficulté conditionne les départs de joueurs et le niveau des équipes
  // IA générées pour la nouvelle saison : elle doit accompagner la requête.
  endSeason: (teamId, managerId, difficulty) => request(`/season/${teamId}/end-season`, { method: 'POST', body: JSON.stringify({ managerId, difficulty }) }),

  getManagement: (teamId) => request(`/season/${teamId}/management`),
  buyManagement: (teamId, actionId, managerId) => request(`/season/${teamId}/manage`, { method: 'POST', body: JSON.stringify({ actionId, managerId }) }),

  getConversation: (teamId) => request(`/season/${teamId}/conversations`),
  resolveConversation: (teamId, conversationId, choiceId, playerId, managerId) => request(`/season/${teamId}/resolve-conversation`, { method: 'POST', body: JSON.stringify({ conversationId, choiceId, playerId, managerId }) }),

  resolveEvent: (teamId, eventId, choiceId, managerId) => request(`/season/${teamId}/resolve-event`, { method: 'POST', body: JSON.stringify({ eventId, choiceId, managerId }) }),

  // Champions League
  getCupStatus: (teamId) => request(`/season/${teamId}/cup/status`),
  playCupMatch: (teamId, difficulty) => request(`/season/${teamId}/cup/play`, { method: 'POST', body: JSON.stringify({ difficulty }) }),
  getSeasonHistory: (teamId) => request(`/season/${teamId}/history`),
  getPlayerStats: (teamId) => request(`/season/${teamId}/stats`),
  getSquadMood: (teamId) => request(`/season/${teamId}/mood`),

  getCLStatus: (teamId) => request(`/season/${teamId}/cl/status`),
  initCL: (teamId) => request(`/season/${teamId}/cl/init`, { method: 'POST' }),
  playCLMatch: (teamId) => request(`/season/${teamId}/cl/play`, { method: 'POST' }),

  // DreamTeam
  getDreamTeamPlayers: (league, position) => {
    let url = '/dreamteam/players';
    const params = [];
    if (league) params.push(`league=${encodeURIComponent(league)}`);
    if (position) params.push(`position=${encodeURIComponent(position)}`);
    if (params.length) url += '?' + params.join('&');
    return request(url);
  },

  // DreamTeam gameplay
  dreamTeamFriendly: (homePlayers, difficulty) => request('/dreamteam/friendly', { method: 'POST', body: JSON.stringify({ homePlayers, difficulty }) }),
  dreamTeamCLDraw: () => request('/dreamteam/cl-draw', { method: 'POST' }),
  dreamTeamCLMatch: (homePlayers, awayPlayers) => request('/dreamteam/cl-match', { method: 'POST', body: JSON.stringify({ homePlayers, awayPlayers }) }),
  dreamTeamStartCareer: (username, teamName, players) => request('/dreamteam/start-career', { method: 'POST', body: JSON.stringify({ username, teamName, players }) }),
};
