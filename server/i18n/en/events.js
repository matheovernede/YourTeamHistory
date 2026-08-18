/**
 * Traduction anglaise des événements de saison.
 *
 * Ce fichier traduit les textes affichés de server/data/events.js, qui reste
 * la source de vérité : la logique, les effets, les poids et les prédicats
 * `when` y demeurent et ne sont jamais dupliqués ici.
 *
 * L'objet est indexé par l'identifiant de l'événement, et chaque événement par
 * l'identifiant de ses choix. Ces identifiants sont des clés techniques :
 * ils doivent correspondre exactement à ceux de la source.
 *
 * Seuls title, description, choices[].text et choices[].consequence sont
 * traduits. Toute clé absente retombe sur le français d'origine (voir
 * localiserEvenement dans server/i18n/index.js) : une traduction incomplète
 * laisse donc passer le texte français plutôt qu'un identifiant brut.
 */

module.exports = {
  // ============================================================
  // MORAL / VESTIAIRE
  // ============================================================
  player_dispute: {
    title: 'Dressing-room row',
    description: "Two of your players had a furious argument at training. The atmosphere is poisonous.",
    choices: {
      punish: { text: 'Discipline both players', consequence: 'Discipline upheld, but the dressing room grumbles.' },
      ignore: { text: 'Let it blow over', consequence: 'The feud festers and morale takes a dive.' },
      mediate: { text: 'Bring in a mediator (£100k)', consequence: 'The players patch things up and the mood lifts.' },
    },
  },
  media_scandal: {
    title: 'Tabloid scandal',
    description: "One of your players was papped in a nightclub the night before a big fixture.",
    choices: {
      bench: { text: 'Drop him to the bench as punishment', consequence: 'Message sent: discipline comes first. The culprit is out of the starting eleven.' },
      fine: { text: 'Club fine (£50k recovered)', consequence: 'He pays up, but the dressing room turns frosty.' },
      support: { text: 'Back him publicly', consequence: 'The squad loves you for it, the media less so.' },
    },
  },
  captain_armband: {
    title: 'The armband question',
    description: "Several senior players want a new captain. The current skipper no longer carries the room.",
    choices: {
      change: { text: 'Change captain', consequence: "The group approves, but the old skipper takes it badly." },
      keep: { text: 'Stick with your choice', consequence: "You stand your ground. The doubters will have to live with it." },
      vote: { text: 'Let the squad vote', consequence: 'A collective call: the dressing room feels listened to.' },
    },
  },
  training_revolt: {
    title: 'Revolt on the training ground',
    description: 'The players reckon your sessions are too brutal. Some are threatening to ease off.',
    choices: {
      soften: { text: 'Lighten the workload', consequence: 'Fresh legs are back, but your authority takes a knock.' },
      harden: { text: 'Crank it up further: they lack character', consequence: 'You lay down the law. The squad grits its teeth.' },
      explain: { text: 'Explain your method, with the data to back it up', consequence: 'Teaching pays off: they buy into the plan.' },
    },
  },
  birthday_party: {
    title: "A senior player's birthday",
    description: 'An influential player is throwing a birthday do and inviting the whole squad. The match is in three days.',
    choices: {
      allow: { text: 'Allow it, within reason', consequence: 'A cracking night out and a tighter squad. A few sore heads.' },
      forbid: { text: 'Ban it, big match coming', consequence: 'They fall into line, in silence.' },
      delay: { text: 'Push it back until after the match', consequence: 'A compromise, accepted without much enthusiasm.' },
    },
  },
  religious_fasting: {
    title: 'Fasting period',
    description: 'Several players are observing a period of fasting. Their preparation is suffering for it.',
    choices: {
      adapt: { text: 'Rearrange training times', consequence: 'The respect you show pulls the dressing room together.' },
      nothing: { text: 'Change nothing', consequence: 'They cope, but the message goes down badly.' },
      nutrition: { text: 'Bring in a specialist nutritionist', consequence: "Tailored support: nobody is left at a disadvantage." },
    },
  },

  // ============================================================
  // FINANCIER
  // ============================================================
  star_demands: {
    title: 'Wage demand',
    description: 'Your best player wants a one-off bonus. Otherwise, he hints, his performances might slip.',
    choices: {
      pay: { text: 'Pay the bonus (£300k)', consequence: 'The player is happy and the dressing room follows his lead.' },
      refuse: { text: 'Refuse flat out', consequence: 'You show who is in charge, but the player sulks.' },
      negotiate: { text: 'Negotiate a results-based bonus', consequence: 'A compromise everyone can live with.' },
    },
  },
  sponsor_shady: {
    title: 'A dodgy offer',
    description: 'A businessman offers you £800k in exchange for his nephew (overall 45) starting matches.',
    choices: {
      accept: { text: 'Take the deal', consequence: "The money lands, but the squad cannot fathom the decision." },
      refuse: { text: 'Turn him down politely', consequence: 'You keep your integrity and the players respect you for it.' },
      counter: { text: 'Counter-offer: he invests in the club with no strings', consequence: 'He settles for a smaller but clean investment.' },
    },
  },
  local_business: {
    title: 'Local partnership',
    description: 'A restaurant down the road offers a deal: free meals for the squad in return for exposure.',
    choices: {
      accept: { text: 'Accept the partnership', consequence: 'The players love it, good vibes guaranteed.' },
      refuse: { text: 'Decline, not professional enough', consequence: 'The owner is disappointed, opportunity gone.' },
      negotiate: { text: 'Accept and negotiate a sponsorship (£50k)', consequence: 'Everybody wins.' },
    },
  },
  tax_audit: {
    title: 'Tax audit',
    description: "The taxman is going through the club's books. There are a few minor irregularities lying about.",
    choices: {
      lawyer: { text: 'Hire a specialist firm (£250k)', consequence: 'The file is closed cleanly, no follow-up.' },
      gamble: { text: 'Handle it yourself and hope for the best', consequence: 'A risky punt: a 45% chance it goes pear-shaped.' },
      confess: { text: 'Declare everything voluntarily', consequence: 'Your honesty is applauded, the bill is steep.' },
    },
  },
  merchandising: {
    title: 'Club shop',
    description: 'The commercial director wants to launch a range of collector shirts.',
    choices: {
      invest: { text: 'Invest in a proper collection (£200k)', consequence: "If it catches on, the club's image goes through the roof." },
      cheap: { text: 'Budget version', consequence: 'The fans think it looks cheap.' },
      none: { text: 'Not now', consequence: 'Status quo. A missed chance, perhaps.' },
    },
  },
  prize_money: {
    title: 'Federation payout',
    description: 'The club receives a one-off grant. The chairman lets you decide where it goes.',
    choices: {
      squad: { text: 'Strengthen the squad', consequence: 'A new signing arrives to add depth.' },
      facilities: { text: 'Modernise the training ground', consequence: 'Brand-new facilities, and the players recover far better.' },
      save: { text: 'Put it aside (£400k)', consequence: 'Healthier finances for the transfer window.' },
    },
  },
  salary_delay: {
    title: 'Wages held up',
    description: "Cash flow is tight. This month's wages may well go out late.",
    choices: {
      loan: { text: 'Take out a loan (£200k cost)', consequence: 'Everyone is paid on time. The interest will sting.' },
      honest: { text: 'Explain the situation to the squad', consequence: 'Your transparency is appreciated, but the worry sets in.' },
      sell: { text: 'Sell a player to plug the hole', consequence: 'The coffers can breathe again, the squad is weaker for it.' },
    },
  },

  // ============================================================
  // SPORTIF
  // ============================================================
  youth_talent: {
    title: 'Academy gem',
    description: 'A 16-year-old is turning heads in training. Several pro clubs are watching him.',
    choices: {
      promote: { text: 'Bring him into the first-team squad', consequence: 'The lad is buzzing and the dressing room takes to him.' },
      sell: { text: 'Sell him now (£400k)', consequence: 'The money is banked, but the fans are grumbling.' },
      loan: { text: 'Loan him out for a year, then bring him back (£150k fee)', consequence: 'A wise call: a season of minutes elsewhere and he comes back hardened.' },
    },
  },
  rival_poach: {
    title: 'Offer from a rival',
    description: 'A rival club bids £2M for your captain. The player is wavering.',
    choices: {
      sell: { text: 'Accept the bid (£2M)', consequence: 'The money rolls in but the dressing room is stunned.' },
      refuse: { text: 'Refuse point blank', consequence: 'The skipper is moved by your loyalty.' },
      negotiate: { text: 'Hold out for more (£3.5M or nothing)', consequence: 'They walk away 60% of the time. If it lands, it is a jackpot.' },
    },
  },
  injured_veteran: {
    title: 'Veteran injured',
    description: 'Your most experienced player has done his knee. The doctor lays out the options.',
    choices: {
      surgery: { text: 'Surgery: a long lay-off', consequence: 'He is physically on the floor and will be out for several matchdays.' },
      quick_fix: { text: 'Quick fix: back soon but not right', consequence: 'He is playing again shortly, but nowhere near his best.' },
      retire: { text: 'Suggest he hangs up his boots', consequence: 'A sad end to a career. The old heads in the dressing room feel it.' },
    },
  },
  doping_suspicion: {
    title: 'Doping suspicion',
    description: 'A surprise drug test has been announced. One of your players admits to taking dubious supplements.',
    choices: {
      report: { text: 'Report the player to the federation', consequence: 'Integrity beyond reproach: the player is suspended and leaves the squad.' },
      cover: { text: 'Cover for him and hope it blows over', consequence: 'A 50% chance of being caught. If it comes out: another -20 rep.' },
      substitute: { text: 'Quietly list him as "injured"', consequence: 'No scandal, but the unease lingers.' },
    },
  },
  free_agent: {
    title: 'Free agent on the market',
    description: 'An experienced player is clubless after his contract was torn up. His agent is on the phone.',
    choices: {
      sign: { text: 'Sign him straight away', consequence: 'An experienced head arrives for nothing.' },
      trial: { text: 'Give him a week on trial before deciding', consequence: 'The trial goes well and you sign him knowing exactly what you are getting.' },
      pass: { text: 'Pass, the squad is deep enough', consequence: 'The group appreciates the stability.' },
    },
  },
  scout_report: {
    title: 'Your scout reports back',
    description: 'Your scout has spotted an interesting player down in a lower division.',
    choices: {
      sign: { text: 'Bring him in (transfer fee)', consequence: 'The gamble is on: he joins the squad.' },
      watch: { text: 'Keep watching him', consequence: 'Caution. You will keep an eye on him.' },
      ignore: { text: 'Forget it, the current squad comes first', consequence: 'Your players like that you are not shopping elsewhere.' },
    },
  },
  tactical_leak: {
    title: 'Tactics leaked',
    description: 'Your plans for the next match have appeared in the press. Someone has talked.',
    choices: {
      investigate: { text: 'Launch an internal inquiry', consequence: 'A climate of suspicion, but the leak is plugged.' },
      change: { text: 'Change everything at the last minute', consequence: 'The opposition is caught cold. The squad had to improvise.' },
      shrug: { text: 'Laugh it off in public', consequence: 'You take the heat out of it. The dressing room breathes again.' },
    },
  },
  winning_run: {
    title: 'On a run',
    description: 'The team is stringing results together. The press is getting carried away and already talking title.',
    choices: {
      humble: { text: 'Calm everyone down', consequence: 'Feet on the ground. The squad stays switched on.' },
      ride: { text: 'Ride the wave', consequence: 'Confidence sky-high, even if they get a bit ahead of themselves.' },
      bonus: { text: 'A squad bonus to keep the momentum going', consequence: 'The dressing room is fired up.' },
    },
  },
  losing_run: {
    title: 'Rotten run',
    description: 'The defeats keep coming. Confidence is draining away and the criticism is raining down.',
    choices: {
      seminar: { text: 'Organise a team-bonding trip (£180k)', consequence: 'The squad rebuilds itself away from the pitch.' },
      shock: { text: 'Shock treatment: training at first light', consequence: 'Brutal methods. Some take to it, others do not.' },
      protect: { text: 'Publicly take all the blame yourself', consequence: 'You take the hits for them. They will pay you back.' },
    },
  },

  // ============================================================
  // CLUB / INFRASTRUCTURE
  // ============================================================
  stadium_issue: {
    title: 'Pitch in a shocking state',
    description: 'The stadium pitch is a disgrace. It is hurting the way your team plays.',
    choices: {
      repair: { text: 'Relay the pitch (£200k)', consequence: 'An immaculate surface, and your players can finally play their football.' },
      nothing: { text: 'Play on it anyway', consequence: 'The players are moaning and injuries are looming.' },
      synthetic: { text: 'Switch to an artificial surface (£500k)', consequence: 'No more upkeep headaches, but the purists are up in arms.' },
    },
  },
  bus_breakdown: {
    title: 'Team bus breaks down',
    description: 'The club bus gives up the ghost the day before a trip to the other end of the region.',
    choices: {
      rent: { text: 'Hire a comfortable coach (£80k)', consequence: 'A smooth journey and fresh legs on arrival.' },
      cars: { text: 'Car share in whatever motors people have', consequence: 'They turn up in dribs and drabs, knackered. Hardly professional.' },
      buy: { text: 'Invest in a new bus (£450k)', consequence: 'A lasting investment, and the club gains credibility.' },
    },
  },
  floodlight_failure: {
    title: 'Floodlight failure',
    description: 'The stadium floodlights have packed in. The next home fixture is at risk of postponement.',
    choices: {
      fix: { text: 'Emergency repairs (£150k)', consequence: 'The match goes ahead as normal.' },
      move: { text: 'Move the match elsewhere', consequence: 'Playing away from your own fans always costs you.' },
      afternoon: { text: 'Negotiate a daylight kick-off', consequence: 'A pragmatic fix, and it costs nothing.' },
    },
  },
  academy_investment: {
    title: 'The future of the academy',
    description: 'The chairman wants your view on the future of the academy.',
    choices: {
      invest: { text: 'Invest heavily (£600k)', consequence: 'Your long-term vision is applauded. One youngster is already standing out.' },
      maintain: { text: 'Keep the current budget', consequence: 'Continuity, nothing more.' },
      close: { text: 'Scale it back and focus on the first team (£300k saved)', consequence: "The coffers can breathe, the club's image suffers." },
    },
  },
  weather_chaos: {
    title: 'Weather chaos',
    description: 'Torrential rain has left the training pitches unusable for a week.',
    choices: {
      gym: { text: 'Move indoors and do video work', consequence: 'A studious week, and the legs are spared.' },
      rent: { text: 'Hire an indoor complex (£120k)', consequence: 'Preparation goes on almost as normal despite the downpour.' },
      outside: { text: 'Train outdoors regardless', consequence: 'Heroic sessions in the mud. The bodies take a battering.' },
    },
  },

  // ============================================================
  // SUPPORTERS / MÉDIAS / DIRECTION
  // ============================================================
  fan_protest: {
    title: 'Supporters up in arms',
    description: 'After a string of poor results, the fans are staging a protest outside the ground.',
    choices: {
      meet_fans: { text: 'Go out and face them', consequence: 'Your bottle earns respect and the pressure eases.' },
      hide: { text: 'Ignore it and stay focused', consequence: 'The fans feel snubbed.' },
      promise: { text: 'Promise a signing (£500k)', consequence: 'You keep your word: a new face arrives and hope returns.' },
    },
  },
  charity_match: {
    title: 'Charity match',
    description: 'A local charity asks you to put on a charity match during the winter break.',
    choices: {
      accept: { text: 'Accept enthusiastically', consequence: 'Great publicity for the club, though the players are a little leggy.' },
      refuse: { text: 'Decline, the league comes first', consequence: 'Pragmatic, but it goes down badly.' },
      donate: { text: 'Turn down the match but make a donation (£150k)', consequence: 'Generous, without risking anyone\'s fitness.' },
    },
  },
  ultras_demand: {
    title: 'The ultras want a meeting',
    description: 'The most fanatical supporters\' group wants to talk about where the club is heading. It could get heated.',
    choices: {
      meet: { text: 'Meet them yourself', consequence: 'A frank but respectful exchange. They leave reassured.' },
      delegate: { text: 'Send a club official in your place', consequence: 'They take it as contempt.' },
      invite: { text: 'Invite them to a closed training session', consequence: 'A big gesture: they become your loudest advocates.' },
    },
  },
  president_pressure: {
    title: 'The chairman is losing patience',
    description: 'The chairman calls you in: the results are not what he expected.',
    choices: {
      defend: { text: 'Defend your project with the numbers in hand', consequence: 'He grants you more time.' },
      promise: { text: 'Promise immediate results', consequence: 'You buy yourself some breathing space, under serious pressure.' },
      resources: { text: 'Demand extra resources', consequence: 'A risky stand-off: a 40% chance he takes it badly.' },
    },
  },
  tv_documentary: {
    title: 'Cameras in the dressing room',
    description: 'A broadcaster wants to film a documentary about the club for a month.',
    choices: {
      accept: { text: 'Open the doors (£200k in rights)', consequence: 'A fine shop window, but the players feel watched.' },
      refuse: { text: 'Refuse, the dressing room is sacred', consequence: 'The squad thanks you for protecting them.' },
      partial: { text: 'Accept, but not in the dressing room', consequence: 'A decent balance between exposure and privacy.' },
    },
  },
  referee_controversy: {
    title: 'Refereeing row',
    description: 'A contentious decision has cost you points. The microphones are dangling the bait.',
    choices: {
      attack: { text: 'Slaughter the officials in public', consequence: 'The dressing room adores you, the federation rather less so.' },
      calm: { text: 'Keep it measured', consequence: 'Your attitude is praised by every observer.' },
      selfcrit: { text: 'Point the finger at your own mistakes', consequence: 'Rare honesty, but the squad takes it badly.' },
    },
  },
  derby_week: {
    title: 'Derby week',
    description: 'The derby is coming. The whole city is talking about nothing else and the pressure is cranking up.',
    choices: {
      hype: { text: 'Stoke the fervour with the supporters', consequence: 'A bouncing stadium guaranteed.' },
      isolate: { text: 'Training camp away from the noise (£100k)', consequence: 'A focused, well-rested squad.' },
      normal: { text: 'Treat it like any other match', consequence: 'A hard sell to a dressing room already at boiling point.' },
    },
  },
  award_nomination: {
    title: 'Up for an award',
    description: 'You are nominated for Manager of the Month. The ceremony falls the night before a match.',
    choices: {
      attend: { text: 'Go along', consequence: 'Deserved recognition, preparation slightly disrupted.' },
      skip: { text: 'Decline, the pitch comes first', consequence: 'The squad likes that the team comes before the individual.' },
      dedicate: { text: 'Go and dedicate the award to the players', consequence: 'The dressing room is touched by the gesture.' },
    },
  },
};
