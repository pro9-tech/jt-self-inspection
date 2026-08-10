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
  Layers
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
    if (value === null || !standardWeight || underweightTolerance === null || overweightTolerance === null) return 'text-zinc-900 font-bold';
    const diff = value - standardWeight;
    if (diff < -underweightTolerance) return 'text-red-600 font-black'; // Extra bold for failures
    if (diff > overweightTolerance) return 'text-blue-600 font-black'; // Extra bold for failures
    return 'text-zinc-900 font-bold';
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
      <tr className="border-b border-zinc-200 hover:bg-zinc-50 transition-colors group">
        <td className="p-3 text-center w-20 min-w-[80px]">
          <button 
            onClick={toggleExpand}
            className="flex flex-col items-center justify-center w-full group"
          >
            <span className="font-mono text-sm text-zinc-500">{measurement.time}</span>
            <div className={cn(
              "mt-1 p-0.5 rounded-md bg-zinc-100 text-zinc-400 group-hover:bg-zinc-200 group-hover:text-zinc-600 transition-all",
              measurement.isExpanded && "bg-zinc-800 text-white group-hover:bg-zinc-700"
            )}>
              {measurement.isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            </div>
          </button>
        </td>
        
        {mainMode === '충진' && subMode === '충진1' && (
          <>
            {[0, 1, 2].map((i) => (
              <td key={`w-${i}`} className={cn("p-2 w-[100px] min-w-[100px]", i === 0 && "border-l-2 border-zinc-300")}>
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
              <td key={`c-${i}`} className={cn("p-2 w-[100px] min-w-[100px]", i === 0 && "border-l-2 border-zinc-300", i === 2 && "border-r-2 border-zinc-300")}>
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
              <td key={`p-${i}`} className={cn("p-2 w-[100px] min-w-[100px]", i === 0 && "border-l-2 border-zinc-300", i === 2 && "border-r-2 border-zinc-300")}>
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
              <td key={`p-${i}`} className={cn("p-2 w-[100px] min-w-[100px]", i === 0 && "border-l-2 border-zinc-300")}>
                <StatusToggle 
                  value={measurement.printingStatus[i]} 
                  onChange={(val) => handleStatusChange('printingStatus', i, val)} 
                />
              </td>
            ))}
            {[0, 1, 2].map((i) => (
              <td key={`c-${i}`} className={cn("p-2 w-[100px] min-w-[100px]", i === 0 && "border-l-2 border-zinc-300")}>
                <StatusToggle 
                  value={measurement.capStatus[i]} 
                  onChange={(val) => handleStatusChange('capStatus', i, val)} 
                />
              </td>
            ))}
            {[0, 1, 2].map((i) => (
              <td key={`s-${i}`} className={cn("p-2 w-[100px] min-w-[100px]", i === 0 && "border-l-2 border-zinc-300")}>
                <StatusToggle 
                  value={measurement.stickerStatus[i]} 
                  onChange={(val) => handleStatusChange('stickerStatus', i, val)} 
                />
              </td>
            ))}
            {[0, 1, 2].map((i) => (
              <td key={`sc-${i}`} className={cn("p-2 w-[100px] min-w-[100px]", i === 0 && "border-l-2 border-zinc-300")}>
                <StatusToggle 
                  value={measurement.scratchStatus[i]} 
                  onChange={(val) => handleStatusChange('scratchStatus', i, val)} 
                />
              </td>
            ))}
            {[0, 1, 2].map((i) => (
              <td key={`f-${i}`} className={cn("p-2 w-[100px] min-w-[100px]", i === 0 && "border-l-2 border-zinc-300", i === 2 && "border-r-2 border-zinc-300")}>
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

function AppContent() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
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
    <div className="min-h-screen bg-[var(--color-bg-layout)] text-[var(--color-text)] font-sans p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8 print-hidden">
        
        {/* Header Section (상단 헤더 영역) */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[var(--color-border)] pb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
            {/* 로고 영역: 클릭 시 대시보드로 이동, 다크모드에 따라 로고색이 자동 교체됨 */}
            <div className="flex items-center cursor-pointer select-none" onClick={handleGoDashboard} title="대시보드로 이동">
              <img 
                src="/brand/logo/logo-h.svg" 
                alt="Zenitry Logo" 
                className="h-[26px] w-auto object-contain block dark:hidden" 
              />
              <img 
                src="/brand/logo/logo-h-light.svg" 
                alt="Zenitry Logo" 
                className="h-[26px] w-auto object-contain hidden dark:block" 
              />
            </div>
            
            <div className="border-l border-[var(--color-border)] pl-4 hidden md:block h-6"></div>

            <div>
              <h1 className="text-xl font-bold tracking-tight text-[var(--color-text)]">충진품 자주측정 ({record.mainMode})</h1>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 uppercase tracking-widest font-mono">Filling Product Measurement Record</p>
            </div>
            <div className="flex bg-[var(--color-primary-bg)] p-1 rounded-xl">
              {(['충진', '포장'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setRecord(prev => ({ ...prev, mainMode: m }))}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
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
          <div className="flex flex-wrap gap-2">
            {user ? (
              <>
                <div className="flex items-center gap-2 px-3 py-2 bg-white border border-zinc-200 rounded-full text-xs font-medium text-zinc-600">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-5 h-5 rounded-full" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-zinc-200 flex items-center justify-center text-[10px] text-zinc-500 font-bold">
                      {user.displayName?.charAt(0) || 'U'}
                    </div>
                  )}
                  {user.displayName}
                </div>
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-300 rounded-full text-sm hover:bg-zinc-50 transition-all shadow-sm"
                >
                  <LogOut size={16} />
                  로그아웃
                </button>
              </>
            ) : (
              <button 
                onClick={handleLogin}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-white rounded-full text-sm hover:bg-zinc-700 transition-all shadow-md"
              >
                <LogIn size={16} />
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
              className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-300 rounded-full text-sm hover:bg-zinc-50 transition-all shadow-sm"
            >
              <Settings size={16} />
              환경설정
            </button>
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-300 rounded-full text-sm hover:bg-zinc-50 transition-all shadow-sm"
            >
              <History size={16} />
              기록 내역
            </button>
            <button 
              onClick={resetForm}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-300 rounded-full text-sm hover:bg-zinc-50 transition-all shadow-sm"
            >
              <Plus size={16} />
              새 기록
            </button>
            <button 
              onClick={saveRecord}
              disabled={isSaving || !user}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-white rounded-full text-sm hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              저장
            </button>
          </div>
        </div>

        {/* Settings Modal */}
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
                  <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
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
                        className="px-6 py-2 bg-zinc-800 text-white rounded-full text-sm font-bold hover:bg-zinc-700 transition-all"
                      >
                        구글 로그인하기
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Items Settings */}
                      <section className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-bold text-zinc-700 flex items-center gap-2">
                        <Package size={16} /> 품목 및 중량 설정
                      </h3>
                      <button 
                        onClick={() => {
                          const newItems = [...settings.items, { name: '', standardWeight: null, underweightTolerance: null, overweightTolerance: null }];
                          saveSettings({ ...settings, items: newItems });
                        }}
                        className="text-xs font-bold text-zinc-500 hover:text-zinc-800 flex items-center gap-1"
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
                                className="w-full bg-white border-none rounded-lg text-sm focus:ring-2 focus:ring-zinc-200"
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
                              className="p-2 text-zinc-300 hover:text-red-500 transition-colors justify-self-end"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>

                          <AnimatePresence>
                            {deletingItemIdx === idx && (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="absolute inset-0 bg-white/80 backdrop-blur-[1px] rounded-2xl flex items-center justify-center gap-3 p-4 z-10"
                              >
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
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Operator & Verifier Settings */}
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
                          className="text-xs font-bold text-zinc-500 hover:text-zinc-800 flex items-center gap-1"
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
                              className="flex-1 bg-zinc-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-zinc-200 p-3"
                            />
                            <button 
                              onClick={() => {
                                const newVers = settings.verifiers.filter((_, i) => i !== idx);
                                setSettings({ ...settings, verifiers: newVers });
                              }}
                              className="p-2 text-zinc-300 hover:text-red-500 transition-colors"
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
                          className="text-xs font-bold text-zinc-500 hover:text-zinc-800 flex items-center gap-1"
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
                              className="flex-1 bg-zinc-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-zinc-200 p-3"
                            />
                            <button 
                              onClick={() => {
                                const newOps = settings.operators.filter((_, i) => i !== idx);
                                setSettings({ ...settings, operators: newOps });
                              }}
                              className="p-2 text-zinc-300 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>



                  {/* Google Sheets Sync Settings */}
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
                          className="w-full bg-white border border-zinc-200 rounded-lg text-sm focus:ring-2 focus:ring-zinc-200 p-2"
                        />
                      </div>
                      <p className="text-[10px] text-zinc-400">
                        * 구글 앱스스크립트 웹 앱 URL을 입력하세요. 저장 시 데이터가 해당 시트로 자동 전송됩니다.
                      </p>
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                        <p className="text-[10px] text-blue-600 leading-relaxed">
                          <strong>통함 시트 알림:</strong> '충진1'의 '중량' 데이터는 '중량' 시트에, 그 외 모든 데이터는 '그 외' 시트에 한 줄씩 기록됩니다.
                        </p>
                      </div>
                    </div>
                  </section>
                </>
              )}
            </div>

                <div className="p-6 border-t border-zinc-100 bg-zinc-50 flex justify-end gap-3">
                  <button 
                    onClick={() => setShowSettings(false)}
                    className="px-6 py-3 bg-white border border-zinc-300 text-zinc-600 rounded-xl font-bold hover:bg-zinc-50 transition-all"
                  >
                    취소
                  </button>
                  <button 
                    onClick={async () => {
                      await saveSettings(settings);
                      setShowSettings(false);
                    }}
                    disabled={isSavingSettings}
                    className="px-8 py-3 bg-zinc-800 text-white rounded-xl font-bold hover:bg-zinc-700 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSavingSettings ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    설정 저장
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* History Panel */}
        <AnimatePresence>
          {showHistory && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-white border border-zinc-200 rounded-2xl shadow-inner"
            >
              <div className="p-4 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-400 shrink-0">최근 기록</h3>
                  
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-zinc-50 px-3 py-1.5 rounded-xl border border-zinc-100">
                      <Calendar size={14} className="text-zinc-400" />
                      <input 
                        type="date" 
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="bg-transparent border-none text-[11px] font-bold focus:ring-0 p-0 w-24"
                      />
                    </div>

                    <div className="flex items-center gap-2 bg-zinc-50 px-3 py-1.5 rounded-xl border border-zinc-100">
                      <Package size={14} className="text-zinc-400" />
                      <select 
                        value={filterItem}
                        onChange={(e) => setFilterItem(e.target.value)}
                        className="bg-transparent border-none text-[11px] font-bold focus:ring-0 p-0 min-w-[100px]"
                      >
                        <option value="">품목 전체</option>
                        {settings.items.map((item, idx) => (
                          <option key={idx} value={item.name}>{item.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2 bg-zinc-50 px-3 py-1.5 rounded-xl border border-zinc-100">
                      <Hash size={14} className="text-zinc-400" />
                      <input 
                        type="text" 
                        placeholder="로트번호 검색"
                        value={filterLot}
                        onChange={(e) => setFilterLot(e.target.value)}
                        className="bg-transparent border-none text-[11px] font-bold focus:ring-0 p-0 w-24 placeholder:text-zinc-300"
                      />
                    </div>

                    <div className="flex items-center gap-2 bg-zinc-50 px-3 py-1.5 rounded-xl border border-zinc-100">
                      <Layers size={14} className="text-zinc-400" />
                      <select 
                        value={filterMode}
                        onChange={(e) => setFilterMode(e.target.value)}
                        className="bg-transparent border-none text-[11px] font-bold focus:ring-0 p-0 min-w-[80px]"
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
                        className="text-[10px] font-bold text-red-500 hover:text-red-600 underline underline-offset-2"
                      >
                        필터 초기화
                      </button>
                    )}
                  </div>
                </div>

                {!user ? (
                  <p className="text-sm text-zinc-400 italic py-4 text-center">로그인 후 기록을 확인할 수 있습니다.</p>
                ) : filteredHistory.length === 0 ? (
                  <p className="text-sm text-zinc-400 italic py-4 text-center">검색 결과가 없습니다.</p>
                ) : (
                  <div className="max-h-[120px] overflow-y-auto pr-1 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {filteredHistory.map((h) => (
                      <div
                        key={h.id}
                        className="relative"
                      >
                        <button
                          onClick={() => !deletingId && loadRecord(h)}
                          className={cn(
                            "w-full text-left p-3 border border-zinc-100 rounded-xl hover:border-zinc-300 hover:bg-zinc-50 transition-all group relative",
                            deletingId === h.id && "border-red-200 bg-red-50/30"
                          )}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-zinc-700 group-hover:text-zinc-900">{h.itemName || '품목명 없음'}</span>
                              <div className="flex gap-1 mt-0.5">
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
                            <div className="flex flex-col items-end shrink-0 pt-1">
                              <span className="text-[9px] font-bold text-zinc-500">
                                {h.mainMode === '포장' ? '포장일' : '충진일'} : {h.fillingDate || '-'}
                              </span>
                              <span className="text-[10px] font-mono text-zinc-400 mt-0.5">{format(h.createdAt, 'yyyy/MM/dd HH:mm')}</span>
                            </div>
                          </div>
                          <div className="text-xs text-zinc-500 mt-1">Lot: {h.lotNumber || '-'}</div>
                          
                          {deletingId !== h.id && (
                            <div 
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingId(h.id);
                              }}
                              className="absolute top-2 right-2 p-1 text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 size={14} />
                            </div>
                          )}
                        </button>

                        <AnimatePresence>
                          {deletingId === h.id && (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className="absolute inset-0 bg-white/90 backdrop-blur-[1px] rounded-xl flex items-center justify-center gap-2 p-2 z-10"
                            >
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
                                className="flex-1 py-2 bg-red-500 text-white text-[10px] font-bold rounded-lg hover:bg-red-600 transition-colors"
                              >
                                삭제확인
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeletingId(null);
                                }}
                                className="flex-1 py-2 bg-zinc-200 text-zinc-600 text-[10px] font-bold rounded-lg hover:bg-zinc-300 transition-colors"
                              >
                                취소
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Metadata Form */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-400">기본 정보 설정</h2>
                {record.mainMode === '충진' && (
                  <div className="flex bg-zinc-100 p-0.5 rounded-lg border border-zinc-200">
                    {(['충진1', '충진2'] as const).map((sm) => (
                      <button
                        key={sm}
                        onClick={() => setRecord(prev => ({ ...prev, subMode: sm }))}
                        className={cn(
                          "px-3 py-1 rounded-md text-[10px] font-bold transition-all",
                          record.subMode === sm 
                            ? "bg-white text-zinc-800 shadow-sm" 
                            : "text-zinc-400 hover:text-zinc-600"
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
                    className="w-full bg-zinc-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-zinc-200"
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
                    className="w-full bg-zinc-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-zinc-200"
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
                    className="w-full bg-zinc-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-zinc-200"
                  />
                </div>

                {!(record.mainMode === '충진' && record.subMode === '충진1') && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                        <User size={12} /> 측정자
                      </label>
                      <select
                        value={record.verifier}
                        onChange={(e) => setRecord({ ...record, verifier: e.target.value })}
                        className="w-full bg-zinc-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-zinc-200"
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
                        className="w-full bg-zinc-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-zinc-200"
                      >
                        <option value="">선택...</option>
                        {(settings.operators || []).map((op, i) => (
                          <option key={i} value={op}>{op}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {record.mainMode === '충진' && record.subMode === '충진1' && (
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

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                          <User size={12} /> 측정자
                        </label>
                        <select
                          value={record.verifier}
                          onChange={(e) => setRecord({ ...record, verifier: e.target.value })}
                          className="w-full bg-zinc-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-zinc-200"
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
                          className="w-full bg-zinc-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-zinc-200"
                        >
                          <option value="">선택...</option>
                          {(settings.operators || []).map((op, i) => (
                            <option key={i} value={op}>{op}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}


              </div>
            </div>

            <div className="bg-zinc-800 text-white p-6 rounded-3xl shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="text-zinc-400" size={20} />
                <h3 className="text-sm font-bold">계측 가이드</h3>
              </div>
              <ul className="text-xs space-y-2 text-zinc-400">
                <li className="flex items-start gap-2">
                  <span className="text-zinc-500">•</span>
                  <span>매 시간 무작위로 3개의 바이알을 채취하여 측정합니다.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-zinc-500">•</span>
                  <span>평균값이 허용오차를 벗어날 경우 반드시 일탈 사유를 기록하십시오.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-zinc-500">•</span>
                  <span className="text-red-400 font-bold">빨간색</span>: 허용오차 미달 (부족)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-zinc-500">•</span>
                  <span className="text-blue-400 font-bold">파란색</span>: 허용오차 초과 (과다)
                </li>
              </ul>
            </div>
          </div>

          {/* Measurement Table */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden overflow-x-auto">
              <table className={cn(
                "w-full border-collapse",
                record.mainMode === '포장' ? "min-w-[1580px]" : "min-w-[680px]"
              )}>
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200">
                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 w-20 min-w-[80px]">시간</th>
                    
                    {record.mainMode === '충진' && record.subMode === '충진1' && (
                      <>
                        <th colSpan={3} className="p-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 border-l-2 border-zinc-300 w-[300px]">중량</th>
                        <th colSpan={3} className="p-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 border-l-2 border-r-2 border-zinc-300 w-[300px]">캡</th>
                      </>
                    )}

                    {record.mainMode === '충진' && record.subMode === '충진2' && (
                      <>
                        <th colSpan={3} className="p-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 border-l-2 border-zinc-300 w-[300px]">스티커</th>
                        <th colSpan={3} className="p-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 border-l-2 border-r-2 border-zinc-300 w-[300px]">날인</th>
                      </>
                    )}

                    {record.mainMode === '포장' && (
                      <>
                        <th colSpan={3} className="p-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 border-l-2 border-zinc-300 w-[300px]">날인</th>
                        <th colSpan={3} className="p-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 border-l-2 border-zinc-300 w-[300px]">캡</th>
                        <th colSpan={3} className="p-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 border-l-2 border-zinc-300 w-[300px]">스티커</th>
                        <th colSpan={3} className="p-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 border-l-2 border-zinc-300 w-[300px]">스크래치</th>
                        <th colSpan={3} className="p-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 border-l-2 border-r-2 border-zinc-300 w-[300px]">이물</th>
                      </>
                    )}
                  </tr>
                  {/* Sub-headers for vials */}
                  <tr className="bg-zinc-50/50 border-b border-zinc-100 text-[9px] text-zinc-400">
                    <th className="p-2 w-20 min-w-[80px]">Time</th>
                    
                    {record.mainMode === '충진' && record.subMode === '충진1' && (
                      <>
                        <th className="p-2 border-l-2 border-zinc-300 w-[100px] min-w-[100px]">V1</th>
                        <th className="p-2 w-[100px] min-w-[100px]">V2</th>
                        <th className="p-2 w-[100px] min-w-[100px]">V3</th>
                        <th className="p-2 border-l-2 border-zinc-300 w-[100px] min-w-[100px]">V1</th>
                        <th className="p-2 w-[100px] min-w-[100px]">V2</th>
                        <th className="p-2 border-r-2 border-zinc-300 w-[100px] min-w-[100px]">V3</th>
                      </>
                    )}

                    {record.mainMode === '충진' && record.subMode === '충진2' && (
                      <>
                        <th className="p-2 border-l-2 border-zinc-300 w-[100px] min-w-[100px]">V1</th>
                        <th className="p-2 w-[100px] min-w-[100px]">V2</th>
                        <th className="p-2 w-[100px] min-w-[100px]">V3</th>
                        <th className="p-2 border-l-2 border-zinc-300 w-[100px] min-w-[100px]">V1</th>
                        <th className="p-2 w-[100px] min-w-[100px]">V2</th>
                        <th className="p-2 border-r-2 border-zinc-300 w-[100px] min-w-[100px]">V3</th>
                      </>
                    )}

                    {record.mainMode === '포장' && (
                      <>
                        <th className="p-2 border-l-2 border-zinc-300 w-[100px] min-w-[100px]">V1</th>
                        <th className="p-2 w-[100px] min-w-[100px]">V2</th>
                        <th className="p-2 w-[100px] min-w-[100px]">V3</th>
                        <th className="p-2 border-l-2 border-zinc-300 w-[100px] min-w-[100px]">V1</th>
                        <th className="p-2 w-[100px] min-w-[100px]">V2</th>
                        <th className="p-2 w-[100px] min-w-[100px]">V3</th>
                        <th className="p-2 border-l-2 border-zinc-300 w-[100px] min-w-[100px]">V1</th>
                        <th className="p-2 w-[100px] min-w-[100px]">V2</th>
                        <th className="p-2 w-[100px] min-w-[100px]">V3</th>
                        <th className="p-2 border-l-2 border-zinc-300 w-[100px] min-w-[100px]">V1</th>
                        <th className="p-2 w-[100px] min-w-[100px]">V2</th>
                        <th className="p-2 w-[100px] min-w-[100px]">V3</th>
                        <th className="p-2 border-l-2 border-zinc-300 w-[100px] min-w-[100px]">V1</th>
                        <th className="p-2 w-[100px] min-w-[100px]">V2</th>
                        <th className="p-2 border-r-2 border-zinc-300 w-[100px] min-w-[100px] text-transparent select-none">...</th>
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
              <div className="p-4 bg-zinc-50 flex flex-wrap justify-center gap-x-8 gap-y-4 border-t border-zinc-200">
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
                    className="text-xs font-bold text-zinc-500 hover:text-zinc-800 flex items-center gap-1 transition-colors"
                  >
                    <Plus size={14} /> 윗 시간대 추가
                  </button>
                  
                  <div className="relative">
                    {!isDeletingTopRow ? (
                      <button 
                        onClick={() => setIsDeletingTopRow(true)}
                        className="text-[var(--fs-sm)] font-bold text-[var(--color-error)] hover:text-[var(--color-error-hover)] flex items-center gap-1 transition-colors"
                      >
                        <Trash2 size={14} /> 윗 시간대 삭제
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 bg-[var(--color-bg-container)] border border-[var(--color-error-border)] rounded-lg p-1 shadow-sm">
                        <button 
                          onClick={() => {
                            if (record.measurements.length > 1) {
                              setRecord({
                                ...record,
                                measurements: record.measurements.slice(1)
                              });
                            }
                            setIsDeletingTopRow(false);
                          }}
                          className="px-2 py-1 bg-[var(--color-error)] text-white text-[var(--fs-sm)] font-bold rounded hover:bg-[var(--color-error-hover)] transition-colors"
                        >
                          삭제확인
                        </button>
                        <button 
                          onClick={() => setIsDeletingTopRow(false)}
                          className="px-2 py-1 bg-[var(--color-primary-bg)] text-[var(--color-text)] text-[var(--fs-sm)] font-bold rounded hover:bg-[var(--color-border)] transition-colors"
                        >
                          취소
                        </button>
                      </div>
                    )}
                  </div>
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
                    className="text-xs font-bold text-zinc-500 hover:text-zinc-800 flex items-center gap-1 transition-colors"
                  >
                    <Plus size={14} /> 아랫 시간대 추가
                  </button>
                  
                  <div className="relative">
                    {!isDeletingBottomRow ? (
                      <button 
                        onClick={() => setIsDeletingBottomRow(true)}
                        className="text-[var(--fs-sm)] font-bold text-[var(--color-error)] hover:text-[var(--color-error-hover)] flex items-center gap-1 transition-colors"
                      >
                        <Trash2 size={14} /> 아랫 시간대 삭제
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 bg-[var(--color-bg-container)] border border-[var(--color-error-border)] rounded-lg p-1 shadow-sm">
                        <button 
                          onClick={() => {
                            if (record.measurements.length > 1) {
                              setRecord({
                                ...record,
                                measurements: record.measurements.slice(0, -1)
                              });
                            }
                            setIsDeletingBottomRow(false);
                          }}
                          className="px-2 py-1 bg-[var(--color-error)] text-white text-[var(--fs-sm)] font-bold rounded hover:bg-[var(--color-error-hover)] transition-colors"
                        >
                          삭제확인
                        </button>
                        <button 
                          onClick={() => setIsDeletingBottomRow(false)}
                          className="px-2 py-1 bg-[var(--color-primary-bg)] text-[var(--color-text)] text-[var(--fs-sm)] font-bold rounded hover:bg-[var(--color-border)] transition-colors"
                        >
                          취소
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
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
