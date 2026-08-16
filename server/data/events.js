/**
 * Événements de saison.
 *
 * Chaque entrée expose :
 *   id           identifiant stable (sert à retrouver le choix côté serveur)
 *   type         'moral' | 'financial' | 'sporting' | 'club'
 *   title        titre affiché
 *   description  mise en situation
 *   weight       poids de tirage (défaut 1). Les événements contextuels sont
 *                pondérés plus haut pour ne pas être noyés sous les génériques.
 *   minMatchday  journée minimale d'apparition
 *   when         prédicat (ctx) -> booléen. Absent = toujours éligible.
 *   choices      options, avec effets et conséquence affichée.
 *
 * Effets appliqués par season.js :
 *   budget          argent (multiplié par l'échelle de la division)
 *   morale          moral de TOUT l'effectif
 *   reputation      réputation du manager
 *   stamina_boost   forme de tout l'effectif
 *   chance          probabilité de réussite ; en cas d'échec, rien n'est appliqué
 *   recruit_player  { ageRange, overallRange, morale } -> un joueur rejoint le club
 *   remove_player   'captain'|'best'|'worst'|'oldest'|'youngest'|'starter'|'random'
 *   bench_player    même sélecteur -> le joueur est écarté du onze
 *   drain_player    { target, stamina } -> indisponibilité simulée
 *
 * `when` est une fonction : elle disparaît à la sérialisation JSON, le client
 * ne reçoit donc que les données d'affichage.
 */

const EVENTS = [
  // ============================================================
  // MORAL / VESTIAIRE
  // ============================================================
  {
    id: 'player_dispute',
    type: 'moral',
    title: 'Conflit dans le vestiaire',
    description: 'Deux de vos joueurs se sont disputés violemment à l\'entraînement. L\'ambiance est tendue.',
    minMatchday: 3,
    choices: [
      { id: 'punish', text: 'Sanctionner les deux joueurs', effects: { morale: -5, reputation: 3 }, consequence: 'Discipline respectée, mais le vestiaire grogne.' },
      { id: 'ignore', text: 'Laisser couler', effects: { morale: -10 }, consequence: 'Le conflit s\'envenime, le moral chute.' },
      { id: 'mediate', text: 'Organiser une médiation (100k€)', effects: { budget: -100000, morale: 5, reputation: 2 }, consequence: 'Les joueurs se réconcilient, l\'ambiance s\'améliore.' },
    ],
  },
  {
    id: 'media_scandal',
    type: 'moral',
    title: 'Scandale médiatique',
    description: 'Un joueur a été photographié en boîte de nuit la veille d\'un match important.',
    minMatchday: 7,
    choices: [
      { id: 'bench', text: 'Le mettre sur le banc en guise de punition', effects: { morale: -3, reputation: 5, bench_player: 'starter' }, consequence: 'Message envoyé : la discipline passe avant tout. Le fautif est écarté du onze.' },
      { id: 'fine', text: 'Amende interne (50k€ récupérés)', effects: { budget: 50000, morale: -5 }, consequence: 'Le joueur paye mais l\'ambiance est froide.' },
      { id: 'support', text: 'Le soutenir publiquement', effects: { morale: 5, reputation: -8 }, consequence: 'Le vestiaire vous adore, mais les médias vous critiquent.' },
    ],
  },
  {
    id: 'captain_armband',
    type: 'moral',
    title: 'Question de brassard',
    description: 'Plusieurs cadres réclament un changement de capitaine. Le titulaire actuel ne fait plus l\'unanimité.',
    minMatchday: 6,
    weight: 2,
    choices: [
      { id: 'change', text: 'Changer de capitaine', effects: { morale: 6, reputation: -2 }, consequence: 'Le groupe approuve, mais l\'ancien capitaine encaisse mal.' },
      { id: 'keep', text: 'Maintenir votre choix', effects: { morale: -6, reputation: 6 }, consequence: 'Vous assumez. Les contestataires devront s\'y faire.' },
      { id: 'vote', text: 'Laisser le groupe voter', effects: { morale: 12, reputation: -4 }, consequence: 'Décision collective : le vestiaire se sent écouté.' },
    ],
  },
  {
    id: 'training_revolt',
    type: 'moral',
    title: 'Fronde à l\'entraînement',
    description: 'Les joueurs jugent vos séances trop dures. Certains menacent de lever le pied.',
    minMatchday: 5,
    weight: 3,
    when: ctx => ctx.streak.type === 'loss' || ctx.isLosing,
    choices: [
      { id: 'soften', text: 'Alléger la charge de travail', effects: { stamina_boost: 15, morale: 8, reputation: -3 }, consequence: 'Jambes fraîches retrouvées, mais votre autorité en prend un coup.' },
      { id: 'harden', text: 'Durcir encore : ils manquent de caractère', effects: { stamina_boost: -12, morale: -8, reputation: 5 }, consequence: 'Vous imposez votre loi. Le groupe serre les dents.' },
      { id: 'explain', text: 'Expliquer votre méthode, chiffres à l\'appui', effects: { morale: 5, reputation: 3 }, consequence: 'La pédagogie paye : ils comprennent la démarche.' },
    ],
  },
  {
    id: 'birthday_party',
    type: 'moral',
    title: 'Anniversaire d\'un cadre',
    description: 'Un joueur influent organise son anniversaire et invite tout le groupe. Le match est dans trois jours.',
    minMatchday: 4,
    choices: [
      { id: 'allow', text: 'Autoriser, mais raisonnables', effects: { morale: 10, stamina_boost: -5 }, consequence: 'Soirée réussie, le groupe est soudé. Quelques têtes lourdes.' },
      { id: 'forbid', text: 'Interdire, match important', effects: { morale: -8, stamina_boost: 5 }, consequence: 'Ils obéissent, en silence.' },
      { id: 'delay', text: 'Reporter après le match', effects: { morale: 4, reputation: 2 }, consequence: 'Compromis accepté sans enthousiasme.' },
    ],
  },
  {
    id: 'religious_fasting',
    type: 'moral',
    title: 'Période de jeûne',
    description: 'Plusieurs joueurs observent une période de jeûne. Leur préparation en est affectée.',
    minMatchday: 6,
    choices: [
      { id: 'adapt', text: 'Adapter les horaires d\'entraînement', effects: { morale: 14, reputation: 4, budget: -30000 }, consequence: 'Le respect que vous montrez soude le vestiaire.' },
      { id: 'nothing', text: 'Ne rien changer', effects: { morale: -10, stamina_boost: -8 }, consequence: 'Ils tiennent, mais le message est mal passé.' },
      { id: 'nutrition', text: 'Faire venir un nutritionniste spécialisé', effects: { morale: 10, stamina_boost: 8, budget: -80000 }, consequence: 'Accompagnement sur mesure : personne n\'est pénalisé.' },
    ],
  },

  // ============================================================
  // FINANCIER
  // ============================================================
  {
    id: 'star_demands',
    type: 'financial',
    title: 'Revendication salariale',
    description: 'Votre meilleur joueur demande une prime exceptionnelle. Il menace de mal jouer sinon.',
    minMatchday: 5,
    choices: [
      { id: 'pay', text: 'Payer la prime (300k€)', effects: { budget: -300000, morale: 8 }, consequence: 'Le joueur est satisfait, le vestiaire suit.' },
      { id: 'refuse', text: 'Refuser fermement', effects: { morale: -8, reputation: 5 }, consequence: 'Vous montrez qui commande, mais le joueur boude.' },
      { id: 'negotiate', text: 'Négocier un bonus au résultat', effects: { morale: 3, reputation: 2 }, consequence: 'Compromis accepté, tout le monde y trouve son compte.' },
    ],
  },
  {
    id: 'sponsor_shady',
    type: 'financial',
    title: 'Offre douteuse',
    description: 'Un homme d\'affaires vous propose 800k€ en échange de la titularisation de son neveu (overall 45).',
    minMatchday: 4,
    choices: [
      { id: 'accept', text: 'Accepter le deal', effects: { budget: 800000, morale: -10, reputation: -15, recruit_player: { ageRange: [19, 23], overallRange: [42, 48], morale: 95 } }, consequence: 'L\'argent rentre mais l\'équipe ne comprend pas cette décision.' },
      { id: 'refuse', text: 'Refuser poliment', effects: { reputation: 5, morale: 3 }, consequence: 'Vous gardez votre intégrité, les joueurs vous respectent.' },
      { id: 'counter', text: 'Contre-proposer : il investit au club sans condition', effects: { budget: 300000, reputation: 3 }, consequence: 'Il accepte un investissement plus modeste mais propre.' },
    ],
  },
  {
    id: 'local_business',
    type: 'financial',
    title: 'Partenariat local',
    description: 'Un restaurant du quartier propose un partenariat : repas gratuits pour l\'équipe contre visibilité.',
    minMatchday: 1,
    choices: [
      { id: 'accept', text: 'Accepter le partenariat', effects: { morale: 5, stamina_boost: 3, reputation: 2 }, consequence: 'Les joueurs adorent, bonne ambiance garantie.' },
      { id: 'refuse', text: 'Décliner, pas assez professionnel', effects: { reputation: -2 }, consequence: 'Le restaurateur est déçu, opportunité perdue.' },
      { id: 'negotiate', text: 'Accepter + négocier un sponsoring (50k€)', effects: { budget: 50000, morale: 3, reputation: 3 }, consequence: 'Tout le monde y gagne.' },
    ],
  },
  {
    id: 'tax_audit',
    type: 'financial',
    title: 'Contrôle fiscal',
    description: 'L\'administration épluche les comptes du club. Quelques irrégularités mineures traînent.',
    minMatchday: 8,
    weight: 2,
    choices: [
      { id: 'lawyer', text: 'Payer un cabinet spécialisé (250k€)', effects: { budget: -250000, reputation: 3 }, consequence: 'Dossier réglé proprement, aucune suite.' },
      { id: 'gamble', text: 'Assumer seul et espérer', effects: { reputation: -12, chance: 0.55 }, consequence: 'Pari risqué : 45% de chances que ça tourne mal.' },
      { id: 'confess', text: 'Tout déclarer spontanément', effects: { budget: -400000, reputation: 8 }, consequence: 'Honnêteté saluée, la note est salée.' },
    ],
  },
  {
    id: 'merchandising',
    type: 'financial',
    title: 'Boutique du club',
    description: 'Le directeur commercial veut lancer une gamme de maillots collector.',
    minMatchday: 5,
    choices: [
      { id: 'invest', text: 'Investir dans une belle collection (200k€)', effects: { budget: -200000, reputation: 8, chance: 0.7 }, consequence: 'Si ça prend, l\'image du club décolle.' },
      { id: 'cheap', text: 'Version économique', effects: { budget: 80000, reputation: -3 }, consequence: 'Les supporters trouvent ça bas de gamme.' },
      { id: 'none', text: 'Pas maintenant', effects: {}, consequence: 'Statu quo. Une occasion manquée, peut-être.' },
    ],
  },
  {
    id: 'prize_money',
    type: 'financial',
    title: 'Prime de la fédération',
    description: 'Le club touche une dotation exceptionnelle. Le président vous laisse décider de son affectation.',
    minMatchday: 9,
    weight: 2,
    choices: [
      { id: 'squad', text: 'Renforcer l\'effectif', effects: { recruit_player: { ageRange: [21, 28], overallRange: [58, 68], morale: 80 }, morale: 6 }, consequence: 'Une recrue arrive pour densifier le groupe.' },
      { id: 'facilities', text: 'Moderniser le centre d\'entraînement', effects: { stamina_boost: 15, morale: 8, reputation: 5 }, consequence: 'Installations flambant neuves, les joueurs récupèrent mieux.' },
      { id: 'save', text: 'Mettre de côté (400k€)', effects: { budget: 400000 }, consequence: 'Trésorerie renforcée pour le mercato.' },
    ],
  },
  {
    id: 'salary_delay',
    type: 'financial',
    title: 'Retard de salaires',
    description: 'La trésorerie est tendue. Les salaires du mois risquent d\'arriver en retard.',
    minMatchday: 10,
    weight: 3,
    when: ctx => ctx.budget < 1500000,
    choices: [
      { id: 'loan', text: 'Contracter un prêt (coût 200k€)', effects: { budget: -200000, morale: 5 }, consequence: 'Tout le monde est payé à l\'heure. Les intérêts feront mal.' },
      { id: 'honest', text: 'Expliquer la situation au groupe', effects: { morale: -10, reputation: 4 }, consequence: 'Transparence appréciée, mais l\'inquiétude s\'installe.' },
      { id: 'sell', text: 'Vendre un joueur pour renflouer', effects: { budget: 900000, morale: -12, remove_player: 'best' }, consequence: 'Les caisses respirent, le groupe est amputé.' },
    ],
  },

  // ============================================================
  // SPORTIF
  // ============================================================
  {
    id: 'youth_talent',
    type: 'sporting',
    title: 'Pépite du centre de formation',
    description: 'Un jeune de 16 ans impressionne à l\'entraînement. Plusieurs clubs pros le surveillent.',
    minMatchday: 6,
    choices: [
      { id: 'promote', text: 'L\'intégrer au groupe pro', effects: { morale: 5, reputation: 5, recruit_player: { ageRange: [16, 17], overallRange: [48, 58], morale: 90 } }, consequence: 'Le jeune est motivé et le vestiaire l\'accueille bien.' },
      { id: 'sell', text: 'Le vendre maintenant (400k€)', effects: { budget: 400000, morale: -3, reputation: -3 }, consequence: 'L\'argent est là mais les supporters grognent.' },
      { id: 'loan', text: 'Le prêter un an puis le récupérer (150k€ d\'indemnité)', effects: { reputation: 3, budget: 150000, recruit_player: { ageRange: [18, 19], overallRange: [58, 66], morale: 85 } }, consequence: 'Sage décision : une saison de temps de jeu ailleurs, et il revient aguerri.' },
    ],
  },
  {
    id: 'rival_poach',
    type: 'sporting',
    title: 'Offre d\'un rival',
    description: 'Un club rival propose de racheter votre capitaine pour 2M€. Le joueur hésite.',
    minMatchday: 12,
    choices: [
      { id: 'sell', text: 'Accepter l\'offre (2M€)', effects: { budget: 2000000, morale: -12, reputation: -5, remove_player: 'captain' }, consequence: 'L\'argent afflue mais le vestiaire est sous le choc.' },
      { id: 'refuse', text: 'Refuser catégoriquement', effects: { morale: 8, reputation: 3 }, consequence: 'Le capitaine est touché par votre loyauté.' },
      { id: 'negotiate', text: 'Demander plus (3.5M€ ou rien)', effects: { budget: 3500000, morale: -8, reputation: -3, chance: 0.4, remove_player: 'captain' }, consequence: 'Ils refusent dans 60% des cas. Si ça passe, gros jackpot.' },
    ],
  },
  {
    id: 'injured_veteran',
    type: 'sporting',
    title: 'Vétéran blessé',
    description: 'Votre joueur le plus expérimenté se blesse au genou. Le médecin propose plusieurs options.',
    minMatchday: 5,
    choices: [
      { id: 'surgery', text: 'Opération : convalescence longue', effects: { morale: -5, drain_player: { target: 'oldest', stamina: 0 } }, consequence: 'Il est à zéro physiquement et mettra plusieurs journées à revenir.' },
      { id: 'quick_fix', text: 'Traitement rapide : il revient vite mais diminué', effects: { morale: -2, drain_player: { target: 'oldest', stamina: 35 } }, consequence: 'Il rejoue bientôt, mais loin de son meilleur niveau.' },
      { id: 'retire', text: 'Lui proposer de raccrocher', effects: { morale: -10, budget: 100000, reputation: -3, remove_player: 'oldest' }, consequence: 'Triste fin de carrière. Les vétérans du vestiaire sont affectés.' },
    ],
  },
  {
    id: 'doping_suspicion',
    type: 'moral',
    title: 'Soupçon de dopage',
    description: 'Un contrôle anti-dopage inopiné est annoncé. Un de vos joueurs vous avoue prendre des compléments douteux.',
    minMatchday: 8,
    choices: [
      { id: 'report', text: 'Signaler le joueur à la fédération', effects: { morale: -8, reputation: 15, remove_player: 'random' }, consequence: 'Intégrité irréprochable : le joueur est suspendu et quitte l\'effectif.' },
      { id: 'cover', text: 'Le couvrir et espérer que ça passe', effects: { reputation: -20, chance: 0.5 }, consequence: '50% de chance d\'être pris. Si découvert : -20 rep en plus.' },
      { id: 'substitute', text: 'Le mettre "blessé" discrètement', effects: { morale: -3, reputation: -5 }, consequence: 'Pas de scandale, mais un malaise persiste.' },
    ],
  },
  {
    id: 'free_agent',
    type: 'sporting',
    title: 'Joueur libre sur le marché',
    description: 'Un joueur expérimenté est sans club après une rupture de contrat. Son agent vous appelle.',
    minMatchday: 4,
    weight: 2,
    choices: [
      { id: 'sign', text: 'Le recruter immédiatement', effects: { recruit_player: { ageRange: [29, 34], overallRange: [62, 72], morale: 75 }, morale: 4 }, consequence: 'Un renfort d\'expérience arrive gratuitement.' },
      { id: 'trial', text: 'Le tester une semaine avant de décider', effects: { recruit_player: { ageRange: [29, 34], overallRange: [64, 74], morale: 70 }, budget: -60000 }, consequence: 'L\'essai est concluant, vous signez en connaissance de cause.' },
      { id: 'pass', text: 'Décliner, l\'effectif est suffisant', effects: { morale: 2 }, consequence: 'Le groupe apprécie la stabilité.' },
    ],
  },
  {
    id: 'scout_report',
    type: 'sporting',
    title: 'Rapport de votre recruteur',
    description: 'Votre recruteur a repéré un joueur intéressant dans une division inférieure.',
    minMatchday: 7,
    weight: 2,
    choices: [
      { id: 'sign', text: 'Le faire venir (coût de transfert)', effects: { budget: -350000, recruit_player: { ageRange: [20, 25], overallRange: [58, 68], morale: 85 } }, consequence: 'Le pari est lancé : il rejoint le groupe.' },
      { id: 'watch', text: 'Continuer à l\'observer', effects: { reputation: 2 }, consequence: 'Prudence. Vous le garderez à l\'œil.' },
      { id: 'ignore', text: 'Ignorer, priorité au groupe actuel', effects: { morale: 3 }, consequence: 'Vos joueurs apprécient qu\'on ne cherche pas ailleurs.' },
    ],
  },
  {
    id: 'tactical_leak',
    type: 'sporting',
    title: 'Fuite tactique',
    description: 'Vos consignes pour le prochain match ont fuité dans la presse. Quelqu\'un a parlé.',
    minMatchday: 9,
    weight: 2,
    choices: [
      { id: 'investigate', text: 'Mener l\'enquête en interne', effects: { morale: -8, reputation: 4 }, consequence: 'Ambiance de suspicion, mais la fuite est colmatée.' },
      { id: 'change', text: 'Tout changer au dernier moment', effects: { morale: -4, stamina_boost: -5, reputation: 6 }, consequence: 'L\'adversaire est pris à contre-pied. Le groupe a improvisé.' },
      { id: 'shrug', text: 'S\'en moquer publiquement', effects: { morale: 6, reputation: -4 }, consequence: 'Vous dédramatisez. Le vestiaire respire.' },
    ],
  },
  {
    id: 'winning_run',
    type: 'sporting',
    title: 'Série en cours',
    description: 'L\'équipe enchaîne les bons résultats. La presse s\'emballe et parle déjà de titre.',
    minMatchday: 6,
    weight: 4,
    when: ctx => ctx.streak.type === 'win' && ctx.streak.count >= 3,
    choices: [
      { id: 'humble', text: 'Calmer tout le monde', effects: { morale: -2, reputation: 6, stamina_boost: 5 }, consequence: 'Pieds sur terre. Le groupe reste concentré.' },
      { id: 'ride', text: 'Surfer sur la vague', effects: { morale: 14, reputation: -2 }, consequence: 'Confiance maximale, quitte à s\'enflammer un peu.' },
      { id: 'bonus', text: 'Prime collective pour entretenir la dynamique', effects: { budget: -250000, morale: 18 }, consequence: 'Le groupe est galvanisé.' },
    ],
  },
  {
    id: 'losing_run',
    type: 'sporting',
    title: 'Série noire',
    description: 'Les défaites s\'enchaînent. La confiance s\'effrite et les critiques pleuvent.',
    minMatchday: 6,
    weight: 4,
    when: ctx => ctx.streak.type === 'loss' && ctx.streak.count >= 3,
    choices: [
      { id: 'seminar', text: 'Organiser un séminaire de cohésion (180k€)', effects: { budget: -180000, morale: 16, stamina_boost: -5 }, consequence: 'Le groupe se reconstruit loin du terrain.' },
      { id: 'shock', text: 'Électrochoc : entraînement au petit matin', effects: { morale: -8, stamina_boost: -10, reputation: 5 }, consequence: 'Méthode brutale. Certains apprécient, d\'autres non.' },
      { id: 'protect', text: 'Assumer publiquement toute la responsabilité', effects: { morale: 14, reputation: -8 }, consequence: 'Vous prenez les coups à leur place. Ils vous le rendront.' },
    ],
  },

  // ============================================================
  // CLUB / INFRASTRUCTURE
  // ============================================================
  {
    id: 'stadium_issue',
    type: 'club',
    title: 'Pelouse en mauvais état',
    description: 'La pelouse du stade est dans un état lamentable. Cela affecte le jeu de votre équipe.',
    minMatchday: 2,
    choices: [
      { id: 'repair', text: 'Refaire la pelouse (200k€)', effects: { budget: -200000, morale: 5, stamina_boost: 5 }, consequence: 'Pelouse impeccable, vos joueurs peuvent exprimer leur jeu.' },
      { id: 'nothing', text: 'Jouer avec', effects: { morale: -3 }, consequence: 'Les joueurs se plaignent, les blessures menacent.' },
      { id: 'synthetic', text: 'Passer en synthétique (500k€)', effects: { budget: -500000, morale: 3, stamina_boost: 10, reputation: -5 }, consequence: 'Plus de problèmes d\'entretien, mais les puristes râlent.' },
    ],
  },
  {
    id: 'bus_breakdown',
    type: 'club',
    title: 'Panne du bus',
    description: 'Le bus du club rend l\'âme la veille d\'un déplacement à l\'autre bout de la région.',
    minMatchday: 3,
    choices: [
      { id: 'rent', text: 'Louer un car confortable (80k€)', effects: { budget: -80000, stamina_boost: 5, morale: 4 }, consequence: 'Voyage serein, joueurs frais à l\'arrivée.' },
      { id: 'cars', text: 'Covoiturage avec les voitures de chacun', effects: { morale: -6, stamina_boost: -8 }, consequence: 'Arrivée dispersée et fatiguée. Peu professionnel.' },
      { id: 'buy', text: 'Investir dans un nouveau bus (450k€)', effects: { budget: -450000, stamina_boost: 8, morale: 8, reputation: 4 }, consequence: 'Investissement durable, le club gagne en crédibilité.' },
    ],
  },
  {
    id: 'floodlight_failure',
    type: 'club',
    title: 'Éclairage défaillant',
    description: 'Les projecteurs du stade lâchent. Le prochain match à domicile est menacé de report.',
    minMatchday: 4,
    choices: [
      { id: 'fix', text: 'Réparation en urgence (150k€)', effects: { budget: -150000, reputation: 3 }, consequence: 'Le match se joue normalement.' },
      { id: 'move', text: 'Délocaliser le match', effects: { morale: -8, reputation: -6 }, consequence: 'Jouer loin de ses supporters, ça se paye.' },
      { id: 'afternoon', text: 'Négocier un horaire en plein jour', effects: { reputation: -2, morale: 3 }, consequence: 'Solution pragmatique et gratuite.' },
    ],
  },
  {
    id: 'academy_investment',
    type: 'club',
    title: 'Avenir du centre de formation',
    description: 'Le président vous demande votre avis sur l\'avenir du centre de formation.',
    minMatchday: 11,
    weight: 2,
    choices: [
      { id: 'invest', text: 'Investir massivement (600k€)', effects: { budget: -600000, reputation: 12, recruit_player: { ageRange: [16, 18], overallRange: [52, 62], morale: 90 } }, consequence: 'Vision long terme saluée. Un premier jeune sort déjà du lot.' },
      { id: 'maintain', text: 'Maintenir le budget actuel', effects: { reputation: 2 }, consequence: 'Continuité, sans éclat.' },
      { id: 'close', text: 'Réduire et se concentrer sur le pro (300k€ économisés)', effects: { budget: 300000, reputation: -12, morale: -5 }, consequence: 'Les caisses respirent, l\'image du club en souffre.' },
    ],
  },
  {
    id: 'weather_chaos',
    type: 'club',
    title: 'Intempéries',
    description: 'Des pluies torrentielles rendent les terrains d\'entraînement impraticables pour une semaine.',
    minMatchday: 3,
    choices: [
      { id: 'gym', text: 'Basculer en salle et travail vidéo', effects: { stamina_boost: 5, morale: 2 }, consequence: 'Semaine studieuse, physiquement préservée.' },
      { id: 'rent', text: 'Louer un complexe couvert (120k€)', effects: { budget: -120000, morale: 8, stamina_boost: 8 }, consequence: 'Préparation quasi normale malgré le déluge.' },
      { id: 'outside', text: 'S\'entraîner dehors quand même', effects: { stamina_boost: -12, morale: -6, reputation: 4 }, consequence: 'Séances héroïques dans la boue. Les corps encaissent mal.' },
    ],
  },

  // ============================================================
  // SUPPORTERS / MÉDIAS / DIRECTION
  // ============================================================
  {
    id: 'fan_protest',
    type: 'moral',
    title: 'Colère des supporters',
    description: 'Après plusieurs mauvais résultats, les supporters organisent une manifestation devant le stade.',
    minMatchday: 8,
    weight: 3,
    when: ctx => ctx.isLosing,
    choices: [
      { id: 'meet_fans', text: 'Aller à leur rencontre', effects: { morale: -3, reputation: 8 }, consequence: 'Votre courage force le respect, la pression retombe.' },
      { id: 'hide', text: 'Ignorer et rester concentré', effects: { morale: -8, reputation: -5 }, consequence: 'Les supporters se sentent méprisés.' },
      { id: 'promise', text: 'Promettre un recrutement (500k€)', effects: { budget: -500000, morale: 5, reputation: 5, recruit_player: { ageRange: [22, 29], overallRange: [60, 68], morale: 80 } }, consequence: 'Vous tenez parole : une recrue arrive et l\'espoir renaît.' },
    ],
  },
  {
    id: 'charity_match',
    type: 'moral',
    title: 'Match caritatif',
    description: 'Une association locale vous demande d\'organiser un match caritatif pendant la trêve.',
    minMatchday: 10,
    choices: [
      { id: 'accept', text: 'Accepter avec enthousiasme', effects: { morale: 5, reputation: 10, stamina_boost: -5 }, consequence: 'Belle image pour le club, mais les joueurs sont un peu fatigués.' },
      { id: 'refuse', text: 'Décliner, priorité au championnat', effects: { morale: -2, reputation: -5 }, consequence: 'Pragmatique mais mal perçu.' },
      { id: 'donate', text: 'Refuser le match mais faire un don (150k€)', effects: { budget: -150000, reputation: 8 }, consequence: 'Généreux sans risquer la forme physique.' },
    ],
  },
  {
    id: 'ultras_demand',
    type: 'moral',
    title: 'Les ultras réclament un entretien',
    description: 'Le groupe de supporters le plus fervent veut discuter du projet sportif. Le ton pourrait monter.',
    minMatchday: 7,
    weight: 2,
    choices: [
      { id: 'meet', text: 'Les recevoir personnellement', effects: { reputation: 8, morale: 4 }, consequence: 'Dialogue franc mais respectueux. Ils repartent rassurés.' },
      { id: 'delegate', text: 'Envoyer un dirigeant à votre place', effects: { reputation: -4 }, consequence: 'Ils prennent ça pour du mépris.' },
      { id: 'invite', text: 'Les inviter à une séance à huis clos', effects: { reputation: 10, morale: 8, budget: -40000 }, consequence: 'Geste fort : ils deviennent vos meilleurs relais.' },
    ],
  },
  {
    id: 'president_pressure',
    type: 'moral',
    title: 'Le président s\'impatiente',
    description: 'Le président vous convoque : les résultats ne sont pas au niveau de ses attentes.',
    minMatchday: 12,
    weight: 4,
    when: ctx => ctx.isLosing,
    choices: [
      { id: 'defend', text: 'Défendre votre projet, chiffres en main', effects: { reputation: 8, morale: 4 }, consequence: 'Il vous accorde du temps supplémentaire.' },
      { id: 'promise', text: 'Promettre des résultats immédiats', effects: { reputation: -4, morale: -6 }, consequence: 'Vous gagnez du répit, sous forte pression.' },
      { id: 'resources', text: 'Exiger des moyens supplémentaires', effects: { budget: 600000, reputation: -6, chance: 0.6 }, consequence: 'Bras de fer risqué : 40% de chances qu\'il le prenne mal.' },
    ],
  },
  {
    id: 'tv_documentary',
    type: 'moral',
    title: 'Caméras dans le vestiaire',
    description: 'Une chaîne veut tourner un documentaire sur le club pendant un mois.',
    minMatchday: 9,
    weight: 2,
    choices: [
      { id: 'accept', text: 'Ouvrir les portes (200k€ de droits)', effects: { budget: 200000, reputation: 10, morale: -8 }, consequence: 'Belle vitrine, mais les joueurs se sentent épiés.' },
      { id: 'refuse', text: 'Refuser, le vestiaire est sacré', effects: { morale: 10, reputation: -4 }, consequence: 'Le groupe vous remercie de le protéger.' },
      { id: 'partial', text: 'Accepter, sauf le vestiaire', effects: { budget: 100000, reputation: 5, morale: 2 }, consequence: 'Bon équilibre entre exposition et intimité.' },
    ],
  },
  {
    id: 'referee_controversy',
    type: 'moral',
    title: 'Polémique arbitrale',
    description: 'Une décision litigieuse a coûté des points. Les micros vous tendent la perche.',
    minMatchday: 5,
    weight: 2,
    when: ctx => ctx.streak.type === 'loss',
    choices: [
      { id: 'attack', text: 'Dénoncer publiquement l\'arbitrage', effects: { morale: 10, reputation: -10 }, consequence: 'Le vestiaire vous adore, la fédération beaucoup moins.' },
      { id: 'calm', text: 'Rester mesuré', effects: { reputation: 8, morale: -2 }, consequence: 'Attitude saluée par tous les observateurs.' },
      { id: 'selfcrit', text: 'Pointer vos propres erreurs', effects: { reputation: 5, morale: -6 }, consequence: 'Lucidité rare, mais le groupe encaisse mal.' },
    ],
  },
  {
    id: 'derby_week',
    type: 'sporting',
    title: 'Semaine de derby',
    description: 'Le derby approche. La ville ne parle que de ça et la pression monte d\'un cran.',
    minMatchday: 8,
    weight: 2,
    choices: [
      { id: 'hype', text: 'Entretenir la ferveur avec les supporters', effects: { morale: 12, stamina_boost: -4, reputation: 4 }, consequence: 'Stade en fusion garanti.' },
      { id: 'isolate', text: 'Mise au vert loin de l\'agitation (100k€)', effects: { budget: -100000, morale: 6, stamina_boost: 8 }, consequence: 'Groupe concentré et reposé.' },
      { id: 'normal', text: 'Traiter ça comme un match ordinaire', effects: { morale: -4, reputation: 2 }, consequence: 'Difficile à faire avaler à un vestiaire chauffé à blanc.' },
    ],
  },
  {
    id: 'award_nomination',
    type: 'moral',
    title: 'Nomination pour un trophée',
    description: 'Vous êtes nommé entraîneur du mois. La cérémonie tombe la veille d\'un match.',
    minMatchday: 10,
    weight: 2,
    when: ctx => !ctx.isLosing,
    choices: [
      { id: 'attend', text: 'S\'y rendre', effects: { reputation: 10, morale: 4, stamina_boost: -3 }, consequence: 'Reconnaissance méritée, préparation légèrement bousculée.' },
      { id: 'skip', text: 'Décliner, priorité au terrain', effects: { reputation: -3, morale: 8 }, consequence: 'Le groupe apprécie que le collectif passe avant.' },
      { id: 'dedicate', text: 'Y aller et dédier le trophée aux joueurs', effects: { reputation: 8, morale: 12, stamina_boost: -3 }, consequence: 'Le vestiaire est touché par le geste.' },
    ],
  },
];

/**
 * Contexte transmis aux prédicats `when`.
 * Tolérant aux champs manquants pour rester utilisable partout.
 */
function buildEventContext({ matchday = 1, team = {}, rank = null, totalTeams = null, isLosing = false, budget = 0, squadSize = 0, recentMatches = [] } = {}) {
  let streak = { type: 'none', count: 0 };
  for (const m of recentMatches) {
    if (!m || !m.outcome) break;
    if (streak.count === 0) streak = { type: m.outcome, count: 1 };
    else if (m.outcome === streak.type) streak.count++;
    else break;
  }

  return {
    matchday,
    team,
    rank,
    totalTeams,
    isLosing,
    isLeading: rank !== null && rank <= 2,
    budget,
    squadSize,
    division: team.division || 1,
    season: team.season || 1,
    wins: team.wins || 0,
    draws: team.draws || 0,
    losses: team.losses || 0,
    goalsFor: team.goals_for || 0,
    goalsAgainst: team.goals_against || 0,
    streak,
  };
}

/**
 * Tire un événement, pondéré : les événements contextuels (série en cours,
 * pression du président, trésorerie basse) passent devant les génériques.
 * Renvoie null la plupart du temps : environ 12% de chance par journée.
 */
function getRandomEvent(matchdayOrCtx, isLosingLegacy = false) {
  // Compatibilité : ancien appel getRandomEvent(matchday, isLosing)
  const ctx = typeof matchdayOrCtx === 'object' && matchdayOrCtx !== null
    ? matchdayOrCtx
    : buildEventContext({ matchday: matchdayOrCtx, isLosing: isLosingLegacy });

  const eligible = EVENTS.filter(e => {
    if (e.minMatchday > ctx.matchday) return false;
    if (typeof e.when === 'function') {
      try { return e.when(ctx); } catch { return false; }
    }
    return true;
  });

  if (eligible.length === 0) return null;
  if (Math.random() > 0.12) return null;

  const total = eligible.reduce((s, e) => s + (e.weight || 1), 0);
  let roll = Math.random() * total;
  for (const e of eligible) {
    roll -= e.weight || 1;
    if (roll <= 0) return e;
  }
  return eligible[eligible.length - 1];
}

module.exports = { EVENTS, getRandomEvent, buildEventContext };
