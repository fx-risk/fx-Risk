import React, { createContext, useState, useContext } from 'react';
import { calculateRiskScore, recommendPurchaseAmount } from '../utils/calculator';

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  // Initial state for tenors
  const [tenorPlan, setTenorPlan] = useState({
    "1M": { target: 2000000, purchased: 600000 },
    "2M": { target: 2000000, purchased: 900000 },
    "3M": { target: 2000000, purchased: 1000000 },
    "4M": { target: 2000000, purchased: 1300000 },
    "5M": { target: 2000000, purchased: 1400000 },
  });

  // Market data inputs
  const [marketData, setMarketData] = useState({
    currentRate: 1395.50,
    fxTrend: 'UP',
    usRateExpectation: 'HIGH',
    krwSupply: 'NORMAL',
    globalRisk: 'HIGH',
    volatility: 'HIGH'
  });

  // Action to update market data
  const updateMarketData = (data) => {
    setMarketData({ ...marketData, ...data });
  };

  // Action to record a purchase
  const recordPurchase = (tenor, amount) => {
    setTenorPlan(prev => ({
      ...prev,
      [tenor]: {
        ...prev[tenor],
        purchased: prev[tenor].purchased + amount
      }
    }));
  };

  // Derived state: recommendations
  const riskScore = calculateRiskScore(marketData);
  
  const recommendations = Object.keys(tenorPlan).map(tenor => {
    const plan = tenorPlan[tenor];
    const remaining = Math.max(0, plan.target - plan.purchased);
    const rec = recommendPurchaseAmount(tenor, remaining, riskScore);
    
    return {
      tenor,
      target: plan.target,
      purchased: plan.purchased,
      remaining,
      recommended: rec.recommendedAmount,
      grade: rec.grade,
      badge: rec.badge,
      reason: rec.reason
    };
  });

  const totalTarget = Object.values(tenorPlan).reduce((acc, curr) => acc + curr.target, 0);
  const totalPurchased = Object.values(tenorPlan).reduce((acc, curr) => acc + curr.purchased, 0);
  const totalRecommended = recommendations.reduce((acc, curr) => acc + curr.recommended, 0);

  return (
    <AppContext.Provider value={{
      tenorPlan,
      marketData,
      updateMarketData,
      recordPurchase,
      riskScore,
      recommendations,
      totalTarget,
      totalPurchased,
      totalRecommended
    }}>
      {children}
    </AppContext.Provider>
  );
};
