/**
 * Conversations joueur -> coach.
 *
 * Chaque entrée expose :
 *   id       identifiant stable (sert à retrouver le choix côté serveur)
 *   title    titre affiché
 *   message  ce que dit le joueur
 *   weight   poids de tirage (défaut 1). Les dialogues contextuels sont pondérés
 *            plus haut pour ne pas être noyés sous les dialogues génériques.
 *   when     prédicat (player, ctx) -> booléen. Absent = toujours éligible.
 *   choices  réponses possibles, avec effets et réplique du joueur.
 *
 * Effets reconnus par season.js : morale, stamina, overall, budget.
 * `budget` est multiplié par l'échelle de la division (x1 en R2 -> x25 en L1).
 *
 * `when` est une fonction : elle disparaît à la sérialisation JSON, le client
 * ne reçoit donc que les données d'affichage.
 */

// ---------- Prédicats réutilisables ----------
const isGK = p => p.position === 'GAR';
const isDef = p => ['DC', 'ARG', 'ARD', 'PG', 'PD'].includes(p.position);
const isMid = p => ['MC', 'MOC', 'MDF', 'MG', 'MD'].includes(p.position);
const isAtt = p => ['BU', 'AIG', 'AID'].includes(p.position);

const CONVERSATIONS = [
  // ============================================================
  // MORAL BAS
  // ============================================================
  {
    id: 'homesick',
    title: 'Mal du pays',
    weight: 3,
    when: p => p.morale <= 50,
    message: "Coach, je voulais vous parler... Ma famille me manque beaucoup. J'ai du mal à me concentrer ces derniers temps.",
    choices: [
      { id: 'support', text: "Je comprends. Prends quelques jours pour toi.", effects: { morale: 15, stamina: -10 }, response: "Merci coach, ça me touche vraiment. Je reviendrai plus fort." },
      { id: 'tough', text: "On a tous des sacrifices à faire. Concentre-toi sur le terrain.", effects: { morale: -5, stamina: 5 }, response: "...D'accord coach. Je vais essayer." },
      { id: 'help', text: "Je vais voir ce qu'on peut faire pour rapprocher ta famille.", effects: { morale: 20, budget: -50000 }, response: "Vraiment ? Vous feriez ça ? Merci infiniment coach !" },
    ],
  },
  {
    id: 'bad_form',
    title: 'Passage à vide',
    weight: 3,
    when: p => p.morale <= 55,
    message: "Coach, je sais que je suis pas bon en ce moment. Je sais pas ce qui se passe, je perds confiance à chaque match.",
    choices: [
      { id: 'encourage', text: "Ça arrive aux meilleurs. Je crois en toi.", effects: { morale: 12 }, response: "Merci coach... ça fait du bien d'entendre ça." },
      { id: 'bench', text: "Prends du recul depuis le banc, observe.", effects: { morale: -3, stamina: 15 }, response: "Peut-être que ça me fera du bien de souffler un peu..." },
      { id: 'train', text: "On va travailler ensemble après l'entraînement.", effects: { morale: 8, overall: 1, stamina: -10 }, response: "Sérieux ? OK coach, je suis chaud !" },
    ],
  },
  {
    id: 'sleepless',
    title: 'Nuits blanches',
    weight: 3,
    when: p => p.morale <= 45,
    message: "Coach, je dors plus. Je repasse mes actions en boucle la nuit, et le matin je suis vidé avant même de commencer.",
    choices: [
      { id: 'psy', text: "Je te mets en contact avec un préparateur mental.", effects: { morale: 14, budget: -40000 }, response: "J'osais pas le demander... merci coach, vraiment." },
      { id: 'unplug', text: "Coupe tout : vidéo, stats, réseaux. Pendant une semaine.", effects: { morale: 8, stamina: 8 }, response: "Ça va être dur mais vous avez raison, j'en peux plus." },
      { id: 'ignore', text: "Tout le monde passe par là. Ça se soigne en jouant.", effects: { morale: -8 }, response: "Ouais... j'imagine que je dois juste serrer les dents." },
    ],
  },
  {
    id: 'mistake_guilt',
    title: 'La faute qui reste',
    weight: 2,
    when: (p, ctx) => p.morale <= 55 && ctx.streak.type === 'loss',
    message: "Coach, la boulette du dernier match... c'est de ma faute si on a perdu. Les gars me disent rien mais je le sens.",
    choices: [
      { id: 'shield', text: "Je prends la responsabilité publiquement. Tu joues dimanche.", effects: { morale: 18 }, response: "Vous me sauvez la vie coach. Je vais tout rendre sur le terrain." },
      { id: 'collective', text: "On perd à onze. Personne ne te tient pour responsable.", effects: { morale: 10 }, response: "Merci... j'avais besoin de l'entendre." },
      { id: 'blunt', text: "Oui, c'était une erreur grossière. Ne la refais pas.", effects: { morale: -12, overall: 1 }, response: "...Compris coach. Ça n'arrivera plus." },
    ],
  },

  // ============================================================
  // MORAL HAUT
  // ============================================================
  {
    id: 'captain_material',
    title: 'Leadership',
    weight: 3,
    when: p => p.morale >= 75,
    message: "Coach, je voulais vous dire que je suis prêt à prendre plus de responsabilités. Le brassard de capitaine, ça m'intéresserait.",
    choices: [
      { id: 'accept', text: "Tu es le capitaine à partir d'aujourd'hui.", effects: { morale: 20 }, response: "Je ne vous décevrai pas coach. Je vais montrer l'exemple !" },
      { id: 'refuse', text: "Pas encore, prouve-le d'abord sur la durée.", effects: { morale: -5 }, response: "Je comprends... Je vais continuer à bosser." },
      { id: 'later', text: "On en reparle en fin de saison.", effects: { morale: 3 }, response: "D'accord, je serai patient." },
    ],
  },
  {
    id: 'on_fire',
    title: 'En pleine confiance',
    weight: 3,
    when: p => p.morale >= 80,
    message: "Coach, je me sens intouchable en ce moment. Laissez-moi plus de liberté devant, je sens que je peux faire la différence.",
    choices: [
      { id: 'freedom', text: "Vas-y, joue ton football. Je te fais confiance.", effects: { morale: 12, overall: 1 }, response: "Merci coach ! Vous allez voir ce que je vaux." },
      { id: 'humble', text: "Reste dans le cadre. C'est le collectif qui te porte.", effects: { morale: -4 }, response: "Vous avez raison... je m'emballe peut-être un peu." },
      { id: 'challenge', text: "Prouve-le : je te veux décisif trois matchs de suite.", effects: { morale: 8, stamina: -8 }, response: "Pari tenu coach. Comptez sur moi." },
    ],
  },
  {
    id: 'mentor_offer',
    title: 'Envie de transmettre',
    weight: 2,
    when: p => p.morale >= 70 && p.age >= 27,
    message: "Coach, y'a des jeunes qui galèrent dans le groupe. Je peux en prendre un sous mon aile si vous voulez.",
    choices: [
      { id: 'yes', text: "Excellente initiative. Occupe-toi d'eux.", effects: { morale: 12 }, response: "Ça marche ! Je vais leur montrer comment on bosse ici." },
      { id: 'formal', text: "On va structurer ça : tu deviens référent du groupe.", effects: { morale: 16, stamina: -5 }, response: "Waouh, vous me donnez un vrai rôle. Merci coach." },
      { id: 'no', text: "Occupe-toi d'abord de ton propre niveau.", effects: { morale: -10 }, response: "...Je voulais juste aider, coach." },
    ],
  },

  // ============================================================
  // FORME PHYSIQUE
  // ============================================================
  {
    id: 'injury_fear',
    title: 'Peur de la blessure',
    weight: 3,
    when: p => p.stamina <= 50,
    message: "Coach, j'ai une douleur au genou depuis quelques jours. J'ai peur de me blesser gravement si je continue à jouer.",
    choices: [
      { id: 'rest', text: "Repose-toi, ta santé passe avant tout.", effects: { stamina: 30, morale: 10 }, response: "Merci coach, je préfère être prudent." },
      { id: 'push', text: "On a besoin de toi. Serre les dents.", effects: { stamina: -15, morale: -8 }, response: "Bon... je vais essayer de tenir, mais j'ai un mauvais pressentiment." },
      { id: 'medical', text: "Va voir le médecin et on avise.", effects: { stamina: 15, morale: 5 }, response: "Bonne idée. Je vous tiens au courant." },
    ],
  },
  {
    id: 'overloaded',
    title: 'Trop de matchs',
    weight: 3,
    when: p => p.stamina <= 45 && p.is_starter,
    message: "Coach, j'ai enchaîné tous les matchs sans souffler. Les jambes suivent plus, je me sens lourd dès la mi-temps.",
    choices: [
      { id: 'rotate', text: "Je te sors du onze le prochain match. Récupère.", effects: { stamina: 25, morale: -3 }, response: "Ça me fait mal de le dire mais... j'en ai besoin. Merci." },
      { id: 'lighten', text: "Entraînement allégé pour toi cette semaine.", effects: { stamina: 15, morale: 6 }, response: "Nickel coach, ça va me remettre d'aplomb." },
      { id: 'need', text: "Impossible, tu es indispensable. Tiens bon.", effects: { stamina: -8, morale: 8 }, response: "Entendre ça me redonne de l'énergie. J'y vais." },
    ],
  },
  {
    id: 'diet',
    title: 'Question de régime',
    weight: 2,
    when: p => p.stamina <= 65,
    message: "Coach, un pote m'a parlé d'un nutritionniste. Je me demande si mon alimentation me pénalise pas.",
    choices: [
      { id: 'hire', text: "On engage un nutritionniste pour tout le groupe.", effects: { stamina: 20, morale: 10, budget: -60000 }, response: "Ça va profiter à tout le monde ! Merci coach." },
      { id: 'self', text: "Discipline-toi tout seul, c'est ton métier.", effects: { morale: -5, stamina: 5 }, response: "OK... je vais me renseigner de mon côté." },
      { id: 'advice', text: "Je te donne quelques règles simples à suivre.", effects: { stamina: 10, morale: 5 }, response: "Parfait, je m'y tiens dès ce soir." },
    ],
  },

  // ============================================================
  // TEMPS DE JEU / BANC
  // ============================================================
  {
    id: 'not_playing',
    title: 'Frustration du banc',
    weight: 3,
    when: p => !p.is_starter,
    message: "Coach, ça fait plusieurs matchs que je suis sur le banc. Je ne comprends pas, je m'entraîne dur tous les jours.",
    choices: [
      { id: 'promise', text: "Tu auras ta chance bientôt, sois patient.", effects: { morale: 5 }, response: "OK coach... J'espère que vous tiendrez parole." },
      { id: 'honest', text: "Il y a mieux que toi à ce poste pour l'instant.", effects: { morale: -10, stamina: 10 }, response: "C'est dur à entendre mais... je vais bosser encore plus." },
      { id: 'motivate', text: "Montre-moi à l'entraînement que tu mérites ta place.", effects: { morale: 8, overall: 1 }, response: "Vous avez raison. Je vais tout donner pour revenir !" },
    ],
  },
  {
    id: 'wasted_talent',
    title: 'Un talent qui moisit',
    weight: 4,
    when: p => !p.is_starter && p.overall >= 68,
    message: "Coach, soyons honnêtes : j'ai le niveau pour être titulaire ici. Si vous comptez pas sur moi, dites-le et je chercherai ailleurs.",
    choices: [
      { id: 'starter', text: "Tu as raison. Tu commences le prochain match.", effects: { morale: 20, stamina: -5 }, response: "Merci de le reconnaître. Je vais vous le rendre au centuple." },
      { id: 'explain', text: "Ton profil ne colle pas à ce qu'on met en place.", effects: { morale: -12 }, response: "Au moins c'est clair. Je vais réfléchir à mon avenir." },
      { id: 'compete', text: "Personne n'est intouchable. Va chercher ta place.", effects: { morale: 4, overall: 1 }, response: "C'est tout ce que je demandais : une vraie chance." },
    ],
  },
  {
    id: 'position_change',
    title: 'Changement de poste',
    weight: 3,
    when: p => p.is_starter,
    message: "Coach, vous me faites jouer à un poste où je me sens pas à l'aise. Je peux rendre bien plus dans mon registre naturel.",
    choices: [
      { id: 'listen', text: "Tu as raison, je te remets à ton poste.", effects: { morale: 15 }, response: "Merci de m'écouter coach, ça change tout." },
      { id: 'versatile', text: "Un bon joueur s'adapte. C'est une force, pas une punition.", effects: { morale: -5, overall: 1 }, response: "Vu comme ça... je vais bosser ce poste alors." },
      { id: 'trial', text: "Encore trois matchs, et si ça marche pas on change.", effects: { morale: 6 }, response: "Ça me va. Je m'accroche jusque-là." },
    ],
  },
  {
    id: 'sub_ritual',
    title: 'Sorti trop tôt',
    weight: 2,
    when: p => p.is_starter && p.morale <= 65,
    message: "Coach, vous me sortez systématiquement à l'heure de jeu. J'ai l'impression que vous me faites pas confiance sur la longueur.",
    choices: [
      { id: 'full', text: "Le prochain match, tu joues les 90 minutes.", effects: { morale: 14, stamina: -12 }, response: "C'est tout ce que je voulais entendre. Merci coach." },
      { id: 'physical', text: "C'est physique : tu baisses de pied après 60 minutes.", effects: { morale: -6, stamina: 10 }, response: "...Je vais travailler mon endurance alors." },
      { id: 'tactical', text: "C'est tactique, pas personnel. Tu es précieux en début de match.", effects: { morale: 7 }, response: "OK, si c'est un choix assumé je l'accepte." },
    ],
  },

  // ============================================================
  // ÂGE
  // ============================================================
  {
    id: 'young_player',
    title: 'Impatience de la jeunesse',
    weight: 3,
    when: p => p.age <= 21,
    message: "Coach, j'ai l'âge mais je sens que j'ai le niveau. Quand est-ce que je vais avoir du temps de jeu régulier ?",
    choices: [
      { id: 'promote', text: "T'es prêt. Tu seras titulaire dimanche.", effects: { morale: 20, stamina: -5 }, response: "YES ! Vous allez pas le regretter coach !" },
      { id: 'patience', text: "Ton tour viendra, continue à progresser.", effects: { morale: -3 }, response: "Pfff... j'ai l'impression d'entendre ça depuis des mois." },
      { id: 'plan', text: "Je te fais un plan de développement personnalisé.", effects: { morale: 10, overall: 1 }, response: "Ah ça c'est cool ! Au moins je sais que vous pensez à moi." },
    ],
  },
  {
    id: 'young_head',
    title: 'La tête qui tourne',
    weight: 3,
    when: p => p.age <= 22 && p.morale >= 70,
    message: "Coach, depuis mes bonnes perfs y'a des agents qui m'appellent tous les jours. On me promet monts et merveilles.",
    choices: [
      { id: 'ground', text: "Garde les pieds sur terre. Tu n'as encore rien gagné.", effects: { morale: -6, overall: 1 }, response: "Vous avez raison coach, je m'emballe." },
      { id: 'protect', text: "Donne-leur mon numéro, je m'en occupe.", effects: { morale: 14 }, response: "Merci ! J'étais complètement dépassé par tout ça." },
      { id: 'free', text: "C'est ta carrière, gère-la comme tu l'entends.", effects: { morale: 3 }, response: "Ah... OK. Je vais devoir me débrouiller alors." },
    ],
  },
  {
    id: 'studies',
    title: 'Le foot et les études',
    weight: 2,
    when: p => p.age <= 20,
    message: "Coach, mes parents veulent que je continue mes études en parallèle. Mais j'arrive pas à tout mener de front.",
    choices: [
      { id: 'both', text: "On aménage tes horaires. Les deux sont importants.", effects: { morale: 16, stamina: -5 }, response: "Merci coach ! Mes parents vont être rassurés." },
      { id: 'football', text: "Le foot d'abord. C'est maintenant ou jamais.", effects: { morale: 5, overall: 1, stamina: -5 }, response: "C'est ce que je pensais aussi. Je mise tout là-dessus." },
      { id: 'safety', text: "Garde tes études. Une carrière, ça peut s'arrêter demain.", effects: { morale: 8 }, response: "Sage conseil coach. Je vais m'organiser mieux." },
    ],
  },
  {
    id: 'veteran_retire',
    title: 'Fin de carrière',
    weight: 3,
    when: p => p.age >= 32,
    message: "Coach... je pense que c'est bientôt la fin pour moi. Mon corps ne suit plus comme avant.",
    choices: [
      { id: 'stay', text: "Tu as encore des choses à apporter à ce groupe.", effects: { morale: 10 }, response: "Merci coach. Je donnerai tout jusqu'au bout." },
      { id: 'role', text: "Que dirais-tu d'un rôle de mentor pour les jeunes ?", effects: { morale: 15 }, response: "J'adorerais ça ! Transmettre, c'est important." },
      { id: 'honest', text: "C'est peut-être le moment de raccrocher, oui.", effects: { morale: -15 }, response: "...C'est dur à entendre, mais vous avez peut-être raison." },
    ],
  },
  {
    id: 'coaching_badges',
    title: 'L\'après-carrière',
    weight: 2,
    when: p => p.age >= 31,
    message: "Coach, je commence à penser à la suite. Je me verrais bien entraîneur. Vous en pensez quoi ?",
    choices: [
      { id: 'fund', text: "Le club te paie tes diplômes. Commence dès maintenant.", effects: { morale: 18, budget: -70000 }, response: "Vous me changez la vie coach. Merci du fond du cœur." },
      { id: 'shadow', text: "Viens observer mes séances, tu apprendras plus vite.", effects: { morale: 13 }, response: "Avec plaisir ! J'ai tellement à apprendre de vous." },
      { id: 'focus', text: "Finis ta carrière d'abord. Une chose à la fois.", effects: { morale: -4 }, response: "Vous avez sans doute raison, je m'éparpille." },
    ],
  },

  // ============================================================
  // SPÉCIFIQUE AU POSTE
  // ============================================================
  {
    id: 'gk_confidence',
    title: 'Doutes du gardien',
    weight: 4,
    when: p => isGK(p) && p.morale <= 60,
    message: "Coach, dans les buts on est seul. Une erreur et c'est un but. Je commence à appréhender les sorties aériennes.",
    choices: [
      { id: 'specific', text: "On bosse les sorties tous les jours cette semaine.", effects: { morale: 10, overall: 1, stamina: -8 }, response: "C'est exactement ce qu'il me faut. Merci coach." },
      { id: 'trust', text: "Tu es mon numéro un. Point. Joue libéré.", effects: { morale: 16 }, response: "Ça me libère d'un poids énorme coach." },
      { id: 'coach_gk', text: "Je recrute un entraîneur des gardiens.", effects: { morale: 12, overall: 1, budget: -80000 }, response: "Enfin ! J'attendais ça depuis longtemps." },
    ],
  },
  {
    id: 'gk_defense',
    title: 'La défense devant moi',
    weight: 3,
    when: (p, ctx) => isGK(p) && ctx.goalsAgainst > ctx.goalsFor,
    message: "Coach, je prends des buts mais la défense me laisse seul face aux attaquants. Faut qu'on parle de l'organisation derrière.",
    choices: [
      { id: 'listen', text: "Tu as l'œil. On revoit le bloc défensif ensemble.", effects: { morale: 14, overall: 1 }, response: "Merci de m'écouter, je vois des choses d'en bas que vous voyez pas." },
      { id: 'lead', text: "C'est à toi de les diriger. Fais-toi entendre.", effects: { morale: 6 }, response: "Vous avez raison, je vais donner de la voix." },
      { id: 'dismiss', text: "Commence par arrêter les ballons qui te concernent.", effects: { morale: -14 }, response: "...Bien reçu coach." },
    ],
  },
  {
    id: 'striker_drought',
    title: 'Disette du buteur',
    weight: 4,
    when: p => isAtt(p) && p.morale <= 60,
    message: "Coach, ça fait des matchs que je marque plus. J'ai les occasions mais dès que je suis face au but, je réfléchis trop.",
    choices: [
      { id: 'finishing', text: "Cent frappes par jour après l'entraînement. On y va.", effects: { overall: 1, stamina: -12, morale: 5 }, response: "Ça va rentrer, je vais bosser jusqu'à plus sentir mes jambes." },
      { id: 'relax', text: "Arrête de compter tes buts. Ils reviendront.", effects: { morale: 12 }, response: "Vous avez raison, je me mets trop la pression." },
      { id: 'assist', text: "Marque pas, fais marquer. Le reste suivra.", effects: { morale: 8, overall: 1 }, response: "Tiens, j'avais pas vu les choses comme ça. Ça me débloque." },
    ],
  },
  {
    id: 'striker_service',
    title: 'Manque de ballons',
    weight: 3,
    when: p => isAtt(p) && p.is_starter,
    message: "Coach, je touche pas un ballon devant. Je passe le match à courir dans le vide, les milieux me trouvent jamais.",
    choices: [
      { id: 'tactics', text: "Je vais demander aux milieux de te chercher plus tôt.", effects: { morale: 13 }, response: "Merci coach, avec des ballons je vous en mets trois." },
      { id: 'movement', text: "Bouge davantage : c'est à toi de te rendre disponible.", effects: { morale: -5, overall: 1, stamina: -5 }, response: "Peut-être que je décroche pas assez, c'est vrai." },
      { id: 'talk', text: "Va leur parler directement, entre joueurs.", effects: { morale: 7 }, response: "Bonne idée, on va régler ça dans le vestiaire." },
    ],
  },
  {
    id: 'defender_thankless',
    title: 'Le travail de l\'ombre',
    weight: 3,
    when: p => isDef(p),
    message: "Coach, on défend bien mais personne en parle. Y'a que les buteurs qui ont droit aux compliments dans ce club.",
    choices: [
      { id: 'praise', text: "Tu as raison. Je le dirai publiquement après le match.", effects: { morale: 15 }, response: "Ça compte plus que vous croyez coach. Merci." },
      { id: 'pro', text: "C'est le métier. Les vrais connaisseurs te voient.", effects: { morale: 2 }, response: "J'imagine... mais ça fait quand même quelque chose." },
      { id: 'bonus', text: "Prime pour la défense à chaque match sans encaisser.", effects: { morale: 18, budget: -60000 }, response: "Là vous parlez ! On va tout verrouiller derrière." },
    ],
  },
  {
    id: 'mid_freedom',
    title: 'Liberté au milieu',
    weight: 3,
    when: p => isMid(p),
    message: "Coach, vous me demandez de tout faire : défendre, relayer, créer. Je finis les matchs à l'agonie sans être bon nulle part.",
    choices: [
      { id: 'simplify', text: "Je te libère des tâches défensives. Crée, c'est tout.", effects: { morale: 14, stamina: 8 }, response: "Enfin ! Vous allez voir ce que je vaux avec des jambes fraîches." },
      { id: 'partner', text: "Je te mets un joueur à côté pour t'épauler.", effects: { morale: 11 }, response: "Ça va tout changer, merci coach." },
      { id: 'engine', text: "Tu es le moteur de cette équipe. J'ai besoin de tout ça.", effects: { morale: 6, stamina: -10 }, response: "Si vous comptez sur moi à ce point, je tiendrai." },
    ],
  },

  // ============================================================
  // CONTEXTE D'ÉQUIPE
  // ============================================================
  {
    id: 'losing_streak',
    title: 'La spirale',
    weight: 5,
    when: (p, ctx) => ctx.streak.type === 'loss' && ctx.streak.count >= 3,
    message: "Coach, on enchaîne les défaites et le vestiaire part en vrille. Certains commencent à se tirer dessus. Il faut faire quelque chose.",
    choices: [
      { id: 'meeting', text: "Réunion de crise demain. On vide notre sac.", effects: { morale: 12 }, response: "Ça va faire du bien de crever l'abcès." },
      { id: 'shield', text: "Je prends tout sur moi devant la presse. Vous, jouez.", effects: { morale: 15 }, response: "Respect coach. On va se battre pour vous." },
      { id: 'shake', text: "Je vais secouer le cocotier. Personne n'a sa place assurée.", effects: { morale: -8, overall: 1 }, response: "Message reçu. On va se réveiller." },
    ],
  },
  {
    id: 'winning_streak',
    title: 'Sur un nuage',
    weight: 5,
    when: (p, ctx) => ctx.streak.type === 'win' && ctx.streak.count >= 3,
    message: "Coach, on est en feu ! Les gars y croient à fond. Certains parlent déjà de la montée...",
    choices: [
      { id: 'humble', text: "On ne parle de rien. Match après match.", effects: { morale: 4, overall: 1 }, response: "Vous avez raison, faut pas s'enflammer." },
      { id: 'believe', text: "Pourquoi pas ? Rêvez, mais bossez deux fois plus.", effects: { morale: 16, stamina: -6 }, response: "On va tout donner coach ! Rien ne nous arrête !" },
      { id: 'reward', text: "Vous le méritez : prime exceptionnelle pour le groupe.", effects: { morale: 20, budget: -90000 }, response: "Les gars vont devenir fous ! Merci coach !" },
    ],
  },
  {
    id: 'relegation_fear',
    title: 'La peur de descendre',
    weight: 4,
    when: (p, ctx) => ctx.played >= 8 && ctx.losses > ctx.wins + 3,
    message: "Coach, on est mal classés et ça commence à se voir dans les têtes. Les gars jouent avec la peur au ventre.",
    choices: [
      { id: 'calm', text: "On a le niveau. On va s'en sortir, je vous le garantis.", effects: { morale: 14 }, response: "Votre calme nous fait du bien coach. On y croit." },
      { id: 'urgency', text: "Oui, on est en danger. Et il faut que ça se voie sur le terrain.", effects: { morale: -6, overall: 1 }, response: "C'est vrai qu'on manque d'agressivité. Ça va changer." },
      { id: 'simplify', text: "On simplifie tout : bloc bas, on ne prend plus de buts.", effects: { morale: 8, stamina: -5 }, response: "Au moins on aura un plan clair. Ça rassure." },
    ],
  },
  {
    id: 'promotion_push',
    title: 'La dernière ligne droite',
    weight: 4,
    when: (p, ctx) => ctx.played >= 15 && ctx.wins > ctx.losses + 4,
    message: "Coach, on est bien placés. Il reste quelques matchs et tout se joue maintenant. Qu'est-ce qu'on fait ?",
    choices: [
      { id: 'allin', text: "On joue tout. Les titulaires enchaînent, pas de rotation.", effects: { morale: 12, stamina: -15 }, response: "On lâchera rien coach, quitte à finir sur les rotules." },
      { id: 'manage', text: "On gère : rotation et fraîcheur jusqu'au bout.", effects: { stamina: 20, morale: 4 }, response: "Sage. On sera frais au moment décisif." },
      { id: 'pressure', text: "Aucune pression. Profitez, c'est ça le plus beau.", effects: { morale: 15 }, response: "Ça détend, merci coach. On va se régaler." },
    ],
  },
  {
    id: 'leaky_defense',
    title: 'On encaisse trop',
    weight: 3,
    when: (p, ctx) => ctx.played >= 6 && ctx.goalsAgainst >= ctx.goalsFor + 6,
    message: "Coach, on prend des buts à chaque match. Même quand on joue bien devant, on finit par craquer derrière.",
    choices: [
      { id: 'drill', text: "Semaine complète sur l'organisation défensive.", effects: { overall: 1, stamina: -10, morale: 4 }, response: "Il le faut. On peut pas continuer comme ça." },
      { id: 'keeper', text: "Ça vient aussi des individualités. Chacun ses responsabilités.", effects: { morale: -7 }, response: "Hmm... j'espère que ça va pas créer des tensions." },
      { id: 'compact', text: "On resserre le bloc. Moins de folie, plus de rigueur.", effects: { morale: 8 }, response: "Ça devrait nous stabiliser, bonne idée coach." },
    ],
  },
  {
    id: 'low_division_pride',
    title: 'Ambition contrariée',
    weight: 3,
    when: (p, ctx) => ctx.division <= 2 && p.overall >= 62,
    message: "Coach, franchement... qu'est-ce que je fais à ce niveau ? J'ai l'impression de perdre mon temps ici.",
    choices: [
      { id: 'project', text: "On va monter, et tu seras le visage de cette montée.", effects: { morale: 16 }, response: "Vous me donnez envie d'y croire. On y va ensemble." },
      { id: 'reality', text: "Personne ne te retient. Mais ici, tu joues.", effects: { morale: -8 }, response: "...C'est vrai que le temps de jeu, ça compte." },
      { id: 'leader', text: "Les grands joueurs tirent les autres vers le haut. Prouve-le.", effects: { morale: 6, overall: 1 }, response: "Défi accepté. Je vais les emmener avec moi." },
    ],
  },
  {
    id: 'big_stage',
    title: 'Le grand bain',
    weight: 3,
    when: (p, ctx) => ctx.division >= 6,
    message: "Coach, je réalise pas encore. Jouer à ce niveau, devant ce public... j'ai peur de pas être à la hauteur.",
    choices: [
      { id: 'deserve', text: "Tu es là parce que tu le mérites. Point final.", effects: { morale: 16 }, response: "Merci coach. Je vais honorer ce maillot." },
      { id: 'step', text: "Ne pense pas au public. Pense au premier ballon.", effects: { morale: 10, overall: 1 }, response: "Simple et efficace. Je vais faire comme ça." },
      { id: 'pressure', text: "Oui, c'est un autre monde. À toi de t'adapter vite.", effects: { morale: -5, stamina: 5 }, response: "Message reçu. Je vais me mettre au niveau." },
    ],
  },

  // ============================================================
  // ARGENT ET CONTRAT
  // ============================================================
  {
    id: 'salary',
    title: 'Demande d\'augmentation',
    message: "Coach, avec mes performances récentes, je pense mériter une revalorisation salariale. Les autres clubs proposent mieux.",
    choices: [
      { id: 'accept', text: "Tu as raison, tu le mérites.", effects: { morale: 15, budget: -100000 }, response: "Merci coach ! Je ne vous décevrai pas." },
      { id: 'refuse', text: "Le budget ne le permet pas, désolé.", effects: { morale: -12 }, response: "C'est décevant... Je vais y réfléchir." },
      { id: 'negotiate', text: "Je te propose une prime au résultat.", effects: { morale: 5, budget: -30000 }, response: "Hmm... c'est un compromis acceptable. D'accord." },
    ],
  },
  {
    id: 'rival_interest',
    title: 'Intérêt d\'un autre club',
    weight: 3,
    when: p => p.overall >= 65,
    message: "Coach, je vais être honnête avec vous. Un club m'a contacté et l'offre est intéressante. Mais je voulais vous en parler d'abord.",
    choices: [
      { id: 'keep', text: "Tu es essentiel ici. Reste et on fera de grandes choses.", effects: { morale: 10 }, response: "Vous savez trouver les mots coach. Je reste." },
      { id: 'angry', text: "Tu veux partir ? Alors va sur le banc.", effects: { morale: -20 }, response: "C'est injuste ! Je suis venu vous parler en toute transparence..." },
      { id: 'raise', text: "Je m'aligne sur leur offre. Tu restes ?", effects: { morale: 15, budget: -150000 }, response: "Deal ! Merci de me valoriser coach." },
    ],
  },
  {
    id: 'pay_cut',
    title: 'Un geste pour le club',
    weight: 2,
    when: p => p.morale >= 70 && p.age >= 28,
    message: "Coach, j'ai entendu dire que les caisses étaient serrées. Je suis prêt à faire un geste sur mon salaire si ça aide le club.",
    choices: [
      { id: 'accept', text: "Ce geste, je ne l'oublierai pas. Merci.", effects: { morale: 8, budget: 80000 }, response: "C'est normal coach. Ce club m'a tout donné." },
      { id: 'refuse', text: "Hors de question. Tu vaux ton salaire.", effects: { morale: 14 }, response: "Merci de me respecter comme ça. Je le rendrai sur le terrain." },
      { id: 'partial', text: "J'accepte, mais tu auras un bonus si on réussit.", effects: { morale: 12, budget: 40000 }, response: "Marché conclu ! On va aller chercher ce bonus ensemble." },
    ],
  },
  {
    id: 'sponsor_shoot',
    title: 'Sollicitation commerciale',
    weight: 2,
    when: p => p.overall >= 60,
    message: "Coach, une marque veut me faire tourner une pub. Ça prendrait deux jours sur ma semaine. Je fais quoi ?",
    choices: [
      { id: 'yes', text: "Vas-y, ça fait de la visibilité au club.", effects: { morale: 10, stamina: -10, budget: 60000 }, response: "Merci coach ! Je reste pro, promis." },
      { id: 'no', text: "Non. Ta semaine, c'est le terrain.", effects: { morale: -8, stamina: 5 }, response: "Bon... je vais leur dire non alors." },
      { id: 'after', text: "Après le match, pas avant. Ta priorité c'est dimanche.", effects: { morale: 5, budget: 30000 }, response: "Ça marche, on décale. Merci de votre souplesse." },
    ],
  },

  // ============================================================
  // VIE DE GROUPE
  // ============================================================
  {
    id: 'team_spirit',
    title: 'Ambiance dans le vestiaire',
    message: "Coach, les gars et moi on voulait organiser un repas d'équipe ce week-end. Vous en pensez quoi ?",
    choices: [
      { id: 'yes', text: "Excellente idée ! Amusez-vous bien.", effects: { morale: 10, stamina: -5 }, response: "Super ! Ça va souder le groupe, vous verrez !" },
      { id: 'no', text: "Pas le moment, on a un match important.", effects: { morale: -5, stamina: 5 }, response: "Ah... OK coach. On remet ça à plus tard." },
      { id: 'join', text: "Je viens avec vous !", effects: { morale: 15 }, response: "Sérieux coach ?! Les gars vont être trop contents !" },
    ],
  },
  {
    id: 'dressing_room_music',
    title: 'Musique dans le vestiaire',
    message: "Coach, on peut mettre de la musique dans le vestiaire avant les matchs ? Ça nous mettrait dans l'ambiance !",
    choices: [
      { id: 'yes', text: "Bonne idée, mettez ce que vous voulez.", effects: { morale: 8 }, response: "Ah nice ! Les gars vont kiffer, ça va nous booster !" },
      { id: 'no', text: "Non, je veux du silence et de la concentration.", effects: { morale: -3 }, response: "OK coach... on reste focus alors." },
      { id: 'compromise', text: "OK mais que 15 minutes avant l'échauffement.", effects: { morale: 5 }, response: "Ça marche ! Juste ce qu'il faut pour se mettre dedans." },
    ],
  },
  {
    id: 'clique',
    title: 'Des clans dans le groupe',
    weight: 2,
    when: (p, ctx) => ctx.squadSize >= 16,
    message: "Coach, faut que vous sachiez : le groupe se divise. Y'a deux clans qui se parlent plus en dehors du terrain.",
    choices: [
      { id: 'confront', text: "Je règle ça demain, tout le monde dans le vestiaire.", effects: { morale: 10 }, response: "Il faut crever l'abcès, sinon ça va pourrir la saison." },
      { id: 'mix', text: "Je vais mélanger les chambres et les groupes d'entraînement.", effects: { morale: 12 }, response: "Malin. Ça les forcera à se parler." },
      { id: 'ignore', text: "Tant qu'ils gagnent ensemble, le reste m'importe peu.", effects: { morale: -6 }, response: "J'espère que vous avez raison coach..." },
    ],
  },
  {
    id: 'newcomer',
    title: 'Difficile intégration',
    weight: 2,
    when: p => p.morale <= 60,
    message: "Coach, j'arrive pas à trouver ma place dans ce groupe. Personne est méchant, mais je me sens à part.",
    choices: [
      { id: 'buddy', text: "Je te mets en binôme avec un ancien. Il te guidera.", effects: { morale: 14 }, response: "Ça m'aiderait beaucoup, merci coach." },
      { id: 'speak', text: "Fais le premier pas. Personne ne viendra te chercher.", effects: { morale: -4, overall: 1 }, response: "Vous avez raison, je suis peut-être trop en retrait." },
      { id: 'event', text: "On organise quelque chose avec le groupe cette semaine.", effects: { morale: 11, stamina: -5 }, response: "Ce serait top, ça briserait la glace." },
    ],
  },
  {
    id: 'referee_anger',
    title: 'Rancune contre l\'arbitrage',
    weight: 2,
    when: (p, ctx) => ctx.streak.type === 'loss',
    message: "Coach, l'arbitre nous a volés. On peut pas laisser passer ça, il faut porter réclamation !",
    choices: [
      { id: 'complain', text: "Je m'en occupe. Toi, concentre-toi sur le prochain match.", effects: { morale: 10 }, response: "Merci de nous soutenir coach." },
      { id: 'refuse', text: "On ne gagne pas de match dans les bureaux. On avance.", effects: { morale: -4, overall: 1 }, response: "C'est frustrant mais... c'est vrai." },
      { id: 'discipline', text: "Et nos deux cartons stupides, c'est l'arbitre aussi ?", effects: { morale: -8, stamina: 5 }, response: "...Touché. On a nos torts aussi." },
    ],
  },
  {
    id: 'fan_contact',
    title: 'Les supporters',
    weight: 2,
    message: "Coach, les supporters nous attendent après chaque entraînement. Certains gars trouvent ça pesant.",
    choices: [
      { id: 'embrace', text: "Ce sont eux qui font vivre le club. Allez les voir.", effects: { morale: 12 }, response: "Vous avez raison, ils méritent notre temps." },
      { id: 'limit', text: "Une demi-heure par semaine, pas plus. Vous êtes des pros.", effects: { morale: 5 }, response: "Un cadre clair, c'est mieux pour tout le monde." },
      { id: 'block', text: "Je fais fermer l'accès. Vous avez besoin de calme.", effects: { morale: -6, stamina: 8 }, response: "Ça va râler dehors, mais on sera plus tranquilles." },
    ],
  },

  // ============================================================
  // PRESSE ET EXTÉRIEUR
  // ============================================================
  {
    id: 'media_pressure',
    title: 'Pression médiatique',
    message: "Coach, les journalistes n'arrêtent pas de me critiquer. C'est dur à supporter, ça affecte mon jeu.",
    choices: [
      { id: 'protect', text: "Ignore-les. Je vais gérer la presse pour toi.", effects: { morale: 10 }, response: "Merci coach, vous me retirez un poids énorme." },
      { id: 'face', text: "Tu dois apprendre à gérer ça, ça fait partie du métier.", effects: { morale: -3 }, response: "Vous avez raison mais c'est pas facile..." },
      { id: 'social', text: "Coupe les réseaux sociaux pendant un moment.", effects: { morale: 7, stamina: 5 }, response: "Pas bête. Ça me permettra de me recentrer." },
    ],
  },
  {
    id: 'social_media_slip',
    title: 'Dérapage sur les réseaux',
    weight: 2,
    when: p => p.age <= 25,
    message: "Coach... j'ai posté un truc hier soir qui passe mal. Ça tourne partout, je sais pas quoi faire.",
    choices: [
      { id: 'apologize', text: "Tu supprimes, tu t'excuses publiquement, et on n'en parle plus.", effects: { morale: 5 }, response: "Je fais ça tout de suite. Désolé coach." },
      { id: 'fine', text: "Amende, et tu t'excuses devant le groupe.", effects: { morale: -12, overall: 1 }, response: "C'est mérité. Je l'accepte." },
      { id: 'support', text: "On gère ça ensemble. Le club fera une communication.", effects: { morale: 12, budget: -40000 }, response: "Merci de pas me lâcher coach. Je l'oublierai pas." },
    ],
  },
  {
    id: 'national_call',
    title: 'Appel de la sélection',
    weight: 3,
    when: p => p.overall >= 72,
    message: "Coach ! Le sélectionneur m'a appelé ! Mais ça veut dire manquer un match avec vous...",
    choices: [
      { id: 'go', text: "Vas-y sans hésiter. C'est une fierté pour le club.", effects: { morale: 20, stamina: -12 }, response: "Merci coach ! Je porterai les couleurs du club là-bas !" },
      { id: 'stay', text: "J'ai besoin de toi ici. Décline cette fois.", effects: { morale: -18 }, response: "Vous me demandez de refuser mon rêve, coach..." },
      { id: 'negotiate', text: "Vas-y, mais tu reviens en forme. Pas d'excuse au retour.", effects: { morale: 14, stamina: -8 }, response: "Promis coach ! Je reviendrai encore plus fort." },
    ],
  },

  // ============================================================
  // DIVERS / PERSONNEL
  // ============================================================
  {
    id: 'superstition',
    title: 'Une superstition',
    weight: 2,
    message: "Coach, je sais que ça va vous paraître bête... mais je peux garder mon maillot d'échauffement pendant les matchs ? Ça me porte chance.",
    choices: [
      { id: 'yes', text: "Si ça t'aide à être performant, fais-le.", effects: { morale: 8 }, response: "Merci coach ! Vous rigolez pas de moi, ça compte." },
      { id: 'no', text: "Non. On est des professionnels, pas des sorciers.", effects: { morale: -6 }, response: "Bon... je vais devoir m'en passer." },
      { id: 'tease', text: "D'accord, mais si tu rates un match je te l'enlève !", effects: { morale: 11 }, response: "Ahah ça marche coach ! Pari tenu !" },
    ],
  },
  {
    id: 'new_baby',
    title: 'Une naissance',
    weight: 2,
    when: p => p.age >= 24,
    message: "Coach, ma compagne va accoucher cette semaine. Je sais qu'on a un match mais...",
    choices: [
      { id: 'family', text: "Ta famille d'abord. On se débrouillera sans toi.", effects: { morale: 22, stamina: 10 }, response: "Merci coach... vraiment. Je vous revaudrai ça." },
      { id: 'both', text: "Sois là pour elle, et rejoins-nous si tu peux.", effects: { morale: 15 }, response: "C'est le bon équilibre. Merci de comprendre." },
      { id: 'match', text: "Le match d'abord. Elle comprendra.", effects: { morale: -20 }, response: "...Je vais jouer, mais la tête sera pas là, coach." },
    ],
  },
  {
    id: 'housing',
    title: 'Problème de logement',
    weight: 2,
    when: p => p.morale <= 65,
    message: "Coach, je galère à me loger correctement dans le coin. Je dors mal, je fais deux heures de route par jour.",
    choices: [
      { id: 'help', text: "Le club te trouve un logement près du centre.", effects: { morale: 16, stamina: 12, budget: -50000 }, response: "Vous me sauvez coach ! Je vais enfin pouvoir récupérer." },
      { id: 'contact', text: "Je te mets en relation avec quelqu'un, tu gères le reste.", effects: { morale: 8, stamina: 5 }, response: "C'est déjà ça, merci pour le coup de main." },
      { id: 'no', text: "C'est ta vie privée, débrouille-toi.", effects: { morale: -10 }, response: "Bon... je vais continuer comme ça alors." },
    ],
  },
  {
    id: 'training_intensity',
    title: 'Intensité des séances',
    weight: 2,
    message: "Coach, les séances sont hyper dures en ce moment. Certains disent qu'on arrive cramés le week-end.",
    choices: [
      { id: 'lighten', text: "Vous avez raison, j'allège avant les matchs.", effects: { stamina: 18, morale: 8 }, response: "Merci de nous écouter coach, on sera plus frais." },
      { id: 'maintain', text: "C'est comme ça qu'on progresse. On ne change rien.", effects: { morale: -5, overall: 1 }, response: "Bon... on va serrer les dents alors." },
      { id: 'individual', text: "Je vais adapter la charge joueur par joueur.", effects: { stamina: 10, morale: 12, budget: -50000 }, response: "Ce serait l'idéal ! Chacun a des besoins différents." },
    ],
  },
  {
    id: 'tactics_doubt',
    title: 'Doutes tactiques',
    weight: 2,
    when: (p, ctx) => ctx.streak.type === 'loss' && p.overall >= 60,
    message: "Coach, je me permets... je pense que notre système nous dessert. On est trop étirés, les adversaires passent au milieu.",
    choices: [
      { id: 'listen', text: "Explique-moi ce que tu vois. Je t'écoute.", effects: { morale: 15, overall: 1 }, response: "Merci de me considérer coach. Ça montre du respect." },
      { id: 'partial', text: "Intéressant. J'y réfléchirai pour le prochain match.", effects: { morale: 8 }, response: "C'est tout ce que je demandais, merci." },
      { id: 'authority', text: "La tactique, c'est mon domaine. Le tien, c'est le terrain.", effects: { morale: -14 }, response: "...Bien reçu coach. Je la fermerai la prochaine fois." },
    ],
  },
  {
    id: 'loyalty',
    title: 'Fidélité au club',
    weight: 2,
    when: (p, ctx) => p.morale >= 75 && ctx.season >= 2,
    message: "Coach, ça fait un moment que je suis là maintenant. Je me sens chez moi. Je voulais juste que vous le sachiez.",
    choices: [
      { id: 'thanks', text: "Ça compte énormément. Tu es un pilier ici.", effects: { morale: 15 }, response: "Merci coach. Je finirai ma carrière ici s'il le faut." },
      { id: 'symbol', text: "Tu es l'ADN de ce club. Je veux que ça se sache.", effects: { morale: 18 }, response: "Vous allez me faire pleurer coach... merci." },
      { id: 'neutral', text: "Bien. Continue comme ça.", effects: { morale: -3 }, response: "Ah... euh, oui coach. Bonne journée." },
    ],
  },
];

/**
 * Contexte d'équipe transmis aux prédicats `when`.
 * Tolérant aux champs manquants pour rester utilisable partout.
 */
function buildContext(team = {}, squad = [], recentMatches = []) {
  const wins = team.wins || 0;
  const draws = team.draws || 0;
  const losses = team.losses || 0;

  // Série en cours, déduite des derniers matchs (le plus récent en premier).
  let streak = { type: 'none', count: 0 };
  for (const m of recentMatches) {
    if (!m || !m.outcome) break;
    if (streak.count === 0) streak = { type: m.outcome, count: 1 };
    else if (m.outcome === streak.type) streak.count++;
    else break;
  }

  return {
    team,
    squad,
    squadSize: squad.length,
    played: wins + draws + losses,
    wins, draws, losses,
    goalsFor: team.goals_for || 0,
    goalsAgainst: team.goals_against || 0,
    division: team.division || 1,
    season: team.season || 1,
    streak,
  };
}

/**
 * Tire une conversation pour ce joueur, pondérée : les dialogues contextuels
 * (poids élevé) passent devant les dialogues génériques toujours éligibles.
 */
function getRandomConversation(player, ctx = {}) {
  const context = ctx && ctx.streak ? ctx : buildContext(ctx.team, ctx.squad || [], ctx.recentMatches || []);

  const eligible = CONVERSATIONS.filter(c => {
    if (typeof c.when !== 'function') return true;
    try {
      return c.when(player, context);
    } catch {
      return false;
    }
  });

  if (eligible.length === 0) return null;

  const total = eligible.reduce((sum, c) => sum + (c.weight || 1), 0);
  let roll = Math.random() * total;
  for (const c of eligible) {
    roll -= c.weight || 1;
    if (roll <= 0) return c;
  }
  return eligible[eligible.length - 1];
}

module.exports = { CONVERSATIONS, getRandomConversation, buildContext };
