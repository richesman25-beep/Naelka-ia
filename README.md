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
