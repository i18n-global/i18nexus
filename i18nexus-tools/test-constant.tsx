import React from "react";

// 테스트 케이스 1: 렌더링될 가능성이 높은 객체 배열
const NAV_ITEMS = [
  { path: "/home", label: "홈" },
  { path: "/about", label: "소개" },
  { path: "/contact", label: "연락처" },
];

// 테스트 케이스 2: 다양한 렌더링 가능 속성
const BUTTON_CONFIG = {
  title: "저장하기",
  description: "변경사항을 저장합니다",
  placeholder: "내용을 입력하세요",
  tooltip: "클릭하여 저장",
};

// 테스트 케이스 3: 문자열 배열 (렌더링 가능하지만 1depth 초과)
const MENU_ITEMS = ["메뉴1", "메뉴2", "메뉴3"];

// 테스트 케이스 4: 렌더링되지 않을 속성 (처리되면 안됨)
const API_CONFIG = {
  url: "https://api.example.com",
  apiKey: "한글키",
  timeout: 5000,
};

// 테스트 케이스 5: 혼합된 객체
const FORM_FIELDS = [
  {
    id: "name",
    label: "이름",
    placeholder: "이름을 입력하세요",
    type: "text",
  },
  {
    id: "email",
    label: "이메일",
    placeholder: "이메일을 입력하세요",
    type: "email",
  },
];

export default function TestComponent() {
  return (
    <div>
      <h1>테스트 컴포넌트</h1>

      {/* 케이스 1: 상수에서 label 속성 접근 */}
      {NAV_ITEMS.map((item, index) => (
        <button key={item.path}>{item.label}</button>
      ))}

      {/* 케이스 2: 객체 속성들 접근 */}
      <div>
        <h2>{BUTTON_CONFIG.title}</h2>
        <p>{BUTTON_CONFIG.description}</p>
      </div>

      {/* 케이스 3: 폼 필드 */}
      {FORM_FIELDS.map((field) => (
        <input
          key={field.id}
          type={field.type}
          placeholder={field.placeholder}
          aria-label={field.label}
        />
      ))}
    </div>
  );
}
