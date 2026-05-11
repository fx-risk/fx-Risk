import React from 'react';
import { ArrowUpRight, ArrowDownRight, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { useAppContext } from './store/AppContext';

// Mock Data for chart
const rateData = [
  { name: '5/1', rate: 1350 }, { name: '5/2', rate: 1355 }, { name: '5/3', rate: 1362 },
  { name: '5/4', rate: 1360 }, { name: '5/5', rate: 1368 }, { name: '5/6', rate: 1375 },
  { name: '5/7', rate: 1372 }, { name: '5/8', rate: 1380 }, { name: '5/9', rate: 1385 },
  { name: '5/10', rate: 1390 }, { name: '5/11', rate: 1395 },
];

const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

export default function Dashboard() {
  const { marketData, riskScore, recommendations, totalTarget, totalPurchased, totalRecommended } = useAppContext();
  
  const progressPercent = Math.round((totalPurchased / totalTarget) * 100);

  return (
    <div className="dashboard-grid">
      {/* Top Metrics */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="col-span-3 glass-card">
        <div className="metric-title">오늘의 USD/KRW</div>
        <div className="metric-value">{marketData.currentRate.toFixed(2)}</div>
        <div className="metric-trend trend-up">
          <ArrowUpRight size={16} />
          <span>단기 추세: {marketData.fxTrend === 'UP' ? '상승' : '하락'}</span>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }} className="col-span-3 glass-card">
        <div className="metric-title">종합 리스크 점수</div>
        <div className="metric-value" style={{ color: riskScore >= 65 ? 'var(--warning)' : 'var(--success)' }}>{riskScore}점</div>
        <div className="metric-trend" style={{ color: riskScore >= 65 ? 'var(--warning)' : 'var(--success)' }}>
          {riskScore >= 65 ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          <span>{riskScore >= 65 ? '달러 상승 리스크 우세' : '리스크 안정권'}</span>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }} className="col-span-3 glass-card">
        <div className="metric-title">월간 목표 매입액</div>
        <div className="metric-value">{formatCurrency(totalTarget)}</div>
        <div className="progress-bg">
          <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
        </div>
        <div className="metric-trend" style={{ color: 'var(--text-secondary)' }}>
          <span>진행률 {progressPercent}% ({formatCurrency(totalPurchased)} 완료)</span>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 }} className="col-span-3 glass-card" style={{ border: '1px solid rgba(59, 130, 246, 0.5)', background: 'linear-gradient(180deg, rgba(25, 28, 41, 0.7) 0%, rgba(30, 58, 138, 0.2) 100%)' }}>
        <div className="metric-title">오늘 총 추천 매입액</div>
        <div className="metric-value" style={{ color: 'var(--accent-primary)' }}>{formatCurrency(totalRecommended)}</div>
        <div className="metric-trend" style={{ color: 'var(--text-secondary)' }}>
          <CheckCircle2 size={16} color="var(--accent-primary)" />
          <span>전체 잔여금의 {Math.round((totalRecommended / (totalTarget - totalPurchased)) * 100 || 0)}% 매입 추천</span>
        </div>
      </motion.div>

      {/* Main Content Row 1 */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4 }} className="col-span-8 glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>최근 환율 추이 및 리스크 구간</h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <span className={`badge ${marketData.fxTrend === 'UP' ? 'badge-danger' : 'badge-success'}`}>
              5일 추세: {marketData.fxTrend === 'UP' ? '상승' : '하락'}
            </span>
          </div>
        </div>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={rateData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--danger)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--danger)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis domain={['dataMin - 10', 'dataMax + 10']} stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--bg-dark)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                itemStyle={{ color: 'var(--text-primary)' }}
              />
              <Area type="monotone" dataKey="rate" stroke="var(--danger)" strokeWidth={3} fillOpacity={1} fill="url(#colorRate)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.5 }} className="col-span-4 glass-card">
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>종합 추천 사유</h3>
        <ul className="reason-list">
          <li className="reason-item">
            <AlertTriangle className="reason-icon" size={20} />
            <div>
              <p style={{ fontWeight: 500 }}>미국 금리 인하 기대 {marketData.usRateExpectation === 'HIGH' ? '약화' : '유지'}</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>달러 강세 압력이 {marketData.usRateExpectation === 'HIGH' ? '유지' : '완화'}되고 있습니다.</p>
            </div>
          </li>
          <li className="reason-item">
            <Info className="reason-icon" size={20} color="var(--warning)" />
            <div>
              <p style={{ fontWeight: 500 }}>글로벌 리스크 {marketData.globalRisk === 'HIGH' ? '확대' : '안정'}</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>리스크 오프 심리에 따른 환율 변동성에 주의해야 합니다.</p>
            </div>
          </li>
          <li className="reason-item">
            <CheckCircle2 className="reason-icon" size={20} color="var(--success)" />
            <div>
              <p style={{ fontWeight: 500 }}>만기별 분할 매입 권고</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>시장 상황에 따라 전량 매입보다는 방어적 분할 매입이 적절합니다.</p>
            </div>
          </li>
        </ul>
      </motion.div>

      {/* Main Content Row 2 */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.6 }} className="col-span-12 glass-card">
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>만기별 상세 추천 금액</h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>만기 (Tenor)</th>
                <th>잔여 목표액</th>
                <th>추천 매입액</th>
                <th>추천 등급</th>
                <th>추천 상세 사유</th>
              </tr>
            </thead>
            <tbody>
              {recommendations.map((row, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 500 }}>{row.tenor}</td>
                  <td>{formatCurrency(row.remaining)}</td>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatCurrency(row.recommended)}</td>
                  <td><span className={`badge ${row.badge}`}>{row.grade}</span></td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{row.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
