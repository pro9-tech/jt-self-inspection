import { createClient } from '@supabase/supabase-js';

// 환경 변수에서 URL과 Key를 가져옵니다. 없을 경우 빈 문자열로 처리하고 공백을 제거합니다.
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/rest\/v1\/?$/, '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

// Supabase 클라이언트 객체를 저장할 변수입니다.
let supabaseClient: any;

// URL과 Key가 정상적으로 존재할 때만 클라이언트를 생성합니다.
if (supabaseUrl && supabaseAnonKey) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    // 생성 중 예외가 발생하면 콘솔에 에러를 기록하고 더미 클라이언트를 사용합니다.
    console.error('Supabase 클라이언트 생성 실패:', error);
    supabaseClient = createMockClient();
  }
} else {
  // 환경 변수가 없을 때 경고를 콘솔에 출력하고 더미 클라이언트를 지정하여 화이트스크린 에러를 방지합니다.
  console.warn('경고: VITE_SUPABASE_URL 또는 VITE_SUPABASE_ANON_KEY 환경 변수가 없습니다. Supabase 기능이 제한될 수 있습니다.');
  supabaseClient = createMockClient();
}

/**
 * 환경 변수가 유효하지 않을 때 Supabase 관련 코드 호출 시 
 * 자바스크립트 오류(TypeError 등)가 나서 전체 화면이 깨지는 것을 막아주는 모크(Mock) 클라이언트입니다.
 */
function createMockClient() {
  const emptyFn = () => Promise.resolve({ data: null, error: null });
  const handler = {
    get(target: any, prop: string): any {
      if (prop === 'auth') {
        return {
          getSession: () => Promise.resolve({ data: { session: null }, error: null }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
          signInWithPassword: emptyFn,
          signOut: emptyFn,
        };
      }
      // 메서드 체이닝을 안전하게 처리하기 위한 프록시 객체 반환
      return new Proxy(emptyFn, handler);
    },
    apply(target: any, thisArg: any, argumentsList: any) {
      return new Proxy({}, handler);
    }
  };
  return new Proxy({}, handler);
}

// 최종적으로 가공된 클라이언트를 내보냅니다.
export const supabase = supabaseClient;
