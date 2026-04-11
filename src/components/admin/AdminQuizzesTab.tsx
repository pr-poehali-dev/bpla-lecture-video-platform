import { useState, useEffect } from "react";
import { api, FileItem } from "@/api";
import Icon from "@/components/ui/icon";

interface Quiz {
  id: number;
  title: string;
  lecture_id: number;
  question_count: number;
  attempts: number;
  created_at: string;
}

interface Question {
  question: string;
  options: string[];
  correct_index: number;
}

const EMPTY_QUESTION: Question = { question: "", options: ["", "", "", ""], correct_index: 0 };

export default function AdminQuizzesTab() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [lectures, setLectures] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "create">("list");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  // Form state
  const [formLectureId, setFormLectureId] = useState<number | "">("");
  const [formTitle, setFormTitle] = useState("");
  const [formQuestions, setFormQuestions] = useState<Question[]>([{ ...EMPTY_QUESTION, options: ["", "", "", ""] }]);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    const [qRes, lRes] = await Promise.all([
      api.quizzes.adminList(),
      api.files.list("document", undefined, "general"),
    ]);
    if (qRes.quizzes) setQuizzes(qRes.quizzes);
    if (lRes.files) setLectures(lRes.files);
    setLoading(false);
  };

  const resetForm = () => {
    setFormLectureId("");
    setFormTitle("");
    setFormQuestions([{ question: "", options: ["", "", "", ""], correct_index: 0 }]);
  };

  const addQuestion = () => {
    setFormQuestions(prev => [...prev, { question: "", options: ["", "", "", ""], correct_index: 0 }]);
  };

  const removeQuestion = (idx: number) => {
    setFormQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const updateQuestion = (idx: number, field: keyof Question, value: string | number) => {
    setFormQuestions(prev => prev.map((q, i) => {
      if (i !== idx) return q;
      if (field === "options") return q; // handled separately
      return { ...q, [field]: value };
    }));
  };

  const updateOption = (qIdx: number, oIdx: number, value: string) => {
    setFormQuestions(prev => prev.map((q, i) => {
      if (i !== qIdx) return q;
      const opts = [...q.options];
      opts[oIdx] = value;
      return { ...q, options: opts };
    }));
  };

  const addOption = (qIdx: number) => {
    setFormQuestions(prev => prev.map((q, i) => i === qIdx ? { ...q, options: [...q.options, ""] } : q));
  };

  const removeOption = (qIdx: number, oIdx: number) => {
    setFormQuestions(prev => prev.map((q, i) => {
      if (i !== qIdx) return q;
      const opts = q.options.filter((_, j) => j !== oIdx);
      const correct = q.correct_index >= opts.length ? 0 : q.correct_index;
      return { ...q, options: opts, correct_index: correct };
    }));
  };

  const save = async () => {
    if (!formLectureId || !formTitle.trim()) return;
    for (const q of formQuestions) {
      if (!q.question.trim() || q.options.some(o => !o.trim())) {
        alert("Заполните все вопросы и варианты ответов");
        return;
      }
    }
    setSaving(true);
    const res = await api.quizzes.adminCreate({
      lecture_id: Number(formLectureId),
      title: formTitle.trim(),
      questions: formQuestions,
    });
    setSaving(false);
    if (res.error) { alert(res.error); return; }
    resetForm();
    setView("list");
    await loadAll();
  };

  const deleteQuiz = async (id: number) => {
    if (!confirm("Удалить тест и все результаты?")) return;
    setDeleting(id);
    await api.quizzes.adminDelete(id);
    setDeleting(null);
    await loadAll();
  };

  const getLectureTitle = (id: number) => lectures.find(l => l.id === id)?.title ?? `Лекция #${id}`;

  // ── CREATE VIEW ──
  if (view === "create") {
    return (
      <div className="p-6 max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => { setView("list"); resetForm(); }}
            className="text-[#3a5570] hover:text-white transition-colors">
            <Icon name="ArrowLeft" size={16} />
          </button>
          <span className="font-mono text-xs text-[#00f5ff] tracking-widest">НОВЫЙ ТЕСТ</span>
        </div>

        {/* Lecture selector */}
        <div className="mb-5">
          <label className="font-mono text-[10px] text-[#3a5570] tracking-wider block mb-1.5">ЛЕКЦИЯ</label>
          <select
            value={formLectureId}
            onChange={e => setFormLectureId(Number(e.target.value))}
            className="w-full bg-transparent border font-mono text-sm text-white px-3 py-2 outline-none focus:border-[#00f5ff] transition-colors"
            style={{ borderColor: "rgba(0,245,255,0.2)" }}
          >
            <option value="">— выберите лекцию —</option>
            {lectures.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
          </select>
        </div>

        {/* Title */}
        <div className="mb-6">
          <label className="font-mono text-[10px] text-[#3a5570] tracking-wider block mb-1.5">НАЗВАНИЕ ТЕСТА</label>
          <input
            className="w-full bg-transparent border font-mono text-sm text-white px-3 py-2 outline-none focus:border-[#00f5ff] transition-colors"
            style={{ borderColor: "rgba(0,245,255,0.2)" }}
            placeholder="Например: Проверочный тест по теме..."
            value={formTitle}
            onChange={e => setFormTitle(e.target.value)}
          />
        </div>

        {/* Questions */}
        <div className="flex flex-col gap-5 mb-6">
          {formQuestions.map((q, qi) => (
            <div key={qi} style={{ border: "1px solid rgba(0,245,255,0.15)", background: "rgba(0,245,255,0.02)" }}>
              <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: "rgba(0,245,255,0.1)" }}>
                <span className="font-mono text-[10px] text-[#3a5570] tracking-wider">ВОПРОС {qi + 1}</span>
                {formQuestions.length > 1 && (
                  <button onClick={() => removeQuestion(qi)} className="text-[#3a5570] hover:text-[#ff2244] transition-colors">
                    <Icon name="Trash2" size={13} />
                  </button>
                )}
              </div>
              <div className="p-4 flex flex-col gap-3">
                <textarea
                  className="w-full bg-transparent border font-mono text-sm text-white px-3 py-2 outline-none focus:border-[#00f5ff] transition-colors resize-none"
                  style={{ borderColor: "rgba(0,245,255,0.2)" }}
                  placeholder="Текст вопроса..."
                  rows={2}
                  value={q.question}
                  onChange={e => updateQuestion(qi, "question", e.target.value)}
                />

                <div className="flex flex-col gap-2">
                  <div className="font-mono text-[9px] text-[#3a5570] tracking-wider">ВАРИАНТЫ ОТВЕТОВ (отметьте правильный)</div>
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuestion(qi, "correct_index", oi)}
                        className="w-5 h-5 flex items-center justify-center flex-shrink-0 transition-all"
                        style={{
                          border: q.correct_index === oi ? "1px solid #00ff88" : "1px solid rgba(0,245,255,0.2)",
                          background: q.correct_index === oi ? "rgba(0,255,136,0.15)" : "transparent",
                        }}
                      >
                        {q.correct_index === oi && <Icon name="Check" size={10} className="text-[#00ff88]" />}
                      </button>
                      <input
                        className="flex-1 bg-transparent border font-mono text-sm text-white px-2 py-1.5 outline-none focus:border-[#00f5ff] transition-colors"
                        style={{ borderColor: "rgba(0,245,255,0.15)" }}
                        placeholder={`Вариант ${oi + 1}`}
                        value={opt}
                        onChange={e => updateOption(qi, oi, e.target.value)}
                      />
                      {q.options.length > 2 && (
                        <button onClick={() => removeOption(qi, oi)} className="text-[#2a4060] hover:text-[#ff2244] transition-colors flex-shrink-0">
                          <Icon name="X" size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                  {q.options.length < 6 && (
                    <button onClick={() => addOption(qi)}
                      className="flex items-center gap-1.5 font-mono text-[10px] text-[#3a5570] hover:text-[#00f5ff] transition-colors mt-1">
                      <Icon name="Plus" size={11} /> добавить вариант
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={addQuestion}
            className="flex items-center gap-2 px-4 py-2 font-mono text-xs transition-colors"
            style={{ border: "1px solid rgba(0,245,255,0.2)", color: "#3a5570" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#00f5ff"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#3a5570"; }}>
            <Icon name="Plus" size={13} />
            ДОБАВИТЬ ВОПРОС
          </button>
          <button onClick={save}
            disabled={saving || !formLectureId || !formTitle.trim() || formQuestions.length === 0}
            className="flex items-center gap-2 px-5 py-2 font-mono text-xs transition-colors disabled:opacity-40"
            style={{ border: "1px solid rgba(0,245,255,0.4)", color: "#00f5ff", background: "rgba(0,245,255,0.06)" }}>
            <Icon name="Save" size={13} />
            {saving ? "СОХРАНЕНИЕ..." : "СОХРАНИТЬ ТЕСТ"}
          </button>
        </div>
      </div>
    );
  }

  // ── LIST VIEW ──
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="font-mono text-[10px] text-[#3a5570] tracking-widest mb-1">ТЕСТИРОВАНИЕ</div>
          <div className="font-plex text-xs text-[#3a5570]">Тесты прикрепляются к лекциям. Проходной балл — 60%.</div>
        </div>
        <button onClick={() => setView("create")}
          className="flex items-center gap-2 px-4 py-2 font-mono text-xs transition-colors"
          style={{ border: "1px solid rgba(0,245,255,0.3)", color: "#00f5ff", background: "rgba(0,245,255,0.04)" }}>
          <Icon name="Plus" size={13} />
          СОЗДАТЬ ТЕСТ
        </button>
      </div>

      {loading ? (
        <div className="font-mono text-xs text-[#3a5570] animate-pulse py-10 text-center">загрузка...</div>
      ) : quizzes.length === 0 ? (
        <div className="text-center py-16" style={{ border: "1px solid rgba(0,245,255,0.08)" }}>
          <Icon name="ClipboardList" size={32} className="text-[#1a2a3a] mx-auto mb-3" />
          <div className="font-mono text-sm text-[#3a5570]">Тестов пока нет</div>
          <div className="font-mono text-xs text-[#2a4060] mt-1">Создайте первый тест для лекции</div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {quizzes.map(quiz => (
            <div key={quiz.id}
              className="flex items-center gap-4 px-4 py-3"
              style={{ border: "1px solid rgba(0,245,255,0.1)", background: "rgba(0,245,255,0.02)" }}>
              <div className="w-9 h-9 flex items-center justify-center flex-shrink-0"
                style={{ border: "1px solid rgba(0,245,255,0.2)", background: "rgba(0,245,255,0.05)" }}>
                <Icon name="ClipboardCheck" size={15} className="text-[#00f5ff]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-mono text-sm text-white truncate">{quiz.title}</div>
                <div className="font-mono text-[10px] text-[#3a5570] truncate mt-0.5">{getLectureTitle(quiz.lecture_id)}</div>
              </div>
              <div className="hidden sm:flex items-center gap-5 flex-shrink-0">
                <div className="text-center">
                  <div className="font-mono text-sm text-[#00f5ff]">{quiz.question_count}</div>
                  <div className="font-mono text-[8px] text-[#2a4060]">вопросов</div>
                </div>
                <div className="text-center">
                  <div className="font-mono text-sm text-[#00ff88]">{quiz.attempts}</div>
                  <div className="font-mono text-[8px] text-[#2a4060]">прохождений</div>
                </div>
              </div>
              <button onClick={() => deleteQuiz(quiz.id)}
                disabled={deleting === quiz.id}
                className="flex items-center justify-center w-8 h-8 transition-colors disabled:opacity-40 flex-shrink-0"
                style={{ border: "1px solid rgba(255,34,68,0.2)", color: "#3a5570" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#ff2244"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#3a5570"; }}>
                <Icon name="Trash2" size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
