import { useState } from "react";
import Icon from "@/components/ui/icon";

const topics = [
  {
    id: 1,
    title: "Лучший FPV стек для боевых задач в 2026?",
    author: "Operator_17",
    category: "Техника",
    replies: 47,
    views: 1240,
    hot: true,
    time: "2 часа назад",
    lastMsg: "Смотрите в сторону DJI O3 — проверен в деле.",
  },
  {
    id: 2,
    title: "Опыт применения роя из 6 FPV в ночных условиях",
    author: "TacUnit_88",
    category: "Тактика",
    replies: 32,
    views: 890,
    hot: true,
    time: "5 часов назад",
    lastMsg: "Координация ключевая, без этого хаос.",
  },
  {
    id: 3,
    title: "Как настроить PID для стабильного полёта в ветер?",
    author: "PilotFox",
    category: "Настройка",
    replies: 18,
    views: 654,
    hot: false,
    time: "1 день назад",
    lastMsg: "D_term слишком высокий — вот проблема.",
  },
  {
    id: 4,
    title: "Разбор: почему потерял дрон на подлёте к цели",
    author: "Alpha_Control",
    category: "Разбор",
    replies: 61,
    views: 2100,
    hot: true,
    time: "2 дня назад",
    lastMsg: "РЭБ на 433 МГц — 100% глушило.",
  },
  {
    id: 5,
    title: "Опыт доработки VTX для большей дальности",
    author: "RF_Engineer",
    category: "Техника",
    replies: 24,
    views: 760,
    hot: false,
    time: "3 дня назад",
    lastMsg: "Бустер 1W даёт +2км стабильно.",
  },
];

const comments = [
  { id: 1, author: "OP_Vulture", time: "10:32", text: "Использую 5.8 GHz только на коротких дистанциях до 2 км. Дальше только 2.4 или 900 МГц. Тестировал в реальных условиях — подтверждено." },
  { id: 2, author: "Tactics_Alpha", time: "11:15", text: "Согласен. При активном РЭБ переходим на ELRS 868 МГц — проникающая способность намного лучше." },
  { id: 3, author: "TechSpec_33", time: "12:04", text: "Ребята, посмотрите видео #5 на платформе — там конкретно разобрали кейс потери связи и как от него защититься." },
];

export default function DiscussionsPage() {
  const [selectedTopic, setSelectedTopic] = useState<number | null>(1);
  const [newComment, setNewComment] = useState("");
  const [commentsList, setCommentsList] = useState(comments);

  const topic = topics.find((t) => t.id === selectedTopic);

  const handleSend = () => {
    if (!newComment.trim()) return;
    setCommentsList([
      ...commentsList,
      { id: commentsList.length + 1, author: "Вы", time: "сейчас", text: newComment.trim() },
    ]);
    setNewComment("");
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex items-center gap-4 mb-2">
        <div className="w-8 h-px bg-[#00f5ff]" />
        <span className="font-mono text-xs text-[#00f5ff] tracking-[0.3em]">// ФОРУМ СООБЩЕСТВА</span>
      </div>
      <h1 className="font-orbitron text-3xl font-black text-white mb-8 tracking-wider">ОБСУЖДЕНИЯ</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Topics list */}
        <div className="lg:col-span-2 space-y-2">
          <div className="flex items-center justify-between mb-4">
            <span className="font-mono text-xs text-[#3a5570]">{topics.length} ТОПИКОВ</span>
            <button className="btn-neon text-[10px] px-3 py-1.5 flex items-center gap-1">
              <Icon name="Plus" size={10} />
              СОЗДАТЬ
            </button>
          </div>

          {topics.map((topic) => (
            <button
              key={topic.id}
              onClick={() => setSelectedTopic(topic.id)}
              className={`w-full text-left p-4 transition-all duration-200 ${
                selectedTopic === topic.id ? "" : "card-drone"
              }`}
              style={
                selectedTopic === topic.id
                  ? { background: "rgba(0,245,255,0.06)", border: "1px solid rgba(0,245,255,0.3)" }
                  : {}
              }
            >
              <div className="flex items-start gap-2 mb-2">
                <span className="tag-badge text-[9px]">{topic.category}</span>
                {topic.hot && <span className="tag-badge-green text-[9px]">🔥 ХОТ</span>}
              </div>
              <div className="font-plex text-sm text-white leading-snug mb-2">{topic.title}</div>
              <div className="flex items-center gap-3 text-[#3a5570]">
                <span className="font-mono text-[10px]">@{topic.author}</span>
                <div className="flex items-center gap-1">
                  <Icon name="MessageSquare" size={10} />
                  <span className="font-mono text-[10px]">{topic.replies}</span>
                </div>
                <span className="font-mono text-[10px]">{topic.time}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Discussion thread */}
        <div className="lg:col-span-3">
          {topic ? (
            <div className="card-drone p-6 h-full flex flex-col" style={{ border: "1px solid rgba(0,245,255,0.15)" }}>
              {/* Topic header */}
              <div className="pb-4 mb-6" style={{ borderBottom: "1px solid rgba(0,245,255,0.1)" }}>
                <div className="flex gap-2 mb-2">
                  <span className="tag-badge text-[10px]">{topic.category}</span>
                  {topic.hot && <span className="tag-badge-green text-[10px]">🔥 ГОРЯЧЕЕ</span>}
                </div>
                <h2 className="font-plex text-lg font-semibold text-white mb-2">{topic.title}</h2>
                <div className="flex items-center gap-4 text-[#3a5570]">
                  <div className="flex items-center gap-1">
                    <Icon name="User" size={11} />
                    <span className="font-mono text-xs">@{topic.author}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Icon name="MessageSquare" size={11} />
                    <span className="font-mono text-xs">{topic.replies} ответов</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Icon name="Eye" size={11} />
                    <span className="font-mono text-xs">{topic.views}</span>
                  </div>
                </div>
              </div>

              {/* Comments */}
              <div className="flex-1 space-y-4 mb-6 max-h-96 overflow-y-auto">
                {commentsList.map((c) => (
                  <div key={c.id} className="flex gap-3">
                    <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 font-orbitron text-xs text-[#00f5ff]" style={{ background: "rgba(0,245,255,0.08)", border: "1px solid rgba(0,245,255,0.2)" }}>
                      {c.author[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-[#00f5ff]">@{c.author}</span>
                        <span className="font-mono text-[10px] text-[#3a5570]">{c.time}</span>
                      </div>
                      <div className="font-plex text-sm text-[#8ab0cc] leading-relaxed p-3" style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.04)" }}>
                        {c.text}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply input */}
              <div className="flex gap-3">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Написать комментарий..."
                  rows={2}
                  className="flex-1 bg-[#0a1020] border border-[rgba(0,245,255,0.15)] text-[#e0f4ff] font-plex text-sm px-3 py-2 rounded-sm outline-none focus:border-[rgba(0,245,255,0.5)] placeholder:text-[#2a4060] resize-none"
                />
                <button
                  onClick={handleSend}
                  className="btn-neon-filled flex items-center gap-2 self-end flex-shrink-0"
                >
                  <Icon name="Send" size={13} />
                  Отправить
                </button>
              </div>
            </div>
          ) : (
            <div className="card-drone h-64 flex items-center justify-center">
              <div className="font-orbitron text-sm text-[#2a4060]">ВЫБЕРИТЕ ОБСУЖДЕНИЕ</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
