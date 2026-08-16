/**
 * Division hierarchy (1 = lowest, 7 = highest)
 * Player starts in division 1 (Regional 2) and promotes upward.
 *
 * Division index -> League name:
 *   1 = Regional 2
 *   2 = Regional 1
 *   3 = National 3
 *   4 = National 2
 *   5 = National
 *   6 = Ligue 2
 *   7 = Ligue 1
 */

const DIVISIONS = [
  {
    level: 1,
    name: 'Regional 2',
    overallRange: [45, 55],
    budget: 200000,
    prizePool: [50000, 30000, 20000, 15000, 10000],
    teams: [
      { name: 'US Colomiers', formation: '4-4-2' },
      { name: 'AS Muret', formation: '4-4-2' },
      { name: 'FC Balma', formation: '4-3-3' },
      { name: 'Toulouse Rodeo', formation: '3-5-2' },
      { name: 'AS Saint-Sulpice', formation: '4-4-2' },
      { name: 'FC Portet', formation: '4-4-2' },
      { name: 'US Ramonville', formation: '4-3-3' },
      { name: 'Sporting Castanet', formation: '4-4-2' },
      { name: 'Entente Blagnac', formation: '4-2-3-1' },
      { name: 'AS Tournefeuille', formation: '4-4-2' },
      { name: 'FC Cugnaux', formation: '4-3-3' },
      { name: 'US Carbonne', formation: '4-4-2' },
      { name: 'ES Plaisance', formation: '3-5-2' },
    ],
  },
  {
    level: 2,
    name: 'Regional 1',
    overallRange: [50, 58],
    budget: 500000,
    prizePool: [150000, 100000, 70000, 50000, 30000],
    teams: [
      { name: 'Montauban FC', formation: '4-4-2' },
      { name: 'AS Carcassonne', formation: '4-3-3' },
      { name: 'FC Auch', formation: '4-4-2' },
      { name: 'Albi FC', formation: '4-2-3-1' },
      { name: 'US Cahors', formation: '4-4-2' },
      { name: 'Tarbes PF', formation: '4-3-3' },
      { name: 'RC Narbonne', formation: '4-4-2' },
      { name: 'AS Béziers', formation: '3-5-2' },
      { name: 'FC Lourdes', formation: '4-4-2' },
      { name: 'Castres FC', formation: '4-4-2' },
      { name: 'Foix FC', formation: '4-3-3' },
      { name: 'US Pamiers', formation: '4-4-2' },
      { name: 'SC Gaillac', formation: '4-4-2' },
    ],
  },
  {
    level: 3,
    name: 'National 3',
    overallRange: [58, 65],
    budget: 1500000,
    prizePool: [400000, 250000, 150000, 100000, 70000],
    teams: [
      { name: 'US Lusitanos', formation: '4-3-3' },
      { name: 'FC Martigues', formation: '4-4-2' },
      { name: 'AS Poissy', formation: '4-2-3-1' },
      { name: 'Racing Besancon', formation: '4-4-2' },
      { name: 'SO Romorantin', formation: '4-3-3' },
      { name: 'FC Fleury 91', formation: '4-4-2' },
      { name: 'US Boulogne', formation: '4-4-2' },
      { name: 'Hyeres FC', formation: '3-5-2' },
      { name: 'Stade Briochin', formation: '4-3-3' },
      { name: 'US Creteil', formation: '4-4-2' },
      { name: 'FC Rouen', formation: '4-3-3' },
      { name: 'US Avranches', formation: '4-4-2' },
      { name: 'Bergerac Perigord', formation: '4-4-2' },
    ],
  },
  {
    level: 4,
    name: 'National 2',
    overallRange: [62, 68],
    budget: 4000000,
    prizePool: [800000, 500000, 350000, 250000, 150000],
    teams: [
      { name: 'SO Cholet', formation: '4-3-3' },
      { name: 'FC Versailles', formation: '4-4-2' },
      { name: 'Lyon Duchere', formation: '4-2-3-1' },
      { name: 'US Orleans', formation: '4-3-3' },
      { name: 'FC Sete', formation: '4-4-2' },
      { name: 'AS Beauvais', formation: '4-4-2' },
      { name: 'Red Star FC', formation: '4-3-3' },
      { name: 'Stade Lavallois', formation: '4-4-2' },
      { name: 'FC Chambly', formation: '3-5-2' },
      { name: 'US Concarneau', formation: '4-4-2' },
      { name: 'FC Villefranche', formation: '4-3-3' },
      { name: 'SC Bastia', formation: '4-4-2' },
      { name: 'AS Vitré', formation: '4-4-2' },
    ],
  },
  {
    level: 5,
    name: 'National',
    overallRange: [65, 72],
    budget: 8000000,
    prizePool: [2000000, 1200000, 800000, 500000, 350000],
    teams: [
      { name: 'FC Pau', formation: '4-3-3' },
      { name: 'US Quevilly-Rouen', formation: '4-4-2' },
      { name: 'Stade Brestois B', formation: '4-3-3' },
      { name: 'SC Sedan', formation: '4-4-2' },
      { name: 'Entente Sannois', formation: '4-2-3-1' },
      { name: 'Valenciennes FC', formation: '4-4-2' },
      { name: 'GOAL FC', formation: '4-3-3' },
      { name: 'FC Annecy', formation: '4-4-2' },
      { name: 'Grenoble Foot', formation: '4-3-3' },
      { name: 'Chateauroux LB', formation: '4-4-2' },
      { name: 'Nancy ASNL', formation: '4-3-3' },
      { name: 'Niort Chamois', formation: '4-4-2' },
      { name: 'Dijon FCO', formation: '4-2-3-1' },
    ],
  },
  {
    level: 6,
    name: 'Ligue 2',
    overallRange: [72, 78],
    budget: 15000000,
    prizePool: [5000000, 3000000, 2000000, 1500000, 1000000],
    teams: [
      { name: 'SM Caen', formation: '4-3-3' },
      { name: 'Paris FC', formation: '4-4-2' },
      { name: 'Le Puy Foot', formation: '4-3-3' },
      { name: 'EA Guingamp', formation: '4-4-2' },
      { name: 'Girondins Bordeaux', formation: '4-3-3' },
      { name: 'FC Metz', formation: '4-2-3-1' },
      { name: 'AJ Auxerre', formation: '4-4-2' },
      { name: 'Rodez AF', formation: '4-4-2' },
      { name: 'Amiens SC', formation: '4-3-3' },
      { name: 'Troyes ESTAC', formation: '4-4-2' },
      { name: 'Sochaux FCSM', formation: '4-3-3' },
      { name: 'Laval Stade', formation: '4-4-2' },
      { name: 'Dunkerque USL', formation: '4-4-2' },
    ],
  },
  {
    level: 7,
    name: 'Ligue 1',
    overallRange: [80, 90],
    budget: 50000000,
    prizePool: [20000000, 12000000, 8000000, 5000000, 3000000],
    // Ligue 1 uses real teams from realPlayers.js
    teams: null,
  },
];

module.exports = { DIVISIONS };
