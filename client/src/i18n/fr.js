/**
 * Textes français. Langue de référence : toute clé absente d'une autre langue
 * retombe ici, ce qui évite d'afficher un identifiant brut à l'écran.
 */
export default {
  langue: {
    nom: 'Français',
    changer: 'Changer la langue',
  },

  accueil: {
    slogan: 'Recrutez votre équipe, disputez des matchs, grimpez au classement.',
    atouts: {
      divisions: '<b>7 divisions</b> à gravir, de Régional 2 à la Ligue 1',
      mercato: '<b>Mercato</b> entre chaque saison, 26 journées par exercice',
      evenements: '<b>Sponsors & événements</b> aux conséquences cachées',
      dreamteam: '<b>DreamTeam</b> : 200 joueurs réels en mode bac à sable',
    },
    titreConnexion: 'Prenez les commandes',
    sousTitreConnexion: 'Connectez-vous ou reprenez une sauvegarde.',
    titreEquipe: 'Créez votre club',
    sousTitreEquipe: 'Choisissez un nom et votre niveau de défi.',
    pseudo: 'Votre pseudo',
    pseudoExemple: 'Entrez votre pseudo...',
    jouer: 'Jouer',
    connexion: 'Connexion...',
    ou: 'ou',
    chargerSauvegarde: '📂 Charger une sauvegarde',
    sauvegardeInvalide: 'Fichier de sauvegarde invalide',
    dreamteam: 'DreamTeam',
    classementManagers: '🏅 Classement des managers',
    discord: '💬 Rejoindre le Discord',
    kofi: '☕ Ce jeu vous plaît ? Soutenez son développement',
    bienvenue: 'Bienvenue {nom} ! Nommez votre équipe :',
    nomEquipeExemple: 'Ex: FC Tempête...',
    difficulte: 'Difficulté :',
    facile: 'Facile',
    facileDesc: 'IA affaiblie, budget +50%',
    normal: 'Normal',
    normalDesc: 'Expérience équilibrée',
    difficile: 'Difficile',
    difficileDesc: 'IA boostée, budget -30%',
    creation: 'Création...',
    commencerMercato: 'Commencer le mercato',
  },

  dialogues: {
    pseudoCarriere: 'Entrez votre pseudo pour la carrière :',
    nomEquipe: 'Nom de votre équipe :',
    erreurCarriere: 'Impossible de lancer la carrière',
    erreur: 'Erreur : ',
    confirmerNouvelleCarriere: 'Commencer une nouvelle carrière ? Votre progression sera perdue.',
    erreurChargement: 'Erreur lors du chargement de la sauvegarde',
    sauvegardeInvalide: 'Fichier de sauvegarde invalide',
  },

  bilan: {
    titre: 'Bilan Saison {saison} — {division}',
    promotion: '🎉 PROMOTION → {division}',
    relegation: '📉 Relégation → {division}',
    points: '{n} pts',
    prime: 'Prime : +{montant}M€',
    draftInitial: 'Draft initial',
    mercato: 'Mercato',
  },

  barre: {
    discordTitre: 'Rejoindre le serveur Discord du jeu',
    kofiTitre: 'Soutenir le développement du jeu sur Ko-fi',
    budget: 'Budget',
    reputation: 'Réputation',
    saison: 'Saison',
    managers: '🏅 Managers',
    dreamteam: '⭐ DreamTeam',
    discord: '💬 Discord',
    soutenir: '☕ Soutenir',
    nouvelleCarriere: 'Nouvelle carrière',
    exporter: 'Exporter la sauvegarde',
    importer: 'Importer une sauvegarde',
  },

  credits: {
    musique: 'soundtrack by FufuNoir :',
  },

  // ---------------------------------------------------------------- commun

  commun: {
    chargement: 'Chargement...',
    chargementPoints: 'Chargement.',
    retour: ' Retour',
    fermer: 'Fermer',
    erreur: 'Erreur: {message}',
    // Initiales de victoire / nul / défaite, accolées au nombre : « 12V 4N 3D ».
    v: 'V',
    n: 'N',
    d: 'D',
  },

  /** Fiche joueur (composant partagé). */
  joueur: {
    age: '{n} ans',
    forme: 'Forme',
    moral: 'Moral',
    stats: {
      pac: 'PAC',
      tir: 'TIR',
      pas: 'PAS',
      dri: 'DRI',
      def: 'DEF',
      phy: 'PHY',
    },
  },

  // ---------------------------------------------------------------- musique

  musique: {
    lecture: 'Lecture',
    pause: 'Pause',
    precedente: 'Piste précédente',
    suivante: 'Piste suivante',
    piste: 'Piste {n} sur {total} — cliquer pour choisir',
    volume: 'Volume {n}%',
  },

  // ------------------------------------------------------------- navigation

  navigation: {
    effectif: 'Effectif',
    match: 'Match',
    transferts: 'Transferts',
    classement: 'Classement',
    nouvelleCarriere: '🔄 Nouvelle carrière',
  },

  // ---------------------------------------------------------------- mercato

  mercato: {
    chargement: 'Chargement du mercato...',
    autoComposer: '⚡ Composer mon équipe',
    autoResultat: '{n} joueurs recrutés pour {montant}. Vous pouvez ajuster, puis valider.',
    autoRien: 'Rien à recruter : votre effectif est déjà au complet.',
    titreHiver: "Mercato d'hiver",
    sousTitreHiver: "Marché restreint et prix majorés : on ne reconstruit pas une équipe en janvier",
    reprendreSaison: '⚽ Reprendre la saison',
    titreInitial: 'Mercato Initial',
    titre: 'Mercato',
    sousTitreInitial: 'Recrutez au minimum 11 joueurs pour former votre équipe',
    sousTitre: 'Renforcez votre effectif pour la prochaine saison',
    joueurs: 'joueurs',
    recrue: 'recrue',
    recrues: 'recrues',

    marcheIndisponible: 'Marché indisponible : {message}',
    budgetInsuffisant: 'Budget insuffisant !',
    effectifMaxAtteint: 'Effectif maximum atteint ({max} joueurs). Vendez avant de recruter.',
    recrute: '{joueur} recruté !',
    minimumVente: 'Effectif minimum de {min} joueurs requis pour vendre (vous en avez {n})',
    confirmerVente: 'Vendre {joueur} pour {prix} ?',
    vendu: '{joueur} vendu pour {prix}',
    minimumOnze: 'Il vous faut au minimum 11 joueurs ! ({n}/11)',
    alerteEffectifPlein: 'Effectif au maximum ({n}/{max}) — vendez un joueur avant de pouvoir recruter.',

    ligneManque: '{n} {ligne} — il en est conseillé {conseille} pour tenir une saison',
    ligneOk: '{n} {ligne} — effectif suffisant',
    rafraichir: '🔄 Rafraîchir le marché',
    validerEffectif: '✅ Valider mon effectif',
    terminerMercato: '✅ Terminer le mercato',

    ongletMarche: 'Marché',
    ongletEffectif: 'Mon effectif',

    filtreTous: 'Tous',
    filtreGardiens: 'Gardiens',
    filtreDefenseurs: 'Défenseurs',
    filtreMilieux: 'Milieux',
    filtreAttaquants: 'Attaquants',

    legende: '⭐ Légende',
    effectifPlein: 'Effectif plein ({max} joueurs)',
    recruter: 'Recruter',
    aucunJoueur: 'Aucun joueur disponible dans cette catégorie',

    resumeUn: '{n} joueur · valeur totale {valeur}',
    resumePlusieurs: '{n} joueurs · valeur totale {valeur}',
    triPoste: 'Poste',
    triNote: 'Note',
    triValeur: 'Valeur',
    triAge: 'Âge',
    triNom: 'Nom',

    minimumVenteCourt: 'Effectif minimum de {min} joueurs requis pour vendre',
    vendre: 'Vendre ({prix})',
    effectifVide: "Votre effectif est vide — recrutez dans l'onglet Marché.",
  },

  // ------------------------------------------------------------------ match

  match: {
    titre: 'Jouer un Match',
    saison: 'Saison {n}',
    journee: 'J{n}',
    victoires: '{n}V',
    nuls: '{n}N',
    defaites: '{n}D',
    points: '{n} pts',
    simulation: '⏳ Simulation...',
    jouer: '⚽ Jouer le prochain match',
    domicile: 'À domicile',
    exterieur: "À l'extérieur",
    victoire: 'Victoire ! +3 pts',
    nul: 'Match nul +1 pt',
    defaite: 'Défaite',
    historique: '📋 Historique',
    aucunMatch: 'Aucun match joué',
  },

  // --------------------------------------------------------------- managers

  managers: {
    enLigne: 'en ligne',
    jamaisVu: 'jamais vu',
    ilYAMinutes: 'il y a {n} min',
    ilYAHeures: 'il y a {n} h',
    ilYAJours: 'il y a {n} j',

    indisponible: 'Classement indisponible',
    retour: '← Retour',
    titre: 'Classement des managers',
    compteEnLigne: '{n} en ligne',
    totalUn: '{n} manager au total',
    totalPlusieurs: '{n} managers au total',
    aucun: 'Aucun manager pour le moment.',

    colManager: 'Manager',
    colDivision: 'Division',
    colSaison: 'Saison',
    colPlace: 'Place',
    colJoues: 'J',
    colPoints: 'Pts',
    colBilan: 'V-N-D',
    colButs: 'Buts',
    colTitres: 'Titres',
    colActivite: 'Activité',
    titreChampionnats: 'Championnats',
    titreCoupes: 'Coupes',

    chargementFiche: 'Chargement de la fiche…',
    reputation: 'Réputation',
    budget: 'Budget',
    saisons: 'Saisons',
    championnats: 'Championnats',
    coupes: 'Coupes',

    carriere: 'Carrière',
    colCoupe: 'Coupe',
    colResultat: 'Bilan',
    promu: 'Promu',
    relegue: 'Relégué',

    cadres: "Cadres de l'effectif",
    butsEnMatchs: '{buts} buts en {matchs} matchs',
  },

  // --------------------------------------------------------------- dreamteam

  dreamteam: {
    postes: {
      GAR: 'Gardien',
      DC: 'Def. Central',
      ARG: 'Arr. Gauche',
      ARD: 'Arr. Droit',
      MC: 'Milieu',
      MOC: 'Milieu Off.',
      MDF: 'Milieu Def.',
      AIG: 'Ailier Gauche',
      AID: 'Ailier Droit',
      BU: 'Buteur',
    },

    confirmerReset: 'Reinitialiser votre DreamTeam ?',
    retour: 'Retour',

    rechercher: 'Rechercher un joueur...',
    toutesLigues: 'Toutes les ligues',
    tousPostes: 'Tous les postes',
    aucunJoueur: 'Aucun joueur trouve.',

    stats: {
      vit: 'VIT',
      tir: 'TIR',
      pas: 'PAS',
      dri: 'DRI',
      def: 'DEF',
      phy: 'PHY',
    },

    formation: 'Formation:',
    titulaires: 'Titulaires',
    remplacants: 'Remplacants ({n}/7)',
    ajouter: '+ Ajouter',
    statsMoyennes: 'Stats moyennes',

    jouer: 'Jouer',
    carriere: 'Carriere R2',
    amical: 'Match amical',
    championsLeague: 'Champions League',

    choisirDifficulte: "Choisissez la difficulte de l'adversaire :",
    diffFaible: 'Faible (55)',
    diffMoyen: 'Moyen (68)',
    diffFort: 'Fort (78)',
    diffLegende: 'Legende (88)',
    simulation: 'Simulation en cours...',

    victoire: 'Victoire !',
    defaite: 'Defaite...',
    nul: 'Match nul',

    clPresentation: 'Tournoi a 8 equipes : Quarts, Demis, Finale.',
    clTirage: 'Lancer le tirage',
    clQuarts: 'Quarts de finale',
    clDemis: 'Demi-finales',
    clFinale: 'Finale',
    clJouerQuarts: 'Jouer les quarts',
    clJouerDemis: 'Jouer les demis',
    clJouerFinale: 'Jouer la finale',
    clVictoireJoueur: 'Felicitations ! Votre DreamTeam remporte la Champions League !',
    clVictoireAutre: '{equipe} remporte la Champions League.',
  },

  // ----------------------------------------------------------------- saison

  saison: {
    /**
     * Le serveur renvoie le résultat en français : cette chaîne sert aussi
     * d'identifiant technique (classe CSS), seul son affichage est traduit.
     */
    resultat: {
      victoire: 'Victoire',
      matchNul: 'Match nul',
      defaite: 'Défaite',
    },

    /** Adéquation d'un joueur au poste occupé (getFitLabel). */
    adequation: {
      perfect: 'Dans sa ligne',
      good: 'Ligne voisine',
      warn: "Deux lignes d'écart",
      bad: 'Poste inadapté',
    },

    /** Libellés des barres de note d'équipe. */
    notes: {
      gen: 'GEN',
      att: 'ATT',
      mil: 'MIL',
      def: 'DEF',
      gar: 'GAR',
      vit: 'VIT',
      phy: 'PHY',
      forme: 'FOR',
    },

    indispo: {
      suspenduUn: 'suspendu {n} match',
      suspenduPlusieurs: 'suspendu {n} matchs',
      blesseUn: 'blessé {n} match',
      blessePlusieurs: 'blessé {n} matchs',
    },

    entete: {
      titre: '{division} — Saison {saison}',
      journee: 'Journée {n}/{total}',
    },

    nav: {
      saison: 'Saison',
      classement: 'Classement',
      compo: 'Compo',
      effectif: 'Effectif',
      gestion: 'Gestion',
      coupe: 'Coupe',
      palmares: 'Palmarès',
      championsLeague: 'Champions League',
    },

    messages: {
      nonAlignable: '{joueur} est {motif} — il ne peut pas être aligné.',
      composeImpossibleUn: 'Impossible de composer : seulement {n} joueur disponible sur les {requis} requis ({ecartes} suspendu ou blessé).',
      composeImpossiblePlusieurs: 'Impossible de composer : seulement {n} joueurs disponibles sur les {requis} requis ({ecartes} suspendus ou blessés).',
      autoCompoEcartesUn: 'Composition automatique appliquée — {n} joueur indisponible écarté. Pensez à sauvegarder.',
      autoCompoEcartesPlusieurs: 'Composition automatique appliquée — {n} joueurs indisponibles écartés. Pensez à sauvegarder.',
      autoCompo: 'Composition automatique appliquée — pensez à sauvegarder.',
      clInitialisee: 'Champions League initialisee !',
      clResultat: 'CL: {resultat} {buts}-{butsAdverse} vs {adversaire}',
      onzeExact: 'Il faut exactement 11 titulaires (actuellement {n})',
      compoSauvegardee: 'Composition sauvegardée !',
      formationImpossible: 'Impossible de changer la formation : {message}',
      erreurReseau: 'erreur réseau',
      minimumVente: 'Effectif minimum de {min} joueurs requis pour vendre (vous en avez {n})',
      confirmerVente: 'Vendre {joueur} pour {prix} ?',
      vendu: '{joueur} vendu pour {prix}',
      saisonTerminee: 'Saison terminée ! Consultez le bilan.',
      mercatoHiverOuvert: "Mi-saison : le mercato d'hiver ouvre…",
      derbyGagne: 'Derby remporté ! Le vestiaire exulte.',
      derbyPerdu: 'Derby perdu. La semaine va être longue.',
      gestionAppliquee: '{icone} {nom} appliqué ! (-{cout})',
      clotureImpossible: 'Impossible de clôturer la saison : {message}',
    },

    moral: {
      titreDeparts: 'Des joueurs demandent à partir',
      titreTensions: 'Tensions dans le vestiaire',
      partUn: 'part dans {n} journée',
      partPlusieurs: 'part dans {n} journées',
      conseil: 'Remontez leur moral (entraînement de cohésion, dialogues, temps de jeu) pour les apaiser.',
      conseilFacile: " En difficulté facile, un joueur mécontent ne quitte jamais le club de lui-même — mais son moral pèse toujours sur ses performances.",
      conseilNormal: " Un joueur qui force son départ n'est vendu qu'à 60 % de sa valeur.",
    },

    direct: {
      badge: 'EN DIRECT',
      journee: 'Journée {n}',
    },

    stats: {
      points: 'Points',
      victoires: 'Victoires',
      nuls: 'Nuls',
      defaites: 'Défaites',
      buts: 'Buts',
    },

    actions: {
      jouerJournee: '⚽ Jouer la journée {n}',
      sponsors: '🤝 Offres de sponsors',
      finSaison: '🏁 Fin de saison !',
      finClassement: 'Vous terminez <strong>#{rang}</strong> du championnat avec <strong>{points} points</strong>.',
      bilanMercato: 'Bilan & Mercato →',
    },

    dernierMatch: {
      titre: 'Dernier match (J{n})',
      domicile: ' — à domicile',
      exterieur: " — à l'extérieur",
      points: '+{n} pts',
    },

    derby: {
      etiquette: ' — DERBY',
      annonce: '🔥 Derby contre {adversaire} : deux fois plus de moral en jeu, et une prime majorée en cas de victoire.',
    },    classement: {
      rival: 'Votre rival',
      colEquipe: 'Équipe',
      colPoints: 'Pts',
      colVictoires: 'V',
      colNuls: 'N',
      colDefaites: 'D',
      colButsPour: 'BP',
      colButsContre: 'BC',
      colDiff: 'Diff',
      legendePromo: 'Promotion — 2 premiers',
      legendeReleg: 'Relégation — 2 derniers',
      titulaires: 'Titulaires',
      remplacants: 'Remplaçants',
    },

    compo: {
      formation: 'Formation :',
      meilleurOnze: 'Meilleur XI',
      vider: 'Vider',
      sauvegarderModifie: 'Sauvegarder •',
      sauvegarder: 'Sauvegarder',
      nonSauvegarde: "Modifications non sauvegardées — elles seront perdues si vous quittez l'onglet.",

      alerteGardien: 'Aucun gardien de but dans les cages',
      alerteHorsLigneUn: '{n} joueur hors de sa ligne',
      alerteHorsLignePlusieurs: '{n} joueurs hors de sa ligne',
      alerteFatigueUn: '{n} titulaire sous les 50% de forme',
      alerteFatiguePlusieurs: '{n} titulaires sous les 50% de forme',
      suspendu: 'suspendu',
      blesse: 'blessé',
      alerteIndispoUn: 'Indisponible : {liste}',
      alerteIndispoPlusieurs: 'Indisponibles : {liste}',

      emplacementVide: 'Emplacement {poste} vide',
      titreJoueur: '{joueur} — {poste} au poste de {emplacement}\n{adequation} ({pct}%)\nNote {note} · Forme {forme}% · Moral {moral}%',

      emplacementOccupe: 'Emplacement <strong>{emplacement}</strong> — occupé par <strong>{joueur}</strong> ({poste}, {note})',
      retirer: 'Retirer',
      candidatIndispo: 'Indisponible — {motif}',
      candidatFit: '{adequation} au poste de {emplacement} ({pct}%)',
      tagTitulaire: 'TIT',

      remplacants: 'Remplaçants ({n})',
      indiceEmplacement: ' — Cliquez sur un emplacement du terrain',
      triNote: 'Note',
      triPoste: 'Poste',
      triNom: 'Nom',
      triForme: 'Forme',

      titreBanc: '{joueur} — {poste}\nNote {note} · Forme {forme}% · Moral {moral}%',
      titreSuspendu: 'SUSPENDU — {n} match(s)',
      titreBlesse: 'BLESSÉ — {n} match(s)',
      titreVeutPartir: 'DEMANDE À PARTIR',

      legendeParfait: 'Dans sa ligne — aucun malus',
      legendeBon: 'Ligne voisine — 78%',
      legendeMoyen: "Deux lignes d'écart — 64%",
      legendeMauvais: 'Poste inadapté — 40 à 50%',
      legendeForme: 'Forme : au-dessus de 50% aucun malus, en dessous le rendement chute',
    },

    coupe: {
      titre: '🏆 Coupe nationale',
      sousTitre: 'Élimination directe, ouverte à toutes les divisions — un tour à disputer entre deux journées de championnat.',
      gagnee: 'Vous avez remporté la coupe cette saison !',
      gagneeDetail: 'Un titre de plus au palmarès du club.',
      elimineDetail: 'Rendez-vous la saison prochaine.',
      contre: 'contre',
      niveau: '(niveau {n})',
      disputer: 'Disputer le tour',
      verrouille: 'Disponible à partir de la journée {tour} — vous en êtes à la {actuelle}.',
      trophee: 'Vous soulevez le trophée !',
      qualifie: 'Qualifié pour le tour suivant.',
      elimine: 'Élimination.',
      dotation: ' Dotation : {montant}.',
      blessure: 'Blessure : {liste}',
      blessureJoueur: '{joueur} ({n} matchs)',
      suspension: 'Suspension : {liste}',
      suspensionJoueur: '{joueur} — {motif}',
      parcours: 'Parcours',
    },

    palmares: {
      titres: 'Titres de champion',
      coupes: 'Coupes nationales',
      saisons: 'Saisons disputées',

      buteurs: 'Meilleurs buteurs — saison en cours',
      aucunBut: "Aucun but marqué pour l'instant cette saison.",
      colJoueur: 'Joueur',
      colPoste: 'Poste',
      colMatchs: 'Matchs',
      colButs: 'Buts',
      colCartons: 'Cartons',
      colCarriere: 'Carrière',
      carriereJoueur: '{buts} buts / {matchs} matchs',

      historique: 'Historique des saisons',
      aucuneSaison: "Aucune saison terminée pour l'instant.",
      colSaison: 'Saison',
      colDivision: 'Division',
      colRang: 'Rang',
      colPoints: 'Pts',
      colBilan: 'Bilan',
      colCoupe: 'Coupe',
      colButeur: 'Meilleur buteur',
      bilan: '{victoires}V {nuls}N {defaites}D',
    },

    effectif: {
      alertePleinCourt: 'Effectif plein ({n}/{max}) — vous ne pouvez plus recruter',
      alertePleinTitre: 'Effectif au maximum',
      alertePleinCorps: "Vous avez atteint la limite de {max} joueurs. Tout recrutement, draft ou recrue issue d'un événement sera refusé tant que vous n'aurez pas vendu.",
      placeRestanteUne: 'Il ne vous reste que {n} place.',
      placesRestantesPeu: 'Il ne vous reste que {n} places.',
      placesRestantes: 'Il vous reste {n} places.',
      alerteLargeCourt: '{n}/{max} joueurs — pensez à vendre',
      alerteLargeTitre: 'Effectif pléthorique',
      alerteLargeCorps: 'Vous avez {n} joueurs sur un maximum de {max}. {places} Vendez vos joueurs inutilisés pour renflouer le budget et garder de la marge au mercato.',

      nombre: '{n} joueurs',
      valeurTotale: 'Valeur totale : {valeur}',
      minimumVente: 'Effectif minimum de {min} joueurs requis pour vendre',
      vendre: 'Vendre ({prix})',
    },

    sponsors: {
      titre: '🤝 Offres de Sponsors',
      indice: 'Choisissez un sponsor pour la saison. Attention aux conséquences !',
      signer: 'Signer avec {nom}',

      partenariat: 'Partenariat signé avec {nom}',
      bonus: 'Bonus',
      moralPlus: 'Moral +{n}',
      moralPourquoi: "L'image du sponsor motive les joueurs",
      reputationPlus: 'Réputation +{n}',
      reputationPourquoi: 'Un partenaire prestigieux attire les regards',
      formePlus: 'Forme +{n}',
      formePourquoi: 'Accès à de meilleures installations',
      contreparties: 'Contreparties',
      moralMoins: 'Moral {n}',
      moralMoinsPourquoi: "Les joueurs n'apprécient pas cette association",
      reputationMoins: 'Réputation {n}',
      reputationMoinsPourquoi: "L'image du club en prend un coup auprès du public",
      continuer: 'Continuer la saison',
    },

    gestion: {
      titre: 'Gestion du club',
      veutParler: '{joueur} veut vous parler',
      moralPlus: 'Moral +{n}',
      moralMoins: 'Moral {n}',
      formePlus: 'Forme +{n}',
      formeMoins: 'Forme {n}',
      overallPlus: 'Overall +{n}',
      aucunProbleme: "Aucun joueur n'a de problèmes pour l'instant.",
      indice: 'Investissez dans votre club pour améliorer vos performances. Les coûts dépendent de votre division.',
      cooldown: 'Cooldown: {n} journée(s)',
      budgetInsuffisant: 'Budget insuffisant',
      enCooldown: 'En cooldown',
      acheter: 'Acheter ({cout})',
    },

    cl: {
      titre: 'Champions League',
      sousTitre: 'La plus prestigieuse competition europeenne',
      qualifie: 'Votre equipe est qualifiee pour la Champions League !',
      tirage: 'Lancer le tirage au sort',

      phaseGroupes: 'Phase de groupes - Journee {n}/6',
      phaseQuarts: 'Quarts de finale',
      phaseDemis: 'Demi-finales',
      phaseFinale: 'Finale',
      gains: 'Gains CL: {montant}',

      elimineTitre: 'Elimine',
      elimineCorps: 'Votre parcours en Champions League est termine cette saison.',
      gainsTotaux: 'Gains totaux :',
      vainqueurTitre: 'Vainqueur de la Champions League !',
      vainqueurCorps: 'Felicitations ! Vous remportez la plus grande competition europeenne !',

      jouerMatch: 'Jouer le prochain match CL',
      prochain: 'Prochain: vs {adversaire}',
      aller: 'Aller',
      retourManche: 'Retour',

      dernierResultat: 'Dernier resultat CL',
      cumule: 'Score cumule: {joueur} - {adversaire}',
      tabVictoire: 'Victoire aux tirs au but !',
      tabDefaite: 'Defaite aux tirs au but',
      domicileCourt: 'Dom',
      exterieurCourt: 'Ext',

      groupe: 'Groupe {nom}',
      colEquipe: 'Equipe',
      colJoues: 'J',
      colVictoires: 'V',
      colNuls: 'N',
      colDefaites: 'D',
      colButsPour: 'BP',
      colButsContre: 'BC',
      colPoints: 'Pts',

      tableau: 'Tableau {phase}',
      versus: 'VS',
    },
  },

  // -------------------------------------------- écrans hérités (hors flux)

  effectifPage: {
    formationChangee: 'Formation changée en {formation}',
    maxTitulaires: 'Maximum 11 titulaires !',
    compoMaj: 'Composition mise à jour !',
    titre: 'Mon Effectif',
    entrainer: '🏋️ Entraîner',
    titulaires: 'Titulaires ({n}/11)',
    remplacants: 'Remplaçants ({n})',
    versRemplacant: 'Remplaçant',
    versTitulaire: 'Titulaire',
  },

  transferts: {
    recrute: '{joueur} recruté ! Nouveau budget: {budget}',
    vendu: 'Joueur vendu pour {prix} ! Nouveau budget: {budget}',
    titre: 'Transferts',
    budget: 'Budget: {budget}',
    ongletMarche: '🛒 Marché ({n})',
    ongletVendre: '💸 Vendre ({n})',
    acheter: 'Acheter ({prix})',
    vendre: 'Vendre ({prix})',
  },

  classementMondial: {
    titre: '🏆 Classement Mondial',
    aucun: 'Aucun joueur classé pour le moment.',
    invitation: 'Jouez des matchs pour apparaître ici !',
    colManager: 'Manager',
    colEquipe: 'Équipe',
    colPoints: 'Pts',
    colVictoires: 'V',
    colButs: 'Buts',
  },
};
