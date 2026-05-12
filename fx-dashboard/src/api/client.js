// fx-Risk 백엔드 API 클라이언트.
// Vite proxy로 /api → http://localhost:8000 으로 전달됨.
// 백엔드가 떠있지 않을 때를 대비해 모든 함수는 실패 시 null을 반환한다.

async function safeFetch(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[api] ${url} → ${res.status}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.warn(`[api] ${url} → ${err.message}`);
    return null;
  }
}

export const getLatestRate = () => safeFetch('/api/rates/latest');

export const getRateHistory = (days = 90) =>
  safeFetch(`/api/rates/history?days=${days}`);

export const getUSMarket = () => safeFetch('/api/market/us');
