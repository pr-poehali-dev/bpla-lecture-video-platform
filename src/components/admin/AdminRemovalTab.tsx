import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { api, RemovalRequest } from "@/api";

const STATUS_COLOR: Record<string, string> = {
  pending: "#ff6b00",
  approved: "#00ff88",
  rejected: "#ff2244",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "ОЖИДАЕТ",
  approved: "ОДОБРЕНО",
  rejected: "ОТКЛОНЕНО",
};

const FILE_TYPE_COLOR: Record<string, string> = {
  video: "#00f5ff",
  document: "#a78bfa",
  youtube: "#ff2244",
};

const FILE_TYPE_LABEL: Record<string, string> = {
  video: "ВИДЕО",
  document: "ДОКУМЕНТ",
  youtube: "YOUTUBE",
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function getFileTypeKey(req: RemovalRequest): string {
  if (req.mime_type === "youtube") return "youtube";
  if (req.file_type === "video") return "video";
  return "document";
}

interface Props {
  onPendingCount?: (n: number) => void;
}

export default function AdminRemovalTab({ onPendingCount }: Props) {
  const [requests, setRequests] = useState<RemovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const loadRequests = () => {
    setLoading(true);
    api.removal
      .list()
      .then((res) => {
        const list = res.requests || [];
        setRequests(list);
        const pendingCount = list.filter((r) => r.status === "pending").length;
        onPendingCount?.(pendingCount);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showMsg = (text: string, ok = true) => {
    setActionMsg({ text, ok });
    setTimeout(() => setActionMsg(null), 4000);
  };

  const handleReview = async (id: number, action: "approve" | "reject") => {
    setProcessingId(id);
    try {
      const res = await api.removal.review(id, action);
      if (res.ok) {
        showMsg(
          action === "approve"
            ? "Заявка одобрена — файл будет удалён"
            : "Заявка отклонена",
          true
        );
        loadRequests();
      } else {
        showMsg(res.error || "Ошибка при обработке заявки", false);
      }
    } catch {
      showMsg("Ошибка соединения", false);
    } finally {
      setProcessingId(null);
    }
  };

  const pending = requests.filter((r) => r.status === "pending");
  const reviewed = requests.filter((r) => r.status !== "pending");

  const pendingCount = pending.length;
  const approvedCount = requests.filter((r) => r.status === "approved").length;
  const rejectedCount = requests.filter((r) => r.status === "rejected").length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Ожидают", value: pendingCount, color: "#ff6b00" },
          { label: "Одобрено", value: approvedCount, color: "#00ff88" },
          { label: "Отклонено", value: rejectedCount, color: "#ff2244" },
        ].map((s) => (
          <div
            key={s.label}
            className="p-4 text-center"
            style={{ border: "1px solid #1a2a3a", background: "#0a1520" }}
          >
            <div
              className="font-orbitron text-3xl font-black mb-1"
              style={{ color: s.color }}
            >
              {s.value}
            </div>
            <div className="font-mono text-xs text-[#3a5570] tracking-wider">
              {s.label.toUpperCase()}
            </div>
          </div>
        ))}
      </div>

      {/* Action message */}
      {actionMsg && (
        <div
          className="p-3 font-mono text-xs"
          style={{
            border: `1px solid ${actionMsg.ok ? "rgba(0,255,136,0.3)" : "rgba(255,34,68,0.3)"}`,
            color: actionMsg.ok ? "#00ff88" : "#ff2244",
            background: actionMsg.ok
              ? "rgba(0,255,136,0.05)"
              : "rgba(255,34,68,0.05)",
          }}
        >
          {actionMsg.ok ? "✓" : "✗"} {actionMsg.text}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="text-center py-16 font-mono text-sm text-[#3a5570] tracking-widest">
          ЗАГРУЗКА...
        </div>
      ) : requests.length === 0 ? (
        <div
          className="text-center py-16 font-mono text-sm text-[#3a5570] tracking-widest"
          style={{ border: "1px solid #1a2a3a" }}
        >
          Заявок на удаление нет
        </div>
      ) : (
        <div className="space-y-8">
          {/* Pending section */}
          {pending.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-3 mb-3">
                <h3 className="font-orbitron text-xs tracking-widest text-[#ff6b00]">
                  ОЖИДАЮТ РЕШЕНИЯ
                </h3>
                <span
                  className="font-mono text-[10px] px-2 py-0.5 rounded-full"
                  style={{ background: "#ff6b00", color: "#050810" }}
                >
                  {pendingCount}
                </span>
                <div
                  className="flex-1 h-px"
                  style={{ background: "rgba(255,107,0,0.2)" }}
                />
              </div>

              {pending.map((req, i) => (
                <RequestRow
                  key={req.id}
                  req={req}
                  index={i}
                  processingId={processingId}
                  onReview={handleReview}
                />
              ))}
            </div>
          )}

          {/* Reviewed section */}
          {reviewed.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-3 mb-3">
                <h3 className="font-orbitron text-xs tracking-widest text-[#3a5570]">
                  РАССМОТРЕННЫЕ
                </h3>
                <div
                  className="flex-1 h-px"
                  style={{ background: "rgba(58,85,112,0.3)" }}
                />
              </div>

              {reviewed.map((req, i) => (
                <RequestRow
                  key={req.id}
                  req={req}
                  index={i}
                  processingId={processingId}
                  onReview={handleReview}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface RowProps {
  req: RemovalRequest;
  index: number;
  processingId: number | null;
  onReview: (id: number, action: "approve" | "reject") => void;
}

function RequestRow({ req, index, processingId, onReview }: RowProps) {
  const typeKey = getFileTypeKey(req);
  const typeColor = FILE_TYPE_COLOR[typeKey] || "#5a7a95";
  const typeLabel = FILE_TYPE_LABEL[typeKey] || req.file_type.toUpperCase();
  const statusColor = STATUS_COLOR[req.status] || "#5a7a95";
  const statusLabel = STATUS_LABEL[req.status] || req.status.toUpperCase();
  const isPending = req.status === "pending";
  const isProcessing = processingId === req.id;

  return (
    <div
      className="p-4 flex flex-col gap-3 animate-fade-in"
      style={{
        border: `1px solid ${isPending ? "rgba(255,107,0,0.25)" : "#1a2a3a"}`,
        background: isPending ? "rgba(255,107,0,0.03)" : "#0a1520",
        animationDelay: `${index * 0.04}s`,
      }}
    >
      {/* Top row: title + badges */}
      <div className="flex flex-wrap items-center gap-2">
        <Icon name="FileX" size={14} className="flex-shrink-0 text-[#3a5570]" />

        <span className="font-mono text-sm text-white flex-1 min-w-0 truncate">
          {req.file_title}
        </span>

        {/* File type badge */}
        <span
          className="font-mono text-[10px] px-2 py-0.5 flex-shrink-0"
          style={{
            border: `1px solid ${typeColor}44`,
            color: typeColor,
            background: `${typeColor}0d`,
          }}
        >
          {typeLabel}
        </span>

        {/* Status badge */}
        <span
          className="font-mono text-[10px] font-bold px-2 py-0.5 flex-shrink-0"
          style={{
            border: `1px solid ${statusColor}44`,
            color: statusColor,
            background: `${statusColor}0d`,
          }}
        >
          {statusLabel}
        </span>
      </div>

      {/* Middle row: requester + reason + date */}
      <div className="flex flex-wrap gap-x-6 gap-y-1 pl-5">
        {/* Requester */}
        <div className="flex items-center gap-1.5">
          <Icon name="User" size={11} className="text-[#3a5570]" />
          <span className="font-mono text-xs text-[#5a7a95]">
            {req.requester}
          </span>
          {req.callsign && (
            <span className="font-mono text-xs text-[#3a5570]">
              [{req.callsign}]
            </span>
          )}
        </div>

        {/* Date */}
        <div className="flex items-center gap-1.5">
          <Icon name="Calendar" size={11} className="text-[#3a5570]" />
          <span className="font-mono text-xs text-[#3a5570]">
            {formatDate(req.created_at)}
          </span>
        </div>

        {/* Reviewer (if reviewed) */}
        {req.reviewer && (
          <div className="flex items-center gap-1.5">
            <Icon name="ShieldCheck" size={11} className="text-[#3a5570]" />
            <span className="font-mono text-xs text-[#3a5570]">
              {req.reviewer}
            </span>
          </div>
        )}
      </div>

      {/* Reason */}
      {req.reason && (
        <div
          className="ml-5 px-3 py-2 font-mono text-xs text-[#5a7a95] leading-relaxed"
          style={{ border: "1px solid #1a2a3a", background: "rgba(0,0,0,0.2)" }}
        >
          <span className="text-[#2a4060] mr-2">ПРИЧИНА:</span>
          {req.reason}
        </div>
      )}

      {/* Actions for pending */}
      {isPending && (
        <div className="flex gap-2 ml-5">
          <button
            onClick={() => onReview(req.id, "approve")}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-4 py-1.5 font-mono text-xs tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              border: "1px solid rgba(0,255,136,0.4)",
              color: "#00ff88",
              background: "rgba(0,255,136,0.05)",
            }}
          >
            <Icon name="Check" size={11} />
            {isProcessing ? "..." : "ОДОБРИТЬ"}
          </button>

          <button
            onClick={() => onReview(req.id, "reject")}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-4 py-1.5 font-mono text-xs tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              border: "1px solid rgba(255,34,68,0.4)",
              color: "#ff2244",
              background: "rgba(255,34,68,0.05)",
            }}
          >
            <Icon name="X" size={11} />
            {isProcessing ? "..." : "ОТКЛОНИТЬ"}
          </button>
        </div>
      )}
    </div>
  );
}
