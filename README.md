# Bot de Trading Crypto

Bot de trading automatique utilisant l'API Binance, l'IA d'OpenAI et les actualités en temps réel.

## Configuration

1. Créez un compte sur Vercel et importez ce projet
2. Configurez les variables d'environnement suivantes dans les paramètres du projet Vercel :

   ```
   BINANCE_API_KEY=votre_clé_api_binance
   BINANCE_API_SECRET=votre_secret_api_binance
   OPENAI_API_KEY=votre_clé_api_openai
   GNEWS_API_KEY=votre_clé_api_gnews
   ```

3. Déployez le projet

## Développement local

1. Copiez `.env.example` vers `.env`
2. Remplissez les variables d'environnement dans `.env`
3. Installez les dépendances : `npm install`
4. Lancez le serveur de développement : `npm run dev`

## Fonctionnalités

- Trading automatique sur la paire BTC/USDT
- Analyse technique (RSI, EMA)
- Analyse des sentiments par IA (OpenAI)
- Actualités en temps réel (GNews)
- Interface en temps réel
- Gestion des ordres via Binance

## Sécurité

- Ne partagez jamais vos clés API
- Utilisez des clés API avec des permissions limitées
- Surveillez régulièrement l'activité du bot