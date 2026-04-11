import { useState, useEffect } from "react";
import { api } from "@/api";

export function useProgress(itemType: "lecture" | "video") {
  const [done, setDone] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.progress.myProgress().then(res => {
      const ids = (res.progress || [])
        .filter((p: { item_type: string; item_id: number }) => p.item_type === itemType)
        .map((p: { item_id: number }) => p.item_id);
      setDone(new Set(ids));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [itemType]);

  const toggle = async (id: number) => {
    if (done.has(id)) {
      await api.progress.markUndone(itemType, id);
      setDone(prev => { const s = new Set(prev); s.delete(id); return s; });
    } else {
      await api.progress.markDone(itemType, id);
      setDone(prev => new Set([...prev, id]));
    }
  };

  return { done, loading, toggle };
}
