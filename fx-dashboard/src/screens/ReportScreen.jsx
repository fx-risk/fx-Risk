import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, Calendar, CalendarRange, CalendarDays,
  Download, Printer, TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle2, Target,
} from 'lucide-react';
import { useAppContext } from '../store/AppContext';

const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
const formatKRW = (val) => new Intl.NumberFormat('ko-KR').format(Math.round(val));

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
};

const weekRangeStr = () => {
  const d = new Date();
  const day = d.getDay();
  const monday = new Date(d); monday.setDate(d.getDate() - ((day + 6) % 7));
  const friday = new Date(monday); friday.setDate(monday.getDate() + 4);
  const fmt = (x) => `${x.getMonth() + 1}/${x.getDate()}`;
  return `${fmt(monday)} ~ ${fmt(friday)}`;
};

const monthStr = () => {
  const d = new Date();
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
};

const overallStrategy = (score) => {
  if (score >= 80) return '강력 매입';
  if (score >= 65) return '부분 매입 (방어 우선)';
  if (score >= 45) return '부분 매입';
  if (score >= 30) return '소량 매입';
  return '관망';
};

const marketJudgement = (score) => {
  if (score >= 65) return '달러 강세 리스크 우세';
  if (score >= 45) return '상승 압력 존재, 변동성 확대 가능';
  return '리스크 안정권';
};

// 주간/월간용 mock 데이터 (실제 운영 시 백엔드에서 가져올 영역)
const weeklyHighlights = {
  high: 1395.50,
  low: 1372.30,
  open: 1378.00,
  close: 1395.50,
  bullDrivers: [
    '美 4월 PPI 예상치 상회로 인플레 둔화 지연 우려',
    'FOMC 위원 매파적 발언, 연내 금리 인하 기대 약화',
    '중동 지정학 리스크 확대로 안전자산 선호',
  ],
  bearDrivers: [
    '한국 4월 수출 +3.7% 호조',
    '외국인 채권 자금 일부 유입',
  ],
  nextWeekEvents: [
    { date: '월', event: '美 5월 소매판매', impact: 'MID' },
    { date: '수', event: 'FOMC 의사록 공개', impact: 'HIGH' },
    { date: '목', event: '美 신규 실업급여 청구', impact: 'LOW' },
    { date: '금', event: '한국 5월 수출 잠정치', impact: 'MID' },
  ],
};

const monthlyData = {
  avgPurchaseRate: 1382.45,
  avgMarketRate: 1385.10,
  rateSaved: 2.65, // 평균 매입 환율 - 평균 시장 환율 (음수면 시장보다 비싸게 산 것)
  noHedgeScenario: {
    description: '월말 일괄 매입 가정',
    estimatedLoss: 26500000, // 평균 매입 대비 추가 손실(원)
  },
  nextMonthOutlook: '美 CPI 발표 및 FOMC 결과에 따라 변동성 확대 예상. 1~2개월물 우선 분할 매입 권고.',
};

const impactBadge = {
  HIGH: 'badge-danger',
  MID: 'badge-warning',
  LOW: 'badge-info',
};
const labelKR = { HIGH: '높음', MID: '중간', LOW: '낮음' };

// 공통 섹션 헤더
const Section = ({ icon: Icon, title, children, color = 'var(--accent-primary)' }) => (
  <div style={{ marginBottom: '1.75rem' }}>
    <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color }}>
      <Icon size={18} />
      {title}
    </h4>
    {children}
  </div>
);

// 정보 행
const Row = ({ label, value, accent }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0.75rem',
    background: 'rgba(0,0,0,0.2)', borderRadius: '0.4rem', marginBottom: '0.4rem',
  }}>
    <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{label}</span>
    <span style={{ fontWeight: 600, color: accent || 'var(--text-primary)' }}>{value}</span>
  </div>
);

// ─────────────────── 일일 리포트
function DailyReport() {
  const { riskScore, recommendations, totalRecommended, marketData } = useAppContext();
  const strategy = overallStrategy(riskScore);
  const judgement = marketJudgement(riskScore);

  return (
    <div>
      <div style={{
        background: 'linear-gradient(180deg, rgba(59, 130, 246, 0.15) 0%, rgba(25, 28, 41, 0) 100%)',
        padding: '1.5rem', borderRadius: '0.75rem', marginBottom: '1.5rem',
        border: '1px solid rgba(59, 130, 246, 0.3)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Daily FX Purchase Recommendation Report</p>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.25rem' }}>일일 외환 매입 추천 리포트</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>보고일: {todayStr()}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>종합 판단</p>
            <p style={{ fontSize: '1.125rem', fontWeight: 600, color: riskScore >= 65 ? 'var(--warning)' : 'var(--success)' }}>{judgement}</p>
            <p style={{ marginTop: '0.5rem' }}>
              리스크 점수 <strong style={{ fontSize: '1.5rem' }}>{riskScore}</strong> / 100
            </p>
          </div>
        </div>
      </div>

      <Section icon={TrendingUp} title="1) 오늘의 환율 상황">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
          <Row label="현재 USD/KRW" value={marketData.currentRate.toFixed(2)} />
          <Row label="단기 추세" value={marketData.fxTrend === 'UP' ? '상승' : marketData.fxTrend === 'DOWN' ? '하락' : '보합'} />
          <Row label="시장 변동성" value={marketData.volatility === 'HIGH' ? '높음' : '보통'} accent={marketData.volatility === 'HIGH' ? 'var(--warning)' : undefined} />
        </div>
      </Section>

      <Section icon={Target} title="2) 오늘의 추천" color="var(--accent-secondary)">
        <div style={{ marginBottom: '0.75rem', padding: '0.75rem 1rem', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '0.5rem', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>추천 전략: </span>
          <strong style={{ color: 'var(--accent-secondary)' }}>{strategy}</strong>
          <span style={{ marginLeft: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>오늘 총 추천금액: </span>
          <strong>{formatCurrency(totalRecommended)}</strong>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>만기</th>
              <th>잔여 목표</th>
              <th>추천 매입액</th>
              <th>추천 등급</th>
            </tr>
          </thead>
          <tbody>
            {recommendations.map(r => (
              <tr key={r.tenor}>
                <td style={{ fontWeight: 500 }}>{r.tenor}</td>
                <td>{formatCurrency(r.remaining)}</td>
                <td style={{ fontWeight: 600 }}>{formatCurrency(r.recommended)}</td>
                <td><span className={`badge ${r.badge}`}>{r.grade}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section icon={FileText} title="3) 추천 사유" color="var(--warning)">
        <ul className="reason-list">
          {recommendations.filter(r => r.recommended > 0).map((r, idx) => (
            <li key={idx} className="reason-item">
              <CheckCircle2 className="reason-icon" size={20} />
              <div>
                <p style={{ fontWeight: 500 }}>{r.tenor} — {r.grade} ({formatCurrency(r.recommended)})</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{r.reason}</p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section icon={AlertTriangle} title="4) 경영자 판단 포인트" color="var(--danger)">
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[
            '환율 상승 리스크가 현재 회사 손익에 미치는 영향',
            '단기 만기물(1M, 2M)의 미매입 잔액 규모',
            '미국 금리 이벤트 전 변동성 확대 가능성',
            '현재 환율이 단기 고점인지 여부',
            '전량 매입보다 분할 매입이 적절한지 여부',
          ].map((point, idx) => (
            <li key={idx} style={{
              padding: '0.6rem 0.75rem', background: 'rgba(239, 68, 68, 0.08)',
              borderLeft: '3px solid var(--danger)', borderRadius: '0.25rem',
              fontSize: '0.875rem',
            }}>{point}</li>
          ))}
        </ul>
      </Section>
    </div>
  );
}

// ─────────────────── 주간 리포트
function WeeklyReport() {
  const { tenorPlan, totalTarget, totalPurchased } = useAppContext();
  const progress = Math.round((totalPurchased / totalTarget) * 100);

  return (
    <div>
      <div style={{
        background: 'linear-gradient(180deg, rgba(139, 92, 246, 0.15) 0%, rgba(25, 28, 41, 0) 100%)',
        padding: '1.5rem', borderRadius: '0.75rem', marginBottom: '1.5rem',
        border: '1px solid rgba(139, 92, 246, 0.3)',
      }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Weekly FX Risk Summary</p>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.25rem' }}>주간 외환 리스크 요약</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>대상 기간: {weekRangeStr()}</p>
      </div>

      <Section icon={TrendingUp} title="1) 이번 주 원/달러 환율 흐름">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
          <Row label="시가" value={weeklyHighlights.open.toFixed(2)} />
          <Row label="고가" value={weeklyHighlights.high.toFixed(2)} accent="var(--danger)" />
          <Row label="저가" value={weeklyHighlights.low.toFixed(2)} accent="var(--success)" />
          <Row label="종가" value={weeklyHighlights.close.toFixed(2)} accent={weeklyHighlights.close > weeklyHighlights.open ? 'var(--danger)' : 'var(--success)'} />
        </div>
      </Section>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)' }}>
            <TrendingUp size={18} /> 달러 강세 요인
          </h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {weeklyHighlights.bullDrivers.map((d, idx) => (
              <li key={idx} style={{ padding: '0.6rem', background: 'rgba(239, 68, 68, 0.08)', borderLeft: '3px solid var(--danger)', borderRadius: '0.25rem', fontSize: '0.875rem' }}>{d}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)' }}>
            <TrendingDown size={18} /> 달러 약세 요인
          </h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {weeklyHighlights.bearDrivers.map((d, idx) => (
              <li key={idx} style={{ padding: '0.6rem', background: 'rgba(16, 185, 129, 0.08)', borderLeft: '3px solid var(--success)', borderRadius: '0.25rem', fontSize: '0.875rem' }}>{d}</li>
            ))}
          </ul>
        </div>
      </div>

      <Section icon={Target} title="2) 만기별 매입 진행률" color="var(--accent-primary)">
        <table className="data-table">
          <thead>
            <tr>
              <th>만기</th>
              <th>목표</th>
              <th>매입 완료</th>
              <th>진행률</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(tenorPlan).map(([tenor, plan]) => {
              const pct = Math.round((plan.purchased / plan.target) * 100);
              return (
                <tr key={tenor}>
                  <td style={{ fontWeight: 500 }}>{tenor}</td>
                  <td>{formatCurrency(plan.target)}</td>
                  <td>{formatCurrency(plan.purchased)}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ flex: 1, maxWidth: '120px' }} className="progress-bg">
                        <div className="progress-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <span style={{ fontWeight: 600, minWidth: '40px' }}>{pct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
            <tr style={{ background: 'rgba(59, 130, 246, 0.08)' }}>
              <td style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>전체</td>
              <td style={{ fontWeight: 700 }}>{formatCurrency(totalTarget)}</td>
              <td style={{ fontWeight: 700 }}>{formatCurrency(totalPurchased)}</td>
              <td style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{progress}%</td>
            </tr>
          </tbody>
        </table>
      </Section>

      <Section icon={Calendar} title="3) 다음 주 주요 이벤트" color="var(--warning)">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '80px' }}>요일</th>
              <th>이벤트</th>
              <th style={{ width: '120px' }}>영향도</th>
            </tr>
          </thead>
          <tbody>
            {weeklyHighlights.nextWeekEvents.map((e, idx) => (
              <tr key={idx}>
                <td style={{ fontWeight: 500 }}>{e.date}</td>
                <td>{e.event}</td>
                <td><span className={`badge ${impactBadge[e.impact]}`}>{labelKR[e.impact]}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section icon={FileText} title="4) 다음 주 선물환 매입 전략" color="var(--accent-secondary)">
        <div style={{ padding: '1rem', background: 'rgba(139, 92, 246, 0.08)', borderRadius: '0.5rem', borderLeft: '3px solid var(--accent-secondary)', fontSize: '0.9rem', lineHeight: 1.7 }}>
          단기 만기물(1M, 2M)은 결제 시점이 가까워 환율 급등 리스크 방어가 우선이다.
          FOMC 의사록 공개 전 최소 방어 물량을 확보하고, 의사록 이후 추가 변동성 따라 분할 매입을 권고한다.
          중장기 만기물(4M, 5M)은 환율 단기 고점권 감안하여 일부 매입 후 시장 상황 재확인 권장.
        </div>
      </Section>
    </div>
  );
}

// ─────────────────── 월간 리포트
function MonthlyReport() {
  const { tenorPlan, totalTarget, totalPurchased } = useAppContext();
  const progress = Math.round((totalPurchased / totalTarget) * 100);
  const savedKRW = monthlyData.rateSaved * totalPurchased;

  return (
    <div>
      <div style={{
        background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.15) 0%, rgba(25, 28, 41, 0) 100%)',
        padding: '1.5rem', borderRadius: '0.75rem', marginBottom: '1.5rem',
        border: '1px solid rgba(16, 185, 129, 0.3)',
      }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Monthly FX Purchase Review</p>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.25rem' }}>월간 외환 매입 결산</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>대상: {monthStr()}</p>
      </div>

      <Section icon={Target} title="1) 월간 매입 실적">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
          <Row label="목표 매입액" value={formatCurrency(totalTarget)} />
          <Row label="실제 매입액" value={formatCurrency(totalPurchased)} accent="var(--accent-primary)" />
          <Row label="달성률" value={`${progress}%`} accent={progress >= 80 ? 'var(--success)' : 'var(--warning)'} />
        </div>
      </Section>

      <Section icon={CalendarDays} title="2) 만기별 매입 현황" color="var(--accent-secondary)">
        <table className="data-table">
          <thead>
            <tr>
              <th>만기</th>
              <th>목표</th>
              <th>매입 완료</th>
              <th>미매입 잔액</th>
              <th>달성률</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(tenorPlan).map(([tenor, plan]) => {
              const remaining = Math.max(0, plan.target - plan.purchased);
              const pct = Math.round((plan.purchased / plan.target) * 100);
              return (
                <tr key={tenor}>
                  <td style={{ fontWeight: 500 }}>{tenor}</td>
                  <td>{formatCurrency(plan.target)}</td>
                  <td>{formatCurrency(plan.purchased)}</td>
                  <td style={{ color: remaining > 0 ? 'var(--warning)' : 'var(--text-secondary)' }}>{formatCurrency(remaining)}</td>
                  <td style={{ fontWeight: 600 }}>{pct}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Section>

      <Section icon={TrendingUp} title="3) 평균 매입환율 분석" color="var(--accent-primary)">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
          <Row label="평균 매입환율" value={`${monthlyData.avgPurchaseRate.toFixed(2)} 원/$`} accent="var(--accent-primary)" />
          <Row label="평균 시장환율" value={`${monthlyData.avgMarketRate.toFixed(2)} 원/$`} />
        </div>
        <div style={{
          marginTop: '0.75rem', padding: '1rem',
          background: monthlyData.rateSaved >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          borderLeft: `3px solid ${monthlyData.rateSaved >= 0 ? 'var(--success)' : 'var(--danger)'}`,
          borderRadius: '0.25rem',
        }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>시장 대비 절감 효과</p>
          <p style={{ fontSize: '1.125rem', fontWeight: 600, marginTop: '0.25rem', color: monthlyData.rateSaved >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            {monthlyData.rateSaved >= 0 ? '+' : ''}{monthlyData.rateSaved.toFixed(2)}원/$ · 약 {formatKRW(savedKRW)}원 {monthlyData.rateSaved >= 0 ? '절감' : '추가 비용'}
          </p>
        </div>
      </Section>

      <Section icon={FileText} title="4) 미매입 시나리오와의 손익 비교" color="var(--warning)">
        <div style={{ padding: '1rem', background: 'rgba(245, 158, 11, 0.08)', borderRadius: '0.5rem', borderLeft: '3px solid var(--warning)' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{monthlyData.noHedgeScenario.description}</p>
          <p style={{ fontSize: '1.125rem', fontWeight: 600, marginTop: '0.5rem' }}>
            분할 매입을 하지 않았을 경우 예상 추가 손실: <span style={{ color: 'var(--danger)' }}>약 {formatKRW(monthlyData.noHedgeScenario.estimatedLoss)}원</span>
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            ※ 월말 일괄 매입 시 환율 가정 기준. 분할 매입을 통한 평균단가 효과 추정치.
          </p>
        </div>
      </Section>

      <Section icon={AlertTriangle} title="5) 다음 달 환율 리스크 전망 및 기본 전략" color="var(--accent-secondary)">
        <div style={{ padding: '1rem', background: 'rgba(139, 92, 246, 0.08)', borderRadius: '0.5rem', borderLeft: '3px solid var(--accent-secondary)', fontSize: '0.9rem', lineHeight: 1.7 }}>
          {monthlyData.nextMonthOutlook}
        </div>
      </Section>
    </div>
  );
}

// ─────────────────── 메인
export default function ReportScreen() {
  const [reportType, setReportType] = useState('daily');

  const handlePrint = () => window.print();

  const tabs = [
    { id: 'daily', label: '일일 리포트', icon: Calendar },
    { id: 'weekly', label: '주간 리포트', icon: CalendarRange },
    { id: 'monthly', label: '월간 리포트', icon: CalendarDays },
  ];

  return (
    <div className="dashboard-grid">
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="col-span-12 glass-card report-controls"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setReportType(t.id)}
                className="btn"
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: reportType === t.id ? 'var(--accent-gradient)' : 'rgba(255,255,255,0.05)',
                  color: reportType === t.id ? 'white' : 'var(--text-secondary)',
                  boxShadow: reportType === t.id ? '0 4px 15px rgba(59,130,246,0.3)' : 'none',
                }}
              >
                <t.icon size={16} />
                {t.label}
              </button>
            ))}
          </div>
          <button onClick={handlePrint} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Printer size={16} />
            인쇄 / PDF 저장
          </button>
        </div>
      </motion.div>

      <motion.div
        key={reportType}
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="col-span-12 glass-card report-body"
      >
        {reportType === 'daily' && <DailyReport />}
        {reportType === 'weekly' && <WeeklyReport />}
        {reportType === 'monthly' && <MonthlyReport />}
      </motion.div>
    </div>
  );
}
