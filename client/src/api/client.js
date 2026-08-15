const API_URL = import.meta.env.DEV ? 'http://localhost:3001/api' : '/api';

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
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

  createTeam: (managerId, teamName) => request('/team/create', { method: 'POST', body: JSON.stringify({ managerId, teamName }) }),
  getPlayers: (teamId) => request(`/team/${teamId}/players`),
  setFormation: (teamId, formation) => request(`/team/${teamId}/formation`, { method: 'PUT', body: JSON.stringify({ formation }) }),
  setLineup: (teamId, starterIds) => request(`/team/${teamId}/lineup`, { method: 'PUT', body: JSON.stringify({ starterIds }) }),
  train: (teamId) => request(`/team/${teamId}/train`, { method: 'POST' }),

  playMatch: (teamId) => request('/match/play', { method: 'POST', body: JSON.stringify({ teamId }) }),
  getMatchHistory: (teamId) => request(`/match/history/${teamId}`),

  getMarket: () => request('/transfer/market'),
  buyPlayer: (playerId, teamId, managerId) => request('/transfer/buy', { method: 'POST', body: JSON.stringify({ playerId, teamId, managerId }) }),
  sellPlayer: (playerId, managerId) => request('/transfer/sell', { method: 'POST', body: JSON.stringify({ playerId, managerId }) }),

  getLeaderboard: () => request('/leaderboard'),

  getDraftPlayers: (division, reputation) => request(`/draft/available?division=${division || 1}&reputation=${reputation || 50}`),
  draftBuy: (managerId, teamId, player) => request('/draft/buy', { method: 'POST', body: JSON.stringify({ managerId, teamId, player }) }),
  draftFinish: (managerId, teamId) => request('/draft/finish', { method: 'POST', body: JSON.stringify({ managerId, teamId }) }),

  getSeasonStatus: (teamId) => request(`/season/${teamId}/status`),
  playMatchday: (teamId) => request(`/season/${teamId}/play-matchday`, { method: 'POST' }),
  getSponsors: (teamId) => request(`/season/${teamId}/sponsors`),
  chooseSponsor: (teamId, sponsorId, managerId) => request(`/season/${teamId}/choose-sponsor`, { method: 'POST', body: JSON.stringify({ sponsorId, managerId }) }),
  endSeason: (teamId, managerId) => request(`/season/${teamId}/end-season`, { method: 'POST', body: JSON.stringify({ managerId }) }),

  getManagement: (teamId) => request(`/season/${teamId}/management`),
  buyManagement: (teamId, actionId, managerId) => request(`/season/${teamId}/manage`, { method: 'POST', body: JSON.stringify({ actionId, managerId }) }),

  resolveEvent: (teamId, eventId, choiceId, managerId) => request(`/season/${teamId}/resolve-event`, { method: 'POST', body: JSON.stringify({ eventId, choiceId, managerId }) }),

  // Champions League
  getCLStatus: (teamId) => request(`/season/${teamId}/cl/status`),
  initCL: (teamId) => request(`/season/${teamId}/cl/init`, { method: 'POST' }),
  playCLMatch: (teamId) => request(`/season/${teamId}/cl/play`, { method: 'POST' }),
};
