import { getJson } from 'google-search-results-nodejs';
import NodeCache from 'node-cache';
import { NewsItem } from '../types/trading';

const serpApi = new getJson(import.meta.env.VITE_SERPAPI_API_KEY);
const newsCache = new NodeCache();
const CACHE_KEY = 'crypto_news';
const CACHE_TTL = 24 * 60 * 60; // 24 heures en secondes

function getCurrentDate() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function shouldRefreshCache(): boolean {
  const now = new Date();
  const currentHour = now.getHours();
  const lastUpdate = newsCache.get('last_update');
  
  // Rafraîchir si pas de dernière mise à jour ou si nous sommes après 8h et la dernière mise à jour était avant 8h aujourd'hui
  if (!lastUpdate) return true;
  
  const lastUpdateDate = new Date(lastUpdate);
  return currentHour >= 8 && (
    lastUpdateDate.getDate() !== now.getDate() ||
    lastUpdateDate.getHours() < 8
  );
}

async function fetchNewsFromSerpApi(): Promise<NewsItem[]> {
  return new Promise((resolve, reject) => {
    const params = {
      q: "cryptocurrency news",
      tbm: "nws",
      tbs: "qdr:d", // Dernières 24h
      num: 10,
      hl: "fr"
    };

    serpApi.json(params, (data: any) => {
      if (data.error) {
        console.error('SerpApi error:', data.error);
        reject(data.error);
        return;
      }

      const news = data.news_results?.map((item: any) => ({
        title: item.title,
        description: item.snippet,
        url: item.link,
        publishedAt: item.date || new Date().toISOString(),
        source: item.source
      })) || [];

      newsCache.set(CACHE_KEY, news, CACHE_TTL);
      newsCache.set('last_update', new Date().toISOString());
      resolve(news);
    });
  });
}

export async function getLatestNews(): Promise<NewsItem[]> {
  try {
    // Vérifier si nous devons rafraîchir le cache
    if (shouldRefreshCache()) {
      console.log('Rafraîchissement des actualités via SerpApi...');
      return await fetchNewsFromSerpApi();
    }

    // Utiliser le cache si disponible
    const cachedNews = newsCache.get<NewsItem[]>(CACHE_KEY);
    if (cachedNews) {
      console.log('Utilisation des actualités en cache');
      return cachedNews;
    }

    // Si pas de cache, récupérer de nouvelles actualités
    return await fetchNewsFromSerpApi();
  } catch (error) {
    console.error('Erreur lors de la récupération des actualités:', error);
    return generateSimulatedNews();
  }
}

// Fonction de fallback pour générer des actualités simulées
function generateSimulatedNews(): NewsItem[] {
  const templates = [
    {
      title: 'Bitcoin atteint un nouveau sommet de ${price}$ cette semaine',
      description: 'Les analystes attribuent cette hausse à une adoption institutionnelle croissante et à des développements positifs dans le secteur.'
    },
    {
      title: 'Les géants de la finance traditionnelle se tournent vers les crypto-monnaies',
      description: 'De plus en plus d\'institutions financières intègrent les crypto-monnaies dans leurs services, signalant une adoption mainstream croissante.'
    },
    {
      title: 'Analyse technique : Le RSI du Bitcoin indique ${signal}',
      description: 'Les indicateurs techniques suggèrent une possible ${direction} du Bitcoin dans les prochains jours.'
    },
    {
      title: 'Innovation blockchain : Nouveau protocole DeFi lancé',
      description: 'Un nouveau protocole promet d\'améliorer l\'efficacité des transactions et la sécurité dans l\'écosystème DeFi.'
    },
    {
      title: 'Régulation crypto : ${country} annonce un cadre favorable',
      description: 'De nouvelles réglementations visent à encourager l\'innovation tout en protégeant les investisseurs.'
    }
  ];

  const countries = ['La France', 'Les États-Unis', 'Le Royaume-Uni', 'Le Japon', 'L\'Union Européenne'];
  const signals = ['une zone de surachat', 'une zone de survente', 'une tendance haussière', 'une consolidation'];
  const directions = ['hausse', 'consolidation', 'correction technique', 'accumulation'];

  return templates.map((template, index) => {
    let title = template.title;
    let description = template.description;

    if (title.includes('${price}')) {
      const price = (Math.floor(Math.random() * 20000) + 40000).toLocaleString('fr-FR');
      title = title.replace('${price}', price);
    }
    if (title.includes('${signal}')) {
      const signal = signals[Math.floor(Math.random() * signals.length)];
      title = title.replace('${signal}', signal);
    }
    if (title.includes('${country}')) {
      const country = countries[Math.floor(Math.random() * countries.length)];
      title = title.replace('${country}', country);
    }
    if (description.includes('${direction}')) {
      const direction = directions[Math.floor(Math.random() * directions.length)];
      description = description.replace('${direction}', direction);
    }

    return {
      title,
      description,
      url: `https://example.com/crypto-news/${Date.now()}-${index}`,
      publishedAt: new Date(Date.now() - index * 3600000).toISOString(),
      source: 'Simulation'
    };
  });
}
