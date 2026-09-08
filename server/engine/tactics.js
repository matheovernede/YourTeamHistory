const TACTICS = require('../../shared/tactics.json');

const isValidTactic = (id) => typeof id === 'string' && Object.hasOwn(TACTICS, id);
const normalizeTactic = (id) => isValidTactic(id) ? id : 'balanced';
const fatigueCost = (id, base = 10) => Math.round(TACTICS[normalizeTactic(id)].fatigue * base / 10);

function applyTactic(ratings, id, players = []) {
  const tactic = TACTICS[normalizeTactic(id)];
  const starters = players.filter(p => p.is_starter);
  const stamina = starters.length ? starters.reduce((sum, p) => sum + (p.stamina ?? 100), 0) / starters.length : 100;
  // Un pressing épuisé conserve son exposition défensive mais perd ses bonus.
  const effectiveness = id === 'pressing' ? Math.max(0, Math.min(1, (stamina - 30) / 50)) : 1;
  const factor = (value) => value > 1 ? 1 + (value - 1) * effectiveness : value;
  return {
    ...ratings,
    attack: ratings.attack * factor(tactic.attack),
    midfield: ratings.midfield * factor(tactic.midfield),
    defense: ratings.defense * factor(tactic.defense),
  };
}

module.exports = { TACTICS, isValidTactic, normalizeTactic, fatigueCost, applyTactic };
