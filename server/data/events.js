const EVENTS = [
  // --- Moral / Vestiaire ---
  {
    id: 'player_dispute',
    type: 'moral',
    title: 'Conflit dans le vestiaire',
    description: 'Deux de vos joueurs se sont disputés violemment à l\'entraînement. L\'ambiance est tendue.',
    choices: [
      { id: 'punish', text: 'Sanctionner les deux joueurs', effects: { morale: -5, reputation: 3 }, consequence: 'Discipline respectée, mais le vestiaire grogne.' },
      { id: 'ignore', text: 'Laisser couler', effects: { morale: -10 }, consequence: 'Le conflit s\'envenime, le moral chute.' },
      { id: 'mediate', text: 'Organiser une médiation (100k€)', effects: { budget: -100000, morale: 5, reputation: 2 }, consequence: 'Les joueurs se réconcilient, l\'ambiance s\'améliore.' },
    ],
    minMatchday: 3,
  },
  {
    id: 'star_demands',
    type: 'financial',
    title: 'Revendication salariale',
    description: 'Votre meilleur joueur demande une prime exceptionnelle. Il menace de mal jouer sinon.',
    choices: [
      { id: 'pay', text: 'Payer la prime (300k€)', effects: { budget: -300000, morale: 8 }, consequence: 'Le joueur est satisfait, le vestiaire suit.' },
      { id: 'refuse', text: 'Refuser fermement', effects: { morale: -8, reputation: 5 }, consequence: 'Vous montrez qui commande, mais le joueur boude.' },
      { id: 'negotiate', text: 'Négocier un bonus au résultat', effects: { morale: 3, reputation: 2 }, consequence: 'Compromis accepté, tout le monde y trouve son compte.' },
    ],
    minMatchday: 5,
  },
  {
    id: 'fan_protest',
    type: 'moral',
    title: 'Colère des supporters',
    description: 'Après plusieurs mauvais résultats, les supporters organisent une manifestation devant le stade.',
    choices: [
      { id: 'meet_fans', text: 'Aller à leur rencontre', effects: { morale: -3, reputation: 8 }, consequence: 'Votre courage force le respect, la pression retombe.' },
      { id: 'hide', text: 'Ignorer et rester concentré', effects: { morale: -8, reputation: -5 }, consequence: 'Les supporters se sentent méprisés.' },
      { id: 'promise', text: 'Promettre un recrutement (500k€)', effects: { budget: -500000, morale: 5, reputation: 5 }, consequence: 'L\'espoir renaît, mais il faudra tenir parole.' },
    ],
    minMatchday: 8,
    condition: 'losing', // only triggers if team is in bottom half
  },
  // --- Financier ---
  {
    id: 'sponsor_shady',
    type: 'financial',
    title: 'Offre douteuse',
    description: 'Un homme d\'affaires vous propose 800k€ en échange de la titularisation de son neveu (overall 45).',
    choices: [
      { id: 'accept', text: 'Accepter le deal', effects: { budget: 800000, morale: -10, reputation: -15 }, consequence: 'L\'argent rentre mais l\'équipe ne comprend pas cette décision.' },
      { id: 'refuse', text: 'Refuser poliment', effects: { reputation: 5, morale: 3 }, consequence: 'Vous gardez votre intégrité, les joueurs vous respectent.' },
      { id: 'counter', text: 'Contre-proposer : il investit au club sans condition', effects: { budget: 300000, reputation: 3 }, consequence: 'Il accepte un investissement plus modeste mais propre.' },
    ],
    minMatchday: 4,
  },
  {
    id: 'youth_talent',
    type: 'sporting',
    title: 'Pépite du centre de formation',
    description: 'Un jeune de 16 ans impressionne à l\'entraînement. Plusieurs clubs pros le surveillent.',
    choices: [
      { id: 'promote', text: 'L\'intégrer au groupe pro', effects: { morale: 5, reputation: 5 }, consequence: 'Le jeune est motivé et le vestiaire l\'accueille bien.' },
      { id: 'sell', text: 'Le vendre maintenant (400k€)', effects: { budget: 400000, morale: -3, reputation: -3 }, consequence: 'L\'argent est là mais les supporters grognent.' },
      { id: 'loan', text: 'Le prêter pour qu\'il progresse', effects: { reputation: 3 }, consequence: 'Sage décision. Il reviendra plus fort la saison prochaine.' },
    ],
    minMatchday: 6,
  },
  {
    id: 'stadium_issue',
    type: 'financial',
    title: 'Pelouse en mauvais état',
    description: 'La pelouse du stade est dans un état lamentable. Cela affecte le jeu de votre équipe.',
    choices: [
      { id: 'repair', text: 'Refaire la pelouse (200k€)', effects: { budget: -200000, morale: 5, stamina_boost: 5 }, consequence: 'Pelouse impeccable, vos joueurs peuvent exprimer leur jeu.' },
      { id: 'nothing', text: 'Jouer avec', effects: { morale: -3 }, consequence: 'Les joueurs se plaignent, les blessures menacent.' },
      { id: 'synthetic', text: 'Passer en synthétique (500k€)', effects: { budget: -500000, morale: 3, stamina_boost: 10, reputation: -5 }, consequence: 'Plus de problèmes d\'entretien, mais les puristes râlent.' },
    ],
    minMatchday: 2,
  },
  {
    id: 'media_scandal',
    type: 'moral',
    title: 'Scandale médiatique',
    description: 'Un joueur a été photographié en boîte de nuit la veille d\'un match important.',
    choices: [
      { id: 'bench', text: 'Le mettre sur le banc en guise de punition', effects: { morale: -3, reputation: 5 }, consequence: 'Message envoyé : la discipline passe avant tout.' },
      { id: 'fine', text: 'Amende interne (50k€ récupérés)', effects: { budget: 50000, morale: -5 }, consequence: 'Le joueur paye mais l\'ambiance est froide.' },
      { id: 'support', text: 'Le soutenir publiquement', effects: { morale: 5, reputation: -8 }, consequence: 'Le vestiaire vous adore, mais les médias vous critiquent.' },
    ],
    minMatchday: 7,
  },
  {
    id: 'charity_match',
    type: 'moral',
    title: 'Match caritatif',
    description: 'Une association locale vous demande d\'organiser un match caritatif pendant la trêve.',
    choices: [
      { id: 'accept', text: 'Accepter avec enthousiasme', effects: { morale: 5, reputation: 10, stamina_boost: -5 }, consequence: 'Belle image pour le club, mais les joueurs sont un peu fatigués.' },
      { id: 'refuse', text: 'Décliner, priorité au championnat', effects: { morale: -2, reputation: -5 }, consequence: 'Pragmatique mais mal perçu.' },
      { id: 'donate', text: 'Refuser le match mais faire un don (150k€)', effects: { budget: -150000, reputation: 8 }, consequence: 'Généreux sans risquer la forme physique.' },
    ],
    minMatchday: 10,
  },
  {
    id: 'rival_poach',
    type: 'sporting',
    title: 'Offre d\'un rival',
    description: 'Un club rival propose de racheter votre capitaine pour 2M€. Le joueur hésite.',
    choices: [
      { id: 'sell', text: 'Accepter l\'offre (2M€)', effects: { budget: 2000000, morale: -12, reputation: -5 }, consequence: 'L\'argent afflue mais le vestiaire est sous le choc.' },
      { id: 'refuse', text: 'Refuser catégoriquement', effects: { morale: 8, reputation: 3 }, consequence: 'Le capitaine est touché par votre loyauté.' },
      { id: 'negotiate', text: 'Demander plus (3.5M€ ou rien)', effects: { budget: 3500000, morale: -8, reputation: -3, chance: 0.4 }, consequence: 'Ils refusent dans 60% des cas. Si ça passe, gros jackpot.' },
    ],
    minMatchday: 12,
  },
  {
    id: 'doping_suspicion',
    type: 'moral',
    title: 'Soupçon de dopage',
    description: 'Un contrôle anti-dopage inopiné est annoncé. Un de vos joueurs vous avoue prendre des compléments douteux.',
    choices: [
      { id: 'report', text: 'Signaler le joueur à la fédération', effects: { morale: -8, reputation: 15 }, consequence: 'Intégrité irréprochable, mais vous perdez un joueur.' },
      { id: 'cover', text: 'Le couvrir et espérer que ça passe', effects: { reputation: -20, chance: 0.5 }, consequence: '50% de chance d\'être pris. Si découvert : -20 rep en plus.' },
      { id: 'substitute', text: 'Le mettre "blessé" discrètement', effects: { morale: -3, reputation: -5 }, consequence: 'Pas de scandale, mais un malaise persiste.' },
    ],
    minMatchday: 8,
  },
  {
    id: 'local_business',
    type: 'financial',
    title: 'Partenariat local',
    description: 'Un restaurant du quartier propose un partenariat : repas gratuits pour l\'équipe contre visibilité.',
    choices: [
      { id: 'accept', text: 'Accepter le partenariat', effects: { morale: 5, stamina_boost: 3, reputation: 2 }, consequence: 'Les joueurs adorent, bonne ambiance garantie.' },
      { id: 'refuse', text: 'Décliner, pas assez professionnel', effects: { reputation: -2 }, consequence: 'Le restaurateur est déçu, opportunité perdue.' },
      { id: 'negotiate', text: 'Accepter + négocier un sponsoring (50k€)', effects: { budget: 50000, morale: 3, reputation: 3 }, consequence: 'Tout le monde y gagne.' },
    ],
    minMatchday: 1,
  },
  {
    id: 'injured_veteran',
    type: 'sporting',
    title: 'Vétéran blessé',
    description: 'Votre joueur le plus expérimenté se blesse au genou. Le médecin propose deux options.',
    choices: [
      { id: 'surgery', text: 'Opération (miss 8 matchs, guérison totale)', effects: { morale: -5 }, consequence: 'Long à récupérer mais il reviendra à 100%.' },
      { id: 'quick_fix', text: 'Traitement rapide (miss 2 matchs, risque rechute)', effects: { morale: -2, chance: 0.4 }, consequence: '40% de chance de rechute grave plus tard.' },
      { id: 'retire', text: 'Lui proposer de raccrocher', effects: { morale: -10, budget: 100000, reputation: -3 }, consequence: 'Triste fin de carrière. Les vétérans du vestiaire sont affectés.' },
    ],
    minMatchday: 5,
  },
];

function getRandomEvent(matchday, isLosing) {
  const eligible = EVENTS.filter(e => {
    if (e.minMatchday > matchday) return false;
    if (e.condition === 'losing' && !isLosing) return false;
    return true;
  });
  if (eligible.length === 0) return null;
  // ~10% chance of an event per matchday (~2-3 par saison)
  if (Math.random() > 0.10) return null;
  return eligible[Math.floor(Math.random() * eligible.length)];
}

module.exports = { EVENTS, getRandomEvent };
