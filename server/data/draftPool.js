const BASE_POOL = [
  // --- Amateur (Regional) ---
  { first_name: 'Kévin', last_name: 'Durand', age: 27, position: 'BU', overall: 52, pace: 62, shooting: 56, passing: 42, dribbling: 50, defending: 18, physical: 60, tier: 'amateur' },
  { first_name: 'Julien', last_name: 'Petit', age: 31, position: 'BU', overall: 50, pace: 58, shooting: 55, passing: 40, dribbling: 48, defending: 16, physical: 62, tier: 'amateur' },
  { first_name: 'Dylan', last_name: 'Martin', age: 24, position: 'AID', overall: 53, pace: 68, shooting: 50, passing: 44, dribbling: 58, defending: 15, physical: 48, tier: 'amateur' },
  { first_name: 'Lucas', last_name: 'Leroy', age: 22, position: 'AIG', overall: 51, pace: 70, shooting: 46, passing: 42, dribbling: 56, defending: 14, physical: 45, tier: 'amateur' },
  { first_name: 'Hugo', last_name: 'Moreau', age: 20, position: 'AIG', overall: 49, pace: 72, shooting: 44, passing: 40, dribbling: 54, defending: 12, physical: 42, tier: 'amateur' },
  { first_name: 'Théo', last_name: 'Simon', age: 23, position: 'MC', overall: 52, pace: 55, shooting: 48, passing: 56, dribbling: 52, defending: 48, physical: 55, tier: 'amateur' },
  { first_name: 'Maxime', last_name: 'Laurent', age: 28, position: 'MC', overall: 54, pace: 52, shooting: 50, passing: 58, dribbling: 54, defending: 52, physical: 58, tier: 'amateur' },
  { first_name: 'Nathan', last_name: 'Michel', age: 25, position: 'MC', overall: 53, pace: 56, shooting: 49, passing: 57, dribbling: 53, defending: 50, physical: 56, tier: 'amateur' },
  { first_name: 'Romain', last_name: 'Garcia', age: 30, position: 'MC', overall: 55, pace: 50, shooting: 52, passing: 60, dribbling: 55, defending: 54, physical: 60, tier: 'amateur' },
  { first_name: 'Axel', last_name: 'Roux', age: 26, position: 'MC', overall: 51, pace: 54, shooting: 46, passing: 55, dribbling: 50, defending: 48, physical: 54, tier: 'amateur' },
  { first_name: 'Clément', last_name: 'Fournier', age: 29, position: 'DC', overall: 54, pace: 50, shooting: 22, passing: 42, dribbling: 35, defending: 60, physical: 62, tier: 'amateur' },
  { first_name: 'Antoine', last_name: 'Girard', age: 32, position: 'DC', overall: 55, pace: 45, shooting: 20, passing: 40, dribbling: 32, defending: 62, physical: 65, tier: 'amateur' },
  { first_name: 'Quentin', last_name: 'Bonnet', age: 24, position: 'DC', overall: 52, pace: 55, shooting: 18, passing: 40, dribbling: 35, defending: 58, physical: 60, tier: 'amateur' },
  { first_name: 'Baptiste', last_name: 'Mercier', age: 27, position: 'DC', overall: 53, pace: 48, shooting: 20, passing: 42, dribbling: 36, defending: 59, physical: 62, tier: 'amateur' },
  { first_name: 'Florian', last_name: 'Blanc', age: 26, position: 'ARG', overall: 51, pace: 60, shooting: 30, passing: 48, dribbling: 48, defending: 55, physical: 54, tier: 'amateur' },
  { first_name: 'Adrien', last_name: 'Faure', age: 28, position: 'ARG', overall: 52, pace: 58, shooting: 28, passing: 50, dribbling: 46, defending: 56, physical: 56, tier: 'amateur' },
  { first_name: 'Vincent', last_name: 'Guérin', age: 23, position: 'ARD', overall: 50, pace: 62, shooting: 28, passing: 46, dribbling: 48, defending: 54, physical: 52, tier: 'amateur' },
  { first_name: 'Pierre', last_name: 'Muller', age: 25, position: 'ARD', overall: 53, pace: 64, shooting: 32, passing: 48, dribbling: 50, defending: 56, physical: 55, tier: 'amateur' },
  { first_name: 'Nicolas', last_name: 'Perrin', age: 30, position: 'GAR', overall: 52, pace: 28, shooting: 8, passing: 38, dribbling: 15, defending: 55, physical: 55, tier: 'amateur' },
  { first_name: 'Thomas', last_name: 'Rousseau', age: 26, position: 'GAR', overall: 50, pace: 26, shooting: 6, passing: 36, dribbling: 14, defending: 53, physical: 52, tier: 'amateur' },
  { first_name: 'Corentin', last_name: 'Lambert', age: 22, position: 'GAR', overall: 48, pace: 24, shooting: 5, passing: 34, dribbling: 12, defending: 50, physical: 50, tier: 'amateur' },
  { first_name: 'Mehdi', last_name: 'Garnier', age: 24, position: 'BU', overall: 55, pace: 65, shooting: 58, passing: 44, dribbling: 54, defending: 16, physical: 58, tier: 'amateur' },
  { first_name: 'Youssef', last_name: 'Legrand', age: 21, position: 'AID', overall: 50, pace: 70, shooting: 45, passing: 40, dribbling: 55, defending: 12, physical: 44, tier: 'amateur' },
  { first_name: 'Karim', last_name: 'Henry', age: 29, position: 'MC', overall: 56, pace: 52, shooting: 54, passing: 60, dribbling: 56, defending: 52, physical: 58, tier: 'amateur' },
  { first_name: 'Sofiane', last_name: 'Diallo', age: 23, position: 'AIG', overall: 52, pace: 68, shooting: 48, passing: 44, dribbling: 56, defending: 14, physical: 46, tier: 'amateur' },
  { first_name: 'Ibrahim', last_name: 'Camara', age: 20, position: 'DC', overall: 49, pace: 58, shooting: 16, passing: 38, dribbling: 32, defending: 55, physical: 56, tier: 'amateur' },
  { first_name: 'Moussa', last_name: 'Traoré', age: 27, position: 'ARD', overall: 54, pace: 62, shooting: 30, passing: 50, dribbling: 50, defending: 58, physical: 58, tier: 'amateur' },
  { first_name: 'Mamadou', last_name: 'Koné', age: 25, position: 'DC', overall: 55, pace: 54, shooting: 20, passing: 42, dribbling: 36, defending: 62, physical: 64, tier: 'amateur' },
  { first_name: 'Omar', last_name: 'Bamba', age: 22, position: 'BU', overall: 50, pace: 66, shooting: 52, passing: 38, dribbling: 50, defending: 14, physical: 52, tier: 'amateur' },
  { first_name: 'Bilal', last_name: 'Touré', age: 26, position: 'MC', overall: 53, pace: 56, shooting: 50, passing: 56, dribbling: 52, defending: 50, physical: 56, tier: 'amateur' },
  { first_name: 'Erwan', last_name: 'Coulibaly', age: 28, position: 'ARG', overall: 53, pace: 60, shooting: 30, passing: 50, dribbling: 49, defending: 57, physical: 56, tier: 'amateur' },
  { first_name: 'Loïc', last_name: 'Fernandez', age: 33, position: 'GAR', overall: 54, pace: 28, shooting: 8, passing: 40, dribbling: 16, defending: 58, physical: 58, tier: 'amateur' },
  { first_name: 'Cédric', last_name: 'Lopez', age: 31, position: 'DC', overall: 56, pace: 48, shooting: 22, passing: 44, dribbling: 38, defending: 62, physical: 66, tier: 'amateur' },
  { first_name: 'Franck', last_name: 'Pereira', age: 34, position: 'BU', overall: 52, pace: 55, shooting: 58, passing: 42, dribbling: 48, defending: 14, physical: 60, tier: 'amateur' },
  { first_name: 'Sébastien', last_name: 'Da Silva', age: 30, position: 'MC', overall: 54, pace: 50, shooting: 52, passing: 58, dribbling: 54, defending: 52, physical: 58, tier: 'amateur' },

  // --- Ligue 1 (milieu/bas de tableau) ---
  { first_name: 'Steve', last_name: 'Mounié', age: 31, position: 'BU', overall: 72, pace: 68, shooting: 74, passing: 58, dribbling: 65, defending: 28, physical: 80, tier: 'ligue1' },
  { first_name: 'Gaëtan', last_name: 'Laborde', age: 32, position: 'BU', overall: 74, pace: 72, shooting: 76, passing: 68, dribbling: 72, defending: 35, physical: 74, tier: 'ligue1' },
  { first_name: 'Neal', last_name: 'Maupay', age: 30, position: 'BU', overall: 75, pace: 72, shooting: 76, passing: 62, dribbling: 72, defending: 30, physical: 72, tier: 'ligue1' },
  { first_name: 'Habib', last_name: 'Diarra', age: 23, position: 'MC', overall: 73, pace: 70, shooting: 68, passing: 72, dribbling: 72, defending: 68, physical: 72, tier: 'ligue1' },
  { first_name: 'Romain', last_name: 'Faivre', age: 28, position: 'MOC', overall: 74, pace: 72, shooting: 70, passing: 76, dribbling: 80, defending: 30, physical: 55, tier: 'ligue1' },
  { first_name: 'Moses', last_name: 'Simon', age: 30, position: 'AIG', overall: 76, pace: 88, shooting: 70, passing: 68, dribbling: 80, defending: 28, physical: 62, tier: 'ligue1' },
  { first_name: 'Himad', last_name: 'Abdelli', age: 25, position: 'AIG', overall: 72, pace: 80, shooting: 68, passing: 68, dribbling: 76, defending: 26, physical: 58, tier: 'ligue1' },
  { first_name: 'Jérémy', last_name: 'Le Douaron', age: 25, position: 'AID', overall: 74, pace: 86, shooting: 72, passing: 62, dribbling: 74, defending: 28, physical: 68, tier: 'ligue1' },
  { first_name: 'Martin', last_name: 'Terrier', age: 29, position: 'AIG', overall: 76, pace: 78, shooting: 78, passing: 72, dribbling: 78, defending: 32, physical: 62, tier: 'ligue1' },
  { first_name: 'Enzo', last_name: 'Le Fée', age: 26, position: 'MC', overall: 75, pace: 68, shooting: 68, passing: 78, dribbling: 78, defending: 62, physical: 62, tier: 'ligue1' },
  { first_name: 'Birger', last_name: 'Meling', age: 30, position: 'ARG', overall: 74, pace: 76, shooting: 52, passing: 74, dribbling: 72, defending: 74, physical: 68, tier: 'ligue1' },
  { first_name: 'Loïc', last_name: 'Badé', age: 26, position: 'DC', overall: 76, pace: 76, shooting: 35, passing: 58, dribbling: 52, defending: 80, physical: 80, tier: 'ligue1' },
  { first_name: 'Warmed', last_name: 'Omari', age: 22, position: 'DC', overall: 74, pace: 72, shooting: 35, passing: 60, dribbling: 55, defending: 76, physical: 76, tier: 'ligue1' },
  { first_name: 'Andy', last_name: 'Diouf', age: 23, position: 'ARD', overall: 73, pace: 82, shooting: 52, passing: 68, dribbling: 72, defending: 72, physical: 72, tier: 'ligue1' },
  { first_name: 'Lorenz', last_name: 'Assignon', age: 26, position: 'ARD', overall: 75, pace: 84, shooting: 58, passing: 70, dribbling: 74, defending: 74, physical: 74, tier: 'ligue1' },
  { first_name: 'Mory', last_name: 'Diaw', age: 31, position: 'GAR', overall: 74, pace: 36, shooting: 10, passing: 48, dribbling: 22, defending: 74, physical: 74, tier: 'ligue1' },
  { first_name: 'Ibrahim', last_name: 'Amadou', age: 33, position: 'MC', overall: 72, pace: 62, shooting: 58, passing: 66, dribbling: 62, defending: 76, physical: 80, tier: 'ligue1' },
  { first_name: 'Ismaïla', last_name: 'Sarr', age: 28, position: 'AID', overall: 76, pace: 90, shooting: 72, passing: 65, dribbling: 78, defending: 28, physical: 68, tier: 'ligue1' },
  { first_name: 'Ibrahim', last_name: 'Sangaré', age: 28, position: 'MC', overall: 77, pace: 68, shooting: 65, passing: 74, dribbling: 72, defending: 78, physical: 82, tier: 'ligue1' },
  { first_name: 'Iliman', last_name: 'Ndiaye', age: 26, position: 'AIG', overall: 76, pace: 80, shooting: 72, passing: 72, dribbling: 82, defending: 30, physical: 62, tier: 'ligue1' },
  { first_name: 'Alban', last_name: 'Lafont', age: 27, position: 'GAR', overall: 77, pace: 38, shooting: 12, passing: 50, dribbling: 24, defending: 76, physical: 74, tier: 'ligue1' },
  { first_name: 'Brice', last_name: 'Samba', age: 32, position: 'GAR', overall: 78, pace: 40, shooting: 12, passing: 52, dribbling: 26, defending: 78, physical: 76, tier: 'ligue1' },
  { first_name: 'Arnaud', last_name: 'Kalimuendo', age: 24, position: 'BU', overall: 74, pace: 78, shooting: 74, passing: 62, dribbling: 74, defending: 28, physical: 68, tier: 'ligue1' },
  { first_name: 'Mama', last_name: 'Baldé', age: 29, position: 'AID', overall: 74, pace: 86, shooting: 70, passing: 62, dribbling: 76, defending: 26, physical: 68, tier: 'ligue1' },
  { first_name: 'Kamory', last_name: 'Doumbia', age: 24, position: 'MC', overall: 73, pace: 72, shooting: 70, passing: 70, dribbling: 74, defending: 66, physical: 74, tier: 'ligue1' },

  // --- Ligue 2 ---
  { first_name: 'Ilan', last_name: 'Kebbal', age: 27, position: 'MOC', overall: 70, pace: 70, shooting: 68, passing: 74, dribbling: 76, defending: 28, physical: 55, tier: 'ligue2' },
  { first_name: 'Lenny', last_name: 'Vallier', age: 23, position: 'AIG', overall: 67, pace: 82, shooting: 62, passing: 62, dribbling: 72, defending: 24, physical: 55, tier: 'ligue2' },
  { first_name: 'Yanis', last_name: 'Begraoui', age: 22, position: 'BU', overall: 66, pace: 78, shooting: 68, passing: 55, dribbling: 68, defending: 22, physical: 65, tier: 'ligue2' },
  { first_name: 'Rassoul', last_name: 'Ndiaye', age: 21, position: 'MC', overall: 65, pace: 72, shooting: 60, passing: 66, dribbling: 68, defending: 62, physical: 68, tier: 'ligue2' },
  { first_name: 'Tidiane', last_name: 'Salaün', age: 20, position: 'DC', overall: 66, pace: 72, shooting: 30, passing: 55, dribbling: 50, defending: 70, physical: 72, tier: 'ligue2' },
  { first_name: 'Djibril', last_name: 'Cissé Jr', age: 22, position: 'BU', overall: 64, pace: 82, shooting: 65, passing: 52, dribbling: 68, defending: 20, physical: 62, tier: 'ligue2' },
  { first_name: 'Bryan', last_name: 'Passi', age: 24, position: 'ARD', overall: 67, pace: 78, shooting: 48, passing: 64, dribbling: 66, defending: 68, physical: 70, tier: 'ligue2' },
  { first_name: 'Marvin', last_name: 'Senaya', age: 25, position: 'ARG', overall: 68, pace: 76, shooting: 45, passing: 66, dribbling: 68, defending: 70, physical: 72, tier: 'ligue2' },
  { first_name: 'Thomas', last_name: 'Durand', age: 27, position: 'GAR', overall: 68, pace: 34, shooting: 10, passing: 45, dribbling: 20, defending: 68, physical: 70, tier: 'ligue2' },
  { first_name: 'Maxime', last_name: 'Barthelmé', age: 32, position: 'MC', overall: 69, pace: 58, shooting: 65, passing: 72, dribbling: 70, defending: 66, physical: 68, tier: 'ligue2' },
  { first_name: 'Yoann', last_name: 'Touzghar', age: 33, position: 'BU', overall: 68, pace: 70, shooting: 72, passing: 58, dribbling: 66, defending: 24, physical: 72, tier: 'ligue2' },
  { first_name: 'Jason', last_name: 'Berthomier', age: 32, position: 'MOC', overall: 69, pace: 62, shooting: 66, passing: 74, dribbling: 72, defending: 42, physical: 55, tier: 'ligue2' },
  { first_name: 'Gauthier', last_name: 'Gallon', age: 28, position: 'GAR', overall: 70, pace: 36, shooting: 10, passing: 48, dribbling: 22, defending: 70, physical: 72, tier: 'ligue2' },
  { first_name: 'Jessy', last_name: 'Deminguet', age: 28, position: 'MC', overall: 68, pace: 68, shooting: 64, passing: 70, dribbling: 70, defending: 64, physical: 68, tier: 'ligue2' },
  { first_name: 'Florian', last_name: 'David', age: 25, position: 'AID', overall: 67, pace: 80, shooting: 65, passing: 60, dribbling: 72, defending: 24, physical: 60, tier: 'ligue2' },
  { first_name: 'Malik', last_name: 'Tchokounté', age: 31, position: 'BU', overall: 67, pace: 76, shooting: 70, passing: 52, dribbling: 64, defending: 22, physical: 76, tier: 'ligue2' },
  { first_name: 'Logan', last_name: 'Costa', age: 23, position: 'AIG', overall: 68, pace: 84, shooting: 62, passing: 60, dribbling: 74, defending: 22, physical: 58, tier: 'ligue2' },
  { first_name: 'Alexandre', last_name: 'Dupont', age: 26, position: 'DC', overall: 68, pace: 68, shooting: 32, passing: 55, dribbling: 48, defending: 72, physical: 76, tier: 'ligue2' },
  { first_name: 'Quentin', last_name: 'Bernard', age: 29, position: 'ARG', overall: 69, pace: 74, shooting: 42, passing: 66, dribbling: 64, defending: 72, physical: 72, tier: 'ligue2' },
  { first_name: 'Gaëtan', last_name: 'Martin', age: 30, position: 'DC', overall: 70, pace: 65, shooting: 35, passing: 58, dribbling: 50, defending: 74, physical: 78, tier: 'ligue2' },
  { first_name: 'Yoann', last_name: 'Court', age: 32, position: 'AID', overall: 68, pace: 76, shooting: 66, passing: 68, dribbling: 72, defending: 26, physical: 58, tier: 'ligue2' },
  { first_name: 'Mathieu', last_name: 'Peybernes', age: 24, position: 'ARD', overall: 66, pace: 76, shooting: 42, passing: 60, dribbling: 62, defending: 68, physical: 70, tier: 'ligue2' },
  { first_name: 'Edouard', last_name: 'Cissé', age: 28, position: 'MC', overall: 69, pace: 64, shooting: 62, passing: 70, dribbling: 68, defending: 68, physical: 72, tier: 'ligue2' },

  // --- National (3e division) ---
  { first_name: 'Kevin', last_name: 'Fortune', age: 27, position: 'BU', overall: 62, pace: 74, shooting: 66, passing: 50, dribbling: 62, defending: 20, physical: 70, tier: 'national' },
  { first_name: 'Romain', last_name: 'Bernard', age: 29, position: 'DC', overall: 63, pace: 62, shooting: 28, passing: 48, dribbling: 42, defending: 68, physical: 74, tier: 'national' },
  { first_name: 'Anthony', last_name: 'Petit', age: 26, position: 'ARG', overall: 61, pace: 72, shooting: 38, passing: 58, dribbling: 58, defending: 64, physical: 68, tier: 'national' },
  { first_name: 'Dylan', last_name: 'Robert', age: 24, position: 'AID', overall: 62, pace: 80, shooting: 58, passing: 52, dribbling: 66, defending: 20, physical: 55, tier: 'national' },
  { first_name: 'Hugo', last_name: 'Moreau', age: 22, position: 'MC', overall: 61, pace: 68, shooting: 55, passing: 62, dribbling: 62, defending: 58, physical: 65, tier: 'national' },
  { first_name: 'Nicolas', last_name: 'Laurent', age: 30, position: 'GAR', overall: 63, pace: 32, shooting: 13, passing: 42, dribbling: 18, defending: 64, physical: 68, tier: 'national' },
  { first_name: 'Adrien', last_name: 'Simon', age: 28, position: 'MC', overall: 63, pace: 65, shooting: 58, passing: 64, dribbling: 62, defending: 62, physical: 68, tier: 'national' },
  { first_name: 'Lucas', last_name: 'Michel', age: 21, position: 'AIG', overall: 60, pace: 82, shooting: 55, passing: 52, dribbling: 68, defending: 18, physical: 52, tier: 'national' },
  { first_name: 'Vincent', last_name: 'Lefebvre', age: 33, position: 'DC', overall: 64, pace: 55, shooting: 30, passing: 50, dribbling: 42, defending: 70, physical: 76, tier: 'national' },
  { first_name: 'Pierre', last_name: 'Leroy', age: 25, position: 'ARD', overall: 62, pace: 74, shooting: 40, passing: 56, dribbling: 58, defending: 66, physical: 68, tier: 'national' },
  { first_name: 'Julien', last_name: 'Roux', age: 31, position: 'BU', overall: 63, pace: 70, shooting: 68, passing: 48, dribbling: 60, defending: 18, physical: 72, tier: 'national' },
  { first_name: 'Théo', last_name: 'David', age: 20, position: 'MOC', overall: 61, pace: 72, shooting: 58, passing: 64, dribbling: 68, defending: 24, physical: 50, tier: 'national' },
  { first_name: 'Corentin', last_name: 'Bertrand', age: 23, position: 'GAR', overall: 61, pace: 30, shooting: 13, passing: 40, dribbling: 16, defending: 62, physical: 66, tier: 'national' },
  { first_name: 'Alexis', last_name: 'Morel', age: 27, position: 'ARG', overall: 63, pace: 74, shooting: 35, passing: 58, dribbling: 56, defending: 66, physical: 70, tier: 'national' },

  // --- Jeunes prometteurs (centres de formation) ---
  { first_name: 'Mathys', last_name: 'Tel', age: 18, position: 'BU', overall: 63, pace: 80, shooting: 62, passing: 52, dribbling: 68, defending: 18, physical: 55, tier: 'youth' },
  { first_name: 'Enzo', last_name: 'Fournier', age: 19, position: 'MC', overall: 62, pace: 70, shooting: 58, passing: 66, dribbling: 68, defending: 55, physical: 58, tier: 'youth' },
  { first_name: 'Lenny', last_name: 'Girard', age: 18, position: 'AIG', overall: 61, pace: 84, shooting: 55, passing: 55, dribbling: 72, defending: 18, physical: 48, tier: 'youth' },
  { first_name: 'Naoufel', last_name: 'Bonnet', age: 19, position: 'AID', overall: 62, pace: 82, shooting: 58, passing: 56, dribbling: 70, defending: 20, physical: 52, tier: 'youth' },
  { first_name: 'Ibrahim', last_name: 'Lambert', age: 18, position: 'DC', overall: 60, pace: 72, shooting: 25, passing: 48, dribbling: 45, defending: 65, physical: 68, tier: 'youth' },
  { first_name: 'Rayan', last_name: 'Fontaine', age: 17, position: 'MOC', overall: 60, pace: 74, shooting: 58, passing: 65, dribbling: 70, defending: 20, physical: 42, tier: 'youth' },
  { first_name: 'Samy', last_name: 'Rousseau', age: 19, position: 'GAR', overall: 59, pace: 32, shooting: 14, passing: 40, dribbling: 16, defending: 60, physical: 62, tier: 'youth' },
  { first_name: 'Nolan', last_name: 'Vincent', age: 18, position: 'ARD', overall: 60, pace: 78, shooting: 38, passing: 55, dribbling: 60, defending: 62, physical: 60, tier: 'youth' },
  { first_name: 'Ayman', last_name: 'Muller', age: 19, position: 'ARG', overall: 61, pace: 76, shooting: 35, passing: 58, dribbling: 60, defending: 64, physical: 62, tier: 'youth' },
  { first_name: 'Eliott', last_name: 'Lefevre', age: 17, position: 'MC', overall: 59, pace: 68, shooting: 52, passing: 62, dribbling: 64, defending: 52, physical: 52, tier: 'youth' },

  // --- Vétérans / fin de carrière ---
  { first_name: 'Dimitri', last_name: 'Payet', age: 39, position: 'MOC', overall: 72, pace: 48, shooting: 76, passing: 82, dribbling: 78, defending: 32, physical: 48, tier: 'veteran' },
  { first_name: 'Florian', last_name: 'Thauvin', age: 33, position: 'AID', overall: 75, pace: 74, shooting: 78, passing: 76, dribbling: 80, defending: 30, physical: 60, tier: 'veteran' },
  { first_name: 'Moussa', last_name: 'Sissoko', age: 37, position: 'MC', overall: 68, pace: 62, shooting: 58, passing: 66, dribbling: 62, defending: 68, physical: 78, tier: 'veteran' },
  { first_name: 'Steve', last_name: 'Mandanda', age: 41, position: 'GAR', overall: 70, pace: 30, shooting: 8, passing: 48, dribbling: 20, defending: 72, physical: 65, tier: 'veteran' },
  { first_name: 'Nabil', last_name: 'Fekir', age: 33, position: 'MOC', overall: 76, pace: 68, shooting: 76, passing: 78, dribbling: 82, defending: 35, physical: 62, tier: 'veteran' },
  { first_name: 'Wissam', last_name: 'Ben Yedder', age: 36, position: 'BU', overall: 76, pace: 68, shooting: 82, passing: 72, dribbling: 78, defending: 30, physical: 58, tier: 'veteran' },
  { first_name: 'Yohan', last_name: 'Cabaye', age: 40, position: 'MC', overall: 65, pace: 42, shooting: 62, passing: 74, dribbling: 68, defending: 58, physical: 50, tier: 'veteran' },
  { first_name: 'Mathieu', last_name: 'Valbuena', age: 42, position: 'AID', overall: 64, pace: 52, shooting: 64, passing: 76, dribbling: 74, defending: 28, physical: 42, tier: 'veteran' },

  // --- Joueurs étrangers abordables ---
  { first_name: 'Ola', last_name: 'Aina', age: 29, position: 'ARD', overall: 74, pace: 78, shooting: 58, passing: 68, dribbling: 72, defending: 72, physical: 74, tier: 'ligue1' },
  { first_name: 'Salis', last_name: 'Abdul Samed', age: 26, position: 'MC', overall: 74, pace: 66, shooting: 60, passing: 72, dribbling: 70, defending: 76, physical: 78, tier: 'ligue1' },
  { first_name: 'Yunis', last_name: 'Abdelhamid', age: 38, position: 'DC', overall: 72, pace: 55, shooting: 35, passing: 55, dribbling: 48, defending: 76, physical: 78, tier: 'veteran' },
  { first_name: 'Wahbi', last_name: 'Khazri', age: 35, position: 'MOC', overall: 72, pace: 62, shooting: 74, passing: 76, dribbling: 76, defending: 30, physical: 55, tier: 'veteran' },
  { first_name: 'Rémy', last_name: 'Cabella', age: 36, position: 'MOC', overall: 70, pace: 62, shooting: 68, passing: 76, dribbling: 78, defending: 28, physical: 50, tier: 'veteran' },
  { first_name: 'Adama', last_name: 'Traoré', age: 30, position: 'AID', overall: 74, pace: 94, shooting: 60, passing: 58, dribbling: 78, defending: 28, physical: 82, tier: 'ligue1' },
  { first_name: 'Keita', last_name: 'Baldé', age: 31, position: 'AIG', overall: 73, pace: 84, shooting: 72, passing: 62, dribbling: 76, defending: 26, physical: 68, tier: 'ligue1' },
  { first_name: 'M\'Baye', last_name: 'Niang', age: 31, position: 'BU', overall: 72, pace: 78, shooting: 72, passing: 58, dribbling: 70, defending: 24, physical: 76, tier: 'ligue1' },

  // --- Légendes ---
  { first_name: 'Kylian', last_name: 'Mbappé', age: 27, position: 'BU', overall: 93, pace: 97, shooting: 90, passing: 80, dribbling: 92, defending: 32, physical: 76, tier: 'legend', fixedPrice: 180000000 },
  { first_name: 'Erling', last_name: 'Haaland', age: 26, position: 'BU', overall: 92, pace: 89, shooting: 94, passing: 65, dribbling: 78, defending: 30, physical: 88, tier: 'legend', fixedPrice: 180000000 },
  { first_name: 'Vinícius', last_name: 'Júnior', age: 26, position: 'AIG', overall: 92, pace: 95, shooting: 85, passing: 78, dribbling: 94, defending: 30, physical: 68, tier: 'legend', fixedPrice: 150000000 },
  { first_name: 'Jude', last_name: 'Bellingham', age: 23, position: 'MOC', overall: 90, pace: 78, shooting: 85, passing: 82, dribbling: 87, defending: 60, physical: 78, tier: 'legend', fixedPrice: 150000000 },
  { first_name: 'Rodri', last_name: 'Hernández', age: 30, position: 'MC', overall: 91, pace: 60, shooting: 78, passing: 88, dribbling: 82, defending: 82, physical: 80, tier: 'legend', fixedPrice: 120000000 },
  { first_name: 'Mohamed', last_name: 'Salah', age: 34, position: 'AID', overall: 88, pace: 86, shooting: 88, passing: 80, dribbling: 88, defending: 35, physical: 70, tier: 'legend', fixedPrice: 60000000 },
  { first_name: 'Kevin', last_name: 'De Bruyne', age: 35, position: 'MOC', overall: 90, pace: 65, shooting: 86, passing: 94, dribbling: 86, defending: 55, physical: 68, tier: 'legend', fixedPrice: 50000000 },
  { first_name: 'Lamine', last_name: 'Yamal', age: 19, position: 'AID', overall: 86, pace: 92, shooting: 78, passing: 80, dribbling: 90, defending: 28, physical: 55, tier: 'legend', fixedPrice: 150000000 },
  { first_name: 'Bukayo', last_name: 'Saka', age: 24, position: 'AID', overall: 88, pace: 86, shooting: 82, passing: 82, dribbling: 88, defending: 45, physical: 65, tier: 'legend', fixedPrice: 140000000 },
  { first_name: 'Florian', last_name: 'Wirtz', age: 23, position: 'MOC', overall: 88, pace: 76, shooting: 82, passing: 86, dribbling: 90, defending: 42, physical: 58, tier: 'legend', fixedPrice: 130000000 },
  { first_name: 'Harry', last_name: 'Kane', age: 33, position: 'BU', overall: 89, pace: 68, shooting: 94, passing: 84, dribbling: 82, defending: 42, physical: 78, tier: 'legend', fixedPrice: 80000000 },
  { first_name: 'Cristiano', last_name: 'Ronaldo', age: 41, position: 'BU', overall: 84, pace: 65, shooting: 92, passing: 72, dribbling: 80, defending: 30, physical: 75, tier: 'legend', fixedPrice: 30000000 },
  { first_name: 'Lionel', last_name: 'Messi', age: 39, position: 'AID', overall: 86, pace: 60, shooting: 88, passing: 92, dribbling: 94, defending: 28, physical: 55, tier: 'legend', fixedPrice: 35000000 },
  { first_name: 'Pedri', last_name: 'González', age: 23, position: 'MC', overall: 88, pace: 70, shooting: 72, passing: 88, dribbling: 88, defending: 65, physical: 62, tier: 'legend', fixedPrice: 120000000 },
  { first_name: 'Phil', last_name: 'Foden', age: 26, position: 'AIG', overall: 88, pace: 82, shooting: 84, passing: 82, dribbling: 88, defending: 42, physical: 62, tier: 'legend', fixedPrice: 130000000 },
  { first_name: 'Jamal', last_name: 'Musiala', age: 23, position: 'MOC', overall: 88, pace: 78, shooting: 80, passing: 82, dribbling: 92, defending: 40, physical: 60, tier: 'legend', fixedPrice: 130000000 },

  // --- Légendes défensives ---
  // Ces noms existent aussi au palier « élite » : la déduplication conserve la
  // première occurrence, donc la version légendaire ci-dessous les remplace.
  { first_name: 'Alisson', last_name: 'Becker', age: 33, position: 'GAR', overall: 90, pace: 52, shooting: 18, passing: 78, dribbling: 48, defending: 90, physical: 84, tier: 'legend', fixedPrice: 55000000 },
  { first_name: 'Thibaut', last_name: 'Courtois', age: 34, position: 'GAR', overall: 90, pace: 48, shooting: 15, passing: 72, dribbling: 42, defending: 91, physical: 88, tier: 'legend', fixedPrice: 50000000 },

  { first_name: 'Virgil', last_name: 'van Dijk', age: 35, position: 'DC', overall: 89, pace: 76, shooting: 60, passing: 80, dribbling: 72, defending: 92, physical: 90, tier: 'legend', fixedPrice: 45000000 },
  { first_name: 'Rúben', last_name: 'Dias', age: 29, position: 'DC', overall: 88, pace: 72, shooting: 45, passing: 78, dribbling: 68, defending: 91, physical: 88, tier: 'legend', fixedPrice: 100000000 },
  { first_name: 'Achraf', last_name: 'Hakimi', age: 27, position: 'ARD', overall: 87, pace: 93, shooting: 72, passing: 80, dribbling: 86, defending: 80, physical: 78, tier: 'legend', fixedPrice: 100000000 },
  { first_name: 'Alphonso', last_name: 'Davies', age: 25, position: 'ARG', overall: 87, pace: 96, shooting: 66, passing: 78, dribbling: 87, defending: 79, physical: 78, tier: 'legend', fixedPrice: 100000000 },
  { first_name: 'Theo', last_name: 'Hernández', age: 28, position: 'PG', overall: 86, pace: 92, shooting: 74, passing: 80, dribbling: 84, defending: 80, physical: 85, tier: 'legend', fixedPrice: 85000000 },
  { first_name: 'Trent', last_name: 'Alexander-Arnold', age: 27, position: 'PD', overall: 87, pace: 80, shooting: 76, passing: 92, dribbling: 82, defending: 79, physical: 74, tier: 'legend', fixedPrice: 90000000 },
];

// =====================================================================
//  COMPOSITION DU MARCHÉ
//
//  Le pool final agrège trois sources :
//    1. BASE_POOL              — joueurs historiques du jeu (fictifs)
//    2. Joueurs réels          — dreamTeamPlayers.js + draftPoolReal.js
//    3. Pyramide amateur       — généré, pour couvrir R2 -> N1 et TOUS les postes
//
//  Le palier (`tier`) est déduit du niveau, sauf pour les légendes qui restent
//  marquées explicitement. Voir TIER_ORDER pour la correspondance division.
// =====================================================================

const DREAM_TEAM_PLAYERS = require('./dreamTeamPlayers');
const { EXTRA_REAL_PLAYERS } = require('./draftPoolReal');

/** Paliers du plus faible au plus fort. */
const TIER_ORDER = ['r2', 'r1', 'n3', 'n2', 'n1', 'ligue2', 'ligue1', 'elite', 'legend'];

const TIER_LABELS = {
  r2: 'Régional 2',
  r1: 'Régional 1',
  n3: 'National 3',
  n2: 'National 2',
  n1: 'National',
  ligue2: 'Ligue 2',
  ligue1: 'Ligue 1',
  elite: 'Élite européenne',
  legend: 'Légende',
};

/**
 * Palier déduit du niveau global.
 * Le seuil élite est fixé à 84 : les meilleurs latéraux et pistons du monde
 * plafonnent autour de 84-86, et un seuil à 86 les aurait exclus du haut de
 * gamme, laissant la division 7 sans arrière de classe mondiale.
 */
function tierFromOverall(overall) {
  if (overall <= 50) return 'r2';
  if (overall <= 56) return 'r1';
  if (overall <= 62) return 'n3';
  if (overall <= 67) return 'n2';
  if (overall <= 72) return 'n1';
  if (overall <= 77) return 'ligue2';
  if (overall <= 83) return 'ligue1';
  return 'elite';
}

function withTier(p) {
  // Les légendes gardent leur palier : elles ont une rareté et un prix à part.
  const tier = p.tier === 'legend' ? 'legend' : tierFromOverall(p.overall);
  return { ...p, tier };
}

// ---------------------------------------------------------------------
//  Génération de la pyramide amateur (R2 -> N1)
//  Objectif : garantir des joueurs à CHAQUE poste et à chaque niveau, ce
//  qui n'était pas le cas (MG, MD, MDF, PG, PD étaient absents du marché).
// ---------------------------------------------------------------------

const PRENOMS = [
  'Lucas', 'Théo', 'Hugo', 'Nathan', 'Enzo', 'Maxime', 'Romain', 'Axel', 'Yanis', 'Rayan',
  'Mathis', 'Noah', 'Adam', 'Gabin', 'Sofiane', 'Amine', 'Ethan', 'Naël', 'Maël', 'Ibrahim',
  'Kylian', 'Younes', 'Tiago', 'Léo', 'Malo', 'Célian', 'Moussa', 'Ismaël', 'Bilal', 'Sacha',
  'Antoine', 'Clément', 'Baptiste', 'Florian', 'Quentin', 'Valentin', 'Corentin', 'Damien',
  'Jordan', 'Kévin', 'Anthony', 'Mehdi', 'Karim', 'Samuel', 'Mattéo', 'Raphaël', 'Arthur', 'Jules',
];

const NOMS = [
  'Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy',
  'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia', 'David', 'Bertrand', 'Roux',
  'Vincent', 'Fournier', 'Morel', 'Girard', 'André', 'Mercier', 'Blanc', 'Guérin', 'Boyer',
  'Diallo', 'Traoré', 'Camara', 'Cissé', 'Sylla', 'Kouassi', 'Mendy', 'Sagna', 'Bakayoko',
  'Fontaine', 'Perrin', 'Legrand', 'Marchand', 'Roussel', 'Renard', 'Vasseur', 'Maillard',
  'Berthelot', 'Delaunay', 'Ollivier', 'Bonnet', 'Hervé', 'Barbier',
];

/** Générateur pseudo-aléatoire déterministe : le marché reste stable entre deux démarrages. */
function makeRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Pondération des attributs par poste, alignée sur playerGenerator.js. */
const POSITION_WEIGHTS = {
  GAR: { pace: 0.35, shooting: 0.15, passing: 0.55, dribbling: 0.30, defending: 1.00, physical: 0.95 },
  DC:  { pace: 0.70, shooting: 0.40, passing: 0.65, dribbling: 0.55, defending: 1.00, physical: 1.00 },
  ARG: { pace: 1.00, shooting: 0.50, passing: 0.80, dribbling: 0.80, defending: 0.90, physical: 0.80 },
  ARD: { pace: 1.00, shooting: 0.50, passing: 0.80, dribbling: 0.80, defending: 0.90, physical: 0.80 },
  PG:  { pace: 1.00, shooting: 0.55, passing: 0.85, dribbling: 0.85, defending: 0.85, physical: 0.80 },
  PD:  { pace: 1.00, shooting: 0.55, passing: 0.85, dribbling: 0.85, defending: 0.85, physical: 0.80 },
  MDF: { pace: 0.70, shooting: 0.50, passing: 0.85, dribbling: 0.70, defending: 1.00, physical: 0.95 },
  MC:  { pace: 0.75, shooting: 0.70, passing: 1.00, dribbling: 0.90, defending: 0.80, physical: 0.80 },
  MOC: { pace: 0.80, shooting: 0.85, passing: 1.00, dribbling: 1.00, defending: 0.45, physical: 0.60 },
  MG:  { pace: 0.95, shooting: 0.70, passing: 0.90, dribbling: 0.95, defending: 0.60, physical: 0.70 },
  MD:  { pace: 0.95, shooting: 0.70, passing: 0.90, dribbling: 0.95, defending: 0.60, physical: 0.70 },
  AIG: { pace: 1.00, shooting: 0.85, passing: 0.75, dribbling: 1.00, defending: 0.30, physical: 0.60 },
  AID: { pace: 1.00, shooting: 0.85, passing: 0.75, dribbling: 1.00, defending: 0.30, physical: 0.60 },
  BU:  { pace: 0.90, shooting: 1.00, passing: 0.60, dribbling: 0.85, defending: 0.25, physical: 0.90 },
};

const ALL_POSITIONS = Object.keys(POSITION_WEIGHTS);

/** Combien de joueurs générer par poste, pour chaque étage de la pyramide. */
const PYRAMID_LEVELS = [
  { tier: 'r2', league: 'Régional 2',  overall: [42, 50], perPosition: 4 },
  { tier: 'r1', league: 'Régional 1',  overall: [48, 56], perPosition: 4 },
  { tier: 'n3', league: 'National 3',  overall: [55, 62], perPosition: 3 },
  { tier: 'n2', league: 'National 2',  overall: [60, 67], perPosition: 3 },
  { tier: 'n1', league: 'National',    overall: [65, 72], perPosition: 3 },
];

function generatePyramid() {
  const rng = makeRng(20260816);
  const out = [];
  const used = new Set();

  for (const level of PYRAMID_LEVELS) {
    for (const position of ALL_POSITIONS) {
      for (let i = 0; i < level.perPosition; i++) {
        // Nom unique, pour ne pas créer de doublons dans le marché.
        let first, last, key, guard = 0;
        do {
          first = PRENOMS[Math.floor(rng() * PRENOMS.length)];
          last = NOMS[Math.floor(rng() * NOMS.length)];
          key = `${first}_${last}`;
        } while (used.has(key) && ++guard < 200);
        used.add(key);

        const [lo, hi] = level.overall;
        const overall = lo + Math.floor(rng() * (hi - lo + 1));
        const age = 18 + Math.floor(rng() * 18); // 18 à 35 ans
        const w = POSITION_WEIGHTS[position];

        const attr = (weight) => {
          const base = overall * (0.55 + weight * 0.5);
          const noise = Math.round((rng() - 0.5) * 8);
          return Math.max(12, Math.min(99, Math.round(base + noise)));
        };

        out.push({
          first_name: first,
          last_name: last,
          age,
          position,
          overall,
          pace: attr(w.pace),
          shooting: attr(w.shooting),
          passing: attr(w.passing),
          dribbling: attr(w.dribbling),
          defending: attr(w.defending),
          physical: attr(w.physical),
          tier: level.tier,
          league: level.league,
          country: 'France',
        });
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------------
//  Assemblage final
// ---------------------------------------------------------------------

/**
 * Clé de comparaison insensible aux accents et à la ponctuation :
 * « Mbappé » et « Mbappe » désignent le même joueur et ne doivent pas
 * coexister dans le marché avec deux postes et deux niveaux différents.
 */
function nameKey(p) {
  return `${p.first_name} ${p.last_name}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z]/gi, '')
    .toLowerCase();
}

/** Le premier trouvé gagne : BASE_POOL passe avant, les légendes sont donc préservées. */
function dedupe(players) {
  const seen = new Set();
  return players.filter(p => {
    const key = nameKey(p);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const DRAFT_POOL = dedupe([
  ...BASE_POOL.map(withTier),
  ...DREAM_TEAM_PLAYERS.map(p => withTier({ ...p, country: p.country || null })),
  ...EXTRA_REAL_PLAYERS.map(withTier),
  ...generatePyramid(),
]);

// ---------------------------------------------------------------------
//  Tarification
// ---------------------------------------------------------------------

const TIER_PRICES = {
  r2:     { min: 20000,    max: 200000 },
  r1:     { min: 50000,    max: 400000 },
  n3:     { min: 150000,   max: 900000 },
  n2:     { min: 300000,   max: 1800000 },
  n1:     { min: 600000,   max: 3000000 },
  ligue2: { min: 1200000,  max: 6000000 },
  ligue1: { min: 4000000,  max: 20000000 },
  elite:  { min: 15000000, max: 90000000 },
  legend: { min: 30000000, max: 180000000 },
};

function calculateDraftPrice(player) {
  if (player.fixedPrice) return player.fixedPrice;
  const range = TIER_PRICES[player.tier] || TIER_PRICES.n1;
  const overallFactor = Math.max(0, Math.min(1, (player.overall - 40) / 50));
  const ageFactor = player.age < 23 ? 1.3 : player.age > 32 ? 0.6 : 1.0;
  const base = range.min + (range.max - range.min) * overallFactor;
  return Math.max(range.min, Math.round(base * ageFactor / 50000) * 50000);
}

module.exports = {
  DRAFT_POOL,
  calculateDraftPrice,
  TIER_ORDER,
  TIER_LABELS,
  TIER_PRICES,
  tierFromOverall,
};
