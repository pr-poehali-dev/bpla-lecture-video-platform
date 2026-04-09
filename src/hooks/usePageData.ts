import { useState, useEffect } from "react";
import { api } from "@/api";

interface Block { id: number; type: string; sort_order: number; data: unknown; }

export interface HeaderData { title: string; subtitle: string; categories?: string[]; }

export function usePageData(slug: string) {
  const [blocks, setBlocks] = useState<Block[]>([]);

  useEffect(() => {
    api.admin.getPage(slug).then(res => {
      if (res.blocks) setBlocks(res.blocks);
    }).catch(() => {});
  }, [slug]);

  const header = blocks.find(b => b.type === "header")?.data as HeaderData | undefined;
  const getBlock = (type: string) => blocks.find(b => b.type === type);

  return { blocks, header, getBlock };
}
