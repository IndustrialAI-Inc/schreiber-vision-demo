import React, { useState, useRef, useEffect } from 'react';

// Define TypeScript interfaces
interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  status?: 'creating' | 'complete';
}

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isCreatingDocument, setIsCreatingDocument] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSendMessage = () => {
    if (inputValue.trim() === '') return;

    // Add user message
    const newUserMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
    };
    
    setMessages(prev => [...prev, newUserMessage]);
    setInputValue('');

    // Simulate assistant response
    setTimeout(() => {
      const responseText = inputValue.toLowerCase().includes('essay') || inputValue.toLowerCase().includes('document')
        ? 'I am creating a document for your essay on Silicon Valley'
        : 'I can help you with that. What specifically would you like to know?';

      const newAssistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: 'assistant',
      };
      
      setMessages(prev => [...prev, newAssistantMessage]);
      
      // If message mentions essay or document, show the "creating document" status
      if (responseText.includes('creating a document')) {
        setIsCreatingDocument(true);
      }
    }, 800);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-fulldark/80 text-white">
      {/* Main chat area */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`my-2 ${message.sender === 'user' ? 'flex justify-end' : 'flex justify-start'}`}
          >
            {message.sender === 'assistant' && (
              <div className="mr-2 flex items-start mt-2">
                <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                  <span className="text-xl">✨</span>
                </div>
              </div>
            )}
            <div 
              className={`max-w-xs md:max-w-md rounded-2xl p-4 ${
                message.sender === 'user' 
                  ? 'bg-bright text-black' 
                  : 'bg-dark'
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}
        
        {/* Document creation status */}
        {isCreatingDocument && (
          <div className="flex justify-start my-2">
            <div className="ml-10 bg-gray-800 rounded-xl p-4">
              <div className="flex items-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Creating "Essay on Silicon Valley"</span>
                <div className="ml-2 animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Back button */}
      <div className="absolute top-16 left-4">
        <button className="bg-gray-800 rounded-full p-4">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
      </div>
      
      {/* Message input area */}
      <div className="p-4">
        <div className="flex items-center bg-dark rounded-full p-2 pl-4">
          <input
            ref={inputRef}
            type="text"
            placeholder="Send a message..."
            className="flex-1 bg-transparent outline-none"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
          />
          <button 
            className="w-10 h-10 rounded-full flex items-center justify-center ml-2"
            onClick={handleSendMessage}
          >
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
          <button className="ml-2 w-10 h-10 bg-white rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;