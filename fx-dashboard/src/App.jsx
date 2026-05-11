import React, { useState } from 'react';
import { LayoutDashboard, TrendingUp, DollarSign, CalendarDays, FileText, Settings, Bell } from 'lucide-react';
import Dashboard from './Dashboard';
import InputScreen from './screens/InputScreen';
import StatusScreen from './screens/StatusScreen';
import { AppProvider } from './store/AppContext';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'input':
        return <InputScreen />;
      case 'status':
        return <StatusScreen />;
      default:
        return (
          <div className="glass-card" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
              <TrendingUp size={48} style={{ opacity: 0.5, marginBottom: '1rem', margin: '0 auto' }} />
              <h2>해당 메뉴는 현재 준비 중입니다.</h2>
              <p style={{ marginTop: '0.5rem' }}>외환 시스템 고도화 로드맵을 참고해주세요.</p>
            </div>
          </div>
        );
    }
  };

  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard': return '오늘의 매입 추천 현황';
      case 'input': return '매입 결과 및 시장 데이터 입력';
      case 'status': return '만기별 매입 현황';
      case 'market': return '시장 리스크 분석';
      case 'reports': return '리포트';
      default: return '';
    }
  };

  return (
    <AppProvider>
      <div className="app-container">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="logo">
            <TrendingUp size={28} color="var(--accent-primary)" />
            <span>FX-Risk Advisor</span>
          </div>
          
          <ul className="nav-menu">
            <li 
              className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <LayoutDashboard size={20} />
              메인 대시보드
            </li>
            <li 
              className={`nav-item ${activeTab === 'status' ? 'active' : ''}`}
              onClick={() => setActiveTab('status')}
            >
              <CalendarDays size={20} />
              만기별 현황
            </li>
            <li 
              className={`nav-item ${activeTab === 'input' ? 'active' : ''}`}
              onClick={() => setActiveTab('input')}
            >
              <DollarSign size={20} />
              데이터/결과 입력
            </li>
            <li 
              className={`nav-item ${activeTab === 'market' ? 'active' : ''}`}
              onClick={() => setActiveTab('market')}
            >
              <TrendingUp size={20} />
              시장 분석
            </li>
            <li 
              className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveTab('reports')}
            >
              <FileText size={20} />
              리포트
            </li>
          </ul>

          <div style={{ marginTop: 'auto' }}>
            <ul className="nav-menu">
              <li className="nav-item">
                <Settings size={20} />
                설정
              </li>
            </ul>
          </div>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          <header className="header">
            <div>
              <h1>{getTitle()}</h1>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                실시간 데이터 기반 의사결정 지원 시스템
              </p>
            </div>
            
            <div className="header-actions">
              <div style={{ padding: '0.5rem', background: 'var(--bg-card)', borderRadius: '50%', cursor: 'pointer' }}>
                <Bell size={20} color="var(--text-secondary)" />
              </div>
              <button className="btn btn-primary">보고서 다운로드</button>
            </div>
          </header>

          {renderContent()}
        </main>
      </div>
    </AppProvider>
  );
}

export default App;
