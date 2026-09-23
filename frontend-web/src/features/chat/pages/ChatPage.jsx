import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiFetch } from '../../../services/api';
import { useAuth } from '../../auth/AuthContext';
import { MessageSquare, Send, User, Building2 } from 'lucide-react';

export const ChatPage = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const initialConvId = searchParams.get('conversation_id');

  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const data = await apiFetch('/conversations');
        setConversations(data);
        if (initialConvId) {
          const found = data.find(c => c.id === parseInt(initialConvId, 10));
          if (found) setActiveConv(found);
        } else if (data.length > 0) {
          setActiveConv(data[0]);
        }
      } catch (err) {
        console.error('Failed to load conversations:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, [initialConvId]);

  useEffect(() => {
    if (!activeConv) return;

    const loadMessages = async () => {
      try {
        const msgs = await apiFetch(`/conversations/${activeConv.id}/messages`);
        setMessages(msgs);
      } catch (err) {
        console.error('Error loading messages:', err);
      }
    };
    loadMessages();

    const token = localStorage.getItem('token');
    const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsUrl = `${wsProtocol}://${window.location.host}/ws/chat/${activeConv.id}?token=${token}`;

    socketRef.current = new WebSocket(wsUrl);

    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages((prev) => [...prev, data]);
    };

    return () => {
      if (socketRef.current) socketRef.current.close();
    };
  }, [activeConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConv) return;

    const msgText = newMessage;
    setNewMessage('');

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(msgText);
    } else {
      try {
        const saved = await apiFetch(`/conversations/${activeConv.id}/messages`, {
          method: 'POST',
          body: JSON.stringify({ message: msgText })
        });
        setMessages((prev) => [...prev, saved]);
      } catch (err) {
        console.error('Failed to send message:', err);
      }
    }
  };

  if (loading) return <div className="text-center py-20 text-slate-400">Loading chat conversations...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl h-[700px] grid grid-cols-1 md:grid-cols-3">
        <div className="border-r border-slate-800 flex flex-col bg-slate-950/50">
          <div className="p-4 border-b border-slate-800 font-bold text-white flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-emerald-400" />
            <span>Marketplace Messages</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">No active conversations.</div>
            ) : (
              conversations.map((conv) => {
                const otherParty = user?.id === conv.buyer_id ? conv.seller : conv.buyer;
                const isSelected = activeConv && activeConv.id === conv.id;

                return (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConv(conv)}
                    className={`w-full p-4 text-left flex flex-col space-y-1 transition ${
                      isSelected ? 'bg-slate-800/80 border-l-4 border-emerald-500' : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white text-sm">{otherParty?.name}</span>
                      <span className="text-[10px] text-slate-500">{conv.listing?.title}</span>
                    </div>
                    <p className="text-xs text-slate-400 truncate">
                      {conv.last_message ? conv.last_message.message : 'No messages yet'}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="md:col-span-2 flex flex-col bg-slate-900">
          {activeConv ? (
            <>
              <div className="p-4 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-white text-base">
                    {user?.id === activeConv.buyer_id ? activeConv.seller?.name : activeConv.buyer?.name}
                  </h3>
                  <span className="text-xs text-emerald-400">Re: {activeConv.listing?.title} • ₹{activeConv.listing?.price}/{activeConv.listing?.unit}</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((m) => {
                  const isMe = m.sender_id === user?.id;
                  return (
                    <div key={m.id || Math.random()} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-md p-3.5 rounded-2xl text-sm shadow-md ${
                        isMe ? 'bg-emerald-600 text-white rounded-br-none' : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
                      }`}>
                        <p className="leading-relaxed">{m.message}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800 bg-slate-950 flex space-x-3">
                <input
                  type="text"
                  placeholder="Type a message or price offer..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-lg flex items-center space-x-1"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-slate-500">
              <MessageSquare className="h-12 w-12 text-slate-700 mb-2" />
              <span>Select a conversation to begin chatting</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
