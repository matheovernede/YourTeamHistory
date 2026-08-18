/**
 * Traduction anglaise des textes servis par l'API.
 *
 * Structure strictement identique à server/i18n/fr/messages.js : toute clé
 * absente ici retomberait silencieusement sur le français (voir `t` dans
 * server/i18n/index.js), ce qui produirait un affichage mélangé plutôt qu'une
 * erreur visible. Le test de parité des clés est donc la vraie garantie.
 *
 * Anglais britannique et vocabulaire footballistique : squad, matchday,
 * manager, board, transfer window.
 *
 * Les noms de champs d'API (managerId, teamId…) restent tels quels : ce sont
 * des identifiants techniques, pas du texte à traduire.
 */

module.exports = {
  erreur: {
    // ---- Entités introuvables ----
    equipeIntrouvable: 'Team not found',
    managerIntrouvable: 'Manager not found',
    joueurIntrouvable: 'Player not found',
    sponsorIntrouvable: 'Sponsor not found',
    evenementIntrouvable: 'Event not found',
    conversationIntrouvable: 'Conversation not found',
    classementJoueurIntrouvable: 'Manager not found',
    pasEncoreEquipe: 'No club yet',

    // ---- Compte et sauvegarde ----
    pseudoRequis: 'A username is required (2 characters minimum)',
    sauvegardeInvalide: 'Invalid save file',
    equipeDejaCreee: 'You already have a club',

    // ---- Composition ----
    formationInvalide: 'Invalid formation',
    compositionManquante: 'Missing line-up',
    compositionEmplacements: 'The line-up must contain {nombre} slots',
    titulairesRequis: 'Exactly 11 starters required (currently {nombre})',
    joueurDeuxEmplacements: 'A player cannot fill two slots',
    joueurHorsEffectif: 'One of the selected players is not in your squad',
    joueurIndisponible: 'Unavailable player: {liste}',
    joueursIndisponibles: 'Unavailable players: {liste}',

    // ---- Effectif et mercato ----
    budgetInsuffisant: 'Not enough funds',
    effectifMaximum: 'Squad limit reached ({nombre} players)',
    effectifMinimum: 'Minimum squad size required ({nombre} players)',
    joueurPasAVous: 'This player does not belong to you',
    minimumOnzeJoueurs: 'You need at least 11 players (you have {nombre})',

    // ---- Championnat ----
    saisonTerminee: 'Season over! Head to the transfer window.',
    composeEquipe: 'Pick your squad (11 starters) in the Line-up tab before playing!',
    pasDadversairesDivision: 'No opponents in this division',
    pasDadversairesDisponibles: 'No opponents available',

    // ---- Événements, dialogues et gestion ----
    choixInvalide: 'Invalid choice',
    actionInvalide: 'Invalid action',
    actionInconnue: 'Unknown action',
    entrainementCooldown: 'Intensive training is on cooldown (wait 3 matchdays)',

    // ---- Dream team ----
    joueursMinimumRequis: 'At least 11 players required',
    joueursMinimumRequisEquipe: 'At least 11 players required for your team',
    equipeAdverseInvalide: 'Invalid opposition team',

    requis: {
      managerId: 'managerId is required',
      teamId: 'teamId is required',
      managerIdTeamName: 'managerId and teamName are required',
      eventChoiceManager: 'eventId, choiceId and managerId are required',
      conversationChoicePlayer: 'conversationId, choiceId and playerId are required',
      actionManager: 'actionId and managerId are required',
      sponsorManager: 'sponsorId and managerId are required',
      playerTeamManager: 'playerId, teamId and managerId are required',
      playerManager: 'playerId and managerId are required',
      managerTeamPlayer: 'managerId, teamId and player are required',
      managerTeam: 'managerId and teamId are required',
      dreamteamCarriere: 'username, teamName and at least 11 players are required',
    },

    coupe: {
      dejaRemportee: 'You have already won the cup this season',
      elimine: 'You are out of the cup this season',
      aucunTour: 'No round left to play',
      tourIndisponible: '{tour}: playable from matchday {journee} (you are on matchday {actuelle})',
      composeEquipe: 'Pick your squad ({titulaires} starters) before playing the cup!',
    },

    cl: {
      equipeIntrouvable: 'Team not found',
      reserveeLigue1: 'The Champions League is only available in the Premier League (division 7)',
      dejaEnCours: 'Champions League already under way',
      nonAccessible: 'Champions League not available',
      nonInitialisee: 'Champions League not set up. Use /cl/init first.',
      dejaElimine: 'You were knocked out of the Champions League this season.',
      dejaRemportee: 'You have already won the Champions League this season!',
      pasDeMatchKnockout: 'No knockout tie pending.',
    },
  },

  equipe: {
    entrainementTermine: 'Training session complete!',
  },

  match: {
    victoire: 'Win',
    nul: 'Draw',
    defaite: 'Loss',
  },

  evenement: {
    pariEchoue: 'The gamble backfired... the fallout is severe.',
    effectifTropCourt:
      'Not possible: with only {nombre} players you cannot let anyone go. The move is called off.',
    arrivee: '{prenom} {nom} ({poste}, {niveau}, aged {age}) joins the squad.',
    depart: '{prenom} {nom} ({poste}, {niveau}) leaves the club.',
    diminue: '{prenom} {nom} is physically drained.',
  },

  gestion: {
    training: {
      nom: 'Intensive training',
      description: 'Boosts every starter\u2019s overall by +1. Limited to once every 3 matchdays.',
      effet: '+1 OVR for starters',
    },
    cohesion: {
      nom: 'Team-bonding camp',
      description: 'Strengthens team spirit. +10 morale for the whole squad.',
      effet: '+10 morale (everyone)',
    },
    fitness: {
      nom: 'Fitness coach',
      description: 'Restores 30 stamina points for every player.',
      effet: '+30 stamina (everyone)',
    },
    scout: {
      nom: 'Chief scout',
      description: 'Improves your network. +3 permanent reputation.',
      effet: '+3 reputation',
    },
    medical: {
      nom: 'Medical centre',
      description: 'Gets tired players back to full fitness (stamina < 50). Stamina restored to 100.',
      effet: '100 stamina (players below 50)',
    },
  },

  coupe: {
    adversaireInconnu: 'Opponent',

    // Équivalences anglaises des tours français : « 64es de finale » désigne
    // le tour à 128 équipes, d'où le décalage apparent des libellés.
    tours: {
      r64: 'Round of 128',
      r32: 'Round of 64',
      r16: 'Round of 32',
      r8: 'Round of 16',
      qf: 'Quarter-finals',
      sf: 'Semi-finals',
      final: 'Final',
    },

    // Variante de milieu de phrase : l'anglais réclame l'article défini
    // (« Knocked out in the round of 16 »), là où le français se contente
    // d'une minuscule.
    toursMinuscule: {
      r64: 'the round of 128',
      r32: 'the round of 64',
      r16: 'the round of 32',
      r8: 'the round of 16',
      qf: 'the quarter-finals',
      sf: 'the semi-finals',
      final: 'the final',
    },

    resultat: {
      nonDisputee: 'Not entered',
      vainqueur: 'Winners',
      enLiceTour: 'Still in ({tour})',
      enLice: 'Still in',
      elimineTour: 'Knocked out in {tour}',
      elimine: 'Knocked out',
    },
  },

  cl: {
    nonInitialisee:
      'Champions League not set up. Play a league match to start the group stage.',
    initialisee: 'Champions League set up!',
    groupeElimine: 'You did not finish in the top 2 of your group. Knocked out!',
    groupeQualifie: 'Group stage complete! You have qualified for the quarter-finals!',
    pasDeMatch: 'No match this matchday, moving on.',

    victoire: 'Win',
    nul: 'Draw',
    defaite: 'Loss',
  },

  moral: {
    etat: {
      leaving: 'Wants to leave',
      unhappy: 'Unhappy',
      low: 'Low morale',
    },
    griefs: {
      moralBas: 'morale at rock bottom',
      tempsDeJeu: 'lack of game time',
      ambition: 'sporting ambition',
      insatisfaction: 'lingering dissatisfaction',
    },
  },

  indisponibilite: {
    suspendu: 'suspended ({nombre} match)',
    suspendus: 'suspended ({nombre} matches)',
    blesse: 'injured ({nombre} match)',
    blesses: 'injured ({nombre} matches)',
  },
};
