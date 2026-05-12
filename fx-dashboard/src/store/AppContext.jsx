import React, { createContext, useState, useContext, useEffect } from 'react';
import { calculateRiskScore, recommendPurchaseAmount } from '../utils/calculator';
import { getLatestRate, getRateHistory, getUSMarket } from '../api/client';

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

  // Market data inputs (백엔드 연동 전까지 fallback 값 유지)
  const [marketData, setMarketData] = useState({
    currentRate: 1395.50,
    fxTrend: 'UP',
    usRateExpectation: 'HIGH',
    krwSupply: 'NORMAL',
    globalRisk: 'HIGH',
    volatility: 'HIGH'
  });

  // 백엔드에서 받아온 실데이터 (null이면 mock으로 fallback)
  const [liveData, setLiveData] = useState({
    rateHistory: null,    // [{date, rate, ma5, ma20, ma60}]
    usMarket: null,       // {fed_funds_rate, treasury_10y, dollar_index, wti_oil}
    isLive: false,        // true면 실데이터 연동 성공
    lastFetched: null,
  });

  // 마운트 시 백엔드에서 데이터 가져오기. 실패하면 mock 유지.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [latest, history, us] = await Promise.all([
        getLatestRate(),
        getRateHistory(90),
        getUSMarket(),
      ]);
      if (cancelled) return;
      if (latest?.base_rate) {
        setMarketData(prev => ({ ...prev, currentRate: latest.base_rate }));
      }
      setLiveData({
        rateHistory: history,
        usMarket: us,
        isLive: !!(latest || history || us),
        lastFetched: new Date().toISOString(),
      });
    })();
    return () => { cancelled = true; };
  }, []);

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
      totalRecommended,
      liveData
    }}>
      {children}
    </AppContext.Provider>
  );
};
