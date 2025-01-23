// Simulation des données pour le frontend
let simulatedPrice = 45000;
let simulatedBalance = 10000;

export async function getCurrentPrice(): Promise<number> {
  // Simule une variation de prix réaliste
  const variation = (Math.random() - 0.5) * 100;
  simulatedPrice += variation;
  return simulatedPrice;
}

export async function executeBuyOrder() {
  const quantity = 0.001;
  simulatedBalance -= quantity * simulatedPrice;
  return {
    data: {
      executedQty: quantity
    }
  };
}

export async function executeSellOrder() {
  const quantity = 0.001;
  simulatedBalance += quantity * simulatedPrice;
  return {
    data: {
      executedQty: quantity
    }
  };
}

export async function getAccountBalance(): Promise<number> {
  return simulatedBalance;
}

export async function getHistoricalData(interval: string = '1h', limit: number = 100) {
  // Génère des données historiques simulées
  const data = [];
  let price = simulatedPrice;
  
  for (let i = 0; i < limit; i++) {
    const variation = (Math.random() - 0.5) * 100;
    price += variation;
    
    data.unshift({
      timestamp: Date.now() - i * 3600000,
      open: price - 10,
      high: price + 20,
      low: price - 20,
      close: price,
      volume: Math.random() * 100
    });
  }
  
  return data;
}