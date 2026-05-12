import React from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ReferenceLine, Cell,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Activity, Globe, Newspaper,
  AlertTriangle, Info, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { useAppContext } from '../store/AppContext';
import {
  calculateScoreBreakdown,
  SCORE_WEIGHTS,
  SCORE_LABELS,
} from '../utils/calculator';

const mockMovingAverageData = [
  { name: '4/12', rate: 1340, ma5: 1338, ma20: 1335, ma60: 1325 },
  { name: '4/15', rate: 1345, ma5: 1340, ma20: 1336, ma60: 1326 },
  { name: '4/18', rate: 1348, ma5: 1343, ma20: 1338, ma60: 1327 },
  { name: '4/22', rate: 1352, ma5: 1346, ma20: 1340, ma60: 1328 },
  { name: '4/25', rate: 1358, ma5: 1350, ma20: 1343, ma60: 1330 },
  { name: '4/29', rate: 1362, ma5: 1354, ma20: 1346, ma60: 1332 },
  { name: '5/2', rate: 1368, ma5: 1359, ma20: 1349, ma60: 1334 },
  { name: '5/5', rate: 1372, ma5: 1364, ma20: 1352, ma60: 1336 },
  { name: '5/8', rate: 1385, ma5: 1372, ma20: 1356, ma60: 1339 },
  { name: '5/11', rate: 1395, ma5: 1382, ma20: 1361, ma60: 1342 },
];

const mockUsMarket = [
  { label: '美 기준금리', value: '5.25%', detail: 'mock 데이터' },
  { label: '달러 인덱스(DXY)', value: '105.42', detail: 'mock 데이터' },
  { label: '美 10년 국채금리', value: '4.52%', detail: 'mock 데이터' },
  { label: 'WTI 유가', value: '$78.65', detail: 'mock 데이터' },
];

const formatHistoryForChart = (history) => {
  if (!history || history.length === 0) return null;
  // 최근 50개만 표시 (가독성)
  const sliced = history.slice(-50);
  return sliced.map(p => {
    const d = new Date(p.date);
    return {
      name: `${d.getMonth() + 1}/${d.getDate()}`,
      rate: p.rate,
      ma5: p.ma5,
      ma20: p.ma20,
      ma60: p.ma60,
    };
  });
};

const formatUSMarketForCards = (us) => {
  if (!us) return null;
  const fmt = (ind, suffix = '', prefix = '') =>
    ind?.value != null ? `${prefix}${ind.value.toFixed(2)}${suffix}` : '-';
  const dateOf = (ind) => ind?.date || '';
  return [
    { label: '美 기준금리 (DFF)',     value: fmt(us.fed_funds_rate, '%'), detail: `기준일 ${dateOf(us.fed_funds_rate)}` },
    { label: '달러 인덱스 (DTWEXBGS)', value: fmt(us.dollar_index),        detail: `기준일 ${dateOf(us.dollar_index)}` },
    { label: '美 10년 국채금리 (DGS10)', value: fmt(us.treasury_10y, '%'), detail: `기준일 ${dateOf(us.treasury_10y)}` },
    { label: 'WTI 유가 (DCOILWTICO)',  value: fmt(us.wti_oil, '', '$'),   detail: `기준일 ${dateOf(us.wti_oil)}` },
  ];
};

const krMarketIndicators = [
  { label: '韓 기준금리', value: '3.50%', change: '동결', trend: 'flat', detail: '한국은행 금통위 동결 결정' },
  { label: '코스피 외국인 순매수', value: '-1,240억', change: '순매도', trend: 'down', detail: '5일 연속 순매도' },
  { label: '원화 수급', value: '보통', change: '중립', trend: 'flat', detail: '수출입 결제 균형' },
  { label: '韓 CDS 프리미엄', value: '32bp', change: '+2bp', trend: 'up', detail: '소폭 상승' },
];

const newsEvents = [
  { time: '오늘 21:30', title: '美 4월 CPI 발표 예정', impact: 'HIGH', type: 'upcoming',
    note: '예상치 상회 시 달러 강세 압력 확대' },
  { time: '내일 03:00', title: 'FOMC 의사록 공개', impact: 'HIGH', type: 'upcoming',
    note: '금리 인하 시점에 대한 단서 주목' },
  { time: '어제', title: '美 PPI 예상치 상회', impact: 'MID', type: 'past',
    note: '인플레 둔화 지연 우려, 달러 강세 요인' },
  { time: '3일 전', title: '한국 4월 수출 +3.7%', impact: 'LOW', type: 'past',
    note: '원화 수급에 긍정적이나 영향 제한적' },
];

const impactBadge = {
  HIGH: 'badge-danger',
  MID: 'badge-warning',
  LOW: 'badge-info',
};

const labelKR = {
  HIGH: '높음',
  MID: '중간',
  LOW: '낮음',
};

const TrendIcon = ({ trend, size = 16 }) => {
  if (trend === 'up') return <ArrowUpRight size={size} color="var(--danger)" />;
  if (trend === 'down') return <ArrowDownRight size={size} color="var(--success)" />;
  return <Activity size={size} color="var(--text-secondary)" />;
};

export default function MarketScreen() {
  const { marketData, riskScore, liveData } = useAppContext();
  const breakdown = calculateScoreBreakdown(marketData);

  const contributionData = Object.keys(breakdown).map(key => ({
    name: SCORE_LABELS[key],
    score: breakdown[key],
    weighted: Math.round(breakdown[key] * SCORE_WEIGHTS[key] * 10) / 10,
    weight: SCORE_WEIGHTS[key] * 100,
  }));

  // 실데이터 우선, 없으면 mock fallback
  const liveHistory = formatHistoryForChart(liveData?.rateHistory);
  const movingAverageData = liveHistory || mockMovingAverageData;
  const usMarketIndicators = formatUSMarketForCards(liveData?.usMarket) || mockUsMarket;
  const isLiveRate = !!liveHistory;
  const isLiveUS = !!liveData?.usMarket;

  const todayChange = movingAverageData.at(-1).rate - movingAverageData.at(-2).rate;

  return (
    <div className="dashboard-grid">
      {/* 상단 요약 카드 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="col-span-4 glass-card"
      >
        <div className="metric-title">현재 USD/KRW</div>
        <div className="metric-value">{marketData.currentRate.toFixed(2)}</div>
        <div className={`metric-trend ${todayChange > 0 ? 'trend-up' : 'trend-down'}`}>
          {todayChange > 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
          <span>전일 대비 {todayChange > 0 ? '+' : ''}{todayChange.toFixed(2)}원</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="col-span-4 glass-card"
      >
        <div className="metric-title">종합 리스크 점수</div>
        <div
          className="metric-value"
          style={{ color: riskScore >= 65 ? 'var(--warning)' : 'var(--success)' }}
        >
          {riskScore}점
        </div>
        <div
          className="metric-trend"
          style={{ color: riskScore >= 65 ? 'var(--warning)' : 'var(--success)' }}
        >
          {riskScore >= 65 ? <AlertTriangle size={16} /> : <Info size={16} />}
          <span>{riskScore >= 65 ? '달러 강세 리스크 우세' : '리스크 안정권'}</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="col-span-4 glass-card"
      >
        <div className="metric-title">시장 변동성</div>
        <div className="metric-value" style={{ color: 'var(--warning)' }}>
          {marketData.volatility === 'HIGH' ? '높음' : '보통'}
        </div>
        <div className="metric-trend" style={{ color: 'var(--text-secondary)' }}>
          <Activity size={16} />
          <span>최근 10일 환율 표준편차 확대 추세</span>
        </div>
      </motion.div>

      {/* 이동평균 차트 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="col-span-8 glass-card"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>환율 이동평균 (5일 / 20일 / 60일)</h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <span className={`badge ${isLiveRate ? 'badge-success' : 'badge-neutral'}`}>
              {isLiveRate ? '실시간 (한국은행 ECOS)' : 'mock 데이터'}
            </span>
          </div>
        </div>
        <div className="chart-container" style={{ height: '340px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={movingAverageData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis domain={['dataMin - 5', 'dataMax + 5']} stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--bg-dark)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                itemStyle={{ color: 'var(--text-primary)' }}
              />
              <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
              <Line type="monotone" dataKey="rate" name="종가" stroke="var(--danger)" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="ma5" name="5일선" stroke="#fbbf24" strokeWidth={1.8} dot={false} />
              <Line type="monotone" dataKey="ma20" name="20일선" stroke="var(--accent-primary)" strokeWidth={1.8} dot={false} />
              <Line type="monotone" dataKey="ma60" name="60일선" stroke="var(--accent-secondary)" strokeWidth={1.8} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* 리스크 점수 분해 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="col-span-4 glass-card"
      >
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>리스크 점수 구성</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '1rem' }}>
          각 지표 점수 × 가중치 = 종합 기여도
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {contributionData.map(item => (
            <div key={item.name}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{item.name}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {item.score}점 × {item.weight}% = <strong style={{ color: 'var(--text-primary)' }}>{item.weighted}</strong>
                </span>
              </div>
              <div className="progress-bg" style={{ marginTop: 0 }}>
                <div
                  className="progress-fill"
                  style={{
                    width: `${item.score}%`,
                    background: item.score >= 65 ? 'var(--danger)' : item.score >= 45 ? 'var(--warning)' : 'var(--success)',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* 미국 시장 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="col-span-6 glass-card"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Globe size={20} color="var(--accent-primary)" />
            미국 시장 동향
          </h3>
          <span className={`badge ${isLiveUS ? 'badge-success' : 'badge-neutral'}`}>
            {isLiveUS ? '실시간 (FRED)' : 'mock 데이터'}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          {usMarketIndicators.map(item => (
            <div key={item.label} style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.label}</span>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{item.value}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                {item.detail}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* 한국 시장 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="col-span-6 glass-card"
      >
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp size={20} color="var(--accent-secondary)" />
          한국 시장 동향
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          {krMarketIndicators.map(item => (
            <div key={item.label} style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.label}</span>
                <TrendIcon trend={item.trend} />
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{item.value}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                {item.change} · {item.detail}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* 가중 기여도 막대차트 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
        className="col-span-6 glass-card"
      >
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>지표별 리스크 기여도</h3>
        <div className="chart-container" style={{ height: '280px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={contributionData} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={false} />
              <XAxis type="number" domain={[0, 20]} stroke="var(--text-secondary)" fontSize={12} />
              <YAxis type="category" dataKey="name" stroke="var(--text-secondary)" fontSize={12} width={90} tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{ backgroundColor: 'var(--bg-dark)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                itemStyle={{ color: 'var(--text-primary)' }}
                formatter={(value) => [`${value}점`, '가중 기여도']}
              />
              <Bar dataKey="weighted" radius={[0, 4, 4, 0]}>
                {contributionData.map((entry, idx) => (
                  <Cell
                    key={idx}
                    fill={entry.score >= 65 ? 'var(--danger)' : entry.score >= 45 ? 'var(--warning)' : 'var(--success)'}
                  />
                ))}
              </Bar>
              <ReferenceLine x={riskScore / 6} stroke="var(--text-secondary)" strokeDasharray="3 3" label={{ value: '평균', fill: 'var(--text-secondary)', fontSize: 11, position: 'top' }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* 주요 이벤트/뉴스 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="col-span-6 glass-card"
      >
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Newspaper size={20} color="var(--warning)" />
          주요 이벤트 및 뉴스 리스크
        </h3>
        <ul className="reason-list">
          {newsEvents.map((evt, idx) => (
            <li key={idx} className="reason-item" style={{ opacity: evt.type === 'past' ? 0.75 : 1 }}>
              <div style={{ minWidth: '70px' }}>
                <span
                  className={`badge ${impactBadge[evt.impact]}`}
                  style={{ fontSize: '0.7rem' }}
                >
                  {labelKR[evt.impact]}
                </span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <p style={{ fontWeight: 500 }}>{evt.title}</p>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>{evt.time}</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{evt.note}</p>
              </div>
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
}
