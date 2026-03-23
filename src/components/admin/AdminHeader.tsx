import Icon from "@/components/ui/icon";

interface Props {
  currentUser: { name: string; email: string; callsign?: string };
  onLogout: () => void;
  onGoToSite: () => void;
}

export default function AdminHeader({ currentUser, onLogout, onGoToSite }: Props) {
  return (
    <header className="flex items-center justify-between h-12 px-4 flex-shrink-0" style={{ background: "#1e2a3a", borderBottom: "1px solid #2a3a4a" }}>
      <button
        onClick={onGoToSite}
        className="flex items-center gap-2 font-medium text-sm text-white hover:text-[#00f5ff] transition-colors"
      >
        <Icon name="Globe" size={16} />
        На сайт
      </button>

      <div className="flex items-center gap-1">
        {[
          { icon: "RefreshCw", title: "Обновить" },
          { icon: "Users", title: "Пользователи" },
          { icon: "Code", title: "Код" },
          { icon: "Upload", title: "Загрузить" },
          { icon: "GitBranch", title: "Версии" },
          { icon: "FileText", title: "Файлы" },
        ].map((btn) => (
          <button
            key={btn.icon}
            title={btn.title}
            className="w-8 h-8 flex items-center justify-center text-[#8aacbf] hover:text-white hover:bg-[#2a3a4a] transition-all rounded-sm"
          >
            <Icon name={btn.icon} size={15} />
          </button>
        ))}

        <button
          className="flex items-center gap-2 px-3 h-8 ml-2 text-sm font-medium text-white transition-all rounded-sm"
          style={{ background: "#cc2244" }}
          onClick={onLogout}
        >
          Выход ({currentUser.callsign || currentUser.name})
        </button>

        <button className="w-8 h-8 flex items-center justify-center text-[#8aacbf] hover:text-white transition-all rounded-sm ml-1">
          <Icon name="Menu" size={15} />
        </button>
      </div>
    </header>
  );
}
