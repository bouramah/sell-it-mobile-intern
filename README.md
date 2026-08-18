# KFSTORE — App mobile client

App React Native (Expo) grand public pour les clients de KFSTORE : catalogue, commande, suivi,
crédit, assistant IA. Distincte de `../mobile` (appli interne pour le personnel des boutiques).
Consomme l'API du backend (`../backend`), sur un canal client isolé (jetons JWT non
interchangeables avec ceux du staff).

## Démarrage

1. **Prérequis** : Node.js 18+, Expo Go (téléphone) ou Xcode/Android Studio (simulateur).

2. **Installer les dépendances** :
   ```bash
   npm install
   ```

3. **Configurer l'API cible** — copier `.env.example` en `.env` :
   ```bash
   cp .env.example .env
   ```
   Par défaut pointe vers la prod (https://admin.kfstore-gn.com). Pour développer contre un
   backend local :
   - **Téléphone physique** : IP LAN de la machine de dev (`ipconfig getifaddr en0` sur Mac),
     jamais `localhost`. Démarrer le backend avec `--host 0.0.0.0` (voir `../backend/README.md`).
   - **Simulateur iOS** : `localhost` fonctionne (le simulateur partage le réseau de la machine
     hôte) — `EXPO_PUBLIC_API_BASE=http://localhost:8000/api/v1`.

4. **Lancer le bundler** :
   ```bash
   npm start
   ```
   Scanner le QR code avec **Expo Go**, ou :
   ```bash
   npm run ios       # simulateur iOS — build natif complet (expo run:ios)
   npm run android   # émulateur Android
   ```
   `npm run ios`/`npm run android` compilent un binaire natif (nécessaire pour les modules
   natifs — impression, partage, stockage sécurisé) ; `npm start` seul suffit pour Expo Go si
   aucun module natif custom n'a changé.

## Authentification

Pas de mot de passe : numéro de téléphone + code à usage unique reçu par SMS. Un numéro inconnu
crée automatiquement un compte (segment "nouveau", crédit non autorisé par défaut) — pas
d'inscription séparée.

## Structure

- `src/api/client.ts` — client HTTP, injecte le header `X-Client-Canal: mobile_client` sur
  chaque requête (distingue ce canal dans le journal d'audit).
- `src/screens/` :
  - `LoginScreen` — téléphone + OTP.
  - `CatalogueScreen`, `ProduitScreen` — navigation sans connexion, recherche, recommandations
    IA (produits similaires, souvent achetés ensemble, tendances du réseau).
  - `PanierScreen` — panier et passage de commande (connexion requise).
  - `CommandesScreen`, `CommandeDetailScreen` — suivi, historique, facture PDF.
  - `CompteScreen`, `CreditScreen` — profil, solde de crédit/dette, demande de crédit,
    signalement de remboursement.
  - `AssistantScreen` — chatbot service client (OpenAI), répond sur les commandes du client,
    son crédit, et le fonctionnement général de l'appli.
- `src/lib/AuthContext.tsx` — session client, jeton stocké via `expo-secure-store`.
- `src/lib/CartContext.tsx` — panier et boutique d'achat sélectionnée, en mémoire.

## Notes

- Les écrans d'onglet (Compte, Commandes...) restent montés par React Navigation en arrière-plan
  — les données qui peuvent changer côté serveur pendant que l'appli est ouverte (crédit activé,
  nouvelle commande) sont rechargées via `useFocusEffect` à chaque reprise de focus de l'onglet,
  pas seulement au montage initial.
- Mode de paiement Mobile Money visible mais désactivé (intégration à venir, cf. GAP_CDC.md à la
  racine du repo `Sell-It`).
