/**
 * English strings.
 *
 * Any key missing here falls back to French, so a partial translation shows
 * the original wording rather than a raw identifier.
 */
export default {
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
      dreamteam: '<b>DreamTeam</b>: 200 real players in sandbox mode',
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
    chargerSauvegarde: '📂 Load a saved game',
    sauvegardeInvalide: 'Invalid save file',
    dreamteam: 'DreamTeam',
    classementManagers: '🏅 Manager rankings',
    discord: '💬 Join the Discord',
    kofi: '☕ Enjoying the game? Support its development',
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
    pseudoCarriere: 'Enter your username for the career:',
    nomEquipe: 'Name your club:',
    erreurCarriere: 'Could not start the career',
    erreur: 'Error: ',
    confirmerNouvelleCarriere: 'Start a new career? Your progress will be lost.',
    erreurChargement: 'Could not load the save file',
    sauvegardeInvalide: 'Invalid save file',
  },

  bilan: {
    titre: 'Season {saison} review — {division}',
    promotion: '🎉 PROMOTED → {division}',
    relegation: '📉 Relegated → {division}',
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
    managers: '🏅 Managers',
    dreamteam: '⭐ DreamTeam',
    discord: '💬 Discord',
    soutenir: '☕ Support',
    nouvelleCarriere: 'New career',
    exporter: 'Export save file',
    importer: 'Import a save file',
  },

  credits: {
    musique: 'soundtrack by FufuNoir:',
  },

  /** First steps, shown until the first season is under way. */
  guide: {
    titre: 'First steps',
    masquer: 'Do not show again',
    recruter: {
      texte: 'Your squad is short of players. Head to the transfer market and sign at least eleven — the "Build my squad" button does it in one click.',
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
    age: '{n} yrs',
    forme: 'Fitness',
    moral: 'Morale',
    stats: {
      pac: 'PAC',
      tir: 'SHO',
      pas: 'PAS',
      dri: 'DRI',
      def: 'DEF',
      phy: 'PHY',
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

  navigation: {
    effectif: 'Squad',
    match: 'Match',
    transferts: 'Transfers',
    classement: 'Table',
    nouvelleCarriere: '🔄 New career',
  },

  // ------------------------------------------------------- transfer window

  mercato: {
    chargement: 'Loading the transfer window...',
    autoComposer: '⚡ Build my squad',
    autoResultat: '{n} players signed for {montant}. Adjust as you like, then confirm.',
    autoRien: 'Nothing to sign: your squad is already complete.',
    titreHiver: 'January Transfer Window',
    sousTitreHiver: 'A short list and inflated prices: nobody rebuilds a squad in January',
    reprendreSaison: '⚽ Back to the season',
    titreInitial: 'Initial Transfer Window',
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
    rafraichir: '🔄 Refresh the market',
    validerEffectif: '✅ Confirm my squad',
    terminerMercato: '✅ Close the transfer window',

    ongletMarche: 'Market',
    ongletEffectif: 'My squad',

    filtreTous: 'All',
    filtreGardiens: 'Goalkeepers',
    filtreDefenseurs: 'Defenders',
    filtreMilieux: 'Midfielders',
    filtreAttaquants: 'Forwards',

    legende: '⭐ Legend',
    effectifPlein: 'Squad full ({max} players)',
    recruter: 'Sign',
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

  match: {
    titre: 'Play a Match',
    saison: 'Season {n}',
    journee: 'MD{n}',
    victoires: '{n}W',
    nuls: '{n}D',
    defaites: '{n}L',
    points: '{n} pts',
    simulation: '⏳ Simulating...',
    jouer: '⚽ Play the next match',
    domicile: 'Home',
    exterieur: 'Away',
    victoire: 'Win! +3 pts',
    nul: 'Draw +1 pt',
    defaite: 'Defeat',
    historique: '📋 History',
    aucunMatch: 'No matches played',
  },

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

  // -------------------------------------------------------------- dreamteam

  dreamteam: {
    postes: {
      GAR: 'Goalkeeper',
      DC: 'Centre-back',
      ARG: 'Left-back',
      ARD: 'Right-back',
      MC: 'Midfielder',
      MOC: 'Attacking mid.',
      MDF: 'Defensive mid.',
      AIG: 'Left winger',
      AID: 'Right winger',
      BU: 'Striker',
    },

    confirmerReset: 'Reset your DreamTeam?',
    retour: 'Back',

    rechercher: 'Search for a player...',
    toutesLigues: 'All leagues',
    tousPostes: 'All positions',
    aucunJoueur: 'No players found.',

    stats: {
      vit: 'PAC',
      tir: 'SHO',
      pas: 'PAS',
      dri: 'DRI',
      def: 'DEF',
      phy: 'PHY',
    },

    formation: 'Formation:',
    titulaires: 'Starting XI',
    remplacants: 'Substitutes ({n}/7)',
    ajouter: '+ Add',
    statsMoyennes: 'Average stats',

    jouer: 'Play',
    carriere: 'R2 career',
    amical: 'Friendly',
    championsLeague: 'Champions League',

    choisirDifficulte: 'Choose how strong the opposition should be:',
    diffFaible: 'Weak (55)',
    diffMoyen: 'Average (68)',
    diffFort: 'Strong (78)',
    diffLegende: 'Legendary (88)',
    simulation: 'Simulating...',

    victoire: 'Win!',
    defaite: 'Defeat...',
    nul: 'Draw',

    clPresentation: 'An eight-team tournament: quarter-finals, semi-finals, final.',
    clTirage: 'Make the draw',
    clQuarts: 'Quarter-finals',
    clDemis: 'Semi-finals',
    clFinale: 'Final',
    clJouerQuarts: 'Play the quarter-finals',
    clJouerDemis: 'Play the semi-finals',
    clJouerFinale: 'Play the final',
    clVictoireJoueur: 'Congratulations! Your DreamTeam win the Champions League!',
    clVictoireAutre: '{equipe} win the Champions League.',
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
      compo: 'Line-up',
      effectif: 'Squad',
      gestion: 'Club',
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
      jouerJournee: '⚽ Play matchday {n}',
      sponsors: '🤝 Sponsor offers',
      finSaison: '🏁 Season over!',
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
      annonce: '🔥 Derby against {adversaire}: twice the morale at stake, and a bigger bonus if you win.',
    },    classement: {
      rival: 'Your rivals',
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
      formation: 'Formation:',
      meilleurOnze: 'Best XI',
      vider: 'Clear',
      sauvegarderModifie: 'Save •',
      sauvegarder: 'Save',
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
      titre: '🏆 National cup',
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
      titre: '🤝 Sponsor offers',
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
      domicileCourt: 'H',
      exterieurCourt: 'A',

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

  effectifPage: {
    formationChangee: 'Formation changed to {formation}',
    maxTitulaires: 'Maximum 11 starters!',
    compoMaj: 'Line-up updated!',
    titre: 'My Squad',
    entrainer: '🏋️ Train',
    titulaires: 'Starting XI ({n}/11)',
    remplacants: 'Substitutes ({n})',
    versRemplacant: 'Substitute',
    versTitulaire: 'Starter',
  },

  transferts: {
    recrute: '{joueur} signed! New budget: {budget}',
    vendu: 'Player sold for {prix}! New budget: {budget}',
    titre: 'Transfers',
    budget: 'Budget: {budget}',
    ongletMarche: '🛒 Market ({n})',
    ongletVendre: '💸 Sell ({n})',
    acheter: 'Buy ({prix})',
    vendre: 'Sell ({prix})',
  },

  classementMondial: {
    titre: '🏆 Global table',
    aucun: 'No managers ranked yet.',
    invitation: 'Play matches to appear here!',
    colManager: 'Manager',
    colEquipe: 'Team',
    colPoints: 'Pts',
    colVictoires: 'W',
    colButs: 'Goals',
  },
};
