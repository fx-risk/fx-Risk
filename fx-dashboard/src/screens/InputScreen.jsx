import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '../store/AppContext';
import { DollarSign, Save, CheckCircle2, Target } from 'lucide-react';

const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

export default function InputScreen() {
  const { marketData, updateMarketData, tenorPlan, recordPurchase, setAllTenorTargets } = useAppContext();

  // Market Input State
  const [localMarket, setLocalMarket] = useState({ ...marketData });

  // Purchase Input State
  const [purchaseInput, setPurchaseInput] = useState({
    tenor: '1M',
    amount: ''
  });

  // Tenor Target Input State — 만기별 목표액
  const [targetInputs, setTargetInputs] = useState(() => {
    const obj = {};
    Object.keys(tenorPlan).forEach(t => { obj[t] = tenorPlan[t].target || ''; });
    return obj;
  });

  const targetSum = Object.values(targetInputs).reduce((acc, v) => acc + (Number(v) || 0), 0);

  const handleMarketSave = () => {
    updateMarketData(localMarket);
    alert('시장 데이터가 저장되었으며, 새로운 추천 알고리즘이 반영되었습니다.');
  };

  const handlePurchaseSave = () => {
    if (!purchaseInput.amount || isNaN(purchaseInput.amount)) {
      alert('올바른 매입 금액을 입력해주세요.');
      return;
    }
    recordPurchase(purchaseInput.tenor, Number(purchaseInput.amount));
    setPurchaseInput({ ...purchaseInput, amount: '' });
    alert('매입 결과가 성공적으로 반영되었습니다.');
  };

  const handleTargetSave = () => {
    const parsed = {};
    let hasError = false;
    Object.keys(targetInputs).forEach(t => {
      const v = targetInputs[t];
      if (v === '' || v == null) { parsed[t] = 0; return; }
      const n = Number(v);
      if (isNaN(n) || n < 0) { hasError = true; return; }
      parsed[t] = n;
    });
    if (hasError) {
      alert('만기별 목표액은 0 이상의 숫자여야 합니다.');
      return;
    }
    setAllTenorTargets(parsed);
    alert(`만기별 목표액이 저장되었습니다. (총 ${formatCurrency(Object.values(parsed).reduce((a, b) => a + b, 0))})`);
  };

  const fillEvenSplit = (totalUSD) => {
    const per = Math.floor(totalUSD / Object.keys(tenorPlan).length);
    const next = {};
    Object.keys(tenorPlan).forEach(t => { next[t] = per; });
    setTargetInputs(next);
  };

  return (
    <div className="dashboard-grid">
      {/* ① 만기별 목표액 등록 — 월초 운영 시작 시 1회 입력 */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="col-span-12 glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Target size={20} color="var(--accent-secondary)" />
              만기별 월 목표 매입액 (Monthly Target)
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              월초에 1M~5M 각 만기별 목표 매입액을 등록합니다. 추천 알고리즘은 이 목표를 기준으로 잔여액을 계산합니다.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button onClick={() => fillEvenSplit(10000000)} className="btn" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              월 $10M 균등분배
            </button>
            <button onClick={() => fillEvenSplit(5000000)} className="btn" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              월 $5M 균등분배
            </button>
            <button onClick={() => setTargetInputs({ "1M": 0, "2M": 0, "3M": 0, "4M": 0, "5M": 0 })} className="btn" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              모두 0
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
          {Object.keys(tenorPlan).map(t => (
            <div key={t}>
              <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>
                {t} 목표액 (USD)
              </label>
              <input
                type="number"
                min="0"
                step="100000"
                placeholder="0"
                value={targetInputs[t]}
                onChange={e => setTargetInputs({ ...targetInputs, [t]: e.target.value })}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
              />
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                현재 매입: {formatCurrency(tenorPlan[t].purchased)}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'rgba(59, 130, 246, 0.08)', borderRadius: '0.5rem', marginBottom: '1rem', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>입력된 총 목표액</span>
          <span style={{ fontWeight: 700, color: 'var(--accent-primary)', fontSize: '1.1rem' }}>{formatCurrency(targetSum)}</span>
        </div>

        <button onClick={handleTargetSave} className="btn btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
          <Save size={18} /> 만기별 목표액 저장
        </button>
      </motion.div>

      {/* ② 시장 데이터 입력 */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }} className="col-span-6 glass-card">
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <DollarSign size={20} color="var(--accent-primary)" />
          시장 데이터 입력 (매일 업데이트)
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>오늘의 USD/KRW 환율</label>
            <input
              type="number"
              value={localMarket.currentRate ?? ''}
              placeholder="예: 1395.50 (백엔드 자동값 사용 시 비워두세요)"
              onChange={e => setLocalMarket({...localMarket, currentRate: e.target.value === '' ? null : Number(e.target.value)})}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>환율 단기 추세</label>
            <select
              value={localMarket.fxTrend}
              onChange={e => setLocalMarket({...localMarket, fxTrend: e.target.value})}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
            >
              <option value="UP">상승 추세</option>
              <option value="NEUTRAL">보합 추세</option>
              <option value="DOWN">하락 추세</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>미국 금리 인하 기대감</label>
            <select
              value={localMarket.usRateExpectation}
              onChange={e => setLocalMarket({...localMarket, usRateExpectation: e.target.value})}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
            >
              <option value="HIGH">약화 (금리 유지 전망)</option>
              <option value="LOW">강화 (금리 인하 전망)</option>
            </select>
          </div>

          <button onClick={handleMarketSave} className="btn btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
            <Save size={18} /> 알고리즘 재계산 및 저장
          </button>
        </div>
      </motion.div>

      {/* ③ 실제 매입 결과 입력 */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }} className="col-span-6 glass-card">
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Save size={20} color="var(--success)" />
          실제 매입 결과 입력
        </h3>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          외환 담당자가 은행과 실제 거래한 후, 매입한 금액을 만기별로 입력합니다. 입력된 데이터는 다음 날 기매입 금액으로 반영됩니다.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>매입 만기 (Tenor)</label>
            <select
              value={purchaseInput.tenor}
              onChange={e => setPurchaseInput({...purchaseInput, tenor: e.target.value})}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
            >
              {Object.keys(tenorPlan).map(t => (
                <option key={t} value={t}>
                  {t} (잔여: {formatCurrency(Math.max(0, tenorPlan[t].target - tenorPlan[t].purchased))})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>실제 매입 금액 (USD)</label>
            <input
              type="number"
              placeholder="예: 500000"
              value={purchaseInput.amount}
              onChange={e => setPurchaseInput({...purchaseInput, amount: e.target.value})}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
            />
          </div>

          <button onClick={handlePurchaseSave} className="btn" style={{ background: 'var(--success)', color: 'white', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={18} /> 매입 결과 등록
          </button>
        </div>
      </motion.div>
    </div>
  );
}
