const SPONSORS_BY_TIER = {
  regional: [
    { id: 'sponsor_boulanger', name: 'Boulangerie Dupont', logo: '🥖', tier: 'local', payment: 1500000, description: 'Le boulanger du village soutient le club', bonus: { morale: 8, reputation: 3 }, malus: {} },
    { id: 'sponsor_garage', name: 'Garage Martin', logo: '🔧', tier: 'local', payment: 2000000, description: 'Le garagiste du coin - ambiance familiale', bonus: { morale: 10 }, malus: {} },
    { id: 'sponsor_pizza', name: 'Pizza Chez Marco', logo: '🍕', tier: 'local', payment: 2500000, description: 'Pizzeria locale - les joueurs adorent les pizzas d\'après-match', bonus: { morale: 6 }, malus: { reputation: -2 } },
    { id: 'sponsor_mairie', name: 'Mairie de la commune', logo: '🏛️', tier: 'local', payment: 3000000, description: 'Subvention municipale - image propre', bonus: { reputation: 5 }, malus: {} },
    { id: 'sponsor_superette', name: 'Intermarché Local', logo: '🛒', tier: 'local', payment: 3500000, description: 'Supermarché du quartier', bonus: { morale: 4, reputation: 2 }, malus: {} },
    { id: 'sponsor_plombier', name: 'Plomberie Duval', logo: '🔧', tier: 'local', payment: 1500000, description: 'Artisan local fidèle au club depuis 20 ans', bonus: { morale: 5, reputation: 4 }, malus: {} },
    { id: 'sponsor_bar_pmu', name: 'Bar Le Penalty', logo: '🍺', tier: 'local', payment: 4000000, description: 'Le bar PMU du village - controversé mais généreux', bonus: { morale: 8 }, malus: { reputation: -5 } },
    { id: 'sponsor_auto_ecole', name: 'Auto-école Champion', logo: '🚗', tier: 'local', payment: 2000000, description: 'Les jeunes du club passent le permis chez eux', bonus: { morale: 3, reputation: 2 }, malus: {} },
  ],
  national: [
    { id: 'sponsor_leclerc', name: 'E.Leclerc', logo: '🛒', tier: 'standard', payment: 7000000, description: 'Grande distribution - populaire et fiable', bonus: { morale: 3, reputation: 5 }, malus: {} },
    { id: 'sponsor_credit_agricole', name: 'Crédit Agricole', logo: '🏦', tier: 'standard', payment: 8000000, description: 'Banque régionale historique du football français', bonus: { reputation: 8 }, malus: {} },
    { id: 'sponsor_orange', name: 'Orange', logo: '📱', tier: 'standard', payment: 10000000, description: 'Opérateur télécom - bonne visibilité', bonus: { reputation: 5, morale: 2 }, malus: {} },
    { id: 'sponsor_uber_eats', name: 'Uber Eats', logo: '🍔', tier: 'standard', payment: 12000000, description: 'Livraison de repas - populaire chez les jeunes', bonus: { morale: 5 }, malus: { reputation: -3 } },
    { id: 'sponsor_decathlon', name: 'Decathlon', logo: '🏃', tier: 'standard', payment: 8000000, description: 'Sport accessible pour tous - image très positive', bonus: { morale: 4, reputation: 6, stamina_boost: 5 }, malus: {} },
    { id: 'sponsor_pmu', name: 'PMU', logo: '🐎', tier: 'standard', payment: 14000000, description: 'Paris hippiques - paye bien mais image moyenne', bonus: { morale: 3 }, malus: { reputation: -6 } },
    { id: 'sponsor_energy_drink', name: 'Thunder Energy', logo: '⚡', tier: 'standard', payment: 11000000, description: 'Boisson énergisante - boost physique mais controversé', bonus: { stamina_boost: 10 }, malus: { reputation: -5 } },
    { id: 'sponsor_region', name: 'Conseil Régional', logo: '🏛️', tier: 'standard', payment: 6000000, description: 'Soutien institutionnel - bon pour l\'image', bonus: { reputation: 10 }, malus: {} },
  ],
  ligue2: [
    { id: 'sponsor_nike', name: 'Nike', logo: '✓', tier: 'premium', payment: 40000000, description: 'Équipementier mondial - crédibilité assurée', bonus: { morale: 5, reputation: 10 }, malus: {} },
    { id: 'sponsor_adidas', name: 'Adidas', logo: '⚽', tier: 'premium', payment: 35000000, description: 'Marque historique du football', bonus: { morale: 4, reputation: 8 }, malus: {} },
    { id: 'sponsor_betclic', name: 'BetClic', logo: '🎰', tier: 'premium', payment: 65000000, description: 'Site de paris - très lucratif mais controversé', bonus: {}, malus: { reputation: -12, morale: -3 } },
    { id: 'sponsor_emirates', name: 'Fly Emirates', logo: '✈️', tier: 'premium', payment: 50000000, description: 'Compagnie aérienne de luxe', bonus: { reputation: 8 }, malus: {} },
    { id: 'sponsor_sfr', name: 'SFR', logo: '📡', tier: 'standard', payment: 35000000, description: 'Opérateur télécom, sponsor de la Ligue 2', bonus: { reputation: 5, morale: 3 }, malus: {} },
    { id: 'sponsor_groupama', name: 'Groupama', logo: '🏢', tier: 'standard', payment: 30000000, description: 'Assureur - stabilité et confiance', bonus: { reputation: 6 }, malus: {} },
    { id: 'sponsor_winamax', name: 'Winamax', logo: '♠️', tier: 'premium', payment: 60000000, description: 'Poker/paris en ligne - très lucratif mais mal vu', bonus: { morale: 3 }, malus: { reputation: -10 } },
    { id: 'sponsor_carrefour', name: 'Carrefour', logo: '🛒', tier: 'standard', payment: 30000000, description: 'Grande distribution nationale', bonus: { morale: 3, reputation: 4 }, malus: {} },
  ],
  ligue1: [
    { id: 'sponsor_qatar', name: 'Qatar Airways', logo: '🌍', tier: 'premium', payment: 150000000, description: 'Budget colossal mais très controversé éthiquement', bonus: {}, malus: { reputation: -25, morale: -8 } },
    { id: 'sponsor_crypto', name: 'CryptoFi', logo: '₿', tier: 'premium', payment: 130000000, description: 'Plateforme crypto - paye énormément mais très mal vu', bonus: {}, malus: { reputation: -20, morale: -5 } },
    { id: 'sponsor_emirates_l1', name: 'Fly Emirates', logo: '✈️', tier: 'premium', payment: 100000000, description: 'Compagnie aérienne de luxe - prestige garanti', bonus: { reputation: 10, morale: 3 }, malus: {} },
    { id: 'sponsor_nike_l1', name: 'Nike', logo: '✓', tier: 'premium', payment: 80000000, description: 'Le plus grand équipementier mondial', bonus: { morale: 5, reputation: 12 }, malus: {} },
    { id: 'sponsor_accor', name: 'Accor Live Limitless', logo: '🏨', tier: 'premium', payment: 70000000, description: 'Groupe hôtelier de luxe - image premium', bonus: { reputation: 8, morale: 5 }, malus: {} },
    { id: 'sponsor_rakuten', name: 'Rakuten', logo: '🛍️', tier: 'premium', payment: 60000000, description: 'E-commerce japonais - bonne image internationale', bonus: { reputation: 6, morale: 3 }, malus: {} },
    { id: 'sponsor_betclic_l1', name: 'BetClic', logo: '🎰', tier: 'premium', payment: 120000000, description: 'Paris en ligne - contrat massif mais très controversé', bonus: {}, malus: { reputation: -15, morale: -5 } },
    { id: 'sponsor_visitrwanda', name: 'Visit Rwanda', logo: '🌍', tier: 'premium', payment: 75000000, description: 'Tourisme rwandais - controversé mais bien payé', bonus: { morale: 2 }, malus: { reputation: -8 } },
  ],
};

function getRandomSponsors(division, count = 4) {
  let pool;
  if (division <= 2) pool = SPONSORS_BY_TIER.regional;
  else if (division <= 4) pool = SPONSORS_BY_TIER.national;
  else if (division <= 6) pool = SPONSORS_BY_TIER.ligue2;
  else pool = SPONSORS_BY_TIER.ligue1;

  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

module.exports = { SPONSORS_BY_TIER, getRandomSponsors };
