import { useState, useRef, useEffect } from 'react';
import styled from '@emotion/styled';
import { ClipLoader } from 'react-spinners';
import chatService from './services/chatService';

const ChatToggle = styled.button`
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 50px;
  height: 50px;
  border-radius: 25px;
  background: #b42823;
  color: white;
  border: none;
  cursor: pointer;
  font-size: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  transition: transform 0.3s;
  z-index: 1000;
  &:hover {
    transform: scale(1.1);
    background: #d32f2f;
  }
`;

const ChatWidget = styled.div`
  position: fixed;
  bottom: ${props => props.isMaximized ? '0' : '20px'};
  right: ${props => props.isMaximized ? '0' : '20px'};
  width: ${props => props.isMaximized ? '100%' : 'min(400px, calc(100% - 40px))'};
  height: ${props => props.isMaximized ? '100vh' : 'min(500px, calc(100vh - 40px))'};
  background: white;
  border-radius: ${props => props.isMaximized ? '0' : '10px'};
  box-shadow: 0 5px 20px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  z-index: 999;

  @media (max-width: 480px) {
    bottom: ${props => props.isMaximized ? '0' : '20px'};
    right: ${props => props.isMaximized ? '0' : '20px'};
    width: ${props => props.isMaximized ? '100%' : 'calc(100% - 40px)'};
    height: ${props => props.isMaximized ? '100vh' : '500px'};
    border-radius: ${props => props.isMaximized ? '0' : '10px'};
  }
`;

const ChatHeader = styled.div`
  padding: 15px;
  background: #b42823;
  color: white;
  border-radius: ${props => props.isMaximized ? '0' : '10px 10px 0 0'};
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: ${props => props.isMaximized ? 'fixed' : 'relative'};
  top: ${props => props.isMaximized ? '0' : 'auto'};
  left: ${props => props.isMaximized ? '0' : 'auto'};
  right: ${props => props.isMaximized ? '0' : 'auto'};
  width: ${props => props.isMaximized ? '100%' : 'auto'};
  box-sizing: border-box;
  z-index: 1000;
  h3 {
    margin: 0;
  }

  @media (max-width: 480px) {
    padding: ${props => props.isMaximized ? '15px' : '15px'};
  }
`;

const DisclaimerSection = styled.div`
  background: #fff3cd;
  color: #856404;
  padding: 8px 15px;
  font-size: 12px;
  border-bottom: 1px solid #dee2e6;
  display: flex;
  align-items: center;
  gap: 6px;
  position: ${props => props.isMaximized ? 'fixed' : 'relative'};
  top: ${props => props.isMaximized ? '60px' : 'auto'};
  left: ${props => props.isMaximized ? '0' : 'auto'};
  right: ${props => props.isMaximized ? '0' : 'auto'};
  z-index: 1000;
`;

const MaximizeButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  padding: 0 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  &:hover {
    opacity: 0.8;
  }
`;

const HeaderButton = styled(MaximizeButton)`
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: auto;
  padding: 0 10px;
`;

const ButtonGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
`;

const ChatMessages = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: ${props => props.isMaximized ? '110px' : '0'};
  
  @media (max-width: 480px) {
    padding: 10px;
    margin-top: ${props => props.isMaximized ? '110px' : '0'};
  }
`;

const Message = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 10px;
  padding: 12px;
  border-radius: 8px;
  max-width: 85%;
  ${props => props.sender === 'user' ? 'margin-left: auto; background: #f0f0f0;' : 'margin-right: auto; background: white;'}
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);

  .message-content {
    white-space: pre-wrap;
    word-break: break-word;
    line-height: 1.5;

    ul {
      margin: 8px 0;
      padding-left: 20px;
      list-style-type: disc;
    }

    li {
      margin-bottom: 6px;
      &:last-child {
        margin-bottom: 0;
      }
    }

    strong {
      font-weight: 600;
    }
  }
`;

const ContextSection = styled.div`
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid ${props => props.sender === 'user' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'};
`;

const ContextGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(3, auto);
  gap: 8px;
  margin-top: 8px;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;
  }
  
  @media (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;
  }
`;

const ContextCard = styled.div`
  background: ${props => props.sender === 'user' ? 'rgba(255,255,255,0.1)' : 'white'};
  border-radius: 8px;
  padding: 10px;
  border: 1px solid ${props => props.sender === 'user' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'};
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
  
  h4 {
    margin: 0 0 4px 0;
    font-size: 13px;
    color: ${props => props.sender === 'user' ? 'white' : '#333'};
  }
  
  p {
    margin: 0;
    color: ${props => props.sender === 'user' ? 'rgba(255,255,255,0.8)' : '#666'};
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;

const LoadingSpinner = styled.span`
  display: inline-block;
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  animation: spin 1s linear infinite;
`;

const ChatInput = styled.div`
  padding: 15px;
  border-top: 1px solid #dee2e6;
  display: flex;
  gap: 10px;
  background: white;
  border-radius: ${props => props.isMaximized ? '0' : '0 0 10px 10px'};
  
  textarea {
    flex: 1;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    padding: 8px 12px;
    resize: none;
    font-family: inherit;
    font-size: 14px;
    line-height: 1.5;
    height: 40px;
    max-height: 120px;
    
    &:focus {
      outline: none;
      border-color: #b42823;
    }
  }
  
  button {
    background: #b42823;
    color: white;
    border: none;
    border-radius: 6px;
    padding: 0 16px;
    cursor: pointer;
    font-size: 14px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
    
    &:hover {
      background: #d32f2f;
    }
    
    &:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
  }
`;

function App() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    adjustTextareaHeight();
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;

    const userMessage = { sender: 'user', content: inputValue.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = '40px';
    }

    let currentAssistantMessage = '';
    let currentMessageId = '';
    let currentResources = [];

    const handleStreamMessage = (data) => {
      switch (data.type) {
        case 'chunk':
          currentAssistantMessage += data.content;  
          currentMessageId = data.messageId;
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            
            if (lastMessage && lastMessage.messageId === currentMessageId) {
              lastMessage.content = currentAssistantMessage;
            } else {
              newMessages.push({
                sender: 'assistant',
                content: currentAssistantMessage,
                messageId: currentMessageId
              });
            }
            
            return newMessages;
          });
          break;

        case 'end':
          currentResources = data.resources;
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            
            if (lastMessage && lastMessage.messageId === data.messageId) {
              lastMessage.resources = currentResources;
            }
            
            return newMessages;
          });
          setIsTyping(false);
          break;
      }
    };

    try {
      await chatService.createChatStream(
        userMessage.content,
        handleStreamMessage,
        (error) => {
          console.error('Chat error:', error);
          setMessages(prev => [...prev, { sender: 'assistant', content: 'Sorry, an error occurred. Please try again.' }]);
          setIsTyping(false);
        }
      );
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsTyping(false);
    }
  };

  const handleReset = () => {
    setMessages([]);
    chatService.resetConversation();
  };

  return (
    <div className="App">
      {!isChatOpen && (
        <ChatToggle onClick={() => setIsChatOpen(!isChatOpen)}>
          {isChatOpen ? '✕' : '💬'}
        </ChatToggle>
      )}

      {isChatOpen && (
        <ChatWidget isMaximized={isMaximized}>
          <ChatHeader isMaximized={isMaximized}>
            <h3>Inilah AI</h3>
            <ButtonGroup>
              <HeaderButton onClick={handleReset}>
                <span>🔄</span>
              </HeaderButton>
              <MaximizeButton onClick={() => setIsMaximized(!isMaximized)}>
                {isMaximized ? '⊙' : '⛶'}
              </MaximizeButton>
              <MaximizeButton onClick={() => setIsChatOpen(false)}>✕</MaximizeButton>
            </ButtonGroup>
          </ChatHeader>

          <DisclaimerSection isMaximized={isMaximized}>
            <span>ℹ️</span>
            <span>Respons AI mungkin tidak akurat. Harap verifikasi informasi penting.</span>
          </DisclaimerSection>

          <ChatMessages isMaximized={isMaximized}>
            {messages.map((message, index) => (
              <Message key={index} sender={message.sender}>
                <div className="message-content" dangerouslySetInnerHTML={{ 
                  __html: message.content
                    .split('\n')
                    .map(line => {
                      if (line.trim().startsWith('*') && !line.trim().startsWith('**')) {
                        return `<li>${line.trim().substring(1).trim()}</li>`;
                      }
                      return line;
                    })
                    .join('\n')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/(?<!\*)\*((?!\*)[^*]+)\*(?!\*)/g, '<strong>$1</strong>')
                    .replace(/(?<=<li>.*)\n|^\n(?=.*<li>)/g, '')
                    .replace(/(<li>.*?<\/li>)/g, '<ul>$1</ul>')
                    .replace(/\n/g, '<br/>')
                }} />
                {message.resources && message.resources.length > 0 && !message.content.toLowerCase().includes('saya tidak tahu') && (
                  <ContextSection sender={message.sender}>
                    <strong>Artikel Terkait:</strong>
                    <ContextGrid>
                      {message.resources.map((resource, idx) => (
                        <ContextCard 
                          key={idx} 
                          sender={message.sender}
                          onClick={() => window.open(`https://www.inilah.com/${resource.slug}`, '_blank')}
                        >
                          <h4 dangerouslySetInnerHTML={{ __html: resource.title }} />
                          <p style={{ color: '#666', fontSize: '0.9em' }}>
                            📅 <span dangerouslySetInnerHTML={{ __html: resource.createdAt }} />
                          </p>
                          <p dangerouslySetInnerHTML={{ __html: resource.content }} />
                        </ContextCard>
                      ))}
                    </ContextGrid>
                  </ContextSection>
                )}
              </Message>
            ))}
            <div ref={messagesEndRef} />
          </ChatMessages>

          <ChatInput isMaximized={isMaximized}>
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Tulis pertanyaanmu..."
              disabled={isTyping}
            />
            <button onClick={handleSendMessage} disabled={!inputValue.trim() || isTyping}>
              {isTyping ? <ClipLoader size={15} color="#ffffff" /> : 'Kirim'}
            </button>
          </ChatInput>
        </ChatWidget>
      )}
    </div>
  );
}

export default App;
