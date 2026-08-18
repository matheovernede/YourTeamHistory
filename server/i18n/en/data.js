/**
 * Traduction anglaise des données de jeu affichées au client.
 *
 * Les fichiers de server/data/ restent la source de vérité : ils portent les
 * niveaux, les dotations et les effets, et le nom français y sert d'identifiant.
 * On traduit donc à la sortie, en indexant par ce nom (voir `localiserDonnee`
 * dans server/i18n/index.js). Toute valeur absente d'une table retombe sur
 * l'original, ce qui permet de traduire partiellement sans rien casser.
 *
 * Conséquence directe : ce qui est ÉCRIT EN BASE (division_name, cup_result…)
 * doit continuer d'utiliser le nom français, sinon deux sauvegardes créées dans
 * deux langues ne seraient plus comparables.
 */

module.exports = {
  /**
   * Divisions (server/data/divisions.js).
   *
   * On ne translittère pas la pyramide française, on lui substitue l'échelle
   * anglaise équivalente : un joueur anglophone situe immédiatement son club
   * entre le football de comté et l'élite, ce que « Régional 2 » ne dit pas.
   */
  divisions: {
    'Regional 2': 'County League Two',
    'Regional 1': 'County League One',
    'National 3': 'Regional Premier',
    'National 2': 'National League North',
    'National': 'National League',
    'Ligue 2': 'Championship',
    'Ligue 1': 'Premier League',
  },

  /**
   * Sponsors (server/data/sponsors.js).
   *
   * Seuls les noms descriptifs sont traduits. Les marques réelles (Nike,
   * Decathlon, Crédit Agricole, Fly Emirates…) sont des noms propres : les
   * traduire les rendrait méconnaissables. Elles sont donc absentes de la
   * table et passent telles quelles.
   */
  sponsors: {
    'Boulangerie Dupont': 'Dupont Bakery',
    'Garage Martin': 'Martin Motors',
    'Pizza Chez Marco': "Marco's Pizzeria",
    'Mairie de la commune': 'Town Council',
    'Intermarché Local': 'Local Co-op',
    'Plomberie Duval': 'Duval Plumbing',
    'Bar Le Penalty': 'The Penalty Spot',
    'Auto-école Champion': 'Champion Driving School',
    'Conseil Régional': 'County Council',
  },

  /**
   * Descriptions des sponsors, traduites à part.
   *
   * Le nom peut rester en l'état (marque réelle) alors que sa description est
   * du texte courant : les deux champs ont donc leur propre table.
   */
  sponsorDescriptions: {
    // Palier local
    'Le boulanger du village soutient le club': 'The village baker backs the club',
    'Le garagiste du coin - ambiance familiale': 'The local mechanic - a family affair',
    "Pizzeria locale - les joueurs adorent les pizzas d'après-match":
      'Local pizzeria - the players love a post-match pizza',
    'Subvention municipale - image propre': 'Council grant - a clean image',
    'Supermarché du quartier': 'The neighbourhood supermarket',
    'Artisan local fidèle au club depuis 20 ans': 'A local tradesman loyal to the club for 20 years',
    'Le bar PMU du village - controversé mais généreux':
      'The village betting shop - controversial but generous',
    'Les jeunes du club passent le permis chez eux':
      'The club youngsters take their driving test there',

    // Palier national
    'Grande distribution - populaire et fiable': 'Supermarket chain - popular and reliable',
    'Banque régionale historique du football français':
      'A regional bank steeped in the history of French football',
    'Opérateur télécom - bonne visibilité': 'Telecoms operator - good exposure',
    'Livraison de repas - populaire chez les jeunes':
      'Food delivery - popular with younger supporters',
    'Sport accessible pour tous - image très positive':
      'Sport for everyone - a very positive image',
    'Paris hippiques - paye bien mais image moyenne':
      'Horse-racing betting - pays well but a middling image',
    'Boisson énergisante - boost physique mais controversé':
      'Energy drink - a fitness boost, but controversial',
    "Soutien institutionnel - bon pour l'image": 'Institutional backing - good for the image',

    // Palier Championship
    'Équipementier mondial - crédibilité assurée': 'Global kit supplier - instant credibility',
    'Marque historique du football': 'A historic name in football',
    'Site de paris - très lucratif mais controversé':
      'Betting site - highly lucrative but controversial',
    'Compagnie aérienne de luxe': 'Luxury airline',
    'Opérateur télécom, sponsor de la Ligue 2': 'Telecoms operator, Championship sponsor',
    'Assureur - stabilité et confiance': 'Insurer - stability and trust',
    'Poker/paris en ligne - très lucratif mais mal vu':
      'Online poker and betting - highly lucrative but frowned upon',
    'Grande distribution nationale': 'National supermarket chain',

    // Palier Premier League
    'Budget colossal mais très controversé éthiquement':
      'A colossal budget, but ethically very controversial',
    'Plateforme crypto - paye énormément mais très mal vu':
      'Crypto platform - pays enormously but is badly regarded',
    'Compagnie aérienne de luxe - prestige garanti': 'Luxury airline - prestige guaranteed',
    'Le plus grand équipementier mondial': "The world's biggest kit supplier",
    'Groupe hôtelier de luxe - image premium': 'Luxury hotel group - a premium image',
    'E-commerce japonais - bonne image internationale':
      'Japanese e-commerce - a good international image',
    'Paris en ligne - contrat massif mais très controversé':
      'Online betting - a huge deal but hugely controversial',
    'Tourisme rwandais - controversé mais bien payé':
      'Rwandan tourism - controversial but well paid',
  },
};
