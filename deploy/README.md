# Déploiement sur un serveur IONOS

Ce dossier contient tout le nécessaire pour héberger Foot Manager sur un VPS ou
un Cloud Server IONOS, avec déploiement automatique depuis GitHub.

## Prérequis

Un serveur avec accès SSH et droits `sudo`. Un hébergement mutualisé ou une
offre sans disque persistant ne conviennent pas : voir la note en fin de page.

---

## 1. Préparer le serveur

Connexion en SSH, puis :

```bash
# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git nginx

# Dossier applicatif
sudo mkdir -p /var/www/footmanager
sudo chown -R $USER:$USER /var/www/footmanager

# Dossier de données, SÉPARÉ de l'application
sudo mkdir -p /var/lib/footmanager
sudo chown -R www-data:www-data /var/lib/footmanager
```

La séparation des deux dossiers est le point le plus important : le code est
remplacé à chaque déploiement, la base ne doit jamais l'être.

## 2. Premier déploiement manuel

```bash
cd /var/www/footmanager
git clone https://github.com/matheovernede/YourTeamHistory.git .
npm install
npm run build
```

## 3. Service systemd

```bash
sudo cp deploy/footmanager.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now footmanager
sudo systemctl status footmanager
```

Vérification :

```bash
curl http://127.0.0.1:3001/api/health
```

## 4. Nginx et nom de domaine

Remplacer `VOTRE-DOMAINE.fr` dans `deploy/nginx.conf`, puis :

```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/footmanager
sudo ln -s /etc/nginx/sites-available/footmanager /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Côté IONOS, dans la gestion DNS du domaine, créer :

| Type | Nom | Valeur |
|------|-----|--------|
| A    | @   | adresse IPv4 du serveur |
| A    | www | adresse IPv4 du serveur |

La propagation prend de quelques minutes à quelques heures.

## 5. HTTPS

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d VOTRE-DOMAINE.fr -d www.VOTRE-DOMAINE.fr
```

Certbot modifie la configuration nginx et met en place le renouvellement
automatique.

## 6. Déploiement automatique depuis GitHub

Sur le serveur, créer une clé dédiée au déploiement :

```bash
ssh-keygen -t ed25519 -C "github-deploy" -f ~/.ssh/github_deploy -N ""
cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys
cat ~/.ssh/github_deploy      # à copier intégralement
```

Autoriser le redémarrage du service sans mot de passe :

```bash
echo "$USER ALL=(ALL) NOPASSWD: /bin/systemctl restart footmanager, /bin/systemctl is-active footmanager" \
  | sudo tee /etc/sudoers.d/footmanager
```

Puis sur GitHub, dans **Settings → Secrets and variables → Actions**, ajouter :

| Secret | Valeur |
|--------|--------|
| `SSH_HOST` | adresse IP du serveur |
| `SSH_USER` | votre utilisateur SSH |
| `SSH_KEY`  | contenu de la clé privée `github_deploy` |
| `SSH_PORT` | `22` (facultatif) |
| `APP_DIR`  | `/var/www/footmanager` (facultatif) |

Désormais, chaque `git push` sur `master` lance les tests puis déploie.
Tant que `SSH_HOST` n'existe pas, seuls les tests s'exécutent : le dépôt reste
utilisable même sans serveur configuré.

---

## Sauvegardes

La base tient dans un seul fichier, sa sauvegarde est donc triviale :

```bash
sudo cp /var/lib/footmanager/footmanager.db ~/sauvegarde-$(date +%F).db
```

Pour automatiser, une tâche cron quotidienne :

```bash
0 4 * * * cp /var/lib/footmanager/footmanager.db /home/USER/backups/fm-$(date +\%F).db
```

---

## Pourquoi pas IONOS Deploy Now ?

Deploy Now se connecte effectivement à GitHub en quelques clics, mais il est
conçu pour des sites statiques et des applications sans état.

Foot Manager écrit sa base dans un fichier et a besoin d'un **disque persistant**
ainsi que d'un **processus Node permanent**. Sur une plateforme sans stockage
durable, toutes les parties sauvegardées disparaissent à chaque redéploiement —
exactement le problème rencontré sur le plan gratuit de Render.

Si votre offre IONOS est un VPS ou un Cloud Server, suivez ce guide.
Si c'est un hébergement mutualisé ou Deploy Now, vérifiez dans votre espace
client que Node.js et un stockage persistant sont bien disponibles avant
d'aller plus loin.
