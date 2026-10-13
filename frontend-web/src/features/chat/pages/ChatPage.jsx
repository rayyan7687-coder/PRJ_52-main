import { useState, useEffect, useRef } from 'react';
import { apiFetch, getWebSocketUrl } from '../../../services/api';
import { useAuth } from '../../auth/AuthContext';
import {
  Send, MessageSquare, Shield, AlertTriangle
} from 'lucide-react';

export const ChatPage = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // Reporting / Fraud Modal State
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Scam / Advance Money Request');
  const [reportDesc, setReportDesc] = useState('');
  const [reportSuccess, setReportSuccess] = useState('');

  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const data = await apiFetch('/conversations');
        setConversations(data);
        if (data.length > 0) {
          setActiveConv(data[0]);
        }
      } catch (err) {
        console.error('Error fetching conversations:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, []);

  useEffect(() => {
    if (!activeConv) return;

    const fetchMessages = async () => {
      try {
        const data = await apiFetch(`/conversations/${activeConv.id}/messages`);
        setMessages(data);
      } catch (err) {
        console.error('Error fetching messages:', err);
      }
    };
    fetchMessages();

    // Setup WebSocket with token query param
    const token = localStorage.getItem('token');
    if (token) {
      const wsUrl = getWebSocketUrl(activeConv.id, token);
      const ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        const incomingMsg = JSON.parse(event.data);
        setMessages((prev) => {
          if (prev.some((m) => m.id === incomingMsg.id)) return prev;
          return [...prev, incomingMsg];
        });
      };

      wsRef.current = ws;

      return () => {
        ws.close();
      };
    }
  }, [activeConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConv) return;

    try {
      await apiFetch(`/conversations/${activeConv.id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ message: newMessage }),
      });
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!activeConv) return;

    const otherUserId = activeConv.buyer_id === user.id ? activeConv.seller_id : activeConv.buyer_id;

    try {
      await apiFetch('/reports', {
        method: 'POST',
        body: JSON.stringify({
          listing_id: activeConv.listing_id,
          reported_user_id: otherUserId,
          reason: reportReason,
          description: reportDesc
        })
      });
      setReportSuccess('Report submitted to admin moderation team!');
      setTimeout(() => {
        setReportModalOpen(false);
        setReportSuccess('');
        setReportDesc('');
      }, 2000);
    } catch (err) {
      alert(err.message || 'Failed to submit report');
    }
  };

  if (loading) return <div className="text-center py-20 text-slate-400">Loading your conversations...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl grid grid-cols-1 md:grid-cols-3 h-[700px]">
        {/* Left: Conversation List */}
        <div className="border-r border-slate-800 flex flex-col bg-slate-950">
          <div className="p-4 border-b border-slate-800 font-bold text-white flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-emerald-400" />
            <span>Messages & Deal Inquiries</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
            {conversations.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm">
                No active conversations yet.
              </div>
            ) : (
              conversations.map((conv) => {
                const isActive = activeConv?.id === conv.id;
                return (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConv(conv)}
                    className={`w-full text-left p-4 transition flex flex-col space-y-1 ${
                      isActive ? 'bg-slate-800/90 border-l-4 border-emerald-500' : 'hover:bg-slate-900/50'
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="font-bold text-white text-sm truncate">
                        {conv.listing?.title || `Conversation #${conv.id}`}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {conv.created_at ? new Date(conv.created_at).toLocaleDateString() : ''}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate">
                      {conv.last_message?.message || 'No messages yet...'}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Message Window */}
        <div className="md:col-span-2 flex flex-col bg-slate-900">
          {activeConv ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-white text-base">
                    {activeConv.listing?.title || 'Material Trade Negotiation'}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Listing ID: #{activeConv.listing_id} • Price: ₹{activeConv.listing?.price} / {activeConv.listing?.unit}
                  </p>
                </div>

                <button
                  onClick={() => setReportModalOpen(true)}
                  className="bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800/80 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center space-x-1 transition"
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Report Suspect / Fraud</span>
                </button>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-950/40">
                {messages.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-sm">
                    Send a message to start negotiating details with the seller/buyer.
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.sender_id === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-xs md:max-w-md px-4 py-2.5 rounded-2xl text-sm shadow-md ${
                            isMine
                              ? 'bg-emerald-600 text-white rounded-br-none'
                              : 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700/60'
                          }`}
                        >
                          {msg.message}
                        </div>
                        <span className="text-[10px] text-slate-500 mt-1 px-1">
                          {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Form */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800 bg-slate-950 flex gap-2">
                <input
                  type="text"
                  placeholder="Type a message or price offer..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-5 py-2.5 rounded-lg flex items-center justify-center transition"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-2">
              <MessageSquare className="h-12 w-12 text-slate-700" />
              <p>Select a conversation to start chatting.</p>
            </div>
          )}
        </div>
      </div>

      {/* Report Fraud Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center space-x-2 text-red-400 font-bold border-b border-slate-800 pb-3">
              <Shield className="h-5 w-5" />
              <span>Report Fraud or Malicious Behavior</span>
            </div>

            {reportSuccess ? (
              <div className="bg-emerald-950 border border-emerald-800 text-emerald-200 text-sm p-3 rounded text-center">
                {reportSuccess}
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Reason for Report</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                  >
                    <option value="Scam / Advance Money Request">Scam / Advance Payment Request</option>
                    <option value="Fake / Non-existent Listing">Fake / Non-existent Listing</option>
                    <option value="Abusive / Harassing Language">Abusive / Harassing Language</option>
                    <option value="Misleading Quality / Quantity">Misleading Quality / Quantity</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Incident Description</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Provide specific details about what happened..."
                    value={reportDesc}
                    onChange={(e) => setReportDesc(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white text-sm"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReportModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg"
                  >
                    Submit Case
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
