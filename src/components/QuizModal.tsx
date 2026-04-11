import { useState } from "react";
import { api } from "@/api";
import Icon from "@/components/ui/icon";

interface Question {
  id: number;
  question: string;
  options: string[];
}

interface Quiz {
  id: number;
  title: string;
  questions: Question[];
}

interface MyResult {
  score: number;
  total: number;
  passed: boolean;
}

interface Props {
  quiz: Quiz;
  myResult: MyResult | null;
  onClose: () => void;
  onDone: () => void;
}

export default function QuizModal({ quiz, myResult: initialResult, onClose, onDone }: Props) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{ score: number; total: number; passed: boolean; correct_answers: Record<string, number> } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPrev] = useState(!!initialResult);

  const allAnswered = quiz.questions.every(q => answers[String(q.id)] !== undefined);

  const submit = async () => {
    if (!allAnswered || submitting) return;
    setSubmitting(true);
    const res = await api.quizzes.submit(quiz.id, answers);
    setSubmitting(false);
    if (res.score !== undefined) {
      setResult(res);
      onDone();
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)" }}
      onClick={onClose}>
      <div className="w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden"
        style={{ background: "rgba(4,7,14,0.99)", border: "1px solid rgba(0,245,255,0.25)", boxShadow: "0 0 60px rgba(0,245,255,0.1)" }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0" style={{ borderColor: "rgba(0,245,255,0.1)" }}>
          <div>
            <div className="font-mono text-[10px] text-[#3a5570] tracking-wider mb-0.5">ТЕСТ</div>
            <div className="font-orbitron text-sm text-white font-bold">{quiz.title}</div>
          </div>
          <button onClick={onClose} className="text-[#3a5570] hover:text-white transition-colors">
            <Icon name="X" size={16} />
          </button>
        </div>

        {/* Result view */}
        {result ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4">
            <div className={`w-20 h-20 flex items-center justify-center`}
              style={{ border: `2px solid ${result.passed ? "#00ff88" : "#ff2244"}`, background: result.passed ? "rgba(0,255,136,0.08)" : "rgba(255,34,68,0.08)" }}>
              <Icon name={result.passed ? "Trophy" : "XCircle"} size={36} style={{ color: result.passed ? "#00ff88" : "#ff2244" }} />
            </div>
            <div className="font-orbitron text-4xl font-black" style={{ color: result.passed ? "#00ff88" : "#ff2244" }}>
              {result.score}/{result.total}
            </div>
            <div className="font-mono text-sm" style={{ color: result.passed ? "#00ff88" : "#ff2244" }}>
              {result.passed ? "ТЕСТ ПРОЙДЕН" : "НЕ СДАНО"}
            </div>
            <div className="font-mono text-xs text-[#3a5570]">
              Правильных ответов: {Math.round((result.score / result.total) * 100)}%
              {" · "}Проходной балл: 60%
            </div>
            <button onClick={onClose}
              className="mt-2 px-6 py-2 font-mono text-xs transition-colors"
              style={{ border: "1px solid rgba(0,245,255,0.3)", color: "#00f5ff" }}>
              ЗАКРЫТЬ
            </button>
          </div>
        ) : (
          <>
            {/* Previous result banner */}
            {initialResult && !result && (
              <div className="px-5 py-2 flex items-center gap-2 flex-shrink-0"
                style={{ borderBottom: "1px solid rgba(0,245,255,0.08)", background: initialResult.passed ? "rgba(0,255,136,0.05)" : "rgba(255,34,68,0.05)" }}>
                <Icon name={initialResult.passed ? "CheckCircle" : "AlertCircle"} size={13}
                  style={{ color: initialResult.passed ? "#00ff88" : "#ff6b00" }} />
                <span className="font-mono text-[11px]" style={{ color: initialResult.passed ? "#00ff88" : "#ff6b00" }}>
                  Прошлый результат: {initialResult.score}/{initialResult.total} — {initialResult.passed ? "сдано" : "не сдано"}. Пройти повторно?
                </span>
              </div>
            )}

            {/* Questions */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {quiz.questions.map((q, qi) => (
                <div key={q.id}>
                  <div className="font-mono text-xs text-[#3a5570] mb-2">ВОПРОС {qi + 1} / {quiz.questions.length}</div>
                  <div className="font-plex text-sm text-white mb-3 leading-relaxed">{q.question}</div>
                  <div className="flex flex-col gap-2">
                    {q.options.map((opt, oi) => {
                      const selected = answers[String(q.id)] === oi;
                      return (
                        <button key={oi} onClick={() => setAnswers(prev => ({ ...prev, [String(q.id)]: oi }))}
                          className="flex items-center gap-3 px-4 py-2.5 text-left transition-all"
                          style={{
                            border: `1px solid ${selected ? "rgba(0,245,255,0.5)" : "rgba(0,245,255,0.1)"}`,
                            background: selected ? "rgba(0,245,255,0.08)" : "transparent",
                          }}>
                          <div className="w-4 h-4 flex items-center justify-center flex-shrink-0"
                            style={{ border: `1px solid ${selected ? "#00f5ff" : "rgba(0,245,255,0.3)"}`, background: selected ? "rgba(0,245,255,0.2)" : "transparent" }}>
                            {selected && <Icon name="Check" size={10} className="text-[#00f5ff]" />}
                          </div>
                          <span className="font-plex text-sm" style={{ color: selected ? "#e0f8ff" : "#8ab0cc" }}>{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t flex items-center justify-between flex-shrink-0" style={{ borderColor: "rgba(0,245,255,0.1)" }}>
              <span className="font-mono text-[11px] text-[#3a5570]">
                {Object.keys(answers).length}/{quiz.questions.length} отвечено
              </span>
              <button onClick={submit} disabled={!allAnswered || submitting}
                className="flex items-center gap-2 px-5 py-2 font-mono text-xs transition-colors disabled:opacity-40"
                style={{ border: "1px solid rgba(0,245,255,0.4)", color: "#00f5ff", background: "rgba(0,245,255,0.06)" }}>
                <Icon name={submitting ? "Loader" : "Send"} size={13} className={submitting ? "animate-spin" : ""} />
                {submitting ? "ОТПРАВКА..." : "ОТПРАВИТЬ"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
