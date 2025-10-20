// 외부 파일의 상수들

// 케이스 1: 소문자 + 한국어 (처리되어야 함)
export const users = [
  { id: 1, name: "외부 사용자1" },
  { id: 2, name: "외부 사용자2" },
];

// 케이스 2: 소문자 + 영어 (처리되면 안됨)
export const products = [
  { id: 1, title: "Product 1" },
  { id: 2, title: "Product 2" },
];

// 케이스 3: ALL_CAPS + 한국어 (처리되어야 함)
export const MENU_ITEMS = [
  { path: "/dashboard", label: "대시보드" },
  { path: "/settings", label: "설정" },
];
