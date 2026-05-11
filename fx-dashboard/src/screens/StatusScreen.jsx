import React from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '../store/AppContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

export default function StatusScreen() {
  const { tenorPlan, totalTarget, totalPurchased } = useAppContext();
  
  const chartData = Object.keys(tenorPlan).map(tenor => ({
    name: tenor,
    value: tenorPlan[tenor].purchased
  }));

  return (
    <div className="dashboard-grid">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="col-span-12 glass-card">
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>만기별 매입 진행률 현황</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          {Object.keys(tenorPlan).map((tenor, index) => {
            const plan = tenorPlan[tenor];
            const percent = Math.round((plan.purchased / plan.target) * 100);
            return (
              <div key={tenor} style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>{tenor} 진행률</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: COLORS[index] }}>{percent}%</div>
                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {formatCurrency(plan.purchased)} / {formatCurrency(plan.target)}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: '2rem', height: '350px' }}>
          <div style={{ flex: 1, minHeight: '350px' }}>
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: 'var(--bg-dark)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>전체 누적 달성률</div>
              <div className="progress-bg" style={{ height: '12px', borderRadius: '6px' }}>
                <div className="progress-fill" style={{ width: `${Math.round((totalPurchased/totalTarget)*100)}%`, borderRadius: '6px' }}></div>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>총 목표 금액</span>
              <span style={{ fontWeight: 600 }}>{formatCurrency(totalTarget)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '0.5rem', border: '1px solid rgba(59,130,246,0.3)' }}>
              <span style={{ color: 'var(--accent-primary)', fontWeight: 500 }}>현재까지 매입 완료 금액</span>
              <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{formatCurrency(totalPurchased)}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
