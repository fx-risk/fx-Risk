// Risk score and recommendation logic based on spec

export const calculateRiskScore = (marketData) => {
  // Simple mock scoring logic for MVP
  // In a real scenario, this would evaluate actual market data thresholds
  
  const fxTrendScore = marketData.fxTrend === 'UP' ? 80 : marketData.fxTrend === 'DOWN' ? 20 : 50;
  const usRateScore = marketData.usRateExpectation === 'HIGH' ? 80 : 40;
  const krwSupplyScore = marketData.krwSupply === 'TIGHT' ? 70 : 30;
  const globalRiskScore = marketData.globalRisk === 'HIGH' ? 80 : 30;
  const volatilityScore = marketData.volatility === 'HIGH' ? 80 : 40;
  
  // Weights based on spec
  const totalScore = (
    fxTrendScore * 0.25 +
    usRateScore * 0.20 +
    krwSupplyScore * 0.15 +
    globalRiskScore * 0.15 +
    volatilityScore * 0.10 +
    60 * 0.15 // Default exposure score for MVP
  );
  
  return Math.round(totalScore);
};

export const recommendPurchaseAmount = (tenor, remainingAmount, riskScore) => {
  const tenorWeight = {
    "1M": 1.20,
    "2M": 1.00,
    "3M": 0.80,
    "4M": 0.60,
    "5M": 0.50,
  };

  const adjustedScore = riskScore * tenorWeight[tenor];
  
  let ratio = 0;
  let grade = "";
  let badge = "";

  if (adjustedScore >= 80) {
    ratio = 0.80;
    grade = "강력매입";
    badge = "badge-danger";
  } else if (adjustedScore >= 65) {
    ratio = 0.60;
    grade = "매입권고";
    badge = "badge-warning";
  } else if (adjustedScore >= 45) {
    ratio = 0.35;
    grade = "부분매입";
    badge = "badge-info";
  } else if (adjustedScore >= 30) {
    ratio = 0.10;
    grade = "소량매입";
    badge = "badge-neutral";
  } else {
    ratio = 0.00;
    grade = "관망";
    badge = "badge-neutral";
  }

  const recommendedAmount = remainingAmount * ratio;
  
  // Provide some default reasons based on grade and tenor
  let reason = "";
  if (grade === "강력매입") reason = "결제 시점이 가깝고 환율 상승 리스크가 커 방어 우선";
  else if (grade === "매입권고") reason = "단기 상승 리스크 존재, 변동성 확대 대비";
  else if (grade === "부분매입") reason = "방향성은 상승 우위이나 환율 단기 고점권 감안";
  else if (grade === "소량매입") reason = "장기 리스크 방어 차원의 일부 매입";
  else reason = "환율 수준이 부담스러워 최소 물량만 확보";

  return { recommendedAmount, grade, badge, reason };
};
