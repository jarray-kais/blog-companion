# Configuration CI/CD GitHub Actions

Ce dossier contient les workflows GitHub Actions pour automatiser le déploiement de votre application.

## Workflow de déploiement

Le workflow `deploy.yml` s'exécute automatiquement :
- Lors d'un push sur la branche `main`
- Lors d'une Pull Request vers la branche `main`

## Secrets GitHub requis

Pour que le pipeline fonctionne, vous devez configurer les secrets suivants dans votre dépôt GitHub :

### Secrets Supabase

1. **SUPABASE_PROJECT_REF**
   - Où le trouver : Dashboard Supabase > Settings > General > Reference ID
   - Format : `grtnlwrhmgasaeegnkti` (votre project_id)

2. **SUPABASE_ACCESS_TOKEN**
   - Comment l'obtenir :
     1. Allez sur https://supabase.com/dashboard/account/tokens
     2. Créez un nouveau token avec les permissions nécessaires
     3. Copiez le token généré

### Secrets Netlify

3. **NETLIFY_SITE_ID**
   - Où le trouver : Dashboard Netlify > Site settings > General > Site details > Site ID

4. **NETLIFY_AUTH_TOKEN**
   - Comment l'obtenir :
     1. Allez sur https://app.netlify.com/user/applications#personal-access-tokens
     2. Créez un nouveau token
     3. Copiez le token généré

### Variables d'environnement pour le build

5. **VITE_SUPABASE_URL**
   - Où le trouver : Dashboard Supabase > Settings > API > Project URL

6. **VITE_SUPABASE_PUBLISHABLE_KEY**
   - Où le trouver : Dashboard Supabase > Settings > API > Project API keys > anon/public key

## Comment configurer les secrets

1. Allez dans votre dépôt GitHub
2. Cliquez sur **Settings**
3. Dans le menu de gauche, cliquez sur **Secrets and variables** > **Actions**
4. Cliquez sur **New repository secret**
5. Ajoutez chaque secret avec son nom et sa valeur

## Déroulement du pipeline

1. **Build** : Installe les dépendances, lance le linter et build le projet
2. **Deploy Edge Functions** : Déploie les fonctions `create-article` et `delete-article` sur Supabase
3. **Deploy Netlify** : Déploie l'application buildée sur Netlify
4. **Notify Success** : Affiche un message de succès si tout s'est bien passé

## Notes importantes

- Le pipeline ne se déclenche que sur les pushes vers `main` (pas sur les PR)
- Les Edge Functions sont déployées avec `--no-verify-jwt` (comme configuré localement)
- Le build utilise les variables d'environnement pour les clés Supabase

