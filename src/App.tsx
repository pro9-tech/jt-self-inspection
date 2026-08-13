import React, { useState, useRef, useEffect, useMemo, Component, ErrorInfo, ReactNode } from 'react';
import { 
  Plus, 
  Minus,
  Trash2, 
  Save, 
  History, 
  AlertCircle, 
  CheckCircle2, 
  User, 
  Calendar, 
  Package, 
  Hash, 
  Weight, 
  Percent,
  ChevronDown,
  ChevronUp,
  LogIn,
  LogOut,
  Loader2,
  Settings,
  X,
  Edit2,
  Link,
  Layers,
  Moon,
  Sun
} from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { supabase } from './lib/supabase';
import { db, auth } from './firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  doc, 
  setDoc, 
  deleteDoc,
  Timestamp
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';

// --- Types ---

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  alert('데이터베이스 오류: ' + (errInfo.error || '권한이 없거나 네트워크 오류입니다.'));
  throw new Error(JSON.stringify(errInfo));
}

interface Measurement {
  id: string;
  time: string;
  vials: (number | null)[];
  vialMemo?: string;
  capStatus: (string | null)[];
  capMemo?: string;
  stickerStatus: (string | null)[];
  stickerMemo?: string;
  printingStatus: (string | null)[];
  printingMemo?: string;
  scratchStatus: (string | null)[];
  scratchMemo?: string;
  foreignStatus: (string | null)[];
  foreignMemo?: string;
  isExpanded?: boolean;
}

interface FillingRecord {
  id: string;
  mainMode: '충진' | '포장';
  subMode: '충진1' | '충진2';
  itemName: string;
  lotNumber: string;
  fillingDate: string;
  standardWeight: number | null;
  underweightTolerance: number | null;
  overweightTolerance: number | null;
  operator: string;
  verifier: string;
  measurements: Measurement[];
  createdAt: number;
  uid: string;
}

interface ConfigItem {
  name: string;
  standardWeight: number | null;
  underweightTolerance: number | null;
  overweightTolerance: number | null;
}

interface AppSettings {
  items: ConfigItem[];
  operators: string[];
  verifiers: string[];
  scriptUrl?: string;
  uid: string;
}

// --- Error Boundary ---

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let displayMessage = "문제가 발생했습니다. 잠시 후 다시 시도해주세요.";
      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error && parsed.error.includes("Missing or insufficient permissions")) {
            displayMessage = "권한이 없습니다. 관리자에게 문의하거나 다시 로그인해주세요.";
          }
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-red-100 max-w-md w-full text-center space-y-4">
            <AlertCircle className="mx-auto text-red-500" size={48} />
            <h2 className="text-xl font-bold text-zinc-800">오류 발생</h2>
            <p className="text-zinc-500 text-sm">{displayMessage}</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-zinc-800 text-white rounded-xl font-bold hover:bg-zinc-700 transition-all"
            >
              새로고침
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// --- Constants ---

const TIMES = [
  '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'
];

const DEFAULT_MEASUREMENTS: Measurement[] = TIMES.map(time => ({
  id: Math.random().toString(36).substr(2, 9),
  time: time,
  vials: [null, null, null],
  vialMemo: '',
  capStatus: [null, null, null],
  capMemo: '',
  stickerStatus: [null, null, null],
  stickerMemo: '',
  printingStatus: [null, null, null],
  printingMemo: '',
  scratchStatus: [null, null, null],
  scratchMemo: '',
  foreignStatus: [null, null, null],
  foreignMemo: '',
  isExpanded: false,
}));

// --- Components ---

// 중량 계측값 트렌드 그래프 컴포넌트
const WeightChart = ({ 
  measurements, 
  standardWeight, 
  underweightTolerance, 
  overweightTolerance 
}: { 
  measurements: Measurement[]; 
  standardWeight: number | null; 
  underweightTolerance: number | null; 
  overweightTolerance: number | null; 
  }) => {
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; value: number; time: string } | null>(null);

  // 전체 평균값 계산
  const validWeights = measurements.flatMap(m => m.vials.filter((v): v is number => v !== null));
  const average = validWeights.length > 0 
    ? (validWeights.reduce((a, b) => a + b, 0) / validWeights.length).toFixed(2)
    : '0.00';

  // SVG 그래프 캔버스 사양 설정 (가로 폭을 대폭 넓혀 카드에 꽉 차게 구성)
  const width = 1000;
  const height = 220;
  const padding = 40;

  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const validMeasurements = measurements.filter(m => m.vials.some(v => v !== null));

  // Y축 스케일 범위 계산
  const std = standardWeight || 0;
  const minTolerance = underweightTolerance || 0;
  const maxTolerance = overweightTolerance || 0;
  
  const minVal = std - minTolerance * 1.5 || 0;
  const maxVal = std + maxTolerance * 1.5 || 10;
  const yRange = maxVal - minVal || 1;

  const getX = (index: number) => padding + (index / (measurements.length - 1 || 1)) * chartWidth;
  const getY = (val: number) => height - padding - ((val - minVal) / yRange) * chartHeight;

  return (
    <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col h-full select-none">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-400">중량 측정 트렌드 및 평균</h3>
          <p className="text-lg font-bold text-zinc-800 dark:text-zinc-100 mt-1">종합 평균: <span className="text-blue-600 dark:text-blue-400 font-extrabold">{average} g</span></p>
        </div>
      </div>
      
      <div className="flex-1 min-h-[140px] relative">
        {validMeasurements.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-zinc-400 italic">
            측정된 중량 데이터가 존재하지 않습니다.
          </div>
        ) : (
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
            {/* 오차 한계 기준선 렌더링 */}
            {standardWeight && (
              <>
                {/* 상한값 선 */}
                <line 
                  x1={padding} 
                  y1={getY(std + maxTolerance)} 
                  x2={width - padding} 
                  y2={getY(std + maxTolerance)} 
                  stroke="var(--color-error)" 
                  strokeWidth="1" 
                  strokeDasharray="4 4" 
                />
                <text x={width - padding + 5} y={getY(std + maxTolerance) + 3} fontSize="8" fill="var(--color-error)">
                  +{maxTolerance}g
                </text>
                {/* 정석 중량선 */}
                <line 
                  x1={padding} 
                  y1={getY(std)} 
                  x2={width - padding} 
                  y2={getY(std)} 
                  stroke="var(--color-success)" 
                  strokeWidth="1.5" 
                />
                <text x={width - padding + 5} y={getY(std) + 3} fontSize="8" fill="var(--color-success)">
                  {std}g
                </text>
                {/* 하한값 선 */}
                <line 
                  x1={padding} 
                  y1={getY(std - minTolerance)} 
                  x2={width - padding} 
                  y2={getY(std - minTolerance)} 
                  stroke="var(--color-error)" 
                  strokeWidth="1" 
                  strokeDasharray="4 4" 
                />
                <text x={width - padding + 5} y={getY(std - minTolerance) + 3} fontSize="8" fill="var(--color-error)">
                  -{minTolerance}g
                </text>
              </>
            )}

            {/* X축 시간 라벨 */}
            {measurements.map((m, idx) => (
              <text 
                key={m.id} 
                x={getX(idx)} 
                y={height - 8} 
                fontSize="10" 
                fill="#9DA5AF" 
                textAnchor="middle"
              >
                {m.time}
              </text>
            ))}

            {/* 중량 데이터 꺾은선 그리기 */}
            {(() => {
              const points = measurements.map((m, idx) => {
                const vals = m.vials.filter((v): v is number => v !== null);
                if (vals.length === 0) return null;
                const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
                return { x: getX(idx), y: getY(avg) };
              });

              const pathD = points
                .map((p, idx) => (p ? `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}` : ''))
                .filter(Boolean)
                .join(' ');

              return (
                <>
                  {pathD && (
                    <path 
                      d={pathD} 
                      fill="none" 
                      stroke="var(--color-accent)" 
                      strokeWidth="2.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                    />
                  )}
                  {points.map((p, idx) => {
                    if (!p) return null;
                    const m = measurements[idx];
                    const vals = m.vials.filter((v): v is number => v !== null);
                    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
                    return (
                      <circle 
                        key={idx} 
                        cx={p.x} 
                        cy={p.y} 
                        r="6" 
                        fill="var(--color-accent)" 
                        stroke="#ffffff" 
                        strokeWidth="2" 
                        className="cursor-pointer transition-all hover:r-8"
                        onMouseEnter={() => {
                          setHoveredPoint({ x: p.x, y: p.y, value: avg, time: m.time });
                        }}
                        onMouseLeave={() => {
                          setHoveredPoint(null);
                        }}
                      />
                    );
                  })}
                </>
              );
            })()}

            {/* SVG 내부에 일치화된 반응형 툴팁 오버레이 */}
            {hoveredPoint && (
              <g pointerEvents="none">
                {/* 툴팁 말풍선 배경 (그림자 효과 포함) */}
                <rect 
                  x={hoveredPoint.x - 55} 
                  y={hoveredPoint.y - 45} 
                  width="110" 
                  height="34" 
                  rx="8" 
                  fill="#1F2328" 
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="1"
                />
                <text 
                  x={hoveredPoint.x} 
                  y={hoveredPoint.y - 32} 
                  fontSize="8" 
                  fill="#9DA5AF" 
                  textAnchor="middle"
                >
                  {hoveredPoint.time} 측정
                </text>
                <text 
                  x={hoveredPoint.x} 
                  y={hoveredPoint.y - 18} 
                  fontSize="11" 
                  fontWeight="bold" 
                  fill="#ffffff" 
                  textAnchor="middle"
                >
                  {hoveredPoint.value.toFixed(2)} g
                </text>
                {/* 툴팁 꼬리삼각형 */}
                <polygon 
                  points={`${hoveredPoint.x - 5},${hoveredPoint.y - 11} ${hoveredPoint.x + 5},${hoveredPoint.y - 11} ${hoveredPoint.x},${hoveredPoint.y - 6}`}
                  fill="#1F2328"
                />
              </g>
            )}
          </svg>
        )}
      </div>
    </div>
  );
};

// A4 출력 전용 레포트 템플릿 컴포넌트
const PrintReportTemplate = ({ record, isPreview = false }: { record: FillingRecord; isPreview?: boolean }) => {
  const year = record.fillingDate ? record.fillingDate.split('-')[0] : new Date().getFullYear();
  const classificationTitle = record.mainMode === '포장' ? '포장품 자주검사기록' : '충진품 자주검사기록';
  const reportTitle = `${year}년 ${classificationTitle}`;

  // A4 한 장당 들어갈 최대 데이터 개수 (10개씩 분할)
  const ROWS_PER_PAGE = 10;
  const totalMeasurements = record.measurements;
  
  const pages: Measurement[][] = [];
  for (let i = 0; i < totalMeasurements.length; i += ROWS_PER_PAGE) {
    pages.push(totalMeasurements.slice(i, i + ROWS_PER_PAGE));
  }

  if (pages.length === 0) {
    pages.push([]);
  }

  // 중량 판정 헬퍼 함수
  const getWeightResult = (vials: (number | null)[], std: number, under: number, over: number): string => {
    let count = 0;
    let failCount = 0;
    vials.forEach(v => {
      if (v !== null && v !== undefined && String(v) !== "") {
        count++;
        const val = Number(v);
        if (val < (std - under) || val > (std + over)) failCount++;
      }
    });
    if (count === 0) return "-";
    return failCount < 2 ? "적합" : "부적합";
  };

  // 일반 상태 판정 헬퍼 함수
  const getStatusResult = (arr: (string | null)[]): string => {
    let count = 0;
    let failCount = 0;
    arr.forEach(v => {
      if (v !== null && v !== undefined && v !== "") {
        count++;
        if (v === "불량") failCount++;
      }
    });
    if (count === 0) return "-";
    return failCount < 2 ? "적합" : "부적합";
  };

  return (
    <div className={cn(isPreview ? "w-full flex flex-col gap-6 items-center" : "print-only w-[210mm] mx-auto", "text-black p-4")}>
      {pages.map((pageMeasurements, pageIdx) => (
        <div 
          key={pageIdx} 
          className={cn(
            "page-break flex flex-col justify-between pb-8",
            isPreview ? "w-[210mm] min-h-[297mm] bg-white shadow-xl p-8 border border-zinc-300 rounded-2xl" : "min-h-[297mm]"
          )}
          style={{ boxSizing: 'border-box' }}
        >
          <div>
            {/* 상단 결재란 및 타이틀 */}
            <div className="flex justify-between items-start mb-6">
              {/* 제목 (왼쪽 배치 및 연도 동적 표시) */}
              <div className="text-left flex-1 pr-4 self-center">
                <h1 className="text-2xl font-extrabold tracking-tight border-b-2 border-black pb-2 inline-block">
                  {reportTitle}
                </h1>
                <div className="text-xs text-zinc-600 mt-1 font-mono">
                  인쇄일자: {format(new Date(), 'yyyy-MM-dd HH:mm')} | 페이지: {pageIdx + 1} / {pages.length}
                </div>
              </div>

              {/* 결재란 (오른쪽 배치) */}
              <table className="border-collapse border border-black text-xs text-center w-[180px]">
                <tbody>
                  <tr>
                    <td rowSpan={3} className="border border-black font-bold px-2 py-4 w-[30px] bg-zinc-50">결재</td>
                    <td className="border border-black font-bold py-1 w-[50px] bg-zinc-50">작성</td>
                    <td className="border border-black font-bold py-1 w-[50px] bg-zinc-50">검토</td>
                    <td className="border border-black font-bold py-1 w-[50px] bg-zinc-50">승인</td>
                  </tr>
                  <tr className="h-[45px]">
                    <td className="border border-black py-1"></td>
                    <td className="border border-black py-1"></td>
                    <td className="border border-black py-1"></td>
                  </tr>
                  <tr className="h-[20px]">
                    <td className="border border-black text-[8px]"></td>
                    <td className="border border-black text-[8px]"></td>
                    <td className="border border-black text-[8px]"></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 기본 품목 정보 표 */}
            <table className="w-full border-collapse border border-black text-xs text-center mb-4">
              <tbody>
                <tr className="bg-zinc-50">
                  <td className="border border-black font-bold py-2 w-[15%]">품목명 (Lot No.)</td>
                  <td className="border border-black py-2 w-[35%] font-medium">
                    {record.itemName || '-'} <span className="text-zinc-500">({record.lotNumber || 'Lot 번호 없음'})</span>
                  </td>
                  <td className="border border-black font-bold py-2 w-[15%]">충진량 / 충진일</td>
                  <td className="border border-black py-2 w-[35%] font-medium">
                    {record.standardWeight ? `${record.standardWeight}g (±${record.underweightTolerance}g)` : '-'} / {record.fillingDate || '-'}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* 계측 데이터 테이블 */}
            <table className="w-full border-collapse border border-black text-xs text-center">
              <thead>
                <tr className="bg-zinc-100 text-[10px] font-bold">
                  <td rowSpan={2} className="border border-black py-2 w-[60px]">No</td>
                  <td rowSpan={2} className="border border-black py-2 w-[80px]">검사항목</td>
                  <td colSpan={3} className="border border-black py-1">계측기록 (시료 1, 2, 3)</td>
                  <td rowSpan={2} className="border border-black py-2 w-[70px]">판정</td>
                  <td rowSpan={2} className="border border-black py-2">비고 (메모)</td>
                </tr>
                <tr className="bg-zinc-50 text-[9px]">
                  <td className="border border-black py-1 w-[80px]">1회</td>
                  <td className="border border-black py-1 w-[80px]">2회</td>
                  <td className="border border-black py-1 w-[80px]">3회</td>
                </tr>
              </thead>
              <tbody>
                {pageMeasurements.map((m, idx) => {
                  const globalIdx = pageIdx * ROWS_PER_PAGE + idx + 1;
                  
                  // 충진1 (중량 + 캡)
                  if (record.mainMode === '충진' && record.subMode === '충진1') {
                    const hasWeight = m.vials.some(v => v !== null);
                    const caps = m.capStatus;
                    const weightRes = getWeightResult(m.vials, record.standardWeight || 0, record.underweightTolerance || 0, record.overweightTolerance || 0);
                    const capRes = getStatusResult(caps);

                    return (
                      <React.Fragment key={m.id}>
                        <tr className="h-[28px]">
                          <td rowSpan={2} className="border border-black font-mono font-bold bg-zinc-50/50">{globalIdx}</td>
                          <td className="border border-black font-bold bg-zinc-50/30">중량 (g)</td>
                          <td className="border border-black font-mono">{m.vials[0] !== null ? `${m.vials[0]} g` : '-'}</td>
                          <td className="border border-black font-mono">{m.vials[1] !== null ? `${m.vials[1]} g` : '-'}</td>
                          <td className="border border-black font-mono">{m.vials[2] !== null ? `${m.vials[2]} g` : '-'}</td>
                          <td className={`border border-black font-bold ${weightRes === '부적합' ? 'text-red-600' : 'text-green-700'}`}>
                            {hasWeight ? weightRes : '-'}
                          </td>
                          <td className="border border-black text-left px-2 max-w-[200px] truncate text-[10px]">
                            {m.vialMemo || ''}
                          </td>
                        </tr>
                        <tr className="h-[28px]">
                          <td className="border border-black font-bold bg-zinc-50/30">캡 상태</td>
                          <td className={`border border-black font-bold ${caps[0] === '불량' ? 'text-red-500' : ''}`}>{caps[0] || '-'}</td>
                          <td className={`border border-black font-bold ${caps[1] === '불량' ? 'text-red-500' : ''}`}>{caps[1] || '-'}</td>
                          <td className={`border border-black font-bold ${caps[2] === '불량' ? 'text-red-500' : ''}`}>{caps[2] || '-'}</td>
                          <td className={`border border-black font-bold ${capRes === '부적합' ? 'text-red-600' : 'text-green-700'}`}>
                            {caps.some(c => c !== null) ? capRes : '-'}
                          </td>
                          <td className="border border-black text-left px-2 max-w-[200px] truncate text-[10px]">
                            {m.capMemo || ''}
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  } 
                  
                  // 충진2 (스티커 + 날인)
                  else if (record.mainMode === '충진' && record.subMode === '충진2') {
                    const stickers = m.stickerStatus;
                    const prints = m.printingStatus;
                    const stickerRes = getStatusResult(stickers);
                    const printRes = getStatusResult(prints);

                    return (
                      <React.Fragment key={m.id}>
                        <tr className="h-[28px]">
                          <td rowSpan={2} className="border border-black font-mono font-bold bg-zinc-50/50">{globalIdx}</td>
                          <td className="border border-black font-bold bg-zinc-50/30">스티커</td>
                          <td className={`border border-black font-bold ${stickers[0] === '불량' ? 'text-red-500' : ''}`}>{stickers[0] || '-'}</td>
                          <td className={`border border-black font-bold ${stickers[1] === '불량' ? 'text-red-500' : ''}`}>{stickers[1] || '-'}</td>
                          <td className={`border border-black font-bold ${stickers[2] === '불량' ? 'text-red-500' : ''}`}>{stickers[2] || '-'}</td>
                          <td className={`border border-black font-bold ${stickerRes === '부적합' ? 'text-red-600' : 'text-green-700'}`}>
                            {stickers.some(c => c !== null) ? stickerRes : '-'}
                          </td>
                          <td className="border border-black text-left px-2 max-w-[200px] truncate text-[10px]">
                            {m.stickerMemo || ''}
                          </td>
                        </tr>
                        <tr className="h-[28px]">
                          <td className="border border-black font-bold bg-zinc-50/30">날인</td>
                          <td className={`border border-black font-bold ${prints[0] === '불량' ? 'text-red-500' : ''}`}>{prints[0] || '-'}</td>
                          <td className={`border border-black font-bold ${prints[1] === '불량' ? 'text-red-500' : ''}`}>{prints[1] || '-'}</td>
                          <td className={`border border-black font-bold ${prints[2] === '불량' ? 'text-red-500' : ''}`}>{prints[2] || '-'}</td>
                          <td className={`border border-black font-bold ${printRes === '부적합' ? 'text-red-600' : 'text-green-700'}`}>
                            {prints.some(c => c !== null) ? printRes : '-'}
                          </td>
                          <td className="border border-black text-left px-2 max-w-[200px] truncate text-[10px]">
                            {m.printingMemo || ''}
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  } 
                  
                  // 포장 (날인 + 캡 + 스티커 + 스크래치 + 이물)
                  else {
                    const labels = ["날인", "캡", "스티커", "스크래치", "이물"];
                    const statusArrays = [m.printingStatus, m.capStatus, m.stickerStatus, m.scratchStatus, m.foreignStatus];
                    const memoFields: ("printingMemo" | "capMemo" | "stickerMemo" | "scratchMemo" | "foreignMemo")[] = [
                      "printingMemo", "capMemo", "stickerMemo", "scratchMemo", "foreignMemo"
                    ];

                    return (
                      <React.Fragment key={m.id}>
                        {labels.map((label, labelIdx) => {
                          const arr = statusArrays[labelIdx];
                          const resStatus = getStatusResult(arr);
                          const isFirst = labelIdx === 0;
                          
                          return (
                            <tr key={label} className="h-[24px]">
                              {isFirst && (
                                <td rowSpan={5} className="border border-black font-mono font-bold bg-zinc-50/50">{globalIdx}</td>
                              )}
                              <td className="border border-black font-bold bg-zinc-50/30">{label}</td>
                              <td className={`border border-black font-bold ${arr[0] === '불량' ? 'text-red-500' : ''}`}>{arr[0] || '-'}</td>
                              <td className={`border border-black font-bold ${arr[1] === '불량' ? 'text-red-500' : ''}`}>{arr[1] || '-'}</td>
                              <td className={`border border-black font-bold ${arr[2] === '불량' ? 'text-red-500' : ''}`}>{arr[2] || '-'}</td>
                              <td className={`border border-black font-bold ${resStatus === '부적합' ? 'text-red-600' : 'text-green-700'}`}>
                                {arr.some(c => c !== null) ? resStatus : '-'}
                              </td>
                              <td className="border border-black text-left px-2 max-w-[200px] truncate text-[9px]">
                                {m[memoFields[labelIdx]] || ''}
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  }
                })}
              </tbody>
            </table>
          </div>

          {/* 하단 푸터 (오른쪽 하단에 회사명 지정) */}
          <div className="flex justify-between items-center text-xs font-medium border-t border-black pt-2 mt-4 font-mono">
            <span className="font-extrabold">[JTQF-3440-05]</span>
            <span>(주)제니트리</span>
          </div>
        </div>
      ))}
    </div>
  );
};

interface NumberInputProps {
  value: number | null;
  onChange: (value: number | null) => void;
  step?: number;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  min?: number;
}

const NumberInputWithButtons = ({ 
  value, 
  onChange, 
  step = 0.1, 
  placeholder = "0.0",
  className = "",
  inputClassName = "",
  min = 0
}: NumberInputProps) => {
  const [localValue, setLocalValue] = useState<string>(value !== null ? value.toString() : '');

  useEffect(() => {
    // Only update local value if it's not currently being edited to avoid jumping
    if (document.activeElement?.tagName !== 'INPUT') {
      setLocalValue(value !== null ? value.toFixed(1) : '');
    }
  }, [value]);

  const handleIncrement = () => {
    const current = value ?? 0;
    const next = Math.round((current + step) * 100) / 100;
    onChange(next);
  };

  const handleDecrement = () => {
    const current = value ?? 0;
    const next = Math.round((current - step) * 100) / 100;
    onChange(next >= min ? next : min);
  };

  return (
    <div className={cn("flex items-center h-[var(--control-height)] bg-[var(--color-primary-bg)]/50 rounded-lg px-1 border border-transparent focus-within:border-[var(--color-border)] transition-all", className)}>
      <button 
        onClick={handleDecrement}
        className="p-1 hover:bg-[var(--color-primary-bg)] rounded-md transition-colors text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
        type="button"
      >
        <Minus size={12} />
      </button>
      <input
        type="text"
        inputMode="decimal"
        value={localValue}
        onChange={(e) => {
          const val = e.target.value;
          // Allow numbers, one decimal point, and empty string
          if (val === '' || /^-?\d*\.?\d*$/.test(val)) {
            setLocalValue(val);
            const parsed = parseFloat(val);
            if (!isNaN(parsed)) {
              // Only trigger parent update if it's a valid number
              // We don't use toFixed here to allow typing 10, 100, etc.
              onChange(parsed);
            } else if (val === '') {
              onChange(null);
            }
          }
        }}
        onBlur={() => {
          // Format on blur to ensure consistency (e.g., 10 -> 10.0)
          setLocalValue(value !== null ? value.toFixed(1) : '');
        }}
        className={cn(
          "bg-transparent border-none focus:ring-0 text-center text-[var(--fs-base)] w-full p-1",
          inputClassName
        )}
        placeholder={placeholder}
      />
      <button 
        onClick={handleIncrement}
        className="p-1 hover:bg-[var(--color-primary-bg)] rounded-md transition-colors text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
        type="button"
      >
        <Plus size={12} />
      </button>
    </div>
  );
};

const StatusToggle = ({ 
  value, 
  onChange 
}: { 
  value: string | null; 
  onChange: (val: string) => void 
}) => {
  return (
    <div className="relative w-full">
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full h-[var(--control-height)] pl-2 pr-6 rounded-lg text-[var(--fs-sm)] font-bold transition-all border appearance-none cursor-pointer focus:ring-2 focus:ring-[var(--color-primary-bg)] outline-none",
          value === '불량' 
            ? "bg-[var(--color-error-bg)] border-[var(--color-error-border)] text-[var(--color-error-text)] font-extrabold" 
            : value === '정상'
              ? "bg-[var(--color-bg-container)] border-[var(--color-border)] text-[var(--color-text)] font-extrabold"
              : "bg-[var(--color-primary-bg)] border-[var(--color-primary-border)] text-[var(--color-text-secondary)] italic"
        )}
      >
        <option value="" className="text-[var(--color-text-tertiary)]">선택</option>
        <option value="정상" className="text-[var(--color-text)] not-italic font-bold">정상</option>
        <option value="불량" className="text-[var(--color-error)] not-italic font-bold">불량</option>
      </select>
      <div className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-text-secondary)]">
        <ChevronDown size={10} />
      </div>
    </div>
  );
};

interface MeasurementRowProps {
  key?: React.Key;
  measurement: Measurement;
  mainMode: '충진' | '포장';
  subMode: '충진1' | '충진2';
  standardWeight: number;
  underweightTolerance: number;
  overweightTolerance: number;
  onUpdate: (updated: Measurement) => void;
}

const MeasurementRow = ({ 
  measurement, 
  mainMode,
  subMode,
  standardWeight, 
  underweightTolerance,
  overweightTolerance,
  onUpdate 
}: MeasurementRowProps) => {
  const average = useMemo(() => {
    const validVials = measurement.vials.filter((v): v is number => v !== null);
    if (validVials.length === 0) return null;
    return validVials.reduce((a, b) => a + b, 0) / validVials.length;
  }, [measurement.vials]);

  const getStatusColor = (value: number | null) => {
    if (value === null || !standardWeight || underweightTolerance === null || overweightTolerance === null) return 'text-zinc-900 dark:text-zinc-100 font-bold';
    const diff = value - standardWeight;
    if (diff < -underweightTolerance) return 'text-red-600 font-black'; // Extra bold for failures
    if (diff > overweightTolerance) return 'text-blue-600 font-black'; // Extra bold for failures
    return 'text-zinc-900 dark:text-zinc-100 font-bold';
  };

  const handleVialChange = (index: number, value: number | null) => {
    const newVials = [...measurement.vials];
    newVials[index] = value;
    onUpdate({ ...measurement, vials: newVials });
  };

  const handleStatusChange = (field: keyof Measurement, index: number, value: string) => {
    const currentStatus = [...(measurement[field] as string[])];
    currentStatus[index] = value === "" ? null : value;
    onUpdate({ ...measurement, [field]: currentStatus });
  };

  const toggleExpand = () => {
    onUpdate({ ...measurement, isExpanded: !measurement.isExpanded });
  };

  return (
    <>
      <tr className="border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors group">
        <td className="p-3 text-center w-20 min-w-[80px]">
          <button 
            onClick={toggleExpand}
            className="flex flex-col items-center justify-center w-full group"
          >
            <span className="font-mono text-sm text-zinc-500 dark:text-zinc-400">{measurement.time}</span>
            <div className={cn(
              "mt-1 p-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-all",
              measurement.isExpanded && "bg-zinc-800 dark:bg-zinc-700 text-white dark:text-zinc-100 group-hover:bg-zinc-700 dark:group-hover:bg-zinc-600"
            )}>
              {measurement.isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            </div>
          </button>
        </td>
        
        {mainMode === '충진' && subMode === '충진1' && (
          <>
            {[0, 1, 2].map((i) => (
              <td key={`w-${i}`} className={cn("p-2 w-[100px] min-w-[100px]", i === 0 && "border-l-2 border-zinc-300 dark:border-l-zinc-800")}>
                <NumberInputWithButtons
                  value={measurement.vials[i]}
                  onChange={(val) => handleVialChange(i, val)}
                  step={0.1}
                  placeholder="0.0"
                  inputClassName={getStatusColor(measurement.vials[i])}
                />
              </td>
            ))}
            {[0, 1, 2].map((i) => (
              <td key={`c-${i}`} className={cn("p-2 w-[100px] min-w-[100px]", i === 0 && "border-l-2 border-zinc-300 dark:border-l-zinc-800", i === 2 && "border-r-2 border-zinc-300 dark:border-r-zinc-800")}>
                <StatusToggle 
                  value={measurement.capStatus[i]} 
                  onChange={(val) => handleStatusChange('capStatus', i, val)} 
                />
              </td>
            ))}
          </>
        )}

        {mainMode === '충진' && subMode === '충진2' && (
          <>
            {[0, 1, 2].map((i) => (
              <td key={`s-${i}`} className={cn("p-2 w-[100px] min-w-[100px]", i === 0 && "border-l-2 border-zinc-300")}>
                <StatusToggle 
                  value={measurement.stickerStatus[i]} 
                  onChange={(val) => handleStatusChange('stickerStatus', i, val)} 
                />
              </td>
            ))}
            {[0, 1, 2].map((i) => (
              <td key={`p-${i}`} className={cn("p-2 w-[100px] min-w-[100px]", i === 0 && "border-l-2 border-zinc-300 dark:border-l-zinc-800", i === 2 && "border-r-2 border-zinc-300 dark:border-r-zinc-800")}>
                <StatusToggle 
                  value={measurement.printingStatus[i]} 
                  onChange={(val) => handleStatusChange('printingStatus', i, val)} 
                />
              </td>
            ))}
          </>
        )}

        {mainMode === '포장' && (
          <>
            {[0, 1, 2].map((i) => (
              <td key={`p-${i}`} className={cn("p-2 w-[100px] min-w-[100px]", i === 0 && "border-l-2 border-zinc-300 dark:border-l-zinc-800")}>
                <StatusToggle 
                  value={measurement.printingStatus[i]} 
                  onChange={(val) => handleStatusChange('printingStatus', i, val)} 
                />
              </td>
            ))}
            {[0, 1, 2].map((i) => (
              <td key={`c-${i}`} className={cn("p-2 w-[100px] min-w-[100px]", i === 0 && "border-l-2 border-zinc-300 dark:border-l-zinc-800")}>
                <StatusToggle 
                  value={measurement.capStatus[i]} 
                  onChange={(val) => handleStatusChange('capStatus', i, val)} 
                />
              </td>
            ))}
            {[0, 1, 2].map((i) => (
              <td key={`s-${i}`} className={cn("p-2 w-[100px] min-w-[100px]", i === 0 && "border-l-2 border-zinc-300 dark:border-l-zinc-800")}>
                <StatusToggle 
                  value={measurement.stickerStatus[i]} 
                  onChange={(val) => handleStatusChange('stickerStatus', i, val)} 
                />
              </td>
            ))}
            {[0, 1, 2].map((i) => (
              <td key={`sc-${i}`} className={cn("p-2 w-[100px] min-w-[100px]", i === 0 && "border-l-2 border-zinc-300 dark:border-l-zinc-800")}>
                <StatusToggle 
                  value={measurement.scratchStatus[i]} 
                  onChange={(val) => handleStatusChange('scratchStatus', i, val)} 
                />
              </td>
            ))}
            {[0, 1, 2].map((i) => (
              <td key={`f-${i}`} className={cn("p-2 w-[100px] min-w-[100px]", i === 0 && "border-l-2 border-zinc-300 dark:border-l-zinc-800", i === 2 && "border-r-2 border-zinc-300 dark:border-r-zinc-800")}>
                <StatusToggle 
                  value={measurement.foreignStatus[i]} 
                  onChange={(val) => handleStatusChange('foreignStatus', i, val)} 
                />
              </td>
            ))}
          </>
        )}
      </tr>

      {/* Collapsible Memo Row - Strictly Aligned with Columns Above */}
      <AnimatePresence>
        {measurement.isExpanded && (
          <motion.tr
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-zinc-50/50 border-b border-zinc-200"
          >
            <td className="p-2 text-center bg-zinc-100/50">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">메모</span>
            </td>
            
            {mainMode === '충진' && subMode === '충진1' && (
              <>
                <td colSpan={3} className="p-2 border-l-2 border-zinc-300">
                  <textarea
                    value={measurement.vialMemo || ''}
                    onChange={(e) => onUpdate({ ...measurement, vialMemo: e.target.value })}
                    className="w-full bg-white border border-zinc-200 rounded p-1 text-[11px] focus:ring-1 focus:ring-zinc-300 outline-none resize-none h-8 font-bold"
                    placeholder="중량 메모..."
                  />
                </td>
                <td colSpan={3} className="p-2 border-l-2 border-r-2 border-zinc-300">
                  <textarea
                    value={measurement.capMemo || ''}
                    onChange={(e) => onUpdate({ ...measurement, capMemo: e.target.value })}
                    className="w-full bg-white border border-zinc-200 rounded p-1 text-[11px] focus:ring-1 focus:ring-zinc-300 outline-none resize-none h-8 font-bold"
                    placeholder="캡 메모..."
                  />
                </td>
              </>
            )}

            {mainMode === '충진' && subMode === '충진2' && (
              <>
                <td colSpan={3} className="p-2 border-l-2 border-zinc-300">
                  <textarea
                    value={measurement.stickerMemo || ''}
                    onChange={(e) => onUpdate({ ...measurement, stickerMemo: e.target.value })}
                    className="w-full bg-white border border-zinc-200 rounded p-1 text-[11px] focus:ring-1 focus:ring-zinc-300 outline-none resize-none h-8 font-bold"
                    placeholder="스티커 메모..."
                  />
                </td>
                <td colSpan={3} className="p-2 border-l-2 border-r-2 border-zinc-300">
                  <textarea
                    value={measurement.printingMemo || ''}
                    onChange={(e) => onUpdate({ ...measurement, printingMemo: e.target.value })}
                    className="w-full bg-white border border-zinc-200 rounded p-1 text-[11px] focus:ring-1 focus:ring-zinc-300 outline-none resize-none h-8 font-bold"
                    placeholder="날인 메모..."
                  />
                </td>
              </>
            )}

            {mainMode === '포장' && (
              <>
                <td colSpan={3} className="p-2 border-l-2 border-zinc-300">
                  <textarea
                    value={measurement.printingMemo || ''}
                    onChange={(e) => onUpdate({ ...measurement, printingMemo: e.target.value })}
                    className="w-full bg-white border border-zinc-200 rounded p-1 text-[11px] focus:ring-1 focus:ring-zinc-300 outline-none resize-none h-8 font-bold"
                    placeholder="날인 메모..."
                  />
                </td>
                <td colSpan={3} className="p-2 border-l-2 border-zinc-300">
                  <textarea
                    value={measurement.capMemo || ''}
                    onChange={(e) => onUpdate({ ...measurement, capMemo: e.target.value })}
                    className="w-full bg-white border border-zinc-200 rounded p-1 text-[11px] focus:ring-1 focus:ring-zinc-300 outline-none resize-none h-8 font-bold"
                    placeholder="캡 메모..."
                  />
                </td>
                <td colSpan={3} className="p-2 border-l-2 border-zinc-300">
                  <textarea
                    value={measurement.stickerMemo || ''}
                    onChange={(e) => onUpdate({ ...measurement, stickerMemo: e.target.value })}
                    className="w-full bg-white border border-zinc-200 rounded p-1 text-[11px] focus:ring-1 focus:ring-zinc-300 outline-none resize-none h-8 font-bold"
                    placeholder="스티커 메모..."
                  />
                </td>
                <td colSpan={3} className="p-2 border-l-2 border-zinc-300">
                  <textarea
                    value={measurement.scratchMemo || ''}
                    onChange={(e) => onUpdate({ ...measurement, scratchMemo: e.target.value })}
                    className="w-full bg-white border border-zinc-200 rounded p-1 text-[11px] focus:ring-1 focus:ring-zinc-300 outline-none resize-none h-8 font-bold"
                    placeholder="스크래치 메모..."
                  />
                </td>
                <td colSpan={3} className="p-2 border-l-2 border-r-2 border-zinc-300">
                  <textarea
                    value={measurement.foreignMemo || ''}
                    onChange={(e) => onUpdate({ ...measurement, foreignMemo: e.target.value })}
                    className="w-full bg-white border border-zinc-200 rounded p-1 text-[11px] focus:ring-1 focus:ring-zinc-300 outline-none resize-none h-8 font-bold"
                    placeholder="이물 메모..."
                  />
                </td>
              </>
            )}
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  );
};

const useCardScale = (defaultWidth: number, defaultHeight: number) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(1);

  React.useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width } = entry.contentRect;
        const scaleW = width / defaultWidth;
        setScale(Math.max(0.85, Math.min(2.2, scaleW)));
      }
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [defaultWidth, defaultHeight]);

  return { ref, scale };
};

function AppContent() {
  const infoCard = useCardScale(320, 350);
  const tableCard = useCardScale(700, 350);
  const graphCard = useCardScale(1000, 260);

  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.removeItem('theme');
  }, []);

  const [record, setRecord] = useState<FillingRecord>({
    id: Math.random().toString(36).substr(2, 9),
    mainMode: '충진',
    subMode: '충진1',
    itemName: '',
    lotNumber: '',
    fillingDate: format(new Date(), 'yyyy-MM-dd'),
    standardWeight: null,
    underweightTolerance: null,
    overweightTolerance: null,
    operator: '',
    verifier: '',
    measurements: DEFAULT_MEASUREMENTS,
    createdAt: Date.now(),
    uid: '',
  });

  const [settings, setSettings] = useState<AppSettings>({
    items: [],
    operators: [],
    verifiers: [],
    scriptUrl: '',
    uid: '',
  });

  const [history, setHistory] = useState<FillingRecord[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingItemIdx, setDeletingItemIdx] = useState<number | null>(null);
  const [deletingOperatorIdx, setDeletingOperatorIdx] = useState<number | null>(null);
  const [deletingVerifierIdx, setDeletingVerifierIdx] = useState<number | null>(null);
  const [isDeletingTopRow, setIsDeletingTopRow] = useState(false);
  const [isDeletingBottomRow, setIsDeletingBottomRow] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [filterDate, setFilterDate] = useState('');
  const [filterItem, setFilterItem] = useState('');
  const [filterLot, setFilterLot] = useState('');
  const [filterMode, setFilterMode] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
      if (u) {
        setRecord(prev => ({ ...prev, uid: u.uid }));
        setSettings(prev => ({ ...prev, uid: u.uid }));
      }
    });
    return () => unsubscribe();
  }, []);

  // Handle Redirect Login Result (for mobile)
  useEffect(() => {
    const handleRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          console.log("Redirect login successful:", result.user.email);
        }
      } catch (error: any) {
        console.error("Redirect login failed:", error);
        if (error.code === 'auth/unauthorized-domain') {
          alert('이 도메인은 Firebase 콘솔에서 승인되지 않았습니다. Firebase 콘솔 > Authentication > Settings > Authorized domains에 현재 도메인을 추가해주세요.');
        }
      }
    };
    handleRedirect();
  }, []);

  // Settings Listener
  useEffect(() => {
    if (!user || !isAuthReady) return;

    const unsubscribe = onSnapshot(doc(db, 'settings', 'global'), (snapshot) => {
      if (snapshot.exists()) {
        setSettings(snapshot.data() as AppSettings);
      }
    });

    return () => unsubscribe();
  }, [user, isAuthReady]);

  // Real-time History Listener
  useEffect(() => {
    if (!user || !isAuthReady) {
      setHistory([]);
      return;
    }

    const q = query(
      collection(db, 'records'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map(doc => doc.data() as FillingRecord);
      setHistory(records);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'records');
    });

    return () => unsubscribe();
  }, [user, isAuthReady]);

  const filteredHistory = history.filter(h => {
    const hMainMode = h.mainMode || '충진';
    const hSubMode = h.subMode || '충진1';
    const recordMode = hMainMode === '포장' ? '포장' : hSubMode;
    
    const matchDate = !filterDate || (h.fillingDate || '').trim() === filterDate.trim();
    const matchItem = !filterItem || (h.itemName || '').toLowerCase().includes(filterItem.toLowerCase().trim());
    const matchLot = !filterLot || (h.lotNumber || '').toLowerCase().includes(filterLot.toLowerCase().trim());
    const matchMode = !filterMode || recordMode === filterMode;
    
    return matchDate && matchItem && matchLot && matchMode;
  });

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    // Detect mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    // Detect if in iframe (AI Studio preview)
    const isInIframe = window.self !== window.top;

    try {
      if (isMobile && !isInIframe) {
        // Use redirect for mobile browsers when not in iframe to avoid popup issues
        await signInWithRedirect(auth, provider);
      } else {
        // Use popup for desktop or when in iframe
        await signInWithPopup(auth, provider);
      }
    } catch (error: any) {
      console.error("Login failed:", error);
      if (error.code === 'auth/unauthorized-domain') {
        alert('이 도메인은 Firebase 콘솔에서 승인되지 않았습니다. Firebase 콘솔 > Authentication > Settings > Authorized domains에 현재 도메인을 추가해주세요.');
      } else if (error.code === 'auth/popup-blocked') {
        alert('팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용해주세요.');
      } else {
        alert('로그인에 실패했습니다: ' + (error.message || '알 수 없는 오류'));
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      resetForm();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const syncToGoogleSheets = async (recordData: FillingRecord) => {
    const rawUrl = settings.scriptUrl || import.meta.env.VITE_GOOGLE_SCRIPT_URL;
      
    const scriptUrl = rawUrl?.trim();
      
    if (!scriptUrl) {
      console.warn('Google Sheets sync skipped: Script URL is missing.');
      return;
    }

    // Basic URL validation to prevent common mistakes
    if (!scriptUrl.startsWith('https://script.google.com/')) {
      console.error('Invalid Google Script URL:', scriptUrl);
      alert('구글 시트 URL이 올바르지 않습니다. "https://script.google.com/..."으로 시작하는 웹 앱 URL을 입력해주세요.');
      return;
    }

    try {
      // Use text/plain to avoid CORS preflight issues in no-cors mode
      await fetch(scriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify(recordData),
      });
      console.log('Sync request sent to:', scriptUrl);
    } catch (error) {
      console.error('Google Sheets sync network error:', error);
    }
  };

  const getWeightResult = (vials: (number | null)[], std: number, under: number, over: number): string => {
    let count = 0;
    let failCount = 0;
    vials.forEach(v => {
      if (v !== null && v !== undefined && String(v) !== "") {
        count++;
        const val = Number(v);
        if (val < (std - under) || val > (std + over)) failCount++;
      }
    });
    if (count === 0) return "-";
    return failCount < 2 ? "적합" : "부적합";
  };

  const getStatusResult = (arr: (string | null)[]): string => {
    let count = 0;
    let failCount = 0;
    arr.forEach(v => {
      if (v !== null && v !== undefined && v !== "") {
        count++;
        if (v === "불량") failCount++;
      }
    });
    if (count === 0) return "-";
    return failCount < 2 ? "적합" : "부적합";
  };

  const syncToSupabase = async (recordData: FillingRecord) => {
    try {
      const weightRows: any[] = [];
      const otherRows: any[] = [];

      const std = recordData.standardWeight ?? 0;
      const under = recordData.underweightTolerance ?? 0;
      const over = recordData.overweightTolerance ?? 0;

      recordData.measurements.forEach((m) => {
        // 1. Process Filling1 Weight
        if (recordData.mainMode === '충진' && recordData.subMode === '충진1') {
          const weights = m.vials || [null, null, null];
          if (weights.some(v => v !== null && v !== undefined && String(v) !== "")) {
            const weightRes = getWeightResult(weights, std, under, over);
            const weightJudge = (weightRes === "적합" ? "정상" : "불량");
            weightRows.push({
              filling_date: recordData.fillingDate,
              item_name: recordData.itemName,
              lot_number: recordData.lotNumber,
              measurement_time: m.time,
              classification: "중량",
              standard_weight: std,
              underweight_tolerance: under,
              overweight_tolerance: over,
              vial_1: weights[0] !== null && weights[0] !== undefined ? String(weights[0]) : "-",
              vial_2: weights[1] !== null && weights[1] !== undefined ? String(weights[1]) : "-",
              vial_3: weights[2] !== null && weights[2] !== undefined ? String(weights[2]) : "-",
              average: weightJudge,
              judgement: weightRes,
              operator: recordData.operator,
              verifier: recordData.verifier,
              memo: m.vialMemo || ""
            });
          }
          
          // Cap status for Filling1 goes to "그 외"
          const caps = m.capStatus || [null, null, null];
          if (caps.some(v => v !== null && v !== undefined && v !== "")) {
            const statusRes = getStatusResult(caps);
            otherRows.push({
              filling_date: recordData.fillingDate,
              item_name: recordData.itemName,
              lot_number: recordData.lotNumber,
              measurement_time: m.time,
              classification: "캡(충진1)",
              vial_1: caps[0] || "-",
              vial_2: caps[1] || "-",
              vial_3: caps[2] || "-",
              average: statusRes === "적합" ? "정상" : "불량",
              judgement: statusRes,
              operator: recordData.operator,
              verifier: recordData.verifier,
              memo: m.capMemo || ""
            });
          }
        } 
        
        // 2. Process Filling2
        else if (recordData.mainMode === '충진' && recordData.subMode === '충진2') {
          const stickers = m.stickerStatus || [null, null, null];
          if (stickers.some(v => v !== null && v !== undefined && v !== "")) {
            const resStatus = getStatusResult(stickers);
            otherRows.push({
              filling_date: recordData.fillingDate,
              item_name: recordData.itemName,
              lot_number: recordData.lotNumber,
              measurement_time: m.time,
              classification: "스티커(충진2)",
              vial_1: stickers[0] || "-",
              vial_2: stickers[1] || "-",
              vial_3: stickers[2] || "-",
              average: resStatus === "적합" ? "정상" : "불량",
              judgement: resStatus,
              operator: recordData.operator,
              verifier: recordData.verifier,
              memo: m.stickerMemo || ""
            });
          }
          const prints = m.printingStatus || [null, null, null];
          if (prints.some(v => v !== null && v !== undefined && v !== "")) {
            const resStatus = getStatusResult(prints);
            otherRows.push({
              filling_date: recordData.fillingDate,
              item_name: recordData.itemName,
              lot_number: recordData.lotNumber,
              measurement_time: m.time,
              classification: "날인(충진2)",
              vial_1: prints[0] || "-",
              vial_2: prints[1] || "-",
              vial_3: prints[2] || "-",
              average: resStatus === "적합" ? "정상" : "불량",
              judgement: resStatus,
              operator: recordData.operator,
              verifier: recordData.verifier,
              memo: m.printingMemo || ""
            });
          }
        } 
        
        // 3. Process Packaging
        else if (recordData.mainMode === '포장') {
          const labels = ["날인(포장)", "캡(포장)", "스티커(포장)", "스크래치(포장)", "이물(포장)"];
          const statusArrays = [m.printingStatus, m.capStatus, m.stickerStatus, m.scratchStatus, m.foreignStatus];
          const memoFields: ("printingMemo" | "capMemo" | "stickerMemo" | "scratchMemo" | "foreignMemo")[] = [
            "printingMemo", "capMemo", "stickerMemo", "scratchMemo", "foreignMemo"
          ];
          
          labels.forEach((label, idx) => {
            const arr = statusArrays[idx] || [null, null, null];
            if (arr.some(v => v !== null && v !== undefined && v !== "")) {
              const resStatus = getStatusResult(arr);
              const memo = m[memoFields[idx]] || "";
              otherRows.push({
                filling_date: recordData.fillingDate,
                item_name: recordData.itemName,
                lot_number: recordData.lotNumber,
                measurement_time: m.time,
                classification: label,
                vial_1: arr[0] || "-",
                vial_2: arr[1] || "-",
                vial_3: arr[2] || "-",
                average: resStatus === "적합" ? "정상" : "불량",
                judgement: resStatus,
                operator: recordData.operator,
                verifier: recordData.verifier,
                memo: memo
              });
            }
          });
        }
      });

      // Supabase insert 쿼리 실행
      if (weightRows.length > 0) {
        const { error: weightError } = await supabase
          .from('Weight Measurement')
          .insert(weightRows);
        if (weightError) {
          console.error("Supabase Weight Measurement insert error:", weightError);
        }
      }

      if (otherRows.length > 0) {
        const { error: otherError } = await supabase
          .from('Other Measurements')
          .insert(otherRows);
        if (otherError) {
          console.error("Supabase Other Measurements insert error:", otherError);
        }
      }
      
    } catch (error) {
      console.error("Supabase sync network error:", error);
    }
  };

  const saveRecord = async () => {
    if (!user) {
      alert('저장하려면 로그인이 필요합니다.');
      return;
    }

    setIsSaving(true);
    try {
      // Always generate a new ID to ensure a new record is created even if editing
      const newId = Math.random().toString(36).substr(2, 9);
      const recordToSave = { ...record, id: newId, uid: user.uid, createdAt: Date.now() };
      await setDoc(doc(db, 'records', newId), recordToSave);
      setRecord(recordToSave);
      
      // Sync to Google Sheets if URL is provided
      try {
        await syncToGoogleSheets(recordToSave);
      } catch (sheetsErr) {
        console.error('Google Sheets sync failed:', sheetsErr);
      }

      // Sync to Supabase (완벽하게 격리된 에러 핸들링으로 기존 동작 방해 안 함)
      try {
        await syncToSupabase(recordToSave);
      } catch (supabaseErr) {
        console.error('Supabase sync failed:', supabaseErr);
      }
      
      alert('기록이 클라우드에 저장되었습니다.');
      resetForm();
    } catch (error: any) {
      handleFirestoreError(error, OperationType.WRITE, `records/${record.id}`);
    } finally {
      setIsSaving(false);
    }
  };

  const loadRecord = (h: FillingRecord) => {
    setRecord(h);
    setShowHistory(false);
  };

  const saveSettings = async (newSettings: AppSettings) => {
    if (!user) return;
    setIsSavingSettings(true);
    try {
      await setDoc(doc(db, 'settings', 'global'), newSettings);
      setSettings(newSettings);
      alert('설정이 성공적으로 저장되었습니다.');
    } catch (error: any) {
      handleFirestoreError(error, OperationType.WRITE, `settings/${user.uid}`);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const resetForm = () => {
    setRecord({
      id: Math.random().toString(36).substr(2, 9),
      mainMode: record.mainMode,
      subMode: record.subMode,
      itemName: '',
      lotNumber: '',
      fillingDate: format(new Date(), 'yyyy-MM-dd'),
      standardWeight: null,
      underweightTolerance: null,
      overweightTolerance: null,
      operator: record.operator, // Keep previous operator/verifier for convenience
      verifier: record.verifier,
      measurements: DEFAULT_MEASUREMENTS.map(m => ({ ...m, id: Math.random().toString(36).substr(2, 9) })),
      createdAt: Date.now(),
      uid: user?.uid || '',
    });
  };

  const [showPrintPreview, setShowPrintPreview] = useState(false);


  // 대시보드(홈) 화면으로 돌아가는 핸들러 함수
  const handleGoDashboard = () => {
    setShowHistory(false);
    setShowSettings(false);
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-layout)]">
        <Loader2 className="animate-spin text-[var(--color-text-secondary)]" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[var(--color-bg-layout)] text-[var(--color-text)] font-sans">
      
      {/* ── 1. 왼쪽 세로형 사이드바 (인쇄 시 숨김) ── */}
      <aside className="w-64 bg-white dark:bg-zinc-900 border-r border-[var(--color-border)] dark:border-zinc-800 p-6 flex flex-col gap-6 shrink-0 print-hidden justify-between">
        <div className="space-y-6">
          {/* 로고 영역 (현 위치 유지) */}
          <div className="flex items-center justify-center cursor-pointer select-none pb-4 border-b border-[var(--color-border)] dark:border-zinc-800 w-full" onClick={handleGoDashboard} title="대시보드로 이동">
            <img 
              src="/brand/logo/logo-h.svg?v=2" 
              alt="Zenitry Logo" 
              className="h-[26px] w-auto object-contain block dark:hidden" 
            />
            <img 
              src="/brand/logo/logo-h-light.svg?v=2" 
              alt="Zenitry Logo" 
              className="h-[26px] w-auto object-contain hidden dark:block" 
            />
          </div>

          {/* 측정 분류 모드 */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">분류 모드</label>
            <div className="flex bg-[var(--color-primary-bg)] p-1 rounded-xl w-full">
              {(['충진', '포장'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setRecord(prev => ({ ...prev, mainMode: m }))}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg text-xs font-bold transition-all",
                    record.mainMode === m 
                      ? "bg-white text-zinc-800 shadow-sm" 
                      : "text-zinc-500 hover:text-zinc-700"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* 메뉴 세로 리스트 */}
          <nav className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">메뉴 목록</label>
            
            {user && (
              <div className="flex items-center gap-2 px-3 py-2 bg-zinc-50 border border-zinc-100 rounded-xl text-xs font-medium text-zinc-600 mb-2 truncate">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-5 h-5 rounded-full shrink-0" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-zinc-200 flex items-center justify-center text-[10px] text-zinc-500 font-bold shrink-0">
                    {user.displayName?.charAt(0) || 'U'}
                  </div>
                )}
                <span className="truncate">{user.displayName} 님</span>
              </div>
            )}

            {user ? (
              <button 
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition-all shadow-sm w-full text-left cursor-pointer"
              >
                <LogOut size={14} className="text-zinc-400" />
                로그아웃
              </button>
            ) : (
              <button 
                onClick={handleLogin}
                className="flex items-center gap-3 px-4 py-2.5 bg-zinc-800 text-white rounded-xl text-xs font-bold hover:bg-zinc-700 transition-all shadow-md w-full text-left cursor-pointer"
              >
                <LogIn size={14} />
                구글 로그인
              </button>
            )}

            <button 
              onClick={() => {
                if (!user) {
                  alert('환경설정을 변경하려면 먼저 구글 로그인을 해주세요.');
                  return;
                }
                setShowSettings(true);
              }}
              className="flex items-center gap-3 px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition-all shadow-sm w-full text-left cursor-pointer"
            >
              <Settings size={14} className="text-zinc-400" />
              환경설정
            </button>

            <button 
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-3 px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition-all shadow-sm w-full text-left cursor-pointer"
            >
              <History size={14} className="text-zinc-400" />
              기록 내역
            </button>

            <button 
              onClick={resetForm}
              className="flex items-center gap-3 px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition-all shadow-sm w-full text-left cursor-pointer"
            >
              <Plus size={14} className="text-zinc-400" />
              새 기록
            </button>

            <button 
              onClick={saveRecord}
              disabled={isSaving || !user}
              className="flex items-center gap-3 px-4 py-2.5 bg-zinc-800 text-white rounded-xl text-xs font-bold hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md w-full text-left cursor-pointer"
            >
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              저장
            </button>

            <button 
              onClick={() => setShowPrintPreview(true)}
              className="flex items-center gap-3 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-md w-full text-left mt-2 cursor-pointer"
            >
              <CheckCircle2 size={14} />
              보고서 발행
            </button>

          </nav>
        </div>

        <div className="text-[10px] text-zinc-400 font-mono text-center border-t border-zinc-100 pt-4">
          (주)제니트리
        </div>
      </aside>

      {/* ── 2. 메인 콘텐츠 영역 (인쇄 시 숨김) ── */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto space-y-6 print-hidden">
        {/* 상단 가운데 정렬 제목 */}
        <header className="text-center py-4 border-b border-[var(--color-border)]">
          <h1 className="text-2xl font-black tracking-tight text-[var(--color-text)]">
            충진품 자주측정 ({record.mainMode})
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1 uppercase tracking-widest font-mono">
            Filling Product Measurement Record
          </p>
        </header>

        {/* 대시보드 레이아웃 (확대/축소 카드로 래핑) */}
        <div className="flex flex-wrap gap-6 items-start w-full">
          
          {/* 기본 정보 설정 및 가이드 (드래그 확대/축소 지원) */}
          <div ref={infoCard.ref} className="resizable-card bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6 flex-none" style={{ minWidth: '280px', minHeight: '350px', width: '320px', fontSize: `${13 * infoCard.scale}px`, '--control-height': `${36 * infoCard.scale}px` } as React.CSSProperties}>
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-400">기본 정보 설정</h2>
                {record.mainMode === '충진' && (
                  <div className="flex bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-700">
                    {(['충진1', '충진2'] as const).map((sm) => (
                      <button
                        key={sm}
                        onClick={() => setRecord(prev => ({ ...prev, subMode: sm }))}
                        className={cn(
                          "px-3 py-1 rounded-md text-[10px] font-bold transition-all",
                          record.subMode === sm 
                            ? "bg-white dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 shadow-sm" 
                            : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-400"
                        )}
                      >
                        {sm}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                    <Package size={12} /> 품목명
                  </label>
                  <select
                    value={record.itemName}
                    onChange={(e) => {
                      const selectedItem = settings.items.find(i => i.name === e.target.value);
                      if (selectedItem) {
                        setRecord({ 
                          ...record, 
                          itemName: selectedItem.name,
                          standardWeight: selectedItem.standardWeight,
                          underweightTolerance: selectedItem.underweightTolerance,
                          overweightTolerance: selectedItem.overweightTolerance
                        });
                      } else {
                        setRecord({ ...record, itemName: e.target.value });
                      }
                    }}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-zinc-200 dark:focus:ring-zinc-750 text-zinc-900 dark:text-zinc-100 p-2"
                  >
                    <option value="">품목 선택...</option>
                    {settings.items.map((item, idx) => (
                      <option key={idx} value={item.name}>{item.name}</option>
                    ))}
                    {!settings.items.some(i => i.name === record.itemName) && record.itemName && (
                      <option value={record.itemName}>{record.itemName}</option>
                    )}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                    <Hash size={12} /> 로트번호
                  </label>
                  <input
                    type="text"
                    value={record.lotNumber}
                    onChange={(e) => setRecord({ ...record, lotNumber: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-zinc-200 dark:focus:ring-zinc-750 text-zinc-900 dark:text-zinc-100 p-2"
                    placeholder="예: LOT20240326"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                    <Calendar size={12} /> {record.mainMode === '포장' ? '포장일' : '충진일'}
                  </label>
                  <input
                    type="date"
                    value={record.fillingDate}
                    onChange={(e) => setRecord({ ...record, fillingDate: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-zinc-200 dark:focus:ring-zinc-750 text-zinc-900 dark:text-zinc-100 p-2"
                  />
                </div>

                {record.mainMode === '충진' && record.subMode === '충진1' ? (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                        <Weight size={12} /> 정식중량 (g)
                      </label>
                      <NumberInputWithButtons
                        value={record.standardWeight}
                        onChange={(val) => setRecord({ ...record, standardWeight: val })}
                        step={0.1}
                        placeholder="0.0"
                        className="bg-zinc-50 border-transparent"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                          <Percent size={12} /> 중량미달 (±g)
                        </label>
                        <NumberInputWithButtons
                          value={record.underweightTolerance}
                          onChange={(val) => setRecord({ ...record, underweightTolerance: val })}
                          step={0.1}
                          placeholder="0.0"
                          className="bg-zinc-50 border-transparent"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                          <Percent size={12} /> 중량초과 (±g)
                        </label>
                        <NumberInputWithButtons
                          value={record.overweightTolerance}
                          onChange={(val) => setRecord({ ...record, overweightTolerance: val })}
                          step={0.1}
                          placeholder="0.0"
                          className="bg-zinc-50 border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                      <User size={12} /> 측정자
                    </label>
                    <select
                      value={record.verifier}
                      onChange={(e) => setRecord({ ...record, verifier: e.target.value })}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-zinc-200 dark:focus:ring-zinc-750 text-zinc-900 dark:text-zinc-100 p-2"
                    >
                      <option value="">선택...</option>
                      {(settings.verifiers || []).map((ver, i) => (
                        <option key={i} value={ver}>{ver}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                      <User size={12} /> 확인자
                    </label>
                    <select
                      value={record.operator}
                      onChange={(e) => setRecord({ ...record, operator: e.target.value })}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-zinc-200 dark:focus:ring-zinc-750 text-zinc-900 dark:text-zinc-100 p-2"
                    >
                      <option value="">선택...</option>
                      {(settings.operators || []).map((op, i) => (
                        <option key={i} value={op}>{op}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-zinc-800 text-white p-4 rounded-2xl shadow-sm space-y-2 text-xs">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle size={14} className="text-zinc-400" />
                <span className="font-bold">계측 핵심 가이드</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                • 매 시간 무작위 시료 3개를 채취해 기록.<br />
                • 판정 오차가 기준을 벗어나면 사유 기재.<br />
                • <span className="text-red-400 font-bold">빨간색</span>: 규격 이하 / <span className="text-blue-400 font-bold">파란색</span>: 규격 초과
              </p>
            </div>
          </div>

          {/* 계측 테이블 (드래그 확대/축소 지원) */}
          <div ref={tableCard.ref} className="resizable-card bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col flex-none" style={{ minWidth: '350px', minHeight: '350px', width: '700px', fontSize: `${12 * tableCard.scale}px`, '--control-height': `${36 * tableCard.scale}px` } as React.CSSProperties}>
            <div className="flex-1 overflow-auto">
              <table className={cn(
                "w-full border-collapse text-left",
                record.mainMode === '포장' ? "min-w-[1200px]" : "min-w-[650px]"
              )}>
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-500 dark:text-zinc-400">
                    <th className="p-3 text-center w-20">시간</th>
                    {record.mainMode === '충진' && record.subMode === '충진1' && (
                      <>
                        <th colSpan={3} className="p-3 text-center border-l-2 border-zinc-200 dark:border-l-zinc-700">중량 (g)</th>
                        <th colSpan={3} className="p-3 text-center border-l-2 border-zinc-200 dark:border-l-zinc-700">캡 상태</th>
                      </>
                    )}
                    {record.mainMode === '충진' && record.subMode === '충진2' && (
                      <>
                        <th colSpan={3} className="p-3 text-center border-l-2 border-zinc-200 dark:border-l-zinc-700">스티커 상태</th>
                        <th colSpan={3} className="p-3 text-center border-l-2 border-zinc-200 dark:border-l-zinc-700">날인 상태</th>
                      </>
                    )}
                    {record.mainMode === '포장' && (
                      <>
                        <th colSpan={3} className="p-3 text-center border-l-2 border-zinc-200 dark:border-l-zinc-700">날인</th>
                        <th colSpan={3} className="p-3 text-center border-l-2 border-zinc-200 dark:border-l-zinc-700">캡</th>
                        <th colSpan={3} className="p-3 text-center border-l-2 border-zinc-200 dark:border-l-zinc-700">스티커</th>
                        <th colSpan={3} className="p-3 text-center border-l-2 border-zinc-200 dark:border-l-zinc-700">스크래치</th>
                        <th colSpan={3} className="p-3 text-center border-l-2 border-zinc-200 dark:border-l-zinc-700">이물</th>
                      </>
                    )}
                  </tr>
                  <tr className="bg-zinc-50/50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800 text-[10px] text-zinc-400 dark:text-zinc-500">
                    <th className="p-2 text-center">Time</th>
                    {record.mainMode === '충진' && record.subMode === '충진1' && (
                      <>
                        <th className="p-2 text-center border-l-2 border-zinc-200 w-[70px]">V1</th>
                        <th className="p-2 text-center w-[70px]">V2</th>
                        <th className="p-2 text-center w-[70px]">V3</th>
                        <th className="p-2 text-center border-l-2 border-zinc-200 w-[70px]">V1</th>
                        <th className="p-2 text-center w-[70px]">V2</th>
                        <th className="p-2 text-center w-[70px]">V3</th>
                      </>
                    )}
                    {record.mainMode === '충진' && record.subMode === '충진2' && (
                      <>
                        <th className="p-2 text-center border-l-2 border-zinc-200 w-[70px]">V1</th>
                        <th className="p-2 text-center w-[70px]">V2</th>
                        <th className="p-2 text-center w-[70px]">V3</th>
                        <th className="p-2 text-center border-l-2 border-zinc-200 w-[70px]">V1</th>
                        <th className="p-2 text-center w-[70px]">V2</th>
                        <th className="p-2 text-center w-[70px]">V3</th>
                      </>
                    )}
                    {record.mainMode === '포장' && (
                      <>
                        <th className="p-2 text-center border-l-2 border-zinc-200 w-[70px]">V1</th>
                        <th className="p-2 text-center w-[70px]">V2</th>
                        <th className="p-2 text-center w-[70px]">V3</th>
                        <th className="p-2 text-center border-l-2 border-zinc-200 w-[70px]">V1</th>
                        <th className="p-2 text-center w-[70px]">V2</th>
                        <th className="p-2 text-center w-[70px]">V3</th>
                        <th className="p-2 text-center border-l-2 border-zinc-200 w-[70px]">V1</th>
                        <th className="p-2 text-center w-[70px]">V2</th>
                        <th className="p-2 text-center w-[70px]">V3</th>
                        <th className="p-2 text-center border-l-2 border-zinc-200 w-[70px]">V1</th>
                        <th className="p-2 text-center w-[70px]">V2</th>
                        <th className="p-2 text-center w-[70px]">V3</th>
                        <th className="p-2 text-center border-l-2 border-zinc-200 w-[70px]">V1</th>
                        <th className="p-2 text-center w-[70px]">V2</th>
                        <th className="p-2 text-center w-[70px]">V3</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {record.measurements.map((m, idx) => (
                    <MeasurementRow
                      key={m.id}
                      measurement={m}
                      mainMode={record.mainMode}
                      subMode={record.subMode}
                      standardWeight={record.standardWeight || 0}
                      underweightTolerance={record.underweightTolerance || 0}
                      overweightTolerance={record.overweightTolerance || 0}
                      onUpdate={(updated) => {
                        const newMeasurements = [...record.measurements];
                        newMeasurements[idx] = updated;
                        setRecord({ ...record, measurements: newMeasurements });
                      }}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* 시간대 조절판 */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap justify-center gap-6">
              <div className="flex gap-4 items-center">
                <button 
                  onClick={() => {
                    const firstTime = record.measurements[0]?.time || "09:00";
                    const [h, m] = firstTime.split(':').map(Number);
                    let prevH = (h - 1 + 24) % 24;
                    if (prevH === 13) prevH = 12;
                    const prevTime = `${prevH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                    setRecord({
                      ...record,
                      measurements: [
                        { 
                          id: Math.random().toString(36).substr(2, 9), 
                          time: prevTime, 
                          vials: [null, null, null], 
                          vialMemo: '',
                          capStatus: [null, null, null],
                          capMemo: '',
                          stickerStatus: [null, null, null],
                          stickerMemo: '',
                          printingStatus: [null, null, null],
                          printingMemo: '',
                          scratchStatus: [null, null, null],
                          scratchMemo: '',
                          foreignStatus: [null, null, null],
                          foreignMemo: '',
                          isExpanded: false
                        },
                        ...record.measurements
                      ]
                    });
                  }}
                  className="text-xs font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={12} /> 윗 시간대 추가
                </button>
                
                {!isDeletingTopRow ? (
                  <button 
                    onClick={() => setIsDeletingTopRow(true)}
                    className="text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 size={12} /> 윗 시간대 삭제
                  </button>
                ) : (
                  <div className="flex items-center gap-2 bg-white dark:bg-zinc-800 border border-red-200 dark:border-red-900 rounded-lg p-1 shadow-sm text-[10px]">
                    <button 
                      onClick={() => {
                        if (record.measurements.length > 1) {
                          setRecord({ ...record, measurements: record.measurements.slice(1) });
                        }
                        setIsDeletingTopRow(false);
                      }}
                      className="px-2 py-0.5 bg-red-500 text-white rounded font-bold"
                    >
                      확인
                    </button>
                    <button onClick={() => setIsDeletingTopRow(false)} className="px-2 py-0.5 bg-zinc-100 rounded text-zinc-600 font-bold">
                      취소
                    </button>
                  </div>
                )}
              </div>

              <div className="flex gap-4 items-center">
                <button 
                  onClick={() => {
                    const lastTime = record.measurements[record.measurements.length - 1]?.time || "17:00";
                    const [h, m] = lastTime.split(':').map(Number);
                    let nextH = (h + 1) % 24;
                    if (nextH === 13) nextH = 14;
                    const nextTime = `${nextH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                    setRecord({
                      ...record,
                      measurements: [
                        ...record.measurements,
                        { 
                          id: Math.random().toString(36).substr(2, 9), 
                          time: nextTime, 
                          vials: [null, null, null], 
                          vialMemo: '',
                          capStatus: [null, null, null],
                          capMemo: '',
                          stickerStatus: [null, null, null],
                          stickerMemo: '',
                          printingStatus: [null, null, null],
                          printingMemo: '',
                          scratchStatus: [null, null, null],
                          scratchMemo: '',
                          foreignStatus: [null, null, null],
                          foreignMemo: '',
                          isExpanded: false
                        }
                      ]
                    });
                  }}
                  className="text-xs font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={12} /> 아랫 시간대 추가
                </button>
                
                {!isDeletingBottomRow ? (
                  <button 
                    onClick={() => setIsDeletingBottomRow(true)}
                    className="text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 size={12} /> 아랫 시간대 삭제
                  </button>
                ) : (
                  <div className="flex items-center gap-2 bg-white dark:bg-zinc-800 border border-red-200 dark:border-red-900 rounded-lg p-1 shadow-sm text-[10px]">
                    <button 
                      onClick={() => {
                        if (record.measurements.length > 1) {
                          setRecord({ ...record, measurements: record.measurements.slice(0, -1) });
                        }
                        setIsDeletingBottomRow(false);
                      }}
                      className="px-2 py-0.5 bg-red-500 text-white rounded font-bold"
                    >
                      확인
                    </button>
                    <button onClick={() => setIsDeletingBottomRow(false)} className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-700 rounded text-zinc-600 dark:text-zinc-300 font-bold">
                      취소
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 측정항목 그래프 (충진1 모드일 때만 그래프와 종합 평균 표시) */}
          {record.mainMode === '충진' && record.subMode === '충진1' && (
            <div ref={graphCard.ref} className="resizable-card bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex-none mt-6" style={{ minWidth: '350px', minHeight: '260px', width: '100%', fontSize: `${13 * graphCard.scale}px` } as React.CSSProperties}>
              <WeightChart 
                measurements={record.measurements} 
                standardWeight={record.standardWeight} 
                underweightTolerance={record.underweightTolerance} 
                overweightTolerance={record.overweightTolerance} 
              />
            </div>
          )}

        </div>
      </main>

      {/* ── 3. 설정 모달 ── */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-zinc-800">환경설정</h2>
                  <p className="text-xs text-zinc-400 mt-1 uppercase tracking-widest font-mono">Application Settings</p>
                </div>
                <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {!user ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <AlertCircle size={48} className="text-zinc-300" />
                    <p className="text-zinc-500 font-medium">로그인이 필요합니다.</p>
                    <button 
                      onClick={() => {
                        setShowSettings(false);
                        handleLogin();
                      }}
                      className="px-6 py-2 bg-zinc-800 text-white rounded-full text-sm font-bold hover:bg-zinc-700 transition-all cursor-pointer"
                    >
                      구글 로그인하기
                    </button>
                  </div>
                ) : (
                  <>
                    <section className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-bold text-zinc-700 flex items-center gap-2">
                          <Package size={16} /> 품목 및 중량 설정
                        </h3>
                        <button 
                          onClick={() => {
                            const newItems = [...settings.items, { name: '', standardWeight: null, underweightTolerance: null, overweightTolerance: null }];
                            setSettings({ ...settings, items: newItems });
                          }}
                          className="text-xs font-bold text-zinc-500 hover:text-zinc-800 flex items-center gap-1 cursor-pointer"
                        >
                          <Plus size={14} /> 품목 추가
                        </button>
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        {settings.items.map((item, idx) => (
                          <div key={idx} className="relative group">
                            <div className={cn(
                              "p-4 bg-zinc-50 rounded-2xl border border-zinc-100 grid grid-cols-1 md:grid-cols-4 gap-4 items-end transition-all",
                              deletingItemIdx === idx && "opacity-50 blur-[1px]"
                            )}>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-zinc-400">품목명</label>
                                <input 
                                  type="text" 
                                  value={item.name} 
                                  onChange={(e) => {
                                    const newItems = [...settings.items];
                                    newItems[idx].name = e.target.value;
                                    setSettings({ ...settings, items: newItems });
                                  }}
                                  className="w-full bg-white border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-zinc-100 p-2"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-zinc-400">정식중량 (g)</label>
                                <NumberInputWithButtons
                                  value={item.standardWeight}
                                  onChange={(val) => {
                                    const newItems = [...settings.items];
                                    newItems[idx].standardWeight = val;
                                    setSettings({ ...settings, items: newItems });
                                  }}
                                  step={0.1}
                                  className="bg-white border-zinc-100"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-zinc-400">미달 (g)</label>
                                  <NumberInputWithButtons
                                    value={item.underweightTolerance}
                                    onChange={(val) => {
                                      const newItems = [...settings.items];
                                      newItems[idx].underweightTolerance = val;
                                      setSettings({ ...settings, items: newItems });
                                    }}
                                    step={0.1}
                                    className="bg-white border-zinc-100"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-zinc-400">초과 (g)</label>
                                  <NumberInputWithButtons
                                    value={item.overweightTolerance}
                                    onChange={(val) => {
                                      const newItems = [...settings.items];
                                      newItems[idx].overweightTolerance = val;
                                      setSettings({ ...settings, items: newItems });
                                    }}
                                    step={0.1}
                                    className="bg-white border-zinc-100"
                                  />
                                </div>
                              </div>
                              <button 
                                onClick={() => setDeletingItemIdx(idx)}
                                className="p-2 text-zinc-300 hover:text-red-500 transition-colors justify-self-end cursor-pointer"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>

                            <AnimatePresence>
                              {deletingItemIdx === idx && (
                                <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] rounded-2xl flex items-center justify-center gap-3 p-4 z-10">
                                  <span className="text-xs font-bold text-zinc-600">이 품목을 삭제할까요?</span>
                                  <div className="flex gap-2">
                                    <button 
                                      onClick={() => {
                                        const newItems = settings.items.filter((_, i) => i !== idx);
                                        setSettings({ ...settings, items: newItems });
                                        setDeletingItemIdx(null);
                                      }}
                                      className="px-4 py-2 bg-red-500 text-white text-[10px] font-bold rounded-lg hover:bg-red-600 transition-colors"
                                    >
                                      삭제확인
                                    </button>
                                    <button 
                                      onClick={() => setDeletingItemIdx(null)}
                                      className="px-4 py-2 bg-zinc-200 text-zinc-600 text-[10px] font-bold rounded-lg hover:bg-zinc-300 transition-colors"
                                    >
                                      취소
                                    </button>
                                  </div>
                                </div>
                              )}
                            </AnimatePresence>
                          </div>
                        ))}
                      </div>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <section className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-sm font-bold text-zinc-700 flex items-center gap-2">
                            <User size={16} /> 측정자 (Verifier)
                          </h3>
                          <button 
                            onClick={() => {
                              const newVerifiers = [...(settings.verifiers || []), ''];
                              setSettings({ ...settings, verifiers: newVerifiers });
                            }}
                            className="text-xs font-bold text-zinc-500 hover:text-zinc-800 flex items-center gap-1 cursor-pointer"
                          >
                            <Plus size={14} /> 측정자 추가
                          </button>
                        </div>
                        <div className="space-y-2">
                          {(settings.verifiers || []).map((ver, idx) => (
                            <div key={idx} className="relative group flex items-center gap-2">
                              <input 
                                type="text" 
                                value={ver} 
                                onChange={(e) => {
                                  const newVers = [...settings.verifiers];
                                  newVers[idx] = e.target.value;
                                  setSettings({ ...settings, verifiers: newVers });
                                }}
                                placeholder="측정자 성명"
                                className="flex-1 bg-zinc-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-zinc-100 p-3"
                              />
                              <button 
                                onClick={() => {
                                  const newVers = settings.verifiers.filter((_, i) => i !== idx);
                                  setSettings({ ...settings, verifiers: newVers });
                                }}
                                className="p-2 text-zinc-300 hover:text-red-500 transition-colors cursor-pointer"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </section>
                      
                      <section className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-sm font-bold text-zinc-700 flex items-center gap-2">
                            <User size={16} /> 확인자 (Operator)
                          </h3>
                          <button 
                            onClick={() => {
                              const newOperators = [...(settings.operators || []), ''];
                              setSettings({ ...settings, operators: newOperators });
                            }}
                            className="text-xs font-bold text-zinc-500 hover:text-zinc-800 flex items-center gap-1 cursor-pointer"
                          >
                            <Plus size={14} /> 확인자 추가
                          </button>
                        </div>
                        <div className="space-y-2">
                          {(settings.operators || []).map((op, idx) => (
                            <div key={idx} className="relative group flex items-center gap-2">
                              <input 
                                type="text" 
                                value={op} 
                                onChange={(e) => {
                                  const newOps = [...settings.operators];
                                  newOps[idx] = e.target.value;
                                  setSettings({ ...settings, operators: newOps });
                                }}
                                placeholder="확인자 성명"
                                className="flex-1 bg-zinc-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-zinc-100 p-3"
                              />
                              <button 
                                onClick={() => {
                                  const newOps = settings.operators.filter((_, i) => i !== idx);
                                  setSettings({ ...settings, operators: newOps });
                                }}
                                className="p-2 text-zinc-300 hover:text-red-500 transition-colors cursor-pointer"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </section>
                    </div>

                    <section className="p-6 border-t border-zinc-100 space-y-4">
                      <h3 className="text-sm font-bold text-zinc-700 flex items-center gap-2">
                        <Link size={16} /> 구글 시트 동기화 설정
                      </h3>
                      <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">구글 앱스스크립트(웹 앱) URL</label>
                          <input 
                            type="text" 
                            value={settings.scriptUrl || ''} 
                            onChange={(e) => setSettings({ ...settings, scriptUrl: e.target.value })}
                            placeholder="https://script.google.com/macros/s/.../exec"
                            className="w-full bg-white border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-zinc-100 p-2"
                          />
                        </div>
                        <p className="text-[10px] text-zinc-400">
                          * 웹 앱 URL 입력 시 구글 스프레드시트에 자동 동기화됩니다.
                        </p>
                      </div>
                    </section>
                  </>
                )}
              </div>

              <div className="p-6 border-t border-zinc-100 bg-zinc-50 flex justify-end gap-3">
                <button 
                  onClick={() => setShowSettings(false)}
                  className="px-6 py-3 bg-white border border-zinc-300 text-zinc-600 rounded-xl font-bold hover:bg-zinc-50 transition-all cursor-pointer"
                >
                  취소
                </button>
                <button 
                  onClick={async () => {
                    await saveSettings(settings);
                    setShowSettings(false);
                  }}
                  disabled={isSavingSettings}
                  className="px-8 py-3 bg-zinc-800 text-white rounded-xl font-bold hover:bg-zinc-700 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSavingSettings ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  설정 저장
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── 4. 기록 내역 조회 모달 (팝업 형식) ── */}
      <AnimatePresence>
        {showHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-3xl shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-zinc-800">최근 측정 기록 내역</h2>
                  <p className="text-xs text-zinc-400 mt-1 uppercase tracking-widest font-mono">Measurement History</p>
                </div>
                <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              {/* 필터 설정 */}
              <div className="p-6 bg-zinc-50 border-b border-zinc-100 flex flex-wrap gap-3 items-center text-xs">
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-zinc-200">
                  <Calendar size={14} className="text-zinc-400" />
                  <input 
                    type="date" 
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="border-none font-bold focus:ring-0 p-0 w-24"
                  />
                </div>

                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-zinc-200">
                  <Package size={14} className="text-zinc-400" />
                  <select 
                    value={filterItem}
                    onChange={(e) => setFilterItem(e.target.value)}
                    className="border-none font-bold focus:ring-0 p-0 min-w-[100px]"
                  >
                    <option value="">품목 전체</option>
                    {settings.items.map((item, idx) => (
                      <option key={idx} value={item.name}>{item.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-zinc-200">
                  <Hash size={14} className="text-zinc-400" />
                  <input 
                    type="text" 
                    placeholder="로트번호 검색"
                    value={filterLot}
                    onChange={(e) => setFilterLot(e.target.value)}
                    className="border-none font-bold focus:ring-0 p-0 w-28 placeholder:text-zinc-300"
                  />
                </div>

                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-zinc-200">
                  <Layers size={14} className="text-zinc-400" />
                  <select 
                    value={filterMode}
                    onChange={(e) => setFilterMode(e.target.value)}
                    className="border-none font-bold focus:ring-0 p-0 min-w-[80px]"
                  >
                    <option value="">모드 전체</option>
                    <option value="충진1">충진1</option>
                    <option value="충진2">충진2</option>
                    <option value="포장">포장</option>
                  </select>
                </div>

                {(filterDate || filterItem || filterLot || filterMode) && (
                  <button 
                    onClick={() => {
                      setFilterDate('');
                      setFilterItem('');
                      setFilterLot('');
                      setFilterMode('');
                    }}
                    className="text-red-500 hover:text-red-600 font-bold underline cursor-pointer"
                  >
                    필터 초기화
                  </button>
                )}
              </div>

              {/* 기록 목록 */}
              <div className="flex-1 overflow-y-auto p-6">
                {!user ? (
                  <p className="text-sm text-zinc-400 italic py-8 text-center">로그인 후 기록 조회가 가능합니다.</p>
                ) : filteredHistory.length === 0 ? (
                  <p className="text-sm text-zinc-400 italic py-8 text-center">조회된 데이터 내역이 없습니다.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredHistory.map((h) => (
                      <div key={h.id} className="relative">
                        <button
                          onClick={() => !deletingId && loadRecord(h)}
                          className={cn(
                            "w-full text-left p-4 border border-zinc-200 rounded-2xl hover:border-zinc-400 hover:bg-zinc-50 transition-all group relative cursor-pointer bg-white",
                            deletingId === h.id && "border-red-200 bg-red-50/20"
                          )}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-zinc-700 group-hover:text-zinc-900 truncate max-w-[150px]">{h.itemName || '품목명 없음'}</span>
                              <div className="flex gap-1 mt-1">
                                {h.mainMode === '포장' ? (
                                  <span className="px-1.5 py-0.5 bg-red-50 text-red-600 text-[9px] font-bold rounded uppercase">포장</span>
                                ) : (
                                  <span className={cn(
                                    "px-1.5 py-0.5 text-[9px] font-bold rounded uppercase",
                                    h.subMode === '충진2' ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600"
                                  )}>
                                    {h.subMode || '충진1'}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-end shrink-0 text-right">
                              <span className="text-[9px] font-bold text-zinc-500">
                                {h.mainMode === '포장' ? '포장일' : '충진일'}: {h.fillingDate || '-'}
                              </span>
                              <span className="text-[9px] font-mono text-zinc-400 mt-0.5">{format(h.createdAt, 'yyyy/MM/dd HH:mm')}</span>
                            </div>
                          </div>
                          <div className="text-xs text-zinc-500 mt-2 font-mono">Lot: {h.lotNumber || '-'}</div>
                          
                          {deletingId !== h.id && (
                            <div 
                              onClick={(e) => {
                                  e.stopPropagation();
                                  setDeletingId(h.id);
                              }}
                              className="absolute top-3 right-3 p-1 text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </div>
                          )}
                        </button>

                        <AnimatePresence>
                          {deletingId === h.id && (
                            <div className="absolute inset-0 bg-white/95 backdrop-blur-[1px] rounded-2xl flex items-center justify-center gap-2 p-2 z-10">
                              <button 
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    await deleteDoc(doc(db, 'records', h.id));
                                    if (record.id === h.id) resetForm();
                                    setDeletingId(null);
                                  } catch (error) {
                                    handleFirestoreError(error, OperationType.DELETE, `records/${h.id}`);
                                  }
                                }}
                                className="px-4 py-2 bg-red-500 text-white text-[10px] font-bold rounded-xl hover:bg-red-600 transition-colors"
                              >
                                삭제확인
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeletingId(null);
                                }}
                                className="px-4 py-2 bg-zinc-200 text-zinc-600 text-[10px] font-bold rounded-xl hover:bg-zinc-300 transition-colors"
                              >
                                취소
                              </button>
                            </div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── 5. 보고서 발행 및 A4 인쇄 미리보기 모달 ── */}
      <AnimatePresence>
        {showPrintPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm print-hidden">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 w-[220mm] h-[90vh] overflow-hidden rounded-3xl shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900">
                <div>
                  <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">보고서 인쇄 미리보기 (A4 portrait)</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">실제 프린트물은 결재란과 문서 규격 번호를 포함해 A4 최적화 인쇄됩니다.</p>
                </div>
                <button onClick={() => setShowPrintPreview(false)} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors cursor-pointer text-zinc-500">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 bg-zinc-100 dark:bg-zinc-950 flex flex-col items-center gap-6">
                <PrintReportTemplate record={record} isPreview={true} />
              </div>

              <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex justify-end gap-3">
                <button 
                  onClick={() => setShowPrintPreview(false)}
                  className="px-6 py-3 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-xl font-bold hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all cursor-pointer"
                >
                  취소
                </button>
                <button 
                  onClick={() => {
                    setShowPrintPreview(false);
                    setTimeout(() => {
                      window.print();
                    }, 250);
                  }}
                  className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 size={16} />
                  인쇄하기 (Print)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── 6. 인쇄 시에만 나타나는 프린트 템플릿 컴포넌트 ── */}
      <PrintReportTemplate record={record} />

    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
