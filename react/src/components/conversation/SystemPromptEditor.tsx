import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { apiClient } from '../../api/apiClient';
import { Save } from 'lucide-react';
import Button from '../ui/Button';

interface PromptTemplate {
    id: string;
    name: string;
    description: string;
    prompt: string;
    category: string;
}

interface SystemPromptEditorProps {
    sessionId: string;
    currentPrompt: string;
    onUpdate: (newPrompt: string) => void;
}

const SystemPromptEditor: React.FC<SystemPromptEditorProps> = ({
    sessionId,
    currentPrompt,
    onUpdate
}) => {
    const { addToast } = useToast();
    const [prompt, setPrompt] = useState(currentPrompt);
    const [templates, setTemplates] = useState<PromptTemplate[]>([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const response = await import('../../utils/circuitBreaker').then(m => m.apiCircuitBreaker.execute(() =>
                    apiClient.get<{ templates: PromptTemplate[] }>('/conversations/prompt-templates')
                ));
                setTemplates(response.templates || []);
            } catch (error) {
                console.error('Failed to fetch templates:', error);
            }
        };
        fetchTemplates();
    }, []);

    const handleTemplateSelect = (template: PromptTemplate) => {
        setPrompt(template.prompt);
    };

    const handleSave = async () => {
        if (prompt.length > 2000) {
            addToast('System prompt must be less than 2000 characters', 'error');
            return;
        }

        setSaving(true);
        try {
            await import('../../utils/circuitBreaker').then(m => m.apiCircuitBreaker.execute(() =>
                apiClient.patch(`/conversations/${sessionId}/system-prompt`, {
                    systemPrompt: prompt
                })
            ));
            onUpdate(prompt);
            addToast('System prompt updated successfully', 'success');
        } catch (error) {
            addToast('Failed to update system prompt', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Template Selector */}
            <div className="space-y-2">
                <label className="text-xs font-mono text-jarvis-cyan/70 uppercase tracking-wider ml-1">
                    Template
                </label>
                <select
                    onChange={(e) => {
                        const template = templates.find(t => t.id === e.target.value);
                        if (template) handleTemplateSelect(template);
                    }}
                    className="w-full bg-jarvis-panel border-b-2 border-jarvis-border px-4 py-2 text-sm text-jarvis-text focus:outline-none focus:border-jarvis-blue focus:shadow-[0_4px_10px_-4px_rgba(0,240,255,0.3)] transition-all duration-300 rounded-t-sm"
                >
                    <option value="">Select a template...</option>
                    {templates.map(template => (
                        <option key={template.id} value={template.id}>
                            {template.name} - {template.description}
                        </option>
                    ))}
                </select>
            </div>

            {/* Prompt Editor */}
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <label className="text-xs font-mono text-jarvis-cyan/70 uppercase tracking-wider ml-1">
                        System Prompt
                    </label>
                    <span className={`text-xs font-mono ${prompt.length > 2000 ? 'text-red-400' : 'text-jarvis-cyan/50'}`}>
                        {prompt.length} / 2000
                    </span>
                </div>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={8}
                    maxLength={2000}
                    className="w-full bg-jarvis-panel border-2 border-jarvis-border px-4 py-3 text-sm text-jarvis-text focus:outline-none focus:border-jarvis-blue focus:shadow-[0_4px_10px_-4px_rgba(0,240,255,0.3)] transition-all duration-300 rounded-sm font-mono resize-none"
                    placeholder="Enter custom system prompt..."
                />
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button
                    onClick={handleSave}
                    disabled={saving || prompt.length > 2000}
                    isLoading={saving}
                    leftIcon={<Save size={18} />}
                >
                    Save Prompt
                </Button>
            </div>
        </div>
    );
};

export default SystemPromptEditor;
