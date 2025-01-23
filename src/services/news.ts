import { NewsItem } from '../types/trading';

export async function getLatestNews(): Promise<NewsItem[]> {
  return generateSimulatedNews();
}

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

    // Remplacer les variables dans les templates
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