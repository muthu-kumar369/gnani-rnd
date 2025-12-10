import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ConversationTemplate {
    id: string;
    name: string;
    description: string;
    systemPrompt: string;
    icon?: string;
    category?: 'productivity' | 'creative' | 'learning' | 'general';
}

export const DEFAULT_TEMPLATES: ConversationTemplate[] = [
    {
        id: 'general',
        name: 'General Assistant',
        description: 'A helpful AI assistant for general questions',
        systemPrompt: 'You are a helpful AI assistant. Provide clear, accurate, and concise responses.',
        icon: '💬',
        category: 'general',
    },
    {
        id: 'coding',
        name: 'Coding Assistant',
        description: 'Help with programming and code review',
        systemPrompt: 'You are an expert programming assistant. Help with code, debugging, best practices, and technical explanations. Provide code examples when helpful.',
        icon: '💻',
        category: 'productivity',
    },
    {
        id: 'writing',
        name: 'Writing Assistant',
        description: 'Help with writing and editing',
        systemPrompt: 'You are a professional writing assistant. Help with writing, editing, grammar, style, and creative content. Provide constructive feedback and suggestions.',
        icon: '✍️',
        category: 'creative',
    },
    {
        id: 'brainstorm',
        name: 'Brainstorming',
        description: 'Generate ideas and creative solutions',
        systemPrompt: 'You are a creative brainstorming partner. Help generate innovative ideas, explore possibilities, and think outside the box. Encourage creative thinking.',
        icon: '💡',
        category: 'creative',
    },
    {
        id: 'learning',
        name: 'Learning Tutor',
        description: 'Explain concepts and teach new topics',
        systemPrompt: 'You are a patient and knowledgeable tutor. Explain concepts clearly, use examples, and adapt to the learner\'s level. Break down complex topics into understandable parts.',
        icon: '📚',
        category: 'learning',
    },
    {
        id: 'research',
        name: 'Research Assistant',
        description: 'Help with research and analysis',
        systemPrompt: 'You are a research assistant. Help analyze information, summarize findings, and provide well-researched insights. Cite sources when possible.',
        icon: '🔬',
        category: 'productivity',
    },
];

interface TemplateState {
    templates: ConversationTemplate[];
    currentTemplate: ConversationTemplate;
    setTemplate: (templateId: string) => void;
    addCustomTemplate: (template: Omit<ConversationTemplate, 'id'>) => void;
    removeTemplate: (templateId: string) => void;
}

export const useTemplateStore = create<TemplateState>()(
    persist(
        (set, get) => ({
            templates: DEFAULT_TEMPLATES,
            currentTemplate: DEFAULT_TEMPLATES[0], // Default to General Assistant

            setTemplate: (templateId: string) => {
                const template = get().templates.find((t) => t.id === templateId);
                if (template) {
                    set({ currentTemplate: template });
                }
            },

            addCustomTemplate: (template) => {
                const newTemplate: ConversationTemplate = {
                    ...template,
                    id: `custom-${Date.now()}`,
                };
                set((state) => ({
                    templates: [...state.templates, newTemplate],
                }));
            },

            removeTemplate: (templateId: string) => {
                // Don't allow removing default templates
                if (DEFAULT_TEMPLATES.find((t) => t.id === templateId)) {
                    return;
                }
                set((state) => ({
                    templates: state.templates.filter((t) => t.id !== templateId),
                }));
            },
        }),
        {
            name: 'gnani-templates',
        }
    )
);
