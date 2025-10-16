import React from "react";

// 테스트: 렌더링 가능/불가능 속성 혼합
const USER_CONFIG = {
  apiKey: "한글API키", // ❌ 처리되면 안됨
  apiUrl: "https://api.com", // ❌ 처리되면 안됨
  title: "사용자 설정", // ✅ 처리되어야 함
  description: "설정 페이지", // ✅ 처리되어야 함
  timeout: 5000, // ❌ 처리되면 안됨
  placeholder: "입력하세요", // ✅ 처리되어야 함
};

const API_SETTINGS = {
  baseUrl: "한글URL", // ❌ 처리되면 안됨
  message: "에러 메시지", // ✅ 처리되어야 함
};

export default function TestPropertyFilter() {
  return (
    <div>
      {/* 렌더링 속성 - t()로 래핑되어야 함 */}
      <h1>{USER_CONFIG.title}</h1>
      <p>{USER_CONFIG.description}</p>
      <input placeholder={USER_CONFIG.placeholder} />

      {/* 비렌더링 속성 - t()로 래핑되면 안됨 */}
      <div data-api-key={USER_CONFIG.apiKey}></div>
      <div data-url={USER_CONFIG.apiUrl}></div>

      {/* 메시지는 렌더링 가능 */}
      <p>{API_SETTINGS.message}</p>
    </div>
  );
}
