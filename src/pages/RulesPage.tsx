import { useState, useEffect } from "react";
import { api } from "@/api";
import Icon from "@/components/ui/icon";

interface RuleItem { num: string; title: string; text: string; }

const DEFAULT_RULES: RuleItem[] = [
  { num: "01", title: "Конфиденциальность", text: "Все материалы платформы являются закрытыми. Запрещено передавать, копировать или публиковать учебные материалы, видео, схемы и любые другие данные платформы третьим лицам. Нарушение влечёт немедленную блокировку и юридическую ответственность." },
  { num: "02", title: "Режим информационной безопасности", text: "Запрещено обсуждать в открытых каналах: координаты позиций, данные о личном составе, технические характеристики оборудования, планы операций и любую иную информацию, которая может нанести ущерб оперативной деятельности." },
  { num: "03", title: "Достоверность данных", text: "При регистрации необходимо указывать реальные данные: ФИО, позывной, звание, подразделение. Использование чужих данных, ложной информации или вымышленных личностей является основанием для немедленной блокировки без объяснений." },
  { num: "04", title: "Дисциплина и воинская этика", text: "В обсуждениях и чате соблюдать воинскую этику и субординацию. Запрещены оскорбления, провокации, распространение дезинформации, флуд и любые высказывания, дискредитирующие Вооружённые Силы." },
  { num: "05", title: "Защита учётных данных", text: "Запрещено передавать свои учётные данные другим лицам. Каждый участник несёт личную ответственность за все действия, совершённые под его аккаунтом. При подозрении на компрометацию — немедленно сообщить администратору." },
  { num: "06", title: "Использование материалов", text: "Материалы платформы предназначены исключительно для учебных и оперативных целей личного состава. Использование в личных, коммерческих или иных целях, не связанных с выполнением служебных задач, строго запрещено." },
  { num: "07", title: "Правила загрузки контента", text: "Инструкторы, размещающие материалы, несут ответственность за их достоверность и соответствие требованиям безопасности. Запрещено публиковать материалы, полученные из непроверенных источников или нарушающие режим секретности." },
  { num: "08", title: "Порядок подачи заявки", text: "При регистрации необходимо указать реальное звание, ФИО и контактные данные. Заявки рассматриваются администратором вручную. Срок рассмотрения — до 48 часов. Ложные сведения при подаче заявки являются основанием для отказа и блокировки." },
  { num: "09", title: "Ответственность", text: "Каждый участник несёт личную ответственность за свои действия на платформе. Нарушение любого из правил влечёт немедленную блокировку без предупреждения. Администрация оставляет за собой право принимать решения о блокировке без объяснения причин." },
];

const DEFAULT_INTRO = "Платформа «Беспилотные Системы» является закрытым учебным ресурсом для личного состава. Доступ предоставляется только уполномоченным лицам после ручной проверки администратором. Регистрируясь на платформе, вы принимаете следующие обязательства:";
const DEFAULT_FOOTER = "Администрация платформы оставляет за собой право изменять правила без предварительного уведомления. Продолжение использования платформы означает согласие с актуальной версией правил.";
const RULES_UPDATED = "15 мая 2026";

export default function RulesPage() {
  const [rules, setRules] = useState<RuleItem[]>(DEFAULT_RULES);
  const [intro, setIntro] = useState(DEFAULT_INTRO);
  const [footer, setFooter] = useState(DEFAULT_FOOTER);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.admin.getPage("rules").then(res => {
      const rulesBlock = res.blocks?.find((b: { type: string }) => b.type === "rules");
      if (rulesBlock?.data?.length) setRules(rulesBlock.data);
      const headerBlock = res.blocks?.find((b: { type: string }) => b.type === "rules-header");
      if (headerBlock?.data?.intro) setIntro(headerBlock.data.intro);
      if (headerBlock?.data?.footer) setFooter(headerBlock.data.footer);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-8 h-px bg-[#00f5ff]" />
          <span className="font-mono text-xs text-[#00f5ff] tracking-[0.3em]">// ДОКУМЕНТ</span>
        </div>
        <h1 className="font-orbitron text-2xl sm:text-3xl font-black text-white tracking-wider mb-2">
          ПРАВИЛА ПЛАТФОРМЫ
        </h1>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] text-[#3a5570]">Версия от {RULES_UPDATED}</span>
          <span className="font-mono text-[10px] px-2 py-0.5"
            style={{ background: "rgba(0,245,255,0.06)", border: "1px solid rgba(0,245,255,0.15)", color: "#00f5ff" }}>
            АКТУАЛЬНО
          </span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 font-mono text-xs text-[#3a5570] animate-pulse">ЗАГРУЗКА...</div>
      ) : (
        <div className="space-y-6">
          {/* Вводный текст */}
          <div className="p-5" style={{ background: "rgba(0,245,255,0.02)", border: "1px solid rgba(0,245,255,0.1)" }}>
            <p className="font-plex text-sm text-[#7a9bb5] leading-relaxed">{intro}</p>
          </div>

          {/* Правила */}
          <div className="space-y-3">
            {rules.map((rule, i) => (
              <div key={rule.num}
                className="flex gap-4 p-5 transition-all animate-fade-in"
                style={{ animationDelay: `${i * 0.05}s`, background: "rgba(13,27,46,0.5)", border: "1px solid rgba(0,245,255,0.08)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,245,255,0.2)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,245,255,0.08)"; }}>
                <div className="font-orbitron text-sm font-black flex-shrink-0 mt-0.5 w-8 text-right"
                  style={{ color: "#00f5ff", opacity: 0.35 }}>
                  {rule.num}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-orbitron text-sm font-bold text-white mb-2 tracking-wider">{rule.title}</div>
                  <p className="font-plex text-sm text-[#5a7a95] leading-relaxed">{rule.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Подвал */}
          <div className="p-4" style={{ border: "1px solid rgba(0,245,255,0.06)", background: "rgba(0,0,0,0.2)" }}>
            <div className="flex items-start gap-2">
              <Icon name="Info" size={13} className="text-[#3a5570] flex-shrink-0 mt-0.5" />
              <p className="font-mono text-[11px] text-[#3a5570] leading-relaxed">{footer}</p>
            </div>
          </div>

          {/* Дата обновления */}
          <div className="text-center pt-2">
            <span className="font-mono text-[10px] text-[#2a4060]">
              Последнее обновление: {RULES_UPDATED} · Беспилотные Системы
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
