import React from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ReferenceLine, Cell,
} from 'recharts';
import {
  TrendingUp, Activity, Globe, Newspaper,
  AlertTriangle, Info, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { useAppContext } from '../store/AppContext';
import {
  calculateScoreBreakdown,
  SCORE_WEIGHTS,
  SCORE_LABELS,
} from '../utils/calculator';

// mock 데이터 제거됨 — 실데이터 미수신 시 빈 상태로 표시

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

// 한국 시장 지표 및 뉴스 mock 제거됨 — 데이터 소스 연동 후 활성화

export default function MarketScreen() {
  const { marketData, riskScore, liveData } = useAppContext();
  const breakdown = calculateScoreBreakdown(marketData);

  const contributionData = Object.keys(breakdown).map(key => ({
    name: SCORE_LABELS[key],
    score: breakdown[key],
    weighted: Math.round(breakdown[key] * SCORE_WEIGHTS[key] * 10) / 10,
    weight: SCORE_WEIGHTS[key] * 100,
  }));

  // 실데이터만 표시 — 없으면 빈 상태
  const movingAverageData = formatHistoryForChart(liveData?.rateHistory);
  const usMarketIndicators = formatUSMarketForCards(liveData?.usMarket);
  const isLiveRate = !!movingAverageData;
  const isLiveUS = !!usMarketIndicators;

  const todayChange =
    movingAverageData && movingAverageData.length >= 2
      ? movingAverageData.at(-1).rate - movingAverageData.at(-2).rate
      : null;

  return (
    <div className="dashboard-grid">
      {/* 상단 요약 카드 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="col-span-4 glass-card"
      >
        <div className="metric-title">현재 USD/KRW</div>
        <div className="metric-value">{marketData.currentRate != null ? marketData.currentRate.toFixed(2) : '—'}</div>
        <div className={`metric-trend ${todayChange != null ? (todayChange > 0 ? 'trend-up' : 'trend-down') : ''}`} style={todayChange == null ? { color: 'var(--text-secondary)' } : undefined}>
          {todayChange != null ? (
            <>
              {todayChange > 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              <span>전일 대비 {todayChange > 0 ? '+' : ''}{todayChange.toFixed(2)}원</span>
            </>
          ) : (
            <span>전일 대비 데이터 없음</span>
          )}
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
              {isLiveRate ? '실시간 (한국은행 ECOS)' : '데이터 없음'}
            </span>
          </div>
        </div>
        <div className="chart-container" style={{ height: '340px' }}>
          {isLiveRate ? (
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
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)', flexDirection: 'column', gap: '0.5rem' }}>
              <Activity size={32} style={{ opacity: 0.5 }} />
              <span>환율 데이터를 불러오지 못했습니다.</span>
              <span style={{ fontSize: '0.8rem' }}>백엔드 ECOS 연동을 확인해 주세요.</span>
            </div>
          )}
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
            {isLiveUS ? '실시간 (FRED)' : '데이터 없음'}
          </span>
        </div>
        {isLiveUS ? (
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
        ) : (
          <div style={{ padding: '2rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
            FRED 데이터를 불러오지 못했습니다. 백엔드 연동을 확인해 주세요.
          </div>
        )}
      </motion.div>

      {/* 한국 시장 — 데이터 소스 연동 전까지 준비중 표시 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="col-span-6 glass-card"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={20} color="var(--accent-secondary)" />
            한국 시장 동향
          </h3>
          <span className="badge badge-neutral">데이터 연동 준비중</span>
        </div>
        <div style={{ padding: '2rem 1rem', color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.9rem', lineHeight: 1.6 }}>
          韓 기준금리·외국인 자금 흐름·원화 수급·CDS 프리미엄 등<br />
          한국은행 ECOS 추가 통계표 연동 후 활성화 예정입니다.
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

      {/* 주요 이벤트/뉴스 — 데이터 소스 연동 전까지 준비중 표시 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="col-span-6 glass-card"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Newspaper size={20} color="var(--warning)" />
            주요 이벤트 및 뉴스 리스크
          </h3>
          <span className="badge badge-neutral">데이터 연동 준비중</span>
        </div>
        <div style={{ padding: '2rem 1rem', color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.9rem', lineHeight: 1.6 }}>
          美 CPI·FOMC·한국 수출 등 환율 이벤트 캘린더는<br />
          뉴스 API 연동 후 활성화 예정입니다.
        </div>
      </motion.div>
    </div>
  );
}
