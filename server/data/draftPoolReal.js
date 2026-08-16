/**
 * Joueurs réels ajoutés au marché, en complément de dreamTeamPlayers.js.
 *
 * Objectifs de cette liste :
 *  - couvrir les postes MG, MD, MDF, PG, PD, totalement absents du marché ;
 *  - élargir au-delà des cinq grands championnats (Serie A, Primeira Liga,
 *    Eredivisie, Süper Lig, Pro League, Liga Portugal, MLS, Brésil, Argentine) ;
 *  - fournir un vivier Ligue 2 crédible.
 *
 * `country` est la nationalité (stable dans le temps). Le champ `league` indique
 * le niveau de jeu habituel du joueur et sert au classement par palier : il peut
 * ne plus correspondre à son club actuel, les effectifs changeant à chaque
 * mercato.
 */

const EXTRA_REAL_PLAYERS = [
  // ===================== AILIERS / MILIEUX DE COULOIR (MG / MD) =====================
  { first_name: 'Vinicius', last_name: 'Junior', age: 25, position: 'MG', overall: 89, pace: 95, shooting: 82, passing: 78, dribbling: 92, defending: 30, physical: 68, league: 'La Liga', country: 'Brésil' },
  { first_name: 'Bukayo', last_name: 'Saka', age: 24, position: 'MD', overall: 87, pace: 86, shooting: 82, passing: 82, dribbling: 88, defending: 42, physical: 70, league: 'Premier League', country: 'Angleterre' },
  { first_name: 'Rafael', last_name: 'Leao', age: 26, position: 'MG', overall: 85, pace: 93, shooting: 80, passing: 72, dribbling: 88, defending: 28, physical: 74, league: 'Serie A', country: 'Portugal' },
  { first_name: 'Federico', last_name: 'Chiesa', age: 28, position: 'MD', overall: 83, pace: 88, shooting: 79, passing: 74, dribbling: 85, defending: 35, physical: 68, league: 'Serie A', country: 'Italie' },
  { first_name: 'Jeremy', last_name: 'Doku', age: 23, position: 'MG', overall: 83, pace: 95, shooting: 70, passing: 70, dribbling: 91, defending: 32, physical: 62, league: 'Premier League', country: 'Belgique' },
  { first_name: 'Nico', last_name: 'Williams', age: 23, position: 'MG', overall: 84, pace: 93, shooting: 76, passing: 74, dribbling: 87, defending: 34, physical: 66, league: 'La Liga', country: 'Espagne' },
  { first_name: 'Dani', last_name: 'Olmo', age: 27, position: 'MD', overall: 84, pace: 76, shooting: 80, passing: 84, dribbling: 86, defending: 44, physical: 64, league: 'La Liga', country: 'Espagne' },
  { first_name: 'Jamal', last_name: 'Musiala', age: 22, position: 'MG', overall: 86, pace: 82, shooting: 80, passing: 82, dribbling: 91, defending: 38, physical: 62, league: 'Bundesliga', country: 'Allemagne' },
  { first_name: 'Antony', last_name: 'Matheus', age: 26, position: 'MD', overall: 76, pace: 84, shooting: 72, passing: 70, dribbling: 82, defending: 30, physical: 60, league: 'Premier League', country: 'Brésil' },
  { first_name: 'Noa', last_name: 'Lang', age: 26, position: 'MG', overall: 78, pace: 85, shooting: 74, passing: 72, dribbling: 84, defending: 30, physical: 62, league: 'Eredivisie', country: 'Pays-Bas' },
  { first_name: 'Cody', last_name: 'Gakpo', age: 26, position: 'MG', overall: 82, pace: 82, shooting: 80, passing: 76, dribbling: 82, defending: 38, physical: 76, league: 'Premier League', country: 'Pays-Bas' },
  { first_name: 'Kenan', last_name: 'Yildiz', age: 21, position: 'MG', overall: 79, pace: 82, shooting: 76, passing: 76, dribbling: 85, defending: 32, physical: 62, league: 'Serie A', country: 'Turquie' },
  { first_name: 'Arda', last_name: 'Güler', age: 21, position: 'MD', overall: 80, pace: 76, shooting: 78, passing: 84, dribbling: 86, defending: 36, physical: 58, league: 'La Liga', country: 'Turquie' },
  { first_name: 'Malick', last_name: 'Fofana', age: 21, position: 'MG', overall: 76, pace: 90, shooting: 68, passing: 68, dribbling: 82, defending: 28, physical: 58, league: 'Ligue 1', country: 'Belgique' },
  { first_name: 'Bradley', last_name: 'Barcola', age: 23, position: 'MG', overall: 82, pace: 92, shooting: 76, passing: 74, dribbling: 84, defending: 30, physical: 62, league: 'Ligue 1', country: 'France' },
  { first_name: 'Ismaila', last_name: 'Sarr', age: 28, position: 'MD', overall: 78, pace: 90, shooting: 74, passing: 68, dribbling: 80, defending: 32, physical: 70, league: 'Premier League', country: 'Sénégal' },
  { first_name: 'Takefusa', last_name: 'Kubo', age: 24, position: 'MD', overall: 82, pace: 82, shooting: 76, passing: 80, dribbling: 87, defending: 40, physical: 58, league: 'La Liga', country: 'Japon' },
  { first_name: 'Kaoru', last_name: 'Mitoma', age: 28, position: 'MG', overall: 81, pace: 86, shooting: 74, passing: 74, dribbling: 88, defending: 38, physical: 66, league: 'Premier League', country: 'Japon' },
  { first_name: 'Mohammed', last_name: 'Kudus', age: 25, position: 'MD', overall: 81, pace: 84, shooting: 78, passing: 76, dribbling: 87, defending: 44, physical: 74, league: 'Premier League', country: 'Ghana' },
  { first_name: 'Jesper', last_name: 'Karlsson', age: 27, position: 'MG', overall: 74, pace: 82, shooting: 74, passing: 72, dribbling: 78, defending: 30, physical: 60, league: 'Serie A', country: 'Suède' },

  // ===================== PISTONS (PG / PD) =====================
  { first_name: 'Alphonso', last_name: 'Davies', age: 25, position: 'PG', overall: 84, pace: 95, shooting: 62, passing: 76, dribbling: 84, defending: 74, physical: 74, league: 'Bundesliga', country: 'Canada' },
  { first_name: 'Theo', last_name: 'Hernandez', age: 28, position: 'PG', overall: 84, pace: 90, shooting: 72, passing: 78, dribbling: 82, defending: 76, physical: 82, league: 'Serie A', country: 'France' },
  { first_name: 'Federico', last_name: 'Dimarco', age: 28, position: 'PG', overall: 84, pace: 82, shooting: 72, passing: 85, dribbling: 78, defending: 78, physical: 70, league: 'Serie A', country: 'Italie' },
  { first_name: 'Denzel', last_name: 'Dumfries', age: 29, position: 'PD', overall: 82, pace: 85, shooting: 70, passing: 72, dribbling: 74, defending: 78, physical: 84, league: 'Serie A', country: 'Pays-Bas' },
  { first_name: 'Pervis', last_name: 'Estupinan', age: 28, position: 'PG', overall: 80, pace: 86, shooting: 62, passing: 74, dribbling: 76, defending: 76, physical: 74, league: 'Serie A', country: 'Équateur' },
  { first_name: 'Jeremie', last_name: 'Frimpong', age: 25, position: 'PD', overall: 80, pace: 93, shooting: 68, passing: 72, dribbling: 82, defending: 70, physical: 68, league: 'Premier League', country: 'Pays-Bas' },
  { first_name: 'Alejandro', last_name: 'Grimaldo', age: 30, position: 'PG', overall: 83, pace: 78, shooting: 76, passing: 86, dribbling: 80, defending: 74, physical: 70, league: 'Bundesliga', country: 'Espagne' },
  { first_name: 'Pedro', last_name: 'Porro', age: 26, position: 'PD', overall: 81, pace: 82, shooting: 72, passing: 82, dribbling: 78, defending: 72, physical: 72, league: 'Premier League', country: 'Espagne' },
  { first_name: 'Destiny', last_name: 'Udogie', age: 23, position: 'PG', overall: 79, pace: 84, shooting: 64, passing: 72, dribbling: 78, defending: 74, physical: 78, league: 'Premier League', country: 'Italie' },
  { first_name: 'Nuno', last_name: 'Mendes', age: 23, position: 'PG', overall: 84, pace: 90, shooting: 62, passing: 76, dribbling: 82, defending: 80, physical: 76, league: 'Ligue 1', country: 'Portugal' },
  { first_name: 'Dodo', last_name: 'Silva', age: 27, position: 'PD', overall: 77, pace: 88, shooting: 60, passing: 70, dribbling: 76, defending: 72, physical: 68, league: 'Serie A', country: 'Brésil' },
  { first_name: 'Milos', last_name: 'Kerkez', age: 22, position: 'PG', overall: 78, pace: 86, shooting: 62, passing: 72, dribbling: 76, defending: 74, physical: 72, league: 'Premier League', country: 'Hongrie' },
  { first_name: 'Jurrien', last_name: 'Timber', age: 24, position: 'PD', overall: 82, pace: 80, shooting: 58, passing: 78, dribbling: 78, defending: 82, physical: 76, league: 'Premier League', country: 'Pays-Bas' },
  { first_name: 'Vanderson', last_name: 'de Oliveira', age: 25, position: 'PD', overall: 77, pace: 85, shooting: 62, passing: 72, dribbling: 76, defending: 72, physical: 72, league: 'Ligue 1', country: 'Brésil' },

  // ===================== MILIEUX DÉFENSIFS (MDF) =====================
  { first_name: 'Rodri', last_name: 'Hernandez', age: 29, position: 'MDF', overall: 90, pace: 62, shooting: 76, passing: 88, dribbling: 80, defending: 86, physical: 86, league: 'Premier League', country: 'Espagne' },
  { first_name: 'Declan', last_name: 'Rice', age: 27, position: 'MDF', overall: 87, pace: 72, shooting: 74, passing: 82, dribbling: 78, defending: 86, physical: 88, league: 'Premier League', country: 'Angleterre' },
  { first_name: 'Joshua', last_name: 'Kimmich', age: 31, position: 'MDF', overall: 86, pace: 68, shooting: 74, passing: 90, dribbling: 80, defending: 80, physical: 76, league: 'Bundesliga', country: 'Allemagne' },
  { first_name: 'Nicolo', last_name: 'Barella', age: 29, position: 'MDF', overall: 86, pace: 76, shooting: 78, passing: 85, dribbling: 84, defending: 80, physical: 78, league: 'Serie A', country: 'Italie' },
  { first_name: 'Aurelien', last_name: 'Tchouameni', age: 26, position: 'MDF', overall: 85, pace: 70, shooting: 70, passing: 82, dribbling: 76, defending: 85, physical: 86, league: 'La Liga', country: 'France' },
  { first_name: 'Manuel', last_name: 'Ugarte', age: 25, position: 'MDF', overall: 80, pace: 72, shooting: 60, passing: 76, dribbling: 72, defending: 84, physical: 82, league: 'Premier League', country: 'Uruguay' },
  { first_name: 'Khephren', last_name: 'Thuram', age: 25, position: 'MDF', overall: 82, pace: 76, shooting: 68, passing: 80, dribbling: 80, defending: 78, physical: 86, league: 'Serie A', country: 'France' },
  { first_name: 'Ryan', last_name: 'Gravenberch', age: 24, position: 'MDF', overall: 83, pace: 78, shooting: 72, passing: 82, dribbling: 84, defending: 78, physical: 82, league: 'Premier League', country: 'Pays-Bas' },
  { first_name: 'Joao', last_name: 'Palhinha', age: 30, position: 'MDF', overall: 82, pace: 62, shooting: 66, passing: 74, dribbling: 68, defending: 87, physical: 86, league: 'Bundesliga', country: 'Portugal' },
  { first_name: 'Amadou', last_name: 'Onana', age: 24, position: 'MDF', overall: 80, pace: 72, shooting: 68, passing: 74, dribbling: 72, defending: 80, physical: 88, league: 'Premier League', country: 'Belgique' },
  { first_name: 'Vitinha', last_name: 'Ferreira', age: 26, position: 'MDF', overall: 86, pace: 76, shooting: 76, passing: 88, dribbling: 88, defending: 74, physical: 66, league: 'Ligue 1', country: 'Portugal' },
  { first_name: 'Martin', last_name: 'Zubimendi', age: 27, position: 'MDF', overall: 84, pace: 66, shooting: 66, passing: 85, dribbling: 78, defending: 84, physical: 76, league: 'Premier League', country: 'Espagne' },
  { first_name: 'Warren', last_name: 'Zaire-Emery', age: 20, position: 'MDF', overall: 81, pace: 76, shooting: 70, passing: 82, dribbling: 80, defending: 78, physical: 76, league: 'Ligue 1', country: 'France' },
  { first_name: 'Ederson', last_name: 'Moraes Jr', age: 27, position: 'MDF', overall: 82, pace: 76, shooting: 72, passing: 78, dribbling: 78, defending: 80, physical: 84, league: 'Serie A', country: 'Brésil' },

  // ===================== AUTRES CHAMPIONNATS =====================
  // Primeira Liga
  { first_name: 'Viktor', last_name: 'Gyökeres', age: 28, position: 'BU', overall: 86, pace: 86, shooting: 87, passing: 70, dribbling: 80, defending: 40, physical: 88, league: 'Primeira Liga', country: 'Suède' },
  { first_name: 'Vangelis', last_name: 'Pavlidis', age: 27, position: 'BU', overall: 80, pace: 78, shooting: 82, passing: 68, dribbling: 76, defending: 35, physical: 80, league: 'Primeira Liga', country: 'Grèce' },
  { first_name: 'Otavio', last_name: 'Monteiro', age: 31, position: 'MOC', overall: 80, pace: 76, shooting: 74, passing: 82, dribbling: 84, defending: 52, physical: 66, league: 'Primeira Liga', country: 'Portugal' },
  { first_name: 'Diogo', last_name: 'Costa', age: 26, position: 'GAR', overall: 84, pace: 46, shooting: 15, passing: 70, dribbling: 40, defending: 84, physical: 80, league: 'Primeira Liga', country: 'Portugal' },
  { first_name: 'Antonio', last_name: 'Silva', age: 22, position: 'DC', overall: 79, pace: 74, shooting: 40, passing: 70, dribbling: 62, defending: 80, physical: 80, league: 'Primeira Liga', country: 'Portugal' },

  // Eredivisie
  { first_name: 'Jorrel', last_name: 'Hato', age: 20, position: 'DC', overall: 78, pace: 78, shooting: 42, passing: 74, dribbling: 70, defending: 78, physical: 74, league: 'Eredivisie', country: 'Pays-Bas' },
  { first_name: 'Luuk', last_name: 'de Jong', age: 35, position: 'BU', overall: 76, pace: 52, shooting: 80, passing: 66, dribbling: 66, defending: 40, physical: 86, league: 'Eredivisie', country: 'Pays-Bas' },
  { first_name: 'Ivan', last_name: 'Perisic', age: 37, position: 'MG', overall: 76, pace: 68, shooting: 76, passing: 78, dribbling: 76, defending: 52, physical: 78, league: 'Eredivisie', country: 'Croatie' },
  { first_name: 'Bart', last_name: 'Verbruggen', age: 23, position: 'GAR', overall: 78, pace: 44, shooting: 12, passing: 66, dribbling: 36, defending: 78, physical: 76, league: 'Eredivisie', country: 'Pays-Bas' },

  // Süper Lig / Pro League / autres
  { first_name: 'Mauro', last_name: 'Icardi', age: 33, position: 'BU', overall: 80, pace: 70, shooting: 86, passing: 64, dribbling: 74, defending: 30, physical: 78, league: 'Süper Lig', country: 'Argentine' },
  { first_name: 'Dusan', last_name: 'Tadic', age: 37, position: 'MOC', overall: 76, pace: 58, shooting: 76, passing: 84, dribbling: 80, defending: 44, physical: 62, league: 'Süper Lig', country: 'Serbie' },
  { first_name: 'Hakan', last_name: 'Calhanoglu', age: 32, position: 'MDF', overall: 85, pace: 64, shooting: 84, passing: 88, dribbling: 80, defending: 76, physical: 76, league: 'Serie A', country: 'Turquie' },
  { first_name: 'Lois', last_name: 'Openda', age: 26, position: 'BU', overall: 82, pace: 92, shooting: 82, passing: 66, dribbling: 78, defending: 34, physical: 74, league: 'Bundesliga', country: 'Belgique' },

  // Amérique du Sud / MLS
  { first_name: 'Lionel', last_name: 'Messi', age: 38, position: 'MOC', overall: 88, pace: 76, shooting: 88, passing: 92, dribbling: 93, defending: 32, physical: 62, league: 'MLS', country: 'Argentine' },
  { first_name: 'Luis', last_name: 'Suarez', age: 39, position: 'BU', overall: 78, pace: 56, shooting: 84, passing: 74, dribbling: 76, defending: 36, physical: 76, league: 'MLS', country: 'Uruguay' },
  { first_name: 'Hulk', last_name: 'Souza', age: 39, position: 'BU', overall: 78, pace: 70, shooting: 86, passing: 70, dribbling: 76, defending: 34, physical: 88, league: 'Brasileirão', country: 'Brésil' },
  { first_name: 'Estevao', last_name: 'Willian', age: 19, position: 'AID', overall: 79, pace: 88, shooting: 76, passing: 74, dribbling: 87, defending: 30, physical: 58, league: 'Premier League', country: 'Brésil' },
  { first_name: 'Claudio', last_name: 'Echeverri', age: 20, position: 'MOC', overall: 76, pace: 80, shooting: 72, passing: 78, dribbling: 85, defending: 34, physical: 56, league: 'Premier League', country: 'Argentine' },
  { first_name: 'Julian', last_name: 'Alvarez', age: 26, position: 'BU', overall: 86, pace: 84, shooting: 85, passing: 78, dribbling: 84, defending: 48, physical: 74, league: 'La Liga', country: 'Argentine' },

  // ===================== DÉFENSEURS DE TRÈS HAUT NIVEAU =====================
  // Comblent le palier « élite », qui ne comptait aucun latéral ni piston.
  { first_name: 'Alessandro', last_name: 'Bastoni', age: 27, position: 'DC', overall: 87, pace: 74, shooting: 42, passing: 80, dribbling: 72, defending: 87, physical: 82, league: 'Serie A', country: 'Italie' },
  { first_name: 'Josko', last_name: 'Gvardiol', age: 24, position: 'ARG', overall: 86, pace: 84, shooting: 55, passing: 74, dribbling: 76, defending: 85, physical: 84, league: 'Premier League', country: 'Croatie' },
  { first_name: 'Antonio', last_name: 'Rüdiger', age: 33, position: 'DC', overall: 86, pace: 80, shooting: 45, passing: 70, dribbling: 66, defending: 87, physical: 88, league: 'La Liga', country: 'Allemagne' },
  { first_name: 'Reece', last_name: 'James', age: 26, position: 'PD', overall: 86, pace: 84, shooting: 74, passing: 84, dribbling: 80, defending: 84, physical: 84, league: 'Premier League', country: 'Angleterre' },
  { first_name: 'Éder', last_name: 'Militão', age: 28, position: 'DC', overall: 86, pace: 84, shooting: 45, passing: 70, dribbling: 70, defending: 86, physical: 86, league: 'La Liga', country: 'Brésil' },
  { first_name: 'Kyle', last_name: 'Walker', age: 35, position: 'PD', overall: 84, pace: 90, shooting: 58, passing: 72, dribbling: 74, defending: 80, physical: 82, league: 'Premier League', country: 'Angleterre' },
  { first_name: 'Andrew', last_name: 'Robertson', age: 32, position: 'PG', overall: 84, pace: 82, shooting: 62, passing: 84, dribbling: 78, defending: 80, physical: 76, league: 'Premier League', country: 'Écosse' },
  { first_name: 'Raphaël', last_name: 'Varane', age: 33, position: 'DC', overall: 84, pace: 80, shooting: 40, passing: 70, dribbling: 66, defending: 86, physical: 82, league: 'Ligue 1', country: 'France' },
  { first_name: 'Kim', last_name: 'Min-jae', age: 29, position: 'DC', overall: 85, pace: 82, shooting: 42, passing: 70, dribbling: 66, defending: 86, physical: 88, league: 'Bundesliga', country: 'Corée du Sud' },
  { first_name: 'Ronald', last_name: 'Araujo', age: 27, position: 'DC', overall: 85, pace: 84, shooting: 45, passing: 68, dribbling: 68, defending: 86, physical: 88, league: 'La Liga', country: 'Uruguay' },
  { first_name: 'Jules', last_name: 'Koundé', age: 27, position: 'PD', overall: 86, pace: 86, shooting: 50, passing: 76, dribbling: 76, defending: 85, physical: 80, league: 'La Liga', country: 'France' },
  { first_name: 'Dayot', last_name: 'Upamecano', age: 27, position: 'DC', overall: 85, pace: 82, shooting: 42, passing: 72, dribbling: 68, defending: 85, physical: 87, league: 'Bundesliga', country: 'France' },
  { first_name: 'Cristian', last_name: 'Romero', age: 28, position: 'DC', overall: 86, pace: 78, shooting: 44, passing: 72, dribbling: 68, defending: 87, physical: 86, league: 'Premier League', country: 'Argentine' },

  { first_name: 'Michael', last_name: 'Olise', age: 24, position: 'MD', overall: 85, pace: 82, shooting: 80, passing: 86, dribbling: 88, defending: 40, physical: 64, league: 'Bundesliga', country: 'France' },

  // ===================== LIGUE 2 =====================
  { first_name: 'Fabien', last_name: 'Centonze', age: 30, position: 'PG', overall: 72, pace: 76, shooting: 56, passing: 70, dribbling: 68, defending: 74, physical: 76, league: 'Ligue 2', country: 'France' },
  { first_name: 'Nicolas', last_name: 'Cozza', age: 27, position: 'PG', overall: 71, pace: 74, shooting: 54, passing: 70, dribbling: 68, defending: 72, physical: 74, league: 'Ligue 2', country: 'France' },
  { first_name: 'Gaëtan', last_name: 'Charbonnier', age: 37, position: 'BU', overall: 70, pace: 52, shooting: 74, passing: 60, dribbling: 62, defending: 34, physical: 82, league: 'Ligue 2', country: 'France' },
  { first_name: 'Mickaël', last_name: 'Le Bihan', age: 35, position: 'BU', overall: 69, pace: 66, shooting: 72, passing: 58, dribbling: 66, defending: 30, physical: 70, league: 'Ligue 2', country: 'France' },
  { first_name: 'Yoann', last_name: 'Touzghar', age: 39, position: 'BU', overall: 68, pace: 54, shooting: 72, passing: 60, dribbling: 62, defending: 32, physical: 76, league: 'Ligue 2', country: 'France' },
  { first_name: 'Anthony', last_name: 'Mandrea', age: 28, position: 'GAR', overall: 71, pace: 44, shooting: 12, passing: 56, dribbling: 34, defending: 72, physical: 74, league: 'Ligue 2', country: 'France' },
  { first_name: 'Vincent', last_name: 'Demarconnay', age: 39, position: 'GAR', overall: 69, pace: 40, shooting: 10, passing: 52, dribbling: 30, defending: 70, physical: 72, league: 'Ligue 2', country: 'France' },
  { first_name: 'Florian', last_name: 'Ayé', age: 29, position: 'BU', overall: 71, pace: 68, shooting: 74, passing: 60, dribbling: 68, defending: 32, physical: 78, league: 'Ligue 2', country: 'France' },
  { first_name: 'Julien', last_name: 'Ponceau', age: 26, position: 'MOC', overall: 72, pace: 70, shooting: 70, passing: 76, dribbling: 78, defending: 48, physical: 62, league: 'Ligue 2', country: 'France' },
  { first_name: 'Mathias', last_name: 'Autret', age: 35, position: 'MOC', overall: 72, pace: 62, shooting: 72, passing: 80, dribbling: 78, defending: 46, physical: 62, league: 'Ligue 2', country: 'France' },
  { first_name: 'Kevin', last_name: 'Monnet-Paquet', age: 37, position: 'MG', overall: 67, pace: 68, shooting: 66, passing: 66, dribbling: 70, defending: 42, physical: 66, league: 'Ligue 2', country: 'France' },
  { first_name: 'Jimmy', last_name: 'Roye', age: 30, position: 'MD', overall: 69, pace: 76, shooting: 64, passing: 68, dribbling: 72, defending: 46, physical: 66, league: 'Ligue 2', country: 'France' },
  { first_name: 'Karim', last_name: 'Azamoum', age: 36, position: 'MDF', overall: 68, pace: 56, shooting: 58, passing: 70, dribbling: 64, defending: 74, physical: 74, league: 'Ligue 2', country: 'France' },
  { first_name: 'Ousmane', last_name: 'Camara', age: 25, position: 'MDF', overall: 70, pace: 68, shooting: 58, passing: 70, dribbling: 68, defending: 74, physical: 78, league: 'Ligue 2', country: 'France' },
  { first_name: 'Bilal', last_name: 'Boutobba', age: 27, position: 'MOC', overall: 70, pace: 74, shooting: 70, passing: 74, dribbling: 78, defending: 40, physical: 60, league: 'Ligue 2', country: 'France' },
  { first_name: 'Steve', last_name: 'Ambri', age: 30, position: 'AIG', overall: 69, pace: 82, shooting: 66, passing: 64, dribbling: 76, defending: 32, physical: 62, league: 'Ligue 2', country: 'France' },
  { first_name: 'Jean-Philippe', last_name: 'Krasso', age: 29, position: 'BU', overall: 73, pace: 76, shooting: 76, passing: 66, dribbling: 76, defending: 32, physical: 72, league: 'Ligue 2', country: 'Côte d\'Ivoire' },
  { first_name: 'Cheick', last_name: 'Keita', age: 29, position: 'PG', overall: 69, pace: 78, shooting: 52, passing: 66, dribbling: 68, defending: 70, physical: 72, league: 'Ligue 2', country: 'Mali' },
  { first_name: 'Enzo', last_name: 'Bardeli', age: 24, position: 'MC', overall: 71, pace: 68, shooting: 66, passing: 74, dribbling: 72, defending: 66, physical: 68, league: 'Ligue 2', country: 'France' },
  { first_name: 'Adrien', last_name: 'Thomasson', age: 32, position: 'MOC', overall: 74, pace: 70, shooting: 72, passing: 78, dribbling: 78, defending: 52, physical: 64, league: 'Ligue 2', country: 'France' },
  { first_name: 'Romain', last_name: 'Philippoteaux', age: 37, position: 'MD', overall: 67, pace: 66, shooting: 68, passing: 70, dribbling: 72, defending: 40, physical: 58, league: 'Ligue 2', country: 'France' },
  { first_name: 'Alexandre', last_name: 'Coeff', age: 33, position: 'MDF', overall: 70, pace: 62, shooting: 58, passing: 70, dribbling: 66, defending: 76, physical: 78, league: 'Ligue 2', country: 'France' },
  { first_name: 'Yannick', last_name: 'Cahuzac', age: 41, position: 'MDF', overall: 66, pace: 46, shooting: 56, passing: 68, dribbling: 60, defending: 76, physical: 78, league: 'Ligue 2', country: 'France' },
  { first_name: 'Ludovic', last_name: 'Ajorque', age: 32, position: 'BU', overall: 75, pace: 62, shooting: 76, passing: 66, dribbling: 68, defending: 40, physical: 90, league: 'Ligue 2', country: 'France' },
  { first_name: 'Sofiane', last_name: 'Boufal', age: 32, position: 'MG', overall: 75, pace: 74, shooting: 72, passing: 76, dribbling: 87, defending: 34, physical: 62, league: 'Ligue 2', country: 'Maroc' },
  { first_name: 'Rominigue', last_name: 'Kouame', age: 29, position: 'MDF', overall: 71, pace: 70, shooting: 60, passing: 72, dribbling: 70, defending: 74, physical: 76, league: 'Ligue 2', country: 'Mali' },
  { first_name: 'Teddy', last_name: 'Chevalier', age: 39, position: 'BU', overall: 66, pace: 54, shooting: 72, passing: 60, dribbling: 64, defending: 30, physical: 74, league: 'Ligue 2', country: 'France' },
];

module.exports = { EXTRA_REAL_PLAYERS };
