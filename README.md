# NAËLKA AI

Assistant personnel Android pour Samsung Galaxy A16. Le premier jalon contient un écran React en français et un pont Capacitor qui ouvre les paramètres Android sur demande.

## Audit initial

Le dépôt distant était vide. GitHub ne renvoyait aucun fichier, et `git ls-remote origin` ne renvoyait aucune référence. Les sources React, le projet Android et le workflow ont donc été initialisés dans ce dépôt.

| Composant | Version |
| --- | --- |
| Node.js en CI | 22 |
| Frontend | React 19, Vite 7, TypeScript 5 |
| Capacitor | 7.6.10 |
| JDK, Gradle, Android Gradle Plugin | 21, 8.11.1, 8.7.2 |
| Android | SDK de compilation et cible 35, API minimale 23 |

## Compiler

Avec Node 22.12 ou supérieur, le JDK 21 et le SDK Android 35 configuré via `ANDROID_HOME` :

```bash
npm ci
npm test
npm run build
npm run android:sync
cd android
./gradlew :app:testDebugUnitTest :app:assembleDebug :app:assembleDebugAndroidTest
```

Le workflow **Android APK** exécute les mêmes vérifications et publie l’artefact `naelka-debug`. Le fichier local se trouve à `android/app/build/outputs/apk/debug/app-debug.apk`.

## Installer sur le Galaxy A16

1. Dans GitHub, ouvrir **Actions → Android APK** et sélectionner une exécution réussie.
2. Télécharger `naelka-debug`, extraire `app-debug.apk` et le transférer sur le téléphone.
3. Ouvrir l’APK avec **Mes fichiers**. Si Android le demande, autoriser l’installation d’applications inconnues pour l’application qui ouvre le fichier, puis désactiver cette autorisation après l’installation.
4. Lancer **NAËLKA AI** et toucher **Ouvrir les paramètres Android** pour vérifier le pont natif. L’installation et cette interaction restent à vérifier sur le Galaxy A16.

## Permissions et signature

Le manifeste déclare la permission réseau normale `INTERNET`, fournie par le modèle Capacitor. L’application ne demande aucune permission au premier lancement. Le pont expose uniquement un Intent de paramètres invoqué par le bouton local. Le manifeste désactive la sauvegarde Android et le HTTP en clair.

Pour une diffusion release, générer une clé de signature et conserver le fichier keystore et ses mots de passe hors du dépôt. Compiler avec `./gradlew assembleRelease`, aligner l’APK non signé avec le `zipalign` des Build Tools, puis le signer avec `apksigner sign --ks /chemin/hors-du-depot/naelka.jks --out naelka-release.apk naelka-aligned.apk`. Vérifier avec `apksigner verify --verbose naelka-release.apk`. La clé de débogage ne sert pas à signer la version distribuée.

## Plan d’exécution

1. Initialiser Vite, Capacitor, le projet Android et la CI, puis valider le premier APK.
2. Ajouter le backend Gemini authentifié et la commande vocale française.
3. Étendre les commandes Android par Intents et intégrer les confirmations.
4. Ajouter l’accessibilité et le tableau des notifications avec les autorisations système.
5. Relier le planificateur à un exécuteur local limité aux actions validées.
6. Ajouter l’historique, la mémoire locale, l’arrêt et les réglages de confidentialité.
7. Valider les parcours sur appareil et préparer la livraison.

Le premier jalon se limite à l’écran d’accueil et à l’ouverture des paramètres. Gemini, la voix, les services Android et l’agent multi-étapes restent à développer.

## Phase 2 — Conversation et voix

L’installation, le démarrage et l’ouverture des paramètres de la version 1.0 ont été confirmés sur Galaxy A16. Sur la version 1.1, la dictée ouvre l’interface du service vocal Android en français. Le texte reconnu est inséré dans le champ de saisie pour relecture avant l’envoi. La touche Retour de l’interface de dictée annule la saisie. Le service vocal installé gère le microphone et peut traiter l’audio selon ses propres réglages. NAËLKA ne demande pas d’accès direct au microphone.

**Lire** utilise la voix française du moteur de synthèse Android. Android n’expose aucun attribut de genre standard pour ses voix. Une voix féminine peut être choisie dans les réglages du moteur s’il en propose une. **Arrêter la lecture** interrompt la synthèse. Les parcours vocaux restent à vérifier sur le téléphone.

Le backend Node.js exige trois variables d’environnement :

- `GEMINI_API_KEY` reçoit la clé Gemini côté serveur.
- `NAELKA_TOKEN` reçoit un code d’accès personnel et aléatoire d’au moins 32 caractères. Par exemple, `openssl rand -hex 32` génère un code adapté.
- `GEMINI_MODEL` sélectionne un modèle disponible pour la clé. La valeur par défaut est `gemini-2.5-flash`.

Lancer `npm run start:server` avec Node.js 22 ou supérieur. Le serveur écoute par défaut sur `127.0.0.1:8080`. Exposer `/chat` via un proxy HTTPS avec un certificat valide, ou définir `HOST=0.0.0.0` si la plateforme fournit son propre proxy TLS. Le Galaxy A16 doit pouvoir joindre cette adresse. Saisir l’adresse HTTPS et le code d’accès dans **Connexion Gemini**. Le code et l’historique restent en mémoire jusqu’au rechargement de l’application. Un envoi transmet au plus onze messages. Le serveur limite le code à douze requêtes par minute et par instance. **Effacer la conversation** supprime l’historique en mémoire dans l’application.

Le backend peut être testé avec `npm run test:server`. Ces tests couvrent le contrat d’entrée, l’authentification, la limitation et les réponses invalides du fournisseur. Le test en direct requiert le déploiement HTTPS et une clé Gemini valide.
