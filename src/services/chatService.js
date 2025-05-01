const API_BASE_URL = 'https://6b79-180-244-20-224.ngrok-free.app/v1';
const API_TOKEN = 'Bearer app-I37bJyxpOgQ92i5pUK8SYVrO'; // PROD - Inilah.com AI Chat Assistant v3.0

class ChatService {
    constructor() {
        this.currentConversationId = '';
        this.userId = this.getUserId();
    }

    getUserId() {
        let userId = localStorage.getItem('chat_user_id');
        if (!userId) {
            userId = 'user-' + Math.random().toString(36).substring(2, 15);
            localStorage.setItem('chat_user_id', userId);
        }
        return userId;
    }

    // Create a streaming chat connection
    async createChatStream(message, onMessage, onError) {
        const body = {
            inputs: {},
            query: message,
            response_mode: 'streaming',
            conversation_id: this.currentConversationId,
            user: this.userId,
            files: []
        };

        try {
            const response = await fetch(`${API_BASE_URL}/chat-messages`, {
                method: 'POST',
                headers: {
                    'Authorization': API_TOKEN,
                    'Content-Type': 'application/json',
                    'Accept': 'text/event-stream'
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            
                            switch (data.event) {
                                case 'message':
                                    // Preserve raw text format for bullets (*) and bold (**)
                                    onMessage({
                                        type: 'chunk',
                                        content: data.answer,
                                        messageId: data.message_id
                                    });
                                    break;

                                case 'message_end':
                                    onMessage({
                                        type: 'end',
                                        messageId: data.message_id,
                                        metadata: data.metadata,
                                        resources: data.metadata?.retriever_resources?.map(resource => {
                                            try {
                                                const parts = resource.content.split(';');
                                                const contentMap = {};
                                                parts.forEach(part => {
                                                    const [key, value = ''] = (part.split(': ').length > 1) 
                                                        ? part.split(': ') 
                                                        : [part, ''];
                                                    contentMap[key.trim()] = value.trim();
                                                });
                                                
                                                // Only return article if it has required fields with valid content
                                                if (!contentMap['title'] || !contentMap['content'] || 
                                                    contentMap['title'].length < 2 || contentMap['content'].length < 2) {
                                                    return null;
                                                }

                                                return {
                                                    createdAt: contentMap['created_at'] || new Date().toISOString(),
                                                    slug: contentMap['slug'] || '',
                                                    title: contentMap['title'].replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'),
                                                    content: contentMap['content'].replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'),
                                                    score: resource.score || 0
                                                };
                                            } catch (error) {
                                                console.warn('Error parsing article:', error);
                                                return null;
                                            }
                                        }).filter(Boolean) || []
                                    });
                                    break;

                                case 'workflow_finished':
                                    this.currentConversationId = data.conversation_id;
                                    onMessage({
                                        type: 'complete',
                                        messageId: data.message_id
                                    });
                                    break;

                                case 'error':
                                    onError(data.message);
                                    return;
                            }
                        } catch (e) {
                            console.error('Error parsing SSE data:', e);
                        }
                    }
                }
            }
        } catch (error) {
            onError(error.message);
        }
    }

    // Reset conversation
    resetConversation() {
        this.currentConversationId = '';
    }
}

export default new ChatService();
