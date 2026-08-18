/**
 * Textes français servis par l'API. Langue de référence.
 *
 * Toute clé absente d'une autre langue retombe ici (voir `t` dans
 * server/i18n/index.js) : ce fichier doit donc rester complet, et ses valeurs
 * reprendre EXACTEMENT ce que les routes renvoyaient auparavant en dur.
 * Le moindre écart changerait le comportement en français, ce qui est proscrit.
 *
 * Les variables sont notées {nom} et remplacées par `t(cle, langue, vars)`.
 *
 * Deux détails de forme qui peuvent surprendre et qui sont volontaires :
 *   - les messages de la Champions League sont SANS ACCENT, parce que le code
 *     d'origine les écrivait ainsi ; les corriger modifierait l'affichage ;
 *   - le singulier et le pluriel ont chacun leur clé, faute de mécanisme de
 *     pluralisation, afin de reproduire les `${n > 1 ? 's' : ''}` d'origine.
 */

module.exports = {
  erreur: {
    // ---- Entités introuvables ----
    equipeIntrouvable: 'Équipe non trouvée',
    managerIntrouvable: 'Manager non trouvé',
    joueurIntrouvable: 'Joueur non trouvé',
    sponsorIntrouvable: 'Sponsor non trouvé',
    evenementIntrouvable: 'Événement non trouvé',
    conversationIntrouvable: 'Conversation non trouvée',
    classementJoueurIntrouvable: 'Joueur introuvable',
    pasEncoreEquipe: "Pas encore d'équipe",

    // ---- Compte et sauvegarde ----
    pseudoRequis: 'Pseudo requis (min 2 caractères)',
    sauvegardeInvalide: 'Sauvegarde invalide',
    equipeDejaCreee: 'Vous avez déjà une équipe',

    // ---- Composition ----
    formationInvalide: 'Formation invalide',
    compositionManquante: 'Composition manquante',
    compositionEmplacements: 'La composition doit contenir {nombre} emplacements',
    titulairesRequis: 'Exactement 11 titulaires requis (actuellement {nombre})',
    joueurDeuxEmplacements: 'Un joueur ne peut occuper deux emplacements',
    joueurHorsEffectif: "Un joueur sélectionné n'appartient pas à l'équipe",
    joueurIndisponible: 'Joueur indisponible : {liste}',
    joueursIndisponibles: 'Joueurs indisponibles : {liste}',

    // ---- Effectif et mercato ----
    budgetInsuffisant: 'Budget insuffisant',
    joueurPasBlesse: "Ce joueur n'est pas blessé",
    effectifMaximum: 'Effectif maximum atteint ({nombre} joueurs)',
    effectifMinimum: 'Effectif minimum requis ({nombre} joueurs)',
    joueurPasAVous: 'Ce joueur ne vous appartient pas',
    minimumOnzeJoueurs: 'Il faut au minimum 11 joueurs (vous en avez {nombre})',

    // ---- Championnat ----
    saisonTerminee: 'Saison terminée ! Allez au mercato.',
    composeEquipe: "Composez votre équipe (11 titulaires) dans l'onglet Compo avant de jouer !",
    pasDadversairesDivision: "Pas d'adversaires dans cette division",
    pasDadversairesDisponibles: "Pas d'adversaires disponibles",

    // ---- Événements, dialogues et gestion ----
    choixInvalide: 'Choix invalide',
    actionInvalide: 'Action invalide',
    actionInconnue: 'Action inconnue',
    entrainementCooldown: 'Entrainement intensif en cooldown (attendre 3 journées)',

    // ---- Dream team ----
    joueursMinimumRequis: 'Au moins 11 joueurs requis',
    joueursMinimumRequisEquipe: 'Au moins 11 joueurs requis pour votre equipe',
    equipeAdverseInvalide: 'Equipe adverse invalide',

    /**
     * Paramètres d'API manquants. Les noms de champs (managerId, teamId…) sont
     * des identifiants techniques : ils restent identiques dans toutes les
     * langues, seule la formulation autour est traduite.
     */
    requis: {
      managerId: 'managerId requis',
      teamId: 'teamId requis',
      managerIdTeamName: 'managerId et teamName requis',
      eventChoiceManager: 'eventId, choiceId et managerId requis',
      conversationChoicePlayer: 'conversationId, choiceId et playerId requis',
      actionManager: 'actionId et managerId requis',
      sponsorManager: 'sponsorId et managerId requis',
      playerTeamManager: 'playerId, teamId et managerId requis',
      playerManager: 'playerId et managerId requis',
      managerTeamPlayer: 'managerId, teamId et player requis',
      managerTeam: 'managerId et teamId requis',
      dreamteamCarriere: 'username, teamName et au moins 11 joueurs requis',
    },

    coupe: {
      dejaRemportee: 'Vous avez déjà remporté la coupe cette saison',
      elimine: 'Vous êtes éliminé de la coupe cette saison',
      aucunTour: 'Aucun tour à disputer',
      tourIndisponible: '{tour} : disputable à partir de la journée {journee} (vous en êtes à {actuelle})',
      composeEquipe: 'Composez votre équipe ({titulaires} titulaires) avant de jouer la coupe !',
    },

    cl: {
      equipeIntrouvable: 'Equipe non trouvee',
      reserveeLigue1: 'La Champions League est accessible uniquement en Ligue 1 (division 7)',
      dejaEnCours: 'Champions League deja en cours',
      nonAccessible: 'Champions League non accessible',
      nonInitialisee: "Champions League non initialisee. Utilisez /cl/init d'abord.",
      dejaElimine: 'Vous avez ete elimine de la Champions League cette saison.',
      dejaRemportee: 'Vous avez deja remporte la Champions League cette saison !',
      pasDeMatchKnockout: 'Pas de match knockout en attente.',
    },
  },

  equipe: {
    entrainementTermine: 'Entraînement terminé !',
  },

  /**
   * Libellés de résultat de championnat.
   *
   * Attention : le champ `resultText` renvoyé par l'API garde ces valeurs
   * françaises, le client s'en servant pour composer un nom de classe CSS
   * (.result-tag.victoire / .match-nul / .défaite). La traduction voyage dans
   * un champ séparé, `resultLabel`.
   */
  match: {
    victoire: 'Victoire',
    nul: 'Match nul',
    defaite: 'Défaite',
  },

  evenement: {
    pariEchoue: 'Le pari a échoué... Les conséquences sont lourdes.',
    effectifTropCourt:
      "Impossible : avec seulement {nombre} joueurs, vous ne pouvez pas vous séparer de qui que ce soit. L'opération est annulée.",
    arrivee: "{prenom} {nom} ({poste}, {niveau}, {age} ans) rejoint l'effectif.",
    depart: '{prenom} {nom} ({poste}, {niveau}) quitte le club.',
    diminue: '{prenom} {nom} est diminué physiquement.',
  },

  /** Actions de gestion vendues au manager (onglet Gestion). */
  gestion: {
    training: {
      nom: 'Entrainement intensif',
      description: 'Booste le overall de tous les titulaires de +1. Limité à 1 fois par 3 journées.',
      effet: '+1 OVR titulaires',
    },
    cohesion: {
      nom: 'Stage de cohésion',
      description: "Renforce l'esprit d'équipe. +10 moral pour tout l'effectif.",
      effet: '+10 moral (tous)',
    },
    fitness: {
      nom: 'Préparateur physique',
      description: 'Restaure 30 points de stamina pour tous les joueurs.',
      effet: '+30 stamina (tous)',
    },
    scout: {
      nom: 'Recruteur',
      description: 'Améliore votre réseau. +3 réputation permanente.',
      effet: '+3 réputation',
    },
    medical: {
      nom: 'Centre médical',
      description: 'Remet en forme les joueurs fatigués (stamina < 50). Stamina rétablie à 100.',
      effet: '100 stamina (joueurs < 50)',
    },
  },

  coupe: {
    adversaireInconnu: 'Adversaire',

    /** Noms des tours, alignés sur les identifiants de server/data/cup.js. */
    tours: {
      r64: '64es de finale',
      r32: '32es de finale',
      r16: '16es de finale',
      r8: 'Huitièmes de finale',
      qf: 'Quarts de finale',
      sf: 'Demi-finales',
      final: 'Finale',
    },

    /**
     * Variante employée en milieu de phrase (« Éliminé en huitièmes… »).
     * En français elle correspond au `.toLowerCase()` d'origine ; en anglais
     * elle porte l'article, que la minuscule seule ne suffirait pas à produire.
     */
    toursMinuscule: {
      r64: '64es de finale',
      r32: '32es de finale',
      r16: '16es de finale',
      r8: 'huitièmes de finale',
      qf: 'quarts de finale',
      sf: 'demi-finales',
      final: 'finale',
    },

    resultat: {
      nonDisputee: 'Non disputée',
      vainqueur: 'Vainqueur',
      enLiceTour: 'En lice ({tour})',
      enLice: 'En lice',
      elimineTour: 'Éliminé en {tour}',
      elimine: 'Éliminé',
    },
  },

  cl: {
    nonInitialisee:
      'Champions League non initialisee. Jouez un match de championnat pour lancer la phase de groupes.',
    initialisee: 'Champions League initialisee !',
    groupeElimine: "Vous n'avez pas termine dans le top 2 de votre groupe. Elimine !",
    groupeQualifie: 'Phase de groupes terminee ! Vous etes qualifie pour les quarts de finale !',
    pasDeMatch: 'Pas de match cette journee, on avance.',

    // Résultats de la Champions League : « Defaite » est volontairement sans
    // accent, comme dans le code d'origine, ce texte servant aussi de valeur
    // technique côté client.
    victoire: 'Victoire',
    nul: 'Match nul',
    defaite: 'Defaite',
  },

  /** État d'esprit d'un joueur, renvoyé par la route /mood. */
  moral: {
    etat: {
      leaving: 'Demande à partir',
      unhappy: 'Mécontent',
      low: 'Moral bas',
    },
    /** Motifs d'insatisfaction produits par server/engine/morale.js. */
    griefs: {
      moralBas: 'moral au plus bas',
      tempsDeJeu: 'manque de temps de jeu',
      ambition: 'ambition sportive',
      insatisfaction: 'insatisfaction persistante',
    },
  },

  /** Motif d'indisponibilité, affiché quand un joueur ne peut pas être aligné. */
  indisponibilite: {
    suspendu: 'suspendu ({nombre} match)',
    suspendus: 'suspendu ({nombre} matchs)',
    blesse: 'blessé ({nombre} match)',
    blesses: 'blessé ({nombre} matchs)',
  },
};
