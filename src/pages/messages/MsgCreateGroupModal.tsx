import Icon from "@/components/ui/icon";
import { FoundUser } from "./MsgTypes";

interface Props {
  groupName: string;
  groupMembers: FoundUser[];
  groupSearch: string;
  groupSearchResults: FoundUser[];
  onClose: () => void;
  onGroupNameChange: (v: string) => void;
  onGroupSearch: (q: string) => void;
  onAddMember: (u: FoundUser) => void;
  onRemoveMember: (id: number) => void;
  onCreate: () => void;
}

export default function MsgCreateGroupModal({
  groupName, groupMembers, groupSearch, groupSearchResults,
  onClose, onGroupNameChange, onGroupSearch, onAddMember, onRemoveMember, onCreate,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.8)" }}>
      <div className="w-full max-w-md p-6" style={{ background: "#080d1a", border: "1px solid rgba(0,245,255,0.25)" }}>
        <div className="flex items-center justify-between mb-5">
          <div className="font-orbitron text-sm text-white tracking-wider">СОЗДАТЬ ГРУППОВОЙ ЧАТ</div>
          <button onClick={onClose} className="text-[#5a7a95] hover:text-white">
            <Icon name="X" size={16} />
          </button>
        </div>

        <div className="mb-4">
          <label className="font-mono text-xs text-[#5a7a95] tracking-wider block mb-1.5">НАЗВАНИЕ ЧАТА</label>
          <input
            className="w-full bg-transparent border font-plex text-sm text-white px-3 py-2 outline-none focus:border-[#00f5ff] transition-colors"
            style={{ borderColor: "rgba(0,245,255,0.25)" }}
            placeholder="Название группы"
            value={groupName}
            onChange={e => onGroupNameChange(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label className="font-mono text-xs text-[#5a7a95] tracking-wider block mb-1.5">ДОБАВИТЬ УЧАСТНИКОВ</label>
          <input
            className="w-full bg-transparent border font-plex text-sm text-white px-3 py-2 outline-none focus:border-[#00f5ff] transition-colors mb-2"
            style={{ borderColor: "rgba(0,245,255,0.25)" }}
            placeholder="Поиск по позывному..."
            value={groupSearch}
            onChange={e => onGroupSearch(e.target.value)}
          />
          {groupSearchResults.map(u => (
            <div key={u.id}
              className="flex items-center gap-2 mb-1 p-2 cursor-pointer hover:bg-[rgba(0,245,255,0.05)]"
              style={{ border: "1px solid rgba(0,245,255,0.1)" }}
              onClick={() => onAddMember(u)}>
              <Icon name="UserPlus" size={12} className="text-[#5a7a95]" />
              <span className="font-mono text-xs text-white">{u.callsign}</span>
            </div>
          ))}
          {groupMembers.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {groupMembers.map(m => (
                <span key={m.id} className="flex items-center gap-1 font-mono text-xs px-2 py-1"
                  style={{ border: "1px solid rgba(0,245,255,0.3)", color: "#00f5ff", background: "rgba(0,245,255,0.06)" }}>
                  {m.callsign}
                  <button onClick={() => onRemoveMember(m.id)} className="ml-1 opacity-60 hover:opacity-100">
                    <Icon name="X" size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <button onClick={onCreate} disabled={!groupName.trim() || groupMembers.length === 0}
          className="btn-neon w-full flex items-center justify-center gap-2 disabled:opacity-40">
          <Icon name="Users" size={13} />
          СОЗДАТЬ ЧАТ
        </button>
      </div>
    </div>
  );
}
