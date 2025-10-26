import { useTranslation } from "i18nexus";
import React from "react";

interface Item {
  id: number;
  label: string;
}

interface Props {
  items: Item[];
  title: string;
}

const LOCAL_ITEMS = [
  { id: 1, label: "로컬 항목 1" },
  { id: 2, label: "로컬 항목 2" },
];

// Props로 받은 데이터는 래핑되면 안됨
export default function PropsComponent({ items, title }: Props) {
  const { t } = useTranslation();
  return (
    <div>
      <h1>{title}</h1>

      {/* Props 데이터 - 래핑되면 안됨 */}
      <section>
        <h2>{t("Props 데이터")}</h2>
        {items.map((item) => (
          <div key={item.id}>{item.label}</div>
        ))}
      </section>

      {/* 로컬 상수 - 래핑되어야 함 */}
      <section>
        <h2>{t("로컬 상수")}</h2>
        {LOCAL_ITEMS.map((item) => (
          <div key={item.id}>{t(item.label)}</div>
        ))}
      </section>
    </div>
  );
}

// Destructured props
export default function DestructuredPropsComponent({
  items,
}: {
  items: Item[];
}) {
  return (
    <div>
      <h1>Destructured Props</h1>
      {items.map((item) => (
        <div key={item.id}>{item.label}</div>
      ))}
    </div>
  );
}
