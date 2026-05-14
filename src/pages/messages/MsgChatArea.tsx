import { Chat, Message } from "./MsgTypes";
import MsgChatHeader from "./MsgChatHeader";
import MsgChatMessages from "./MsgChatMessages";
import MsgChatInput from "./MsgChatInput";

interface Props {
  activeChat: Chat;
  messages: Message[];
  visibleMessages: Message[];
  userId: number;
  input: string;
  sending: boolean;
  typingUsers: string[];
  replyTo: Message | null;
  msgSearch: string;
  showSearch: boolean;
  showChatMenu: boolean;
  renaming: boolean;
  newChatName: string;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  editingMsg?: { id: number; content: string } | null;
  onClose: () => void;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onPaste: (e: React.ClipboardEvent) => void;
  onSend: () => void;
  onSendImage: (file: File) => void;
  onSetLightbox: (url: string) => void;
  onRemoveMessage: (id: number) => void;
  onReact: (msgId: number, emoji: string) => void;
  onSetReplyTo: (msg: Message) => void;
  onCancelReply: () => void;
  onToggleSearch: () => void;
  onMsgSearchChange: (v: string) => void;
  onToggleChatMenu: () => void;
  onCloseChatMenu: () => void;
  onStartRename: () => void;
  onClearChat: () => void;
  onLeaveChat: () => void;
  onNewChatNameChange: (v: string) => void;
  onRenameKeyDown: (e: React.KeyboardEvent) => void;
  onRenameConfirm: () => void;
  onCancelRename: () => void;
  onStartEdit: (msg: { id: number; content: string }) => void;
  onEditSubmit: (msgId: number, content: string) => void;
  onCancelEdit: () => void;
}

export default function MsgChatArea({
  activeChat, messages, visibleMessages, userId, input, sending,
  typingUsers, replyTo, msgSearch, showSearch, showChatMenu,
  renaming, newChatName, messagesEndRef, editingMsg,
  onClose, onInputChange, onKeyDown, onPaste, onSend, onSendImage, onSetLightbox,
  onRemoveMessage, onReact, onSetReplyTo, onCancelReply,
  onToggleSearch, onMsgSearchChange, onToggleChatMenu, onCloseChatMenu,
  onStartRename, onClearChat, onLeaveChat,
  onNewChatNameChange, onRenameKeyDown, onRenameConfirm, onCancelRename,
  onStartEdit, onEditSubmit, onCancelEdit,
}: Props) {
  return (
    <div className="flex-1 flex flex-col min-w-0"
      style={{ background: "rgba(4,7,14,0.97)" }}>

      <MsgChatHeader
        activeChat={activeChat}
        typingUsers={typingUsers}
        msgSearch={msgSearch}
        showSearch={showSearch}
        showChatMenu={showChatMenu}
        renaming={renaming}
        newChatName={newChatName}
        visibleMessages={visibleMessages}
        onClose={onClose}
        onToggleSearch={onToggleSearch}
        onMsgSearchChange={onMsgSearchChange}
        onToggleChatMenu={onToggleChatMenu}
        onStartRename={onStartRename}
        onClearChat={onClearChat}
        onLeaveChat={onLeaveChat}
        onNewChatNameChange={onNewChatNameChange}
        onRenameKeyDown={onRenameKeyDown}
        onRenameConfirm={onRenameConfirm}
        onCancelRename={onCancelRename}
      />

      <MsgChatMessages
        activeChat={activeChat}
        visibleMessages={visibleMessages}
        userId={userId}
        msgSearch={msgSearch}
        messagesEndRef={messagesEndRef}
        onCloseChatMenu={onCloseChatMenu}
        onSetLightbox={onSetLightbox}
        onRemoveMessage={onRemoveMessage}
        onReact={onReact}
        onSetReplyTo={onSetReplyTo}
        onStartEdit={onStartEdit}
      />

      <MsgChatInput
        activeChat={activeChat}
        input={input}
        sending={sending}
        typingUsers={typingUsers}
        replyTo={replyTo}
        editingMsg={editingMsg}
        onInputChange={onInputChange}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        onSend={onSend}
        onSendImage={onSendImage}
        onCancelReply={onCancelReply}
        onEditSubmit={onEditSubmit}
        onCancelEdit={onCancelEdit}
      />
    </div>
  );
}
