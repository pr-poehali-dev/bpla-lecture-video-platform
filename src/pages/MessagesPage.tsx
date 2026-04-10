import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { api } from "@/api";
import { User } from "@/App";
import { Chat, Contact, Message, FoundUser, Tab } from "./messages/MsgTypes";
import MsgSidebar from "./messages/MsgSidebar";
import MsgChatArea from "./messages/MsgChatArea";
import MsgCreateGroupModal from "./messages/MsgCreateGroupModal";

interface MessagesPageProps { user: User; }

export default function MessagesPage({ user }: MessagesPageProps) {
  const [tab, setTab] = useState<Tab>("chats");
  const [chats, setChats] = useState<Chat[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const [replyTo, setReplyTo] = useState<Message | null>(null);

  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [msgSearch, setMsgSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const [showChatMenu, setShowChatMenu] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [newChatName, setNewChatName] = useState("");

  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<FoundUser[]>([]);
  const [searching, setSearching] = useState(false);

  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupMembers, setGroupMembers] = useState<FoundUser[]>([]);
  const [groupSearch, setGroupSearch] = useState("");
  const [groupSearchResults, setGroupSearchResults] = useState<FoundUser[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const typingPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { loadAll(); }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (activeChat) {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(() => loadMessages(activeChat.id), 8000);

      if (typingPollRef.current) clearInterval(typingPollRef.current);
      typingPollRef.current = setInterval(() => {
        api.msg.typingGet(activeChat.id).then(r => setTypingUsers(r.typing || []));
      }, 3000);

      return () => {
        if (pollRef.current) clearInterval(pollRef.current);
        if (typingPollRef.current) clearInterval(typingPollRef.current);
      };
    }
  }, [activeChat]);

  const loadAll = async () => {
    setLoading(true);
    const [chatsRes, contactsRes] = await Promise.all([api.msg.chatsList(), api.msg.contactsList()]);
    if (chatsRes.chats) setChats(chatsRes.chats);
    if (contactsRes.contacts) setContacts(contactsRes.contacts);
    setLoading(false);
  };

  const loadMessages = async (chatId: number) => {
    const res = await api.msg.chatMessages(chatId);
    if (res.messages) setMessages(res.messages);
  };

  const openChat = async (chat: Chat) => {
    setActiveChat(chat);
    setMessages([]);
    setReplyTo(null);
    setShowSearch(false);
    setMsgSearch("");
    setShowChatMenu(false);
    await loadMessages(chat.id);
    setChats(prev => prev.map(c => c.id === chat.id ? { ...c, unread_count: 0 } : c));
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeChat || sending) return;
    setSending(true);
    const text = input.trim();
    const res = await api.msg.messageSend(activeChat.id, text, replyTo?.id);
    setSending(false);
    if (res.message) {
      setMessages(prev => [...prev, res.message]);
      setInput("");
      setReplyTo(null);
      setChats(prev => prev.map(c => c.id === activeChat.id ? { ...c, last_message: text, last_message_at: new Date().toISOString() } : c));
    }
  };

  const sendImage = async (file: File) => {
    if (!activeChat || sending) return;
    setSending(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const res = await api.msg.imageSend(activeChat.id, dataUrl, ext, undefined, replyTo?.id);
      setSending(false);
      if (res.message) {
        setMessages(prev => [...prev, res.message]);
        setReplyTo(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    if (e.key === "Escape" && replyTo) { setReplyTo(null); }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (!activeChat) return;
    api.msg.typingSet(activeChat.id);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const file = Array.from(e.clipboardData.items).find(i => i.type.startsWith("image/"))?.getAsFile();
    if (file) { e.preventDefault(); sendImage(file); }
  };

  const handleRemoveMessage = async (msgId: number) => {
    const res = await api.msg.messageRemove(msgId);
    if (res.ok) {
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, hidden: true, content: "Сообщение удалено" } : m));
    }
  };

  const handleReact = async (msgId: number, emoji: string) => {
    const res = await api.msg.messageReact(msgId, emoji);
    if (res.reactions) {
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, reactions: res.reactions } : m));
    }
  };

  const handleLeaveChat = async () => {
    if (!activeChat || !confirm("Выйти из чата?")) return;
    await api.msg.chatLeave(activeChat.id);
    setActiveChat(null);
    setMessages([]);
    setChats(prev => prev.filter(c => c.id !== activeChat.id));
    setShowChatMenu(false);
  };

  const handleClearChat = async () => {
    if (!activeChat || !confirm("Очистить историю?")) return;
    await api.msg.chatClear(activeChat.id);
    setMessages([]);
    setShowChatMenu(false);
  };

  const handleRenameChat = async () => {
    if (!activeChat || !newChatName.trim()) return;
    const res = await api.msg.chatRename(activeChat.id, newChatName.trim());
    if (res.message) {
      setActiveChat(prev => prev ? { ...prev, name: newChatName.trim() } : prev);
      setChats(prev => prev.map(c => c.id === activeChat.id ? { ...c, name: newChatName.trim() } : c));
      setRenaming(false);
      setNewChatName("");
      setShowChatMenu(false);
    }
  };

  const doSearch = async (q: string) => {
    setSearchQ(q);
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    const res = await api.msg.searchUsers(q);
    setSearching(false);
    setSearchResults(res.users || []);
  };

  const sendContactRequest = async (targetId: number) => {
    const res = await api.msg.contactRequest(targetId);
    if (!res.error) { setSearchQ(""); setSearchResults([]); await loadAll(); }
    else alert(res.error);
  };

  const respondContact = async (contactId: number, response: "accept" | "reject") => {
    await api.msg.contactRespond(contactId, response);
    await loadAll();
  };

  const doGroupSearch = async (q: string) => {
    setGroupSearch(q);
    if (q.length < 2) { setGroupSearchResults([]); return; }
    const res = await api.msg.searchUsers(q);
    setGroupSearchResults((res.users || []).filter((u: FoundUser) => !groupMembers.find(m => m.id === u.id)));
  };

  const createGroup = async () => {
    if (!groupName.trim() || groupMembers.length === 0) return;
    const res = await api.msg.chatCreate(groupName.trim(), groupMembers.map(m => m.id));
    if (res.error) { alert(res.error); return; }
    setShowCreateGroup(false); setGroupName(""); setGroupMembers([]);
    await loadAll();
  };

  const visibleMessages = msgSearch
    ? messages.filter(m => m.content.toLowerCase().includes(msgSearch.toLowerCase()))
    : messages;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90" onClick={() => setLightbox(null)}>
          <img src={lightbox} className="max-w-[90vw] max-h-[90vh] object-contain" />
          <button className="absolute top-4 right-4 text-white/60 hover:text-white"><Icon name="X" size={24} /></button>
        </div>
      )}

      <div className="flex items-center gap-4 mb-6">
        <div className="w-8 h-px bg-[#00f5ff]" />
        <span className="font-mono text-xs text-[#00f5ff] tracking-[0.3em]">// ЗАЩИЩЁННАЯ СВЯЗЬ</span>
      </div>

      <div className="flex gap-4 h-[calc(100vh-200px)] min-h-[500px]">
        <MsgSidebar
          tab={tab}
          setTab={setTab}
          chats={chats}
          contacts={contacts}
          activeChat={activeChat}
          loading={loading}
          userId={user.id}
          onOpenChat={openChat}
          onShowCreateGroup={() => setShowCreateGroup(true)}
          searchQ={searchQ}
          searchResults={searchResults}
          searching={searching}
          onSearch={doSearch}
          onSendContactRequest={sendContactRequest}
          onRespondContact={respondContact}
        />

        {/* Chat area */}
        <div className="flex-1 flex flex-col" style={{ border: "1px solid rgba(0,245,255,0.15)", background: "rgba(5,8,16,0.6)" }}>
          {!activeChat ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4" style={{ border: "1px solid rgba(0,245,255,0.2)", background: "rgba(0,245,255,0.04)" }}>
                  <Icon name="MessageSquare" size={28} className="text-[#2a4060]" />
                </div>
                <div className="font-orbitron text-sm text-[#3a5570] tracking-wider">ВЫБЕРИТЕ ЧАТ</div>
              </div>
            </div>
          ) : (
            <MsgChatArea
              activeChat={activeChat}
              messages={messages}
              visibleMessages={visibleMessages}
              userId={user.id}
              input={input}
              sending={sending}
              typingUsers={typingUsers}
              replyTo={replyTo}
              msgSearch={msgSearch}
              showSearch={showSearch}
              showChatMenu={showChatMenu}
              renaming={renaming}
              newChatName={newChatName}
              messagesEndRef={messagesEndRef}
              onClose={() => setActiveChat(null)}
              onInputChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onSend={sendMessage}
              onSendImage={sendImage}
              onSetLightbox={setLightbox}
              onRemoveMessage={handleRemoveMessage}
              onReact={handleReact}
              onSetReplyTo={setReplyTo}
              onCancelReply={() => setReplyTo(null)}
              onToggleSearch={() => { setShowSearch(!showSearch); setMsgSearch(""); }}
              onMsgSearchChange={setMsgSearch}
              onToggleChatMenu={() => setShowChatMenu(!showChatMenu)}
              onCloseChatMenu={() => setShowChatMenu(false)}
              onStartRename={() => { setRenaming(true); setNewChatName(activeChat.name || ""); setShowChatMenu(false); }}
              onClearChat={handleClearChat}
              onLeaveChat={handleLeaveChat}
              onNewChatNameChange={setNewChatName}
              onRenameKeyDown={e => { if (e.key === "Enter") handleRenameChat(); if (e.key === "Escape") setRenaming(false); }}
              onRenameConfirm={handleRenameChat}
              onCancelRename={() => setRenaming(false)}
            />
          )}
        </div>
      </div>

      {showCreateGroup && (
        <MsgCreateGroupModal
          groupName={groupName}
          groupMembers={groupMembers}
          groupSearch={groupSearch}
          groupSearchResults={groupSearchResults}
          onClose={() => setShowCreateGroup(false)}
          onGroupNameChange={setGroupName}
          onGroupSearch={doGroupSearch}
          onAddMember={u => { setGroupMembers(prev => [...prev, u]); setGroupSearch(""); setGroupSearchResults([]); }}
          onRemoveMember={id => setGroupMembers(prev => prev.filter(x => x.id !== id))}
          onCreate={createGroup}
        />
      )}
    </div>
  );
}
