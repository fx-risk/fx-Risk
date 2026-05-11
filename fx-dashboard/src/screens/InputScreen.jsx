import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '../store/AppContext';
import { DollarSign, Save, CheckCircle2 } from 'lucide-react';

export default function InputScreen() {
  const { marketData, updateMarketData, tenorPlan, recordPurchase } = useAppContext();
  
  // Market Input State
  const [localMarket, setLocalMarket] = useState({ ...marketData });
  
  // Purchase Input State
  const [purchaseInput, setPurchaseInput] = useState({
    tenor: '1M',
    amount: ''
  });

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

  return (
    <div className="dashboard-grid">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="col-span-6 glass-card">
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <DollarSign size={20} color="var(--accent-primary)" />
          시장 데이터 입력 (매일 업데이트)
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>오늘의 USD/KRW 환율</label>
            <input 
              type="number" 
              value={localMarket.currentRate} 
              onChange={e => setLocalMarket({...localMarket, currentRate: Number(e.target.value)})}
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

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }} className="col-span-6 glass-card">
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
              {Object.keys(tenorPlan).map(t => <option key={t} value={t}>{t} (잔여: {tenorPlan[t].target - tenorPlan[t].purchased} USD)</option>)}
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
