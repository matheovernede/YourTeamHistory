/**
 * Traduction anglaise des dialogues joueur -> entraîneur.
 *
 * Ce fichier traduit server/data/conversations.js, qui reste en français et
 * n'est pas modifié : il porte la logique de jeu (poids, prédicats `when`,
 * effets). Ici on ne trouve que du texte d'affichage, indexé par les mêmes
 * identifiants — ceux des dialogues et ceux des choix.
 *
 * Seuls `title`, `message`, `choices[].text` et `choices[].response` sont
 * traduits. Toute clé absente retombe sur le français : une traduction
 * incomplète laisse passer le texte d'origine plutôt qu'un identifiant brut.
 *
 * Registre : anglais britannique, parlé. Le joueur s'adresse à son entraîneur
 * en disant « boss » ou « gaffer ».
 */

module.exports = {
  // ============================================================
  // MORAL BAS
  // ============================================================
  homesick: {
    title: 'Homesick',
    message: "Boss, I wanted a word... I miss my family so much. I'm struggling to keep my head in it lately.",
    choices: {
      support: { text: "I understand. Take a few days for yourself.", response: "Thanks boss, that really means a lot. I'll come back stronger." },
      tough: { text: "We've all got sacrifices to make. Focus on the pitch.", response: "...Fine, boss. I'll try." },
      help: { text: "I'll see what we can do about getting your family closer.", response: "Seriously? You'd do that? Thank you so much, boss!" },
    },
  },
  bad_form: {
    title: 'Rough patch',
    message: "Boss, I know I've been rubbish lately. I don't know what's going on, I lose a bit more confidence every match.",
    choices: {
      encourage: { text: "It happens to the best of them. I believe in you.", response: "Cheers boss... it's good to hear that." },
      bench: { text: "Take a step back from the bench, have a look at it from there.", response: "Maybe a breather would do me some good..." },
      train: { text: "We'll work on it together after training.", response: "Really? Right, I'm up for that, boss!" },
    },
  },
  sleepless: {
    title: 'Sleepless nights',
    message: "Boss, I'm not sleeping any more. I replay my touches on a loop all night, then I'm shattered before the morning's even started.",
    choices: {
      psy: { text: "I'll put you in touch with a sports psychologist.", response: "I didn't dare ask... thanks boss, honestly." },
      unplug: { text: "Cut it all out: video, stats, socials. For a week.", response: "It'll be hard but you're right, I can't take any more." },
      ignore: { text: "Everyone goes through it. You play your way out of it.", response: "Yeah... I suppose I just have to grit my teeth." },
    },
  },
  mistake_guilt: {
    title: 'The mistake that sticks',
    message: "Boss, that howler last match... it's my fault we lost. The lads aren't saying anything but I can feel it.",
    choices: {
      shield: { text: "I'll take responsibility publicly. You're playing Sunday.", response: "You're saving my life, boss. I'll give you everything out there." },
      collective: { text: "We lose as eleven. Nobody's holding you responsible.", response: "Thanks... I needed to hear that." },
      blunt: { text: "Yes, it was a shocking error. Don't do it again.", response: "...Understood, boss. It won't happen again." },
    },
  },

  // ============================================================
  // MORAL HAUT
  // ============================================================
  captain_material: {
    title: 'Leadership',
    message: "Boss, I wanted to tell you I'm ready to take on more responsibility. The armband — I'd be interested.",
    choices: {
      accept: { text: "You're the captain as of today.", response: "I won't let you down, boss. I'll lead by example!" },
      refuse: { text: "Not yet. Show me you can keep it up first.", response: "I get it... I'll keep working." },
      later: { text: "We'll talk about it again at the end of the season.", response: "All right, I'll be patient." },
    },
  },
  on_fire: {
    title: 'Full of confidence',
    message: "Boss, I feel untouchable right now. Give me a bit more freedom up top, I reckon I can be the difference.",
    choices: {
      freedom: { text: "Go on, play your football. I trust you.", response: "Cheers boss! You'll see what I'm worth." },
      humble: { text: "Stay within the system. The team carries you.", response: "You're right... maybe I'm getting a bit carried away." },
      challenge: { text: "Prove it: I want you decisive three matches running.", response: "You're on, boss. Count on me." },
    },
  },
  mentor_offer: {
    title: 'Wanting to pass it on',
    message: "Boss, there are a few young lads struggling in the squad. I can take one under my wing if you want.",
    choices: {
      yes: { text: "Great initiative. Look after them.", response: "Done! I'll show them how we work round here." },
      formal: { text: "Let's make it official: you're the players' representative.", response: "Wow, you're giving me a proper role. Cheers boss." },
      no: { text: "Sort your own level out first.", response: "...I was only trying to help, boss." },
    },
  },

  // ============================================================
  // FORME PHYSIQUE
  // ============================================================
  injury_fear: {
    title: 'Fear of injury',
    message: "Boss, my knee's been sore for a few days. I'm scared I'll do something serious if I keep playing.",
    choices: {
      rest: { text: "Get some rest, your health comes first.", response: "Thanks boss, I'd rather be careful." },
      push: { text: "We need you. Grit your teeth.", response: "Right... I'll try to hang on, but I've got a bad feeling about it." },
      medical: { text: "Go and see the doc and we'll take it from there.", response: "Good idea. I'll keep you posted." },
    },
  },
  overloaded: {
    title: 'Too many matches',
    message: "Boss, I've played every match without a breather. My legs have gone, I feel heavy from half-time onwards.",
    choices: {
      rotate: { text: "I'm taking you out of the eleven next match. Recover.", response: "It kills me to say it but... I need it. Thanks." },
      lighten: { text: "Lighter training for you this week.", response: "Spot on, boss, that'll get me right again." },
      need: { text: "Can't do it, you're indispensable. Hang in there.", response: "Hearing that gives me my energy back. Let's go." },
    },
  },
  diet: {
    title: 'A question of diet',
    message: "Boss, a mate mentioned a nutritionist to me. I'm wondering if what I eat is holding me back.",
    choices: {
      hire: { text: "We'll bring in a nutritionist for the whole squad.", response: "That'll help everyone! Cheers boss." },
      self: { text: "Sort your own discipline out, it's your job.", response: "Okay... I'll look into it myself then." },
      advice: { text: "I'll give you a few simple rules to follow.", response: "Perfect, I'm starting tonight." },
    },
  },

  // ============================================================
  // TEMPS DE JEU / BANC
  // ============================================================
  not_playing: {
    title: 'Frustrated on the bench',
    message: "Boss, I've been on the bench for several matches now. I don't get it, I train hard every single day.",
    choices: {
      promise: { text: "You'll get your chance soon, be patient.", response: "Okay boss... I hope you keep your word." },
      honest: { text: "There's someone better than you in that position right now.", response: "That's hard to hear but... I'll work even harder." },
      motivate: { text: "Show me in training that you deserve your place.", response: "You're right. I'll give everything to get back in!" },
    },
  },
  wasted_talent: {
    title: 'Talent going to waste',
    message: "Boss, let's be honest: I'm good enough to start here. If you're not counting on me, say so and I'll look elsewhere.",
    choices: {
      starter: { text: "You're right. You start the next match.", response: "Thanks for admitting it. I'll pay you back tenfold." },
      explain: { text: "Your profile doesn't fit what we're building.", response: "At least that's clear. I'll have a think about my future." },
      compete: { text: "Nobody's untouchable. Go and take your place.", response: "That's all I was asking for: a proper chance." },
    },
  },
  position_change: {
    title: 'Change of position',
    message: "Boss, you're playing me somewhere I don't feel comfortable. I can give you a lot more in my natural role.",
    choices: {
      listen: { text: "You're right, I'm putting you back in your position.", response: "Thanks for listening, boss, that changes everything." },
      versatile: { text: "A good player adapts. It's a strength, not a punishment.", response: "Put like that... I'll work on that position then." },
      trial: { text: "Three more matches, and if it doesn't work we'll change it.", response: "That works for me. I'll stick at it until then." },
    },
  },
  sub_ritual: {
    title: 'Hooked too early',
    message: "Boss, you take me off on the hour every single time. It feels like you don't trust me to last.",
    choices: {
      full: { text: "Next match, you play the full ninety.", response: "That's all I wanted to hear. Cheers boss." },
      physical: { text: "It's physical: you drop off after sixty minutes.", response: "...I'll work on my stamina then." },
      tactical: { text: "It's tactical, not personal. You're vital early on.", response: "Okay, if it's a deliberate call I can live with it." },
    },
  },

  // ============================================================
  // ÂGE
  // ============================================================
  young_player: {
    title: 'The impatience of youth',
    message: "Boss, I know I'm young but I feel like I'm good enough. When am I going to get regular minutes?",
    choices: {
      promote: { text: "You're ready. You're starting on Sunday.", response: "YES! You won't regret it, boss!" },
      patience: { text: "Your turn will come, keep improving.", response: "Pfff... feels like I've been hearing that for months." },
      plan: { text: "I'll draw up a personalised development plan for you.", response: "Now that's cool! At least I know I'm on your mind." },
    },
  },
  young_head: {
    title: 'Head getting turned',
    message: "Boss, since I've been playing well there are agents ringing me every day. They're promising me the earth.",
    choices: {
      ground: { text: "Keep your feet on the ground. You've won nothing yet.", response: "You're right boss, I'm getting ahead of myself." },
      protect: { text: "Give them my number, I'll deal with it.", response: "Cheers! I was completely out of my depth with all that." },
      free: { text: "It's your career, handle it how you like.", response: "Ah... right. I'll have to sort it out myself then." },
    },
  },
  studies: {
    title: 'Football and school',
    message: "Boss, my parents want me to keep studying alongside this. But I can't manage both at once.",
    choices: {
      both: { text: "We'll work around your timetable. Both matter.", response: "Cheers boss! My parents will be relieved." },
      football: { text: "Football first. It's now or never.", response: "That's what I thought too. I'm putting everything into it." },
      safety: { text: "Keep your studies. A career can end tomorrow.", response: "Wise words, boss. I'll organise myself better." },
    },
  },
  veteran_retire: {
    title: 'End of the road',
    message: "Boss... I think it's nearly over for me. My body doesn't keep up the way it used to.",
    choices: {
      stay: { text: "You've still got things to give this squad.", response: "Thanks boss. I'll give everything right to the end." },
      role: { text: "How would you feel about a mentoring role with the youngsters?", response: "I'd love that! Passing it on matters." },
      honest: { text: "It might well be time to hang them up, yes.", response: "...That's hard to hear, but you might be right." },
    },
  },
  coaching_badges: {
    title: 'Life after football',
    message: "Boss, I'm starting to think about what's next. I could see myself coaching. What do you reckon?",
    choices: {
      fund: { text: "The club will pay for your badges. Start right away.", response: "You're changing my life, boss. Thank you, truly." },
      shadow: { text: "Come and watch my sessions, you'll learn quicker.", response: "Gladly! I've got so much to learn from you." },
      focus: { text: "Finish your playing career first. One thing at a time.", response: "You're probably right, I'm spreading myself thin." },
    },
  },

  // ============================================================
  // SPÉCIFIQUE AU POSTE
  // ============================================================
  gk_confidence: {
    title: "Keeper's doubts",
    message: "Boss, it's lonely in goal. One mistake and it's a goal. I'm starting to dread coming for crosses.",
    choices: {
      specific: { text: "We'll work on crosses every day this week.", response: "That's exactly what I need. Cheers boss." },
      trust: { text: "You're my number one. Full stop. Play with freedom.", response: "That takes a huge weight off me, boss." },
      coach_gk: { text: "I'm bringing in a goalkeeping coach.", response: "At last! I've been waiting for that for ages." },
    },
  },
  gk_defense: {
    title: 'The defence in front of me',
    message: "Boss, I'm shipping goals but the defence keeps leaving me one-on-one with strikers. We need to talk about the shape back there.",
    choices: {
      listen: { text: "You've got an eye for it. We'll go through the back line together.", response: "Thanks for listening, I see things from back there that you can't." },
      lead: { text: "It's on you to organise them. Make yourself heard.", response: "You're right, I'll start shouting." },
      dismiss: { text: "Start by saving the ones that are actually yours.", response: "...Message received, boss." },
    },
  },
  striker_drought: {
    title: "Striker's drought",
    message: "Boss, I haven't scored in ages. I'm getting the chances but the second I'm through on goal, I think too much.",
    choices: {
      finishing: { text: "A hundred strikes a day after training. Let's go.", response: "They'll start going in. I'll work until my legs fall off." },
      relax: { text: "Stop counting your goals. They'll come back.", response: "You're right, I put too much pressure on myself." },
      assist: { text: "Don't score, make them score. The rest will follow.", response: "Huh, I hadn't looked at it like that. That frees me up." },
    },
  },
  striker_service: {
    title: 'Starved of the ball',
    message: "Boss, I don't get a touch up there. I spend the whole match running into space and the midfielders never find me.",
    choices: {
      tactics: { text: "I'll tell the midfielders to look for you earlier.", response: "Cheers boss, give me the ball and I'll give you three goals." },
      movement: { text: "Move more: it's on you to make yourself available.", response: "Maybe I don't drop in enough, that's fair." },
      talk: { text: "Go and speak to them yourself, player to player.", response: "Good idea, we'll sort it out in the dressing room." },
    },
  },
  defender_thankless: {
    title: 'The unseen work',
    message: "Boss, we defend well and nobody says a word. Only the goalscorers get any credit at this club.",
    choices: {
      praise: { text: "You're right. I'll say so publicly after the match.", response: "That means more than you think, boss. Thank you." },
      pro: { text: "That's the job. The people who know, know.", response: "I suppose... but it still stings a bit." },
      bonus: { text: "A bonus for the defence every clean sheet.", response: "Now you're talking! We'll bolt the door back there." },
    },
  },
  mid_freedom: {
    title: 'Freedom in midfield',
    message: "Boss, you're asking me to do everything: defend, link up, create. I finish matches dead on my feet and I'm not good at any of it.",
    choices: {
      simplify: { text: "I'm freeing you from the defensive work. Just create.", response: "At last! You'll see what I can do with fresh legs." },
      partner: { text: "I'll put someone alongside you to share the load.", response: "That'll change everything, cheers boss." },
      engine: { text: "You're the engine of this team. I need all of it.", response: "If you're counting on me that much, I'll hold up." },
    },
  },

  // ============================================================
  // CONTEXTE D'ÉQUIPE
  // ============================================================
  losing_streak: {
    title: 'The spiral',
    message: "Boss, we keep losing and the dressing room's falling apart. Some of them are starting to turn on each other. We need to do something.",
    choices: {
      meeting: { text: "Crisis meeting tomorrow. We get it all out.", response: "It'll do us good to clear the air." },
      shield: { text: "I'll take it all on myself in front of the press. You lot, just play.", response: "Respect, boss. We'll fight for you." },
      shake: { text: "I'm going to shake things up. Nobody's place is safe.", response: "Message received. We'll wake up." },
    },
  },
  winning_streak: {
    title: 'Walking on air',
    message: "Boss, we're flying! The lads really believe. Some of them are already talking about promotion...",
    choices: {
      humble: { text: "We talk about nothing. Match by match.", response: "You're right, we mustn't get carried away." },
      believe: { text: "Why not? Dream, but work twice as hard.", response: "We'll give everything, boss! Nothing's stopping us!" },
      reward: { text: "You've earned it: special bonus for the whole squad.", response: "The lads are going to go mad! Cheers boss!" },
    },
  },
  relegation_fear: {
    title: 'Fear of going down',
    message: "Boss, we're down near the bottom and you can see it in people's heads now. The lads are playing scared.",
    choices: {
      calm: { text: "We're good enough. We'll get out of this, I guarantee it.", response: "Your calm does us good, boss. We believe." },
      urgency: { text: "Yes, we're in trouble. And it needs to show on the pitch.", response: "It's true we're not aggressive enough. That'll change." },
      simplify: { text: "We simplify everything: sit deep, stop conceding.", response: "At least we'll have a clear plan. That's reassuring." },
    },
  },
  promotion_push: {
    title: 'The home straight',
    message: "Boss, we're well placed. A few matches left and it's all decided now. What are we doing?",
    choices: {
      allin: { text: "We go all in. The first eleven plays every match, no rotation.", response: "We won't let up, boss, even if we end up on our knees." },
      manage: { text: "We manage it: rotation and fresh legs right to the end.", response: "Sensible. We'll be fresh when it matters." },
      pressure: { text: "No pressure at all. Enjoy it, that's the best part.", response: "That takes the edge off, cheers boss. We'll have some fun." },
    },
  },
  leaky_defense: {
    title: 'Conceding too many',
    message: "Boss, we concede every single match. Even when we play well going forward, we end up cracking at the back.",
    choices: {
      drill: { text: "A full week on our defensive shape.", response: "We need it. We can't carry on like this." },
      keeper: { text: "It's individuals too. Everyone owns their mistakes.", response: "Hmm... I hope that doesn't cause friction." },
      compact: { text: "We tighten the block. Less madness, more discipline.", response: "That should steady us, good call boss." },
    },
  },
  low_division_pride: {
    title: 'Ambition on hold',
    message: "Boss, honestly... what am I doing at this level? I feel like I'm wasting my time here.",
    choices: {
      project: { text: "We're going up, and you'll be the face of it.", response: "You're making me want to believe. Let's do it together." },
      reality: { text: "Nobody's keeping you here. But here, you play.", response: "...True enough, minutes do count for something." },
      leader: { text: "Great players drag the others up with them. Prove it.", response: "Challenge accepted. I'll take them with me." },
    },
  },
  big_stage: {
    title: 'In at the deep end',
    message: "Boss, it hasn't sunk in yet. Playing at this level, in front of that crowd... I'm scared I won't be up to it.",
    choices: {
      deserve: { text: "You're here because you've earned it. End of.", response: "Cheers boss. I'll do this shirt proud." },
      step: { text: "Don't think about the crowd. Think about your first touch.", response: "Simple and effective. That's what I'll do." },
      pressure: { text: "Yes, it's another world. It's on you to adapt fast.", response: "Understood. I'll get myself up to it." },
    },
  },

  // ============================================================
  // ARGENT ET CONTRAT
  // ============================================================
  salary: {
    title: 'Asking for a rise',
    message: "Boss, given how I've been playing, I reckon I deserve better terms. Other clubs are offering more.",
    choices: {
      accept: { text: "You're right, you've earned it.", response: "Cheers boss! I won't let you down." },
      refuse: { text: "The budget won't allow it, sorry.", response: "That's disappointing... I'll have a think about things." },
      negotiate: { text: "I'll offer you a performance bonus instead.", response: "Hmm... that's a fair compromise. All right." },
    },
  },
  rival_interest: {
    title: 'Interest from another club',
    message: "Boss, I'll be straight with you. A club has been in touch and the offer's tempting. But I wanted to tell you first.",
    choices: {
      keep: { text: "You're essential here. Stay and we'll do great things.", response: "You know how to pick your words, boss. I'm staying." },
      angry: { text: "You want to leave? Then get on the bench.", response: "That's not fair! I came to you to be completely upfront..." },
      raise: { text: "I'll match their offer. Are you staying?", response: "Deal! Thanks for valuing me, boss." },
    },
  },
  pay_cut: {
    title: 'A gesture for the club',
    message: "Boss, I've heard money's tight. I'm willing to take a hit on my wages if it helps the club.",
    choices: {
      accept: { text: "I won't forget that gesture. Thank you.", response: "It's only right, boss. This club gave me everything." },
      refuse: { text: "Out of the question. You're worth your wages.", response: "Thanks for respecting me like that. I'll repay it on the pitch." },
      partial: { text: "I'll accept, but you'll get a bonus if we do well.", response: "Deal! We'll go and earn that bonus together." },
    },
  },
  sponsor_shoot: {
    title: 'A commercial offer',
    message: "Boss, a brand wants me to shoot an advert. It'd take two days out of my week. What do I do?",
    choices: {
      yes: { text: "Go on, it's exposure for the club.", response: "Cheers boss! I'll stay professional, promise." },
      no: { text: "No. Your week belongs to the pitch.", response: "Right... I'll tell them no then." },
      after: { text: "After the match, not before. Sunday's your priority.", response: "Fine by me, we'll push it back. Thanks for being flexible." },
    },
  },

  // ============================================================
  // VIE DE GROUPE
  // ============================================================
  team_spirit: {
    title: 'Dressing room atmosphere',
    message: "Boss, me and the lads wanted to organise a team meal this weekend. What do you reckon?",
    choices: {
      yes: { text: "Great idea! Have a good time.", response: "Brilliant! It'll bring the group together, you'll see!" },
      no: { text: "Not the right time, we've got a big match.", response: "Ah... okay boss. We'll do it another time." },
      join: { text: "I'm coming with you!", response: "Seriously, boss?! The lads are going to love that!" },
    },
  },
  dressing_room_music: {
    title: 'Music in the dressing room',
    message: "Boss, can we put music on in the dressing room before matches? It'd get us in the mood!",
    choices: {
      yes: { text: "Good idea, put on whatever you want.", response: "Ah nice one! The lads will love it, it'll fire us up!" },
      no: { text: "No, I want silence and concentration.", response: "Okay boss... we'll stay focused then." },
      compromise: { text: "Fine, but only until fifteen minutes before the warm-up.", response: "That works! Just enough to get us going." },
    },
  },
  clique: {
    title: 'Cliques in the squad',
    message: "Boss, you need to know: the squad's splitting. There are two cliques who don't speak off the pitch any more.",
    choices: {
      confront: { text: "I'll sort it tomorrow, everyone in the dressing room.", response: "We need to clear the air, or it'll poison the whole season." },
      mix: { text: "I'll mix up the rooms and the training groups.", response: "Clever. That'll force them to talk." },
      ignore: { text: "As long as they win together, the rest doesn't bother me.", response: "I hope you're right, boss..." },
    },
  },
  newcomer: {
    title: 'Struggling to fit in',
    message: "Boss, I can't find my place in this group. Nobody's unkind, but I feel like an outsider.",
    choices: {
      buddy: { text: "I'll pair you up with one of the senior lads. He'll show you the ropes.", response: "That'd help me a lot, cheers boss." },
      speak: { text: "Make the first move. Nobody's going to come and find you.", response: "You're right, maybe I hold back too much." },
      event: { text: "We'll organise something with the group this week.", response: "That'd be great, it'd break the ice." },
    },
  },
  referee_anger: {
    title: 'Fuming at the referee',
    message: "Boss, that referee robbed us. We can't let it go, we've got to lodge a complaint!",
    choices: {
      complain: { text: "I'll handle it. You, focus on the next match.", response: "Thanks for backing us, boss." },
      refuse: { text: "You don't win matches in an office. We move on.", response: "It's frustrating but... you're right." },
      discipline: { text: "And our two stupid bookings, was that the referee as well?", response: "...Fair point. We've got our share of the blame." },
    },
  },
  fan_contact: {
    title: 'The supporters',
    message: "Boss, the fans wait for us after every training session. Some of the lads are finding it a bit much.",
    choices: {
      embrace: { text: "They're the ones who keep this club alive. Go and see them.", response: "You're right, they deserve our time." },
      limit: { text: "Half an hour a week, no more. You're professionals.", response: "Clear boundaries, that's better for everyone." },
      block: { text: "I'll have the gates shut. You need some peace.", response: "There'll be moaning outside, but we'll get some quiet." },
    },
  },

  // ============================================================
  // PRESSE ET EXTÉRIEUR
  // ============================================================
  media_pressure: {
    title: 'Media pressure',
    message: "Boss, the journalists won't stop having a go at me. It's hard to take, it's affecting my game.",
    choices: {
      protect: { text: "Ignore them. I'll handle the press for you.", response: "Cheers boss, that's a huge weight off." },
      face: { text: "You have to learn to deal with it, it's part of the job.", response: "You're right but it's not easy..." },
      social: { text: "Come off social media for a while.", response: "Not a bad shout. It'd help me refocus." },
    },
  },
  social_media_slip: {
    title: 'Social media slip-up',
    message: "Boss... I posted something last night that's gone down badly. It's everywhere, I don't know what to do.",
    choices: {
      apologize: { text: "You delete it, you apologise publicly, and we say no more about it.", response: "I'll do it right now. Sorry, boss." },
      fine: { text: "You're fined, and you apologise in front of the squad.", response: "That's fair. I'll take it." },
      support: { text: "We'll handle this together. The club will put out a statement.", response: "Thanks for not dropping me, boss. I won't forget it." },
    },
  },
  national_call: {
    title: 'The international call-up',
    message: "Boss! The national manager rang me! But it means missing a match with you...",
    choices: {
      go: { text: "Go, no hesitation. It's a source of pride for the club.", response: "Cheers boss! I'll fly the flag for the club out there!" },
      stay: { text: "I need you here. Turn it down this time.", response: "You're asking me to turn down my dream, boss..." },
      negotiate: { text: "Go, but come back in shape. No excuses when you're back.", response: "Promise, boss! I'll come back even stronger." },
    },
  },

  // ============================================================
  // DIVERS / PERSONNEL
  // ============================================================
  superstition: {
    title: 'A superstition',
    message: "Boss, I know this'll sound daft... but can I keep my warm-up top on during matches? It brings me luck.",
    choices: {
      yes: { text: "If it helps you perform, do it.", response: "Cheers boss! You're not laughing at me, that matters." },
      no: { text: "No. We're professionals, not witch doctors.", response: "Right... I'll have to do without it then." },
      tease: { text: "All right, but if you have a stinker I'm taking it off you!", response: "Haha, deal, boss! You're on!" },
    },
  },
  new_baby: {
    title: 'A new arrival',
    message: "Boss, my partner's due to give birth this week. I know we've got a match but...",
    choices: {
      family: { text: "Family first. We'll manage without you.", response: "Thanks boss... honestly. I'll make it up to you." },
      both: { text: "Be there for her, and join us if you can.", response: "That's the right balance. Thanks for understanding." },
      match: { text: "Match first. She'll understand.", response: "...I'll play, but my head won't be there, boss." },
    },
  },
  housing: {
    title: 'Housing trouble',
    message: "Boss, I'm struggling to find anywhere decent round here. I sleep badly and I do two hours of driving a day.",
    choices: {
      help: { text: "The club will find you somewhere near the training ground.", response: "You're saving me, boss! I'll finally be able to recover." },
      contact: { text: "I'll put you in touch with someone, you handle the rest.", response: "That's something at least, thanks for the hand." },
      no: { text: "That's your private life, sort it out yourself.", response: "Right... I'll carry on as I am then." },
    },
  },
  training_intensity: {
    title: 'Intensity of the sessions',
    message: "Boss, the sessions are brutal at the moment. Some of the lads reckon we turn up cooked at the weekend.",
    choices: {
      lighten: { text: "You're right, I'll ease off before matches.", response: "Thanks for listening, boss, we'll be fresher." },
      maintain: { text: "That's how you improve. Nothing changes.", response: "Right... we'll grit our teeth then." },
      individual: { text: "I'll tailor the workload player by player.", response: "That'd be ideal! Everyone's needs are different." },
    },
  },
  tactics_doubt: {
    title: 'Tactical doubts',
    message: "Boss, if I may... I think our system is working against us. We're too stretched, teams are walking through the middle.",
    choices: {
      listen: { text: "Tell me what you're seeing. I'm listening.", response: "Thanks for taking me seriously, boss. That's respect, that is." },
      partial: { text: "Interesting. I'll think about it for the next match.", response: "That's all I was asking for, thanks." },
      authority: { text: "Tactics are my department. Yours is the pitch.", response: "...Message received, boss. I'll keep my mouth shut next time." },
    },
  },
  loyalty: {
    title: 'Loyalty to the club',
    message: "Boss, I've been here a while now. I feel at home. I just wanted you to know that.",
    choices: {
      thanks: { text: "That means a great deal. You're a cornerstone here.", response: "Cheers boss. I'd finish my career here if it came to it." },
      symbol: { text: "You're the DNA of this club. I want everyone to know it.", response: "You're going to make me cry, boss... thank you." },
      neutral: { text: "Good. Keep it up.", response: "Ah... er, right boss. Have a good day." },
    },
  },

  // ============================================================
  // RELATIONS INTERNES
  // ============================================================
  teammate_conflict: {
    title: 'Trouble with a team-mate',
    message: "Boss, I can't play with him any more. On the pitch he winds me up, off it he blanks me. It's becoming unbearable.",
    choices: {
      mediate: { text: "The two of you are going to talk it out in front of me, right now.", response: "All right... maybe that's what it takes to clear the air." },
      separate: { text: "I'll keep you apart on the pitch, that'll avoid the friction.", response: "Cheers boss, that's a relief." },
      grow: { text: "You're professionals. Sort it out like adults.", response: "...Right. I was hoping for a bit more support." },
    },
  },
  coach_criticism: {
    title: 'A direct complaint',
    message: "Boss, I'll be blunt: I think your decisions are costing us points. Plenty in the dressing room think the same.",
    choices: {
      listen: { text: "Tell me exactly what isn't working.", response: "Thanks for not taking it badly. Shows you're solid." },
      authority: { text: "You play, I decide. That's how it works.", response: "Fine, boss. Message received." },
      challenge: { text: "Then show me on the pitch that I'm wrong.", response: "Count on me. I'll do my talking with my legs." },
    },
  },
  goal_celebration: {
    title: 'A controversial celebration',
    message: "Boss, my celebration set tongues wagging. I just wanted to answer the people who've been slaughtering me for weeks.",
    choices: {
      back: { text: "You've every right to answer back. I'll cover you.", response: "Cheers boss, it's good to be backed." },
      warn: { text: "Once, fine. Twice, and you're fined.", response: "Understood. I'll keep it low-key next time." },
      humble: { text: "Celebrate with your team-mates, not against other people.", response: "You're right, it's the team that matters." },
    },
  },
  agent_pressure: {
    title: 'Pressure from his agent',
    message: "Boss, my agent's pushing me to leave. I'm happy here, but he says I'm wasting my career.",
    choices: {
      talk_agent: { text: "Give me his number, I'll have a word with him.", response: "Cheers, I can't stand up to him on my own any more." },
      decide: { text: "It's your career, not his. Make your own mind up.", response: "You're right. I'm taking back control." },
      door: { text: "If he wants you gone, the door's open.", response: "I just told you I wanted to stay, boss..." },
    },
  },

  // ============================================================
  // AMBITION ET CARRIÈRE
  // ============================================================
  contract_end: {
    title: 'Contract running down',
    message: "Boss, my contract's up soon and nobody's mentioned an extension. Should I be worried?",
    choices: {
      extend: { text: "We'll extend, you matter to me.", response: "That's a huge relief. Cheers boss." },
      wait: { text: "We'll revisit it at the end of the season, based on your form.", response: "So I've got to prove myself... noted." },
      honest: { text: "I don't intend to renew. Better you know early.", response: "At least that's clear. I'll look elsewhere." },
    },
  },
  europe_dream: {
    title: 'European dream',
    message: "Boss, do you reckon we can aim for Europe one day with this club? I need to believe in it to get up in the morning.",
    choices: {
      believe: { text: "We'll get there. And you'll be here when we do.", response: "That's all I wanted to hear. Let's go." },
      steps: { text: "One step at a time. Let's finish top first.", response: "Sensible. I'll focus on the next match." },
      realist: { text: "Honestly, not with the resources we've got.", response: "That hurts to hear, but thanks for being straight with me." },
    },
  },
  record_chase: {
    title: 'A record in sight',
    message: "Boss, I'm a few goals off the club record. It'd mean a lot to me to break it this season.",
    choices: {
      help: { text: "We'll help you. You're on penalties.", response: "Cheers boss! I'll give it everything." },
      collective: { text: "The record will come if the team wins. Think collective.", response: "You're right, I'm losing sight of things." },
      pressure: { text: "Don't put that pressure on yourself, it'll work against you.", response: "Probably... I'll try to let go of it." },
    },
  },

  // ============================================================
  // VIE QUOTIDIENNE
  // ============================================================
  language_barrier: {
    title: 'Language barrier',
    message: "Boss, I don't understand half of what's said. On the pitch I'm always a step behind the instructions.",
    choices: {
      lessons: { text: "The club will pay for intensive lessons.", response: "Thank you! That'll change everything for me." },
      translate: { text: "I'll have a team-mate translate the instructions for you.", response: "Good idea, that'll get me by in the meantime." },
      effort: { text: "Make the effort, you've been here long enough.", response: "I am trying, boss... it's not that simple." },
    },
  },
  sleep_baby: {
    title: 'Rough nights',
    message: "Boss, my little one's sleeping all over the place. I turn up to training absolutely wrecked.",
    choices: {
      rest: { text: "Come in later in the mornings this week.", response: "You're saving me, boss. Thanks for understanding." },
      nap: { text: "Compulsory nap at the club after lunch.", response: "That'll help me get through it, good idea." },
      pro: { text: "Everyone's got things going on. Sort it out.", response: "...Message received, boss." },
    },
  },
  homesick_transfer: {
    title: 'Wanting to go home',
    message: "Boss, a club back home has offered to take me. The level's lower but my family are there.",
    choices: {
      understand: { text: "If that's what makes you happy, I won't stand in your way.", response: "Thanks for understanding. I'll see the season out properly." },
      convince: { text: "Stay until the end of the season and we'll talk again after.", response: "All right. I owe you that much." },
      refuse: { text: "You've got a contract. You're staying.", response: "I was hoping for a bit of humanity, boss." },
    },
  },
  charity_involvement: {
    title: 'Community work',
    message: "Boss, I'd like to get involved with a charity for kids in the local area. It'd take one afternoon a week.",
    choices: {
      yes: { text: "Go on, it does you credit.", response: "Thank you! It really means a lot to me." },
      club: { text: "Better still: we'll do it in the club's name, with proper backing.", response: "Wow, you're thinking big! The kids are going to love it." },
      no: { text: "Concentrate on your season first.", response: "I thought you'd be proud... never mind." },
    },
  },
  gambling_worry: {
    title: 'A hard admission',
    message: "Boss... I've got a problem. I gamble, a lot. I can't get out of it and it's eating my head up.",
    choices: {
      help: { text: "We'll get you proper support. You're not on your own.", response: "I didn't dare bring it up... thanks for not judging me." },
      discreet: { text: "I'll find you help, and it stays between us.", response: "Discretion is what I needed most." },
      harsh: { text: "Sort it out yourself, that's your private life.", response: "...I was wrong to tell you." },
    },
  },

  // ============================================================
  // TACTIQUE ET TERRAIN
  // ============================================================
  set_pieces: {
    title: 'Set pieces',
    message: "Boss, we're dropping points from corners. I think we should be spending more time on them in training.",
    choices: {
      work: { text: "You're right. Dedicated session starting tomorrow.", response: "It'll win us points, you'll see." },
      specialist: { text: "I'll bring in a specialist.", response: "Now we're stepping up a level, cheers boss!" },
      later: { text: "We've got other priorities right now.", response: "Shame, that's a waste if you ask me." },
    },
  },
  penalty_taker: {
    title: 'Who takes the penalties?',
    message: "Boss, I'd like to be the designated taker. I've got the technique and I'm ice cold when it matters.",
    choices: {
      yes: { text: "You're the taker. Own it.", response: "You'll see, I'll stick them away." },
      compete: { text: "Whoever's best in training takes them.", response: "Challenge accepted, I'll work on it." },
      no: { text: "No, we're sticking with the current taker.", response: "Right... I hope he doesn't miss any." },
    },
  },
  opponent_analysis: {
    title: 'Analysing the opposition',
    message: "Boss, I've watched our next opponents' matches. Their full-back pushes on too far, there's something on in behind him.",
    choices: {
      use: { text: "Excellent. We'll build the plan around that.", response: "Brilliant! I'll get properly prepared for it." },
      praise: { text: "Well done for putting the work in. I'll take a look.", response: "Cheers boss, that makes me want to keep doing it." },
      dismiss: { text: "Analysis is my job.", response: "...I was only trying to help, boss." },
    },
  },
  fitness_doubt: {
    title: 'Doubts about the fitness coach',
    message: "Boss, several of the lads are complaining about the fitness sessions. We've been finishing matches on empty for weeks.",
    choices: {
      review: { text: "I'll go through the whole programme with the staff.", response: "Thanks for taking it seriously." },
      newstaff: { text: "I'm changing the fitness coach.", response: "Strong call. You can tell you want to win." },
      defend: { text: "The staff do their job properly. It's you lot who aren't putting it in.", response: "Message received... we'll grit our teeth then." },
    },
  },

  // ============================================================
  // DÉPART — le joueur a officiellement demandé à partir
  // ============================================================
  transfer_request_talk: {
    title: 'He wants out',
    message: "Boss, I've thought about it for a long time. I've asked to leave and I'm sticking to it. I don't feel like I belong here any more.",
    choices: {
      convince: { text: "Stay. I promise you a central role from next week.", response: "You've caught me off guard... all right, I'll withdraw my request." },
      money: { text: "I'll improve your contract. You matter to this club.", response: "That changes everything, boss. I'm staying and I'll prove it." },
      accept: { text: "I don't keep anyone against their will. You'll leave at the end of the season.", response: "At least that's clear. I'll see the season out properly." },
    },
  },
  wants_out_playtime: {
    title: 'Leaving to play',
    message: "Boss, I'm leaving because I don't play. It's as simple as that. Give me minutes or let me go.",
    choices: {
      starter: { text: "You start the next match. You have my word.", response: "That's all I was asking for. I'll withdraw my request." },
      rotation: { text: "I'll guarantee you a place in the rotation, nothing more.", response: "Hmm... it's better than nothing. I'll think it over." },
      refuse: { text: "You'll play when you're good enough. Not before.", response: "Then there's nothing left for me here. Thanks anyway." },
    },
  },
  wants_out_ambition: {
    title: 'Too big for the club',
    message: "Boss, you know as well as I do that I'm good enough to play higher. It's nothing against you, but I have to think about my career.",
    choices: {
      project: { text: "We go up this year, and you go up with us. Stay.", response: "You're giving me a reason to believe. I'm staying." },
      captain: { text: "I'll make you the cornerstone of the project, with the armband.", response: "Now that gets to me. Forget about me leaving." },
      let_go: { text: "You're right, you deserve better. I'll let you go.", response: "Thanks for your honesty, boss. That means something." },
    },
  },
  unhappy_warning: {
    title: 'Before it is too late',
    message: "Boss, I'd rather say it to your face than behind your back: things aren't right. If nothing changes, I'm going to ask to leave.",
    choices: {
      listen: { text: "Tell me exactly what's wrong and we'll fix it.", response: "Thanks for listening. That alone puts me right again." },
      effort: { text: "I'll make an effort, but so do you on the pitch.", response: "Fair deal. I'll stick to it." },
      dismiss: { text: "Not everyone's happy. That's the job.", response: "...You've just made your decision, not me." },
    },
  },
  dressing_room_split: {
    title: 'The dressing room is emptying',
    message: "Boss, several lads want out and you can feel it in training. The group's coming apart, we've got to do something.",
    choices: {
      meeting: { text: "Full squad meeting tomorrow. We start again from scratch.", response: "About time. It'll do everyone good." },
      core: { text: "Those who want to leave will leave. We build with the rest.", response: "Clear message. The ones who stay will be tight." },
      deny: { text: "There's no problem in this dressing room.", response: "Closing your eyes won't fix anything, boss." },
    },
  },
  farewell: {
    title: 'Goodbyes',
    message: "Boss, the season's ending and I'm off. I wanted to thank you all the same, I've learned a lot here.",
    choices: {
      honor: { text: "You'll get a send-off at the last match. You've earned it.", response: "That means an awful lot. Thank you for everything." },
      lastchance: { text: "There's still time to change your mind, you know.", response: "...You don't give up, do you. All right, I'm staying." },
      cold: { text: "All the best. The club will replace you.", response: "That just confirms I've made the right choice." },
    },
  },
};
