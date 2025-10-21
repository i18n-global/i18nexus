import { useTranslation } from "i18nexus";
export default function TestIgnore() {
  const { t } = useTranslation();
  return (
    <div>
      {/* 일반 텍스트 - 래핑되어야 함 */}
      <h1>{t("안녕하세요")}</h1>

      {/* i18n-ignore */}
      <p>이것은 무시됩니다</p>

      <div>
        {/* i18n-ignore 주석 */}
        <span>{"이것도 무시됩니다"}</span>
      </div>

      {/* 다시 래핑되어야 함 */}
      <button>{t("클릭하세요")}</button>

      {/* i18n-ignore - 여러 줄 */}
      <div>
        <p>무시할 텍스트 1</p>
        <p>{t("무시할 텍스트 2")}</p>
      </div>

      {/* 일반 케이스 */}
      <footer>{t("푸터 텍스트")}</footer>
    </div>
  );
}

const MESSAGES = {
  // i18n-ignore
  greeting: "안녕",
  // 래핑되어야 함
  farewell: "안녕히가세요",
};
