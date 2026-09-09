/**
 * English strings.
 *
 * Any key missing here falls back to French, so a partial translation shows
 * the original wording rather than a raw identifier.
 */
export default {
  interface: {
    darkMode: 'Dark mode', lightMode: 'Light mode',
    workspace: 'YOUR WORKSPACE', navigation: 'Main navigation', clubTools: 'THE CLUB',
    career: 'My career', market: 'Transfers', community: 'The managers', welcome: 'Welcome',
    communityLink: 'Join the community', visitor: 'Visitor', edition: 'FOOTBALL IS YOURS.',
    welcomeKicker: 'THE MANAGEMENT GAME THAT TELLS YOUR STORY', heroLine1: 'YOUR CLUB.', heroLine2: 'YOUR CALL.',
    heroCopy: 'Your first eleven. A derby to win. A promotion to chase. Take charge and build your club, one match at a time.',
    artCaption: 'MAKE YOUR MOVE.', divisions: 'divisions to climb', matchdays: 'matchdays per season', yourStory: 'story to write',
  },
  tactics: {
    title: 'Tactical instructions', hint: 'Choose your approach before the match. It is saved immediately for every competition.',
    fatigue: 'League: −{n} fitness points',
    note: 'Pressing loses its bonuses when the starting eleven is tired. National cup fatigue is proportionally reduced. No approach guarantees a win.',
    current: 'Approach: {name}', change: 'Change instructions',
    balanced: { name: 'Balanced', description: 'A balance between the lines with moderate physical effort.' },
    pressing: { name: 'Pressing', description: 'More presence in midfield and attack, but an exposed defence and high fatigue.' },
    possession: { name: 'Possession', description: 'Stronger midfield control, at the cost of less direct attacking and extra effort.' },
    counter: { name: 'Counter-attack', description: 'Stronger attack and a small defensive boost, while conceding ground in midfield.' },
    low_block: { name: 'Low block', description: 'Defend more solidly and save energy, but create fewer chances.' },
  },
  deals: {
    negotiate: 'Negotiate', close: 'Close terms', loanTitle: 'Loan until the end of the season',
    loanTerms: 'One-off fee: {fee}. The loan ends at the end of season {season}.',
    loanRules: 'Up to three loan players in the squad. No purchase option or resale. The fee is non-refundable.',
    confirmLoan: 'Confirm loan · {price}', loanButton: 'Loan · {price}',
    asking: 'Asking price: {price}', accepted: 'Offer accepted at {price}. You can sign now.',
    counter: 'The club proposes {price}. Accept or increase your offer.',
    yourOffer: 'Your offer in euros', attempts: '{n} offer(s) remaining', sendOffer: 'Send offer',
    finalOffer: 'The club has made its final offer. Accept or choose another player.',
    noCharge: 'No money is deducted until you sign.', sign: 'Sign · {price}',
    loanBadge: 'On loan · until season {season}', cannotSell: 'A loan player cannot be sold.',
    loanArrived: '{player} joins on loan until the end of season {season}.',
    overview: 'Negotiate the price or strengthen your squad with a loan. {n}/3 active loans.',
    stableMarket: 'Players and negotiations remain available throughout this window. New offers arrive in the next window.',
    loanReturns: 'Loans ended: {players}. Remember to replace them during the transfer window.',
  },
  langue: {
    nom: 'English',
    changer: 'Change language',
  },

  accueil: {
    slogan: 'Build your squad, play your matches, climb the table.',
    atouts: {
      divisions: '<b>7 divisions</b> to climb, from amateur leagues to the top flight',
      mercato: '<b>Transfer window</b> between seasons, 26 matchdays each',
      evenements: '<b>Sponsors & events</b> with consequences you cannot see coming',
    },
    titreConnexion: 'Take charge',
    sousTitreConnexion: 'Sign in or load a saved game.',
    titreEquipe: 'Create your club',
    sousTitreEquipe: 'Pick a name and your level of challenge.',
    pseudo: 'Your username',
    pseudoExemple: 'Enter your username...',
    jouer: 'Play',
    connexion: 'Signing in...',
    ou: 'or',
    chargerSauvegarde: 'Load a saved game',
    sauvegardeInvalide: 'Invalid save file',
    classementManagers: 'Manager rankings',
    discord: 'Join the Discord',
    kofi: 'Enjoying the game? Support its development',
    bienvenue: 'Welcome {nom}! Name your club:',
    nomEquipeExemple: 'e.g. Storm FC...',
    difficulte: 'Difficulty:',
    facile: 'Easy',
    facileDesc: 'Weaker AI, budget +50%',
    normal: 'Normal',
    normalDesc: 'A balanced challenge',
    difficile: 'Hard',
    difficileDesc: 'Stronger AI, budget -30%',
    creation: 'Creating...',
    commencerMercato: 'Enter the transfer window',
  },

  dialogues: {
    erreur: 'Error: ',
    confirmerNouvelleCarriere: 'Start a new career? Your progress will be lost.',
    erreurChargement: 'Could not load the save file',
    sauvegardeInvalide: 'Invalid save file',
  },

  bilan: {
    titre: 'Season {saison} review — {division}',
    promotion: 'PROMOTED → {division}',
    relegation: 'Relegated → {division}',
    points: '{n} pts',
    prime: 'Prize money: +£{montant}M',
    draftInitial: 'Initial draft',
    mercato: 'Transfer window',
  },

  barre: {
    discordTitre: "Join the game's Discord server",
    kofiTitre: "Support the game's development on Ko-fi",
    budget: 'Budget',
    reputation: 'Reputation',
    saison: 'Season',
    managers: 'Managers',
    discord: 'Discord',
    soutenir: 'Support',
    nouvelleCarriere: 'New career',
    exporter: 'Export save file',
    importer: 'Import a save file',
    // Short labels for the top bar, where space is tight.
    exporterCourt: 'Export',
    importerCourt: 'Import',
  },

  credits: {
    musique: 'soundtrack by FufuNoir:',
  },

  /**
   * Position abbreviations.
   *
   * The codes stay the game's identifiers — formations, position fit, lineups —
   * and must never change. Only the label is translated. The French ones are
   * abbreviations of French words, unreadable to an English player.
   */
  postes: {
    GAR: 'GK',
    DC: 'CB', ARG: 'LB', ARD: 'RB', PG: 'LWB', PD: 'RWB',
    MDF: 'CDM', MC: 'CM', MOC: 'CAM', MG: 'LM', MD: 'RM',
    AIG: 'LW', AID: 'RW', BU: 'ST',
  },

  /** Squad lines, used by the transfer market counters. */
  lignes: { GAR: 'GK', DEF: 'DEF', MIL: 'MID', ATT: 'ATT' },

  /** First steps, shown until the first season is under way. */
  guide: {
    titre: 'First steps',
    masquer: 'Do not show again',
    recruter: {
      texte: 'Your squad is short of players. Head to the transfer market and sign at least eleven — the "Recruit automatically" button does it in one click.',
    },
    composer: {
      texte: 'Before kick-off, pick your eleven starters. Without a lineup the matchday cannot be played.',
      bouton: 'Go to the lineup',
    },
    jouer: {
      texte: 'Your side is ready. Play your first matchday: twenty-six await you this season.',
    },
    apresMatch: {
      texte: 'Your starters lost condition while the substitutes recovered. Rotate your squad to keep injuries away.',
      bouton: 'View my squad',
    },
    gestion: {
      texte: 'Keep an eye on the Management tab: training, sponsors and talks with your players decide a season.',
      bouton: 'Open management',
    },
  },

  // ---------------------------------------------------------------- shared

  commun: {
    chargement: 'Loading...',
    chargementPoints: 'Loading.',
    retour: ' Back',
    fermer: 'Close',
    erreur: 'Error: {message}',
    // Win / draw / loss initials, written against the figure: "12W 4D 3L".
    v: 'W',
    n: 'D',
    d: 'L',
  },

  /** Player card (shared component). */
  joueur: {
    overall: "Overall rating",
    value: "Estimated value",
    age: '{n} yrs',
    forme: 'Fitness',
    moral: 'Morale',
    stats: {
      pac: "Pace",
      tir: "Shooting",
      pas: "Passing",
      dri: "Dribbling",
      def: "Defence",
      phy: "Physical",
    },
  },

  // ----------------------------------------------------------------- music

  musique: {
    lecture: 'Play',
    pause: 'Pause',
    precedente: 'Previous track',
    suivante: 'Next track',
    piste: 'Track {n} of {total} — click to choose',
    volume: 'Volume {n}%',
  },

  // ------------------------------------------------------------ navigation


  // ------------------------------------------------------- transfer window

  mercato: {
    nextMissing: "Recruit {n} more player(s) to reach the minimum of 11. You can then choose your starting XI.",
    nextReady: "You have at least 11 players. Continue to the lineup to choose your starting XI.",
    nextWindow: "When you have finished recruiting, close the transfer window to resume matches.",
    countsHelp: "By position: current players / recommended number, including substitutes.",
    autoHelp: "Automatic recruitment spends your budget to fill the missing positions.",
    budgetLabel: "Available budget",
    chargement: 'Loading the transfer window...',
    autoComposer: "Recruit automatically",
    autoResultat: '{n} players signed for {montant}. Adjust as you like, then confirm.',
    autoRien: 'Nothing to sign: your squad is already complete.',
    titreHiver: 'January Transfer Window',
    sousTitreHiver: "Strengthen your squad mid-season. Fewer players are available and prices are higher.",
    reprendreSaison: 'Back to the season',
    titreInitial: "Build my squad",
    titre: 'Transfer Window',
    sousTitreInitial: 'Sign at least 11 players to put a squad together',
    sousTitre: 'Strengthen your squad for next season',
    joueurs: 'players',
    recrue: 'signing',
    recrues: 'signings',

    marcheIndisponible: 'Transfer market unavailable: {message}',
    budgetInsuffisant: 'Not enough budget!',
    effectifMaxAtteint: 'Squad limit reached ({max} players). Sell before you sign.',
    recrute: '{joueur} signed!',
    minimumVente: 'A squad of at least {min} players is required to sell (you have {n})',
    confirmerVente: 'Sell {joueur} for {prix}?',
    vendu: '{joueur} sold for {prix}',
    minimumOnze: 'You need at least 11 players! ({n}/11)',
    alerteEffectifPlein: 'Squad at maximum ({n}/{max}) — sell a player before you can sign anyone.',

    ligneManque: '{n} {ligne} — {conseille} recommended to see out a season',
    ligneOk: '{n} {ligne} — enough cover',
    validerEffectif: "Choose my starting XI",
    terminerMercato: 'Close the transfer window',

    ongletMarche: "Players to recruit",
    ongletEffectif: 'My squad',

    filtreTous: 'All',
    filtreGardiens: 'Goalkeepers',
    filtreDefenseurs: 'Defenders',
    filtreMilieux: 'Midfielders',
    filtreAttaquants: 'Forwards',

    legende: 'Legend',
    effectifPlein: 'Squad full ({max} players)',
    recruter: 'Buy',
    aucunJoueur: 'No players available in this category',

    resumeUn: '{n} player · total value {valeur}',
    resumePlusieurs: '{n} players · total value {valeur}',
    triPoste: 'Position',
    triNote: 'Rating',
    triValeur: 'Value',
    triAge: 'Age',
    triNom: 'Name',

    minimumVenteCourt: 'A squad of at least {min} players is required to sell',
    vendre: 'Sell ({prix})',
    effectifVide: 'Your squad is empty — sign players from the Market tab.',
  },

  // ----------------------------------------------------------------- match


  // -------------------------------------------------------------- managers

  managers: {
    enLigne: 'online',
    jamaisVu: 'never seen',
    ilYAMinutes: '{n} min ago',
    ilYAHeures: '{n} h ago',
    ilYAJours: '{n} d ago',

    indisponible: 'Rankings unavailable',
    retour: '← Back',
    titre: 'Manager rankings',
    compteEnLigne: '{n} online',
    totalUn: '{n} manager in total',
    totalPlusieurs: '{n} managers in total',
    aucun: 'No managers yet.',

    colManager: 'Manager',
    colDivision: 'Division',
    colSaison: 'Season',
    colPlace: 'Pos',
    colJoues: 'P',
    colPoints: 'Pts',
    colBilan: 'W-D-L',
    colButs: 'Goals',
    colTitres: 'Honours',
    colActivite: 'Activity',
    titreChampionnats: 'League titles',
    titreCoupes: 'Cups',

    chargementFiche: 'Loading profile…',
    reputation: 'Reputation',
    budget: 'Budget',
    saisons: 'Seasons',
    championnats: 'League titles',
    coupes: 'Cups',

    carriere: 'Career',
    colCoupe: 'Cup',
    colResultat: 'Outcome',
    promu: 'Promoted',
    relegue: 'Relegated',

    cadres: 'Key squad members',
    butsEnMatchs: '{buts} goals in {matchs} appearances',
  },

  // ---------------------------------------------------------------- season

  saison: {
    /**
     * The server returns the result in French; that string doubles as a
     * technical identifier (CSS class), so only its display is translated.
     */
    resultat: {
      victoire: 'Win',
      matchNul: 'Draw',
      defaite: 'Defeat',
    },

    /** How well a player fits the slot he occupies (getFitLabel). */
    adequation: {
      perfect: 'In his own line',
      good: 'Neighbouring line',
      warn: 'Two lines away',
      bad: 'Wrong position',
    },

    /** Labels for the team rating bars. */
    notes: {
      gen: 'OVR',
      att: 'ATT',
      mil: 'MID',
      def: 'DEF',
      gar: 'GK',
      vit: 'PAC',
      phy: 'PHY',
      forme: 'FIT',
    },

    indispo: {
      suspenduUn: 'suspended for {n} match',
      suspenduPlusieurs: 'suspended for {n} matches',
      blesseUn: 'injured for {n} match',
      blessePlusieurs: 'injured for {n} matches',
    },

    entete: {
      titre: '{division} — Season {saison}',
      journee: 'Matchday {n}/{total}',
    },

    nav: {
      saison: 'Season',
      classement: 'Table',
      compo: "Lineup",
      effectif: 'Squad',
      // « Club » nomme désormais le groupe d'onglets : la gestion reprend son
      // propre nom, sans quoi deux entrées du menu s'appelleraient pareil.
      club: 'Club',
      gestion: 'Management',
      coupe: 'Cup',
      palmares: 'Honours',
      championsLeague: 'Champions League',
    },

    messages: {
      nonAlignable: '{joueur} is {motif} — he cannot be selected.',
      composeImpossibleUn: 'Cannot pick a side: only {n} player available out of the {requis} required ({ecartes} suspended or injured).',
      composeImpossiblePlusieurs: 'Cannot pick a side: only {n} players available out of the {requis} required ({ecartes} suspended or injured).',
      autoCompoEcartesUn: 'Best XI applied — {n} unavailable player left out. Remember to save.',
      autoCompoEcartesPlusieurs: 'Best XI applied — {n} unavailable players left out. Remember to save.',
      autoCompo: 'Best XI applied — remember to save.',
      clInitialisee: 'Champions League set up!',
      clResultat: 'CL: {resultat} {buts}-{butsAdverse} vs {adversaire}',
      onzeExact: 'You need exactly 11 starters (currently {n})',
      compoSauvegardee: 'Line-up saved!',
      formationImpossible: 'Unable to change formation: {message}',
      erreurReseau: 'network error',
      minimumVente: 'A squad of at least {min} players is required to sell (you have {n})',
      confirmerVente: 'Sell {joueur} for {prix}?',
      vendu: '{joueur} sold for {prix}',
      saisonTerminee: 'Season over! Check your review.',
      mercatoHiverOuvert: 'Halfway there: the January window is opening…',
      derbyGagne: 'Derby won! The dressing room is buzzing.',
      derbyPerdu: 'Derby lost. It is going to be a long week.',
      gestionAppliquee: '{icone} {nom} applied! (-{cout})',
      clotureImpossible: 'Unable to close the season: {message}',
    },

    moral: {
      titreDeparts: 'Players are asking to leave',
      titreTensions: 'Unrest in the dressing room',
      partUn: 'leaves in {n} matchday',
      partPlusieurs: 'leaves in {n} matchdays',
      conseil: 'Lift their morale (team-bonding sessions, one-to-ones, game time) to settle them down.',
      conseilFacile: ' On easy difficulty an unhappy player never walks out on his own — but his morale still weighs on his performances.',
      conseilNormal: ' A player who forces a move out is only sold for 60% of his value.',
    },

    direct: {
      badge: 'LIVE',
      journee: 'Matchday {n}',
    },

    stats: {
      points: 'Points',
      victoires: 'Wins',
      nuls: 'Draws',
      defaites: 'Defeats',
      buts: 'Goals',
    },

    actions: {
      jouerJournee: 'Play matchday {n}',
      sponsors: 'Sponsor offers',
      finSaison: 'Season over!',
      finClassement: 'You finish <strong>#{rang}</strong> in the league on <strong>{points} points</strong>.',
      bilanMercato: 'Review & transfer window →',
    },

    dernierMatch: {
      titre: 'Last match (MD{n})',
      domicile: ' — at home',
      exterieur: ' — away',
      points: '+{n} pts',
    },

    derby: {
      etiquette: ' — DERBY',
      annonce: 'Derby against {adversaire}: twice the morale at stake, and a bigger bonus if you win.',
    },

    /** Treatment room: cut an injury short for a fee. */
    soins: {
      titre: 'Treatment room',
      note: 'The longer the injury, the dearer the early return. The player comes back available, but short of full fitness.',
      match: '{n} match',
      matchs: '{n} matches',
      bouton: 'Treat — {montant}',
      tropCher: 'Not enough funds',
      confirme: '{joueur} is back: {n} match(es) of absence avoided.',
    },

    /** Opponent report, available before kick-off. */
    scouting: {
      recoit: 'You host',
      deplacement: 'You travel to',
      rang: '{rang}th in the table',
      points: 'Points',
      buts: 'Goals',
      niveau: 'Average rating',
      effectif: 'Squad',
      forme: 'Form',
      dangers: 'Players to watch',
      butsJoueur: '{n} goals',
      voirEffectif: 'View the full squad',
    },

    classement: {
      rival: 'Your rivals',
      voirEffectif: 'View squad',
      colEquipe: 'Team',
      colPoints: 'Pts',
      colVictoires: 'W',
      colNuls: 'D',
      colDefaites: 'L',
      colButsPour: 'GF',
      colButsContre: 'GA',
      colDiff: 'GD',
      legendePromo: 'Promotion — top 2',
      legendeReleg: 'Relegation — bottom 2',
      titulaires: 'Starting XI',
      remplacants: 'Substitutes',
    },

    compo: {
      help: "Click a slot on the pitch to choose a player, or use automatic selection. Then save your starting XI before playing.",
      formation: 'Formation:',
      meilleurOnze: "Select the starting XI",
      vider: "Remove all starters",
      sauvegarderModifie: "Save changes",
      sauvegarder: "Save lineup",
      nonSauvegarde: 'Unsaved changes — they will be lost if you leave this tab.',

      alerteGardien: 'No goalkeeper between the posts',
      alerteHorsLigneUn: '{n} player out of his line',
      alerteHorsLignePlusieurs: '{n} players out of their line',
      alerteFatigueUn: '{n} starter below 50% fitness',
      alerteFatiguePlusieurs: '{n} starters below 50% fitness',
      suspendu: 'suspended',
      blesse: 'injured',
      alerteIndispoUn: 'Unavailable: {liste}',
      alerteIndispoPlusieurs: 'Unavailable: {liste}',

      emplacementVide: 'Empty {poste} slot',
      titreJoueur: '{joueur} — {poste} playing at {emplacement}\n{adequation} ({pct}%)\nRating {note} · Fitness {forme}% · Morale {moral}%',

      emplacementOccupe: 'Slot <strong>{emplacement}</strong> — filled by <strong>{joueur}</strong> ({poste}, {note})',
      retirer: 'Remove',
      candidatIndispo: 'Unavailable — {motif}',
      candidatFit: '{adequation} at {emplacement} ({pct}%)',
      tagTitulaire: 'XI',

      remplacants: 'Substitutes ({n})',
      indiceEmplacement: ' — Click a slot on the pitch',
      triNote: 'Rating',
      triPoste: 'Position',
      triNom: 'Name',
      triForme: 'Fitness',

      titreBanc: '{joueur} — {poste}\nRating {note} · Fitness {forme}% · Morale {moral}%',
      titreSuspendu: 'SUSPENDED — {n} match(es)',
      titreBlesse: 'INJURED — {n} match(es)',
      titreVeutPartir: 'HAS ASKED TO LEAVE',

      legendeParfait: 'In his own line — no penalty',
      legendeBon: 'Neighbouring line — 78%',
      legendeMoyen: 'Two lines away — 64%',
      legendeMauvais: 'Wrong position — 40 to 50%',
      legendeForme: 'Fitness: above 50% no penalty, below it output drops off',
    },

    coupe: {
      titre: 'National cup',
      sousTitre: 'Straight knockout, open to every division — one round to play between two league matchdays.',
      gagnee: 'You have won the cup this season!',
      gagneeDetail: 'One more trophy in the club cabinet.',
      elimineDetail: 'See you next season.',
      contre: 'against',
      niveau: '(rating {n})',
      disputer: 'Play the round',
      verrouille: 'Available from matchday {tour} — you are on matchday {actuelle}.',
      trophee: 'You lift the trophy!',
      qualifie: 'Through to the next round.',
      elimine: 'Knocked out.',
      dotation: ' Prize money: {montant}.',
      blessure: 'Injury: {liste}',
      blessureJoueur: '{joueur} ({n} matches)',
      suspension: 'Suspension: {liste}',
      suspensionJoueur: '{joueur} — {motif}',
      parcours: 'Cup run',
    },

    palmares: {
      titres: 'League titles',
      coupes: 'National cups',
      saisons: 'Seasons played',

      buteurs: 'Top scorers — current season',
      aucunBut: 'No goals scored yet this season.',
      colJoueur: 'Player',
      colPoste: 'Position',
      colMatchs: 'Apps',
      colButs: 'Goals',
      colCartons: 'Cards',
      colCarriere: 'Career',
      carriereJoueur: '{buts} goals / {matchs} apps',

      historique: 'Season history',
      aucuneSaison: 'No completed seasons yet.',
      colSaison: 'Season',
      colDivision: 'Division',
      colRang: 'Pos',
      colPoints: 'Pts',
      colBilan: 'Record',
      colCoupe: 'Cup',
      colButeur: 'Top scorer',
      bilan: '{victoires}W {nuls}D {defaites}L',
    },

    effectif: {
      alertePleinCourt: 'Squad full ({n}/{max}) — you can no longer sign anyone',
      alertePleinTitre: 'Squad at maximum',
      alertePleinCorps: 'You have reached the limit of {max} players. Any signing, draft pick or player arriving through an event will be refused until you sell.',
      placeRestanteUne: 'You have only {n} place left.',
      placesRestantesPeu: 'You have only {n} places left.',
      placesRestantes: 'You have {n} places left.',
      alerteLargeCourt: '{n}/{max} players — consider selling',
      alerteLargeTitre: 'Bloated squad',
      alerteLargeCorps: 'You have {n} players out of a maximum of {max}. {places} Sell the players you never use to top up the budget and keep room for the transfer window.',

      nombre: '{n} players',
      valeurTotale: 'Total value: {valeur}',
      minimumVente: 'A squad of at least {min} players is required to sell',
      vendre: 'Sell ({prix})',
    },

    sponsors: {
      titre: 'Sponsor offers',
      indice: 'Pick a sponsor for the season. Mind the consequences!',
      signer: 'Sign with {nom}',

      partenariat: 'Partnership signed with {nom}',
      bonus: 'Bonuses',
      moralPlus: 'Morale +{n}',
      moralPourquoi: 'The sponsor’s image lifts the players',
      reputationPlus: 'Reputation +{n}',
      reputationPourquoi: 'A prestigious partner turns heads',
      formePlus: 'Fitness +{n}',
      formePourquoi: 'Access to better facilities',
      contreparties: 'Trade-offs',
      moralMoins: 'Morale {n}',
      moralMoinsPourquoi: 'The players are not keen on this association',
      reputationMoins: 'Reputation {n}',
      reputationMoinsPourquoi: 'The club’s image takes a hit with the public',
      continuer: 'Continue the season',
    },

    gestion: {
      titre: 'Club management',
      veutParler: '{joueur} wants a word',
      moralPlus: 'Morale +{n}',
      moralMoins: 'Morale {n}',
      formePlus: 'Fitness +{n}',
      formeMoins: 'Fitness {n}',
      overallPlus: 'Overall +{n}',
      aucunProbleme: 'No player has any issues at the moment.',
      indice: 'Invest in your club to improve your results. Costs depend on your division.',
      cooldown: 'Cooldown: {n} matchday(s)',
      budgetInsuffisant: 'Not enough budget',
      enCooldown: 'On cooldown',
      acheter: 'Buy ({cout})',
    },

    cl: {
      titre: 'Champions League',
      sousTitre: 'The most prestigious competition in Europe',
      qualifie: 'Your side have qualified for the Champions League!',
      tirage: 'Make the draw',

      phaseGroupes: 'Group stage - Matchday {n}/6',
      phaseQuarts: 'Quarter-finals',
      phaseDemis: 'Semi-finals',
      phaseFinale: 'Final',
      gains: 'CL earnings: {montant}',

      elimineTitre: 'Knocked out',
      elimineCorps: 'Your Champions League run is over for this season.',
      gainsTotaux: 'Total earnings:',
      vainqueurTitre: 'Champions League winners!',
      vainqueurCorps: 'Congratulations! You have won the biggest competition in Europe!',

      jouerMatch: 'Play the next CL match',
      prochain: 'Next: vs {adversaire}',
      aller: 'First leg',
      retourManche: 'Second leg',

      dernierResultat: 'Last CL result',
      cumule: 'Aggregate: {joueur} - {adversaire}',
      tabVictoire: 'Won on penalties!',
      tabDefaite: 'Lost on penalties',

      groupe: 'Group {nom}',
      colEquipe: 'Team',
      colJoues: 'P',
      colVictoires: 'W',
      colNuls: 'D',
      colDefaites: 'L',
      colButsPour: 'GF',
      colButsContre: 'GA',
      colPoints: 'Pts',

      tableau: '{phase} bracket',
      versus: 'VS',
    },
  },

  // ----------------------------------------------- legacy screens (unused)



};
