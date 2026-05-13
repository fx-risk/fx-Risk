import React, { createContext, useState, useContext, useEffect } from 'react';
import { calculateRiskScore, recommendPurchaseAmount } from '../utils/calculator';
import { getLatestRate, getRateHistory, getUSMarket } from '../api/client';

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  // Initial state for tenors — 운영 시작: 모든 값 0. 담당자가 입력 화면에서 등록.
  const [tenorPlan, setTenorPlan] = useState({
    "1M": { target: 0, purchased: 0 },
    "2M": { target: 0, purchased: 0 },
    "3M": { target: 0, purchased: 0 },
    "4M": { target: 0, purchased: 0 },
    "5M": { target: 0, purchased: 0 },
  });

  // Market data — currentRate는 백엔드에서 받아오고, 나머지 enum은 담당자가 입력 화면에서 설정.
  const [marketData, setMarketData] = useState({
    currentRate: null,
    fxTrend: 'NEUTRAL',
    usRateExpectation: 'LOW',
    krwSupply: 'NORMAL',
    globalRisk: 'LOW',
    volatility: 'NORMAL'
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

  // Action to set monthly target per tenor (담당자가 월별 목표 등록 시 사용)
  const setTenorTarget = (tenor, target) => {
    setTenorPlan(prev => ({
      ...prev,
      [tenor]: { ...prev[tenor], target: Math.max(0, target) }
    }));
  };

  // Bulk update of all tenor targets at once
  const setAllTenorTargets = (targets) => {
    setTenorPlan(prev => {
      const next = { ...prev };
      Object.keys(targets).forEach(t => {
        if (next[t]) next[t] = { ...next[t], target: Math.max(0, targets[t]) };
      });
      return next;
    });
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
      setTenorTarget,
      setAllTenorTargets,
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
