// 다른 파일에 선언된 상수들

// 케이스 1: 한국어 label
export const EXTERNAL_NAV_ITEMS = [
  { path: "/home", label: "홈" },
  { path: "/products", label: "상품" },
  { path: "/cart", label: "장바구니" },
];

// 케이스 2: 영어 label (변환되면 안됨)
export const ENGLISH_NAV_ITEMS = [
  { path: "/home", label: "Home" },
  { path: "/about", label: "About" },
  { path: "/contact", label: "Contact Us" },
];

// 케이스 3: 혼합 (한국어와 영어)
export const MIXED_MENU = [
  { id: 1, title: "Dashboard", subtitle: "대시보드" },
  { id: 2, title: "Settings", subtitle: "설정" },
];

// 케이스 4: 영어 객체
export const ENGLISH_CONFIG = {
  title: "Application Settings",
  description: "Configure your application",
  placeholder: "Enter value here",
};

// 케이스 5: 한국어 객체
export const KOREAN_CONFIG = {
  title: "앱 설정",
  description: "앱을 설정하세요",
  placeholder: "값을 입력하세요",
};
