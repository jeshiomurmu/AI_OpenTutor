"use client";

import { useState } from 'react';
import {
  Settings as SettingsIcon,
  User,
  Palette,
  Key,
  Bell,
  Shield,
  Download,
  Trash2,
  Globe,
  MessageSquare,
  Zap,
} from 'lucide-react';
import { useSettingsStore } from '@/lib/stores';
import { AI_MODELS, type AIProvider, type UserPreferences } from '@/lib/types';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ThemeToggle } from './theme-toggle';
import { useUIStore } from '@/lib/stores';

function PreferencesTab() {
  const { preferences, setPreferences } = useSettingsStore();

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Send on Enter</Label>
            <p className="text-xs text-muted-foreground">
              Press Enter to send message, Shift+Enter for new line
            </p>
          </div>
          <Switch
            checked={preferences.sendOnEnter}
            onCheckedChange={(checked) => setPreferences({ sendOnEnter: checked })}
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Show Citations</Label>
            <p className="text-xs text-muted-foreground">
              Display source citations in AI responses
            </p>
          </div>
          <Switch
            checked={preferences.showCitations}
            onCheckedChange={(checked) => setPreferences({ showCitations: checked })}
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Auto-generate Flashcards</Label>
            <p className="text-xs text-muted-foreground">
              Automatically create flashcards from key concepts
            </p>
          </div>
          <Switch
            checked={preferences.autoGenerateFlashcards}
            onCheckedChange={(checked) => setPreferences({ autoGenerateFlashcards: checked })}
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Auto-generate Quizzes</Label>
            <p className="text-xs text-muted-foreground">
              Automatically create quizzes after studying
            </p>
          </div>
          <Switch
            checked={preferences.autoGenerateQuizzes}
            onCheckedChange={(checked) => setPreferences({ autoGenerateQuizzes: checked })}
          />
        </div>

        <Separator />

        <div className="space-y-2">
          <Label>Font Size</Label>
          <Select
            value={preferences.fontSize}
            onValueChange={(value: UserPreferences['fontSize']) => setPreferences({ fontSize: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Small</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="large">Large</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Language</Label>
          <Select
            value={preferences.language}
            onValueChange={(value) => setPreferences({ language: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Spanish</SelectItem>
              <SelectItem value="fr">French</SelectItem>
              <SelectItem value="de">German</SelectItem>
              <SelectItem value="zh">Chinese</SelectItem>
              <SelectItem value="ja">Japanese</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

function AIProviderTab() {
  const { preferences, setPreferences } = useSettingsStore();
  const [newApiKey, setNewApiKey] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('openai');

  const models = AI_MODELS.filter((m) => m.provider === preferences.defaultProvider);

  const handleSaveApiKey = () => {
    if (!newApiKey.trim()) return;
    toast.success('API key saved successfully');
    setNewApiKey('');
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Default AI Provider</Label>
        <Select
          value={preferences.defaultProvider}
          onValueChange={(value: AIProvider) => {
            const defaultModel = AI_MODELS.find((m) => m.provider === value)?.id || '';
            setPreferences({ defaultProvider: value, defaultModel });
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="openai">OpenAI</SelectItem>
            <SelectItem value="anthropic">Anthropic</SelectItem>
            <SelectItem value="google">Google</SelectItem>
            <SelectItem value="groq">Groq</SelectItem>
            <SelectItem value="deepseek">DeepSeek</SelectItem>
            <SelectItem value="openrouter">OpenRouter</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Default Model</Label>
        <Select
          value={preferences.defaultModel}
          onValueChange={(value) => setPreferences({ defaultModel: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {models.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                <div className="flex items-center gap-2">
                  <span>{model.name}</span>
                  {model.supportsVision && (
                    <Badge variant="outline" className="text-xs">Vision</Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>Bring Your Own Key (BYOK)</Label>
            <p className="text-xs text-muted-foreground">
              Use your own API keys for more control
            </p>
          </div>
        </div>

        <div className="grid gap-4">
          <Select
            value={selectedProvider}
            onValueChange={(value: AIProvider) => setSelectedProvider(value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="openai">OpenAI</SelectItem>
              <SelectItem value="anthropic">Anthropic</SelectItem>
              <SelectItem value="google">Google</SelectItem>
              <SelectItem value="groq">Groq</SelectItem>
              <SelectItem value="deepseek">DeepSeek</SelectItem>
              <SelectItem value="openrouter">OpenRouter</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Input
              type="password"
              placeholder={`Enter your ${selectedProvider} API key`}
              value={newApiKey}
              onChange={(e) => setNewApiKey(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleSaveApiKey} disabled={!newApiKey.trim()}>
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AppearanceTab() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Theme</Label>
        <ThemeToggle />
      </div>

      <Separator />

      <div className="space-y-4">
        <Label>Accent Color</Label>
        <div className="flex gap-2">
          {['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899'].map((color) => (
            <button
              key={color}
              className="h-8 w-8 rounded-full transition-all hover:scale-110 ring-offset-background focus:ring-2 focus:ring-offset-2"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function PrivacyTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Analytics</Label>
          <p className="text-xs text-muted-foreground">
            Help improve the platform with anonymous usage data
          </p>
        </div>
        <Switch defaultChecked />
      </div>

      <Separator />

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Crash Reports</Label>
          <p className="text-xs text-muted-foreground">
            Automatically send crash reports to help fix issues
          </p>
        </div>
        <Switch defaultChecked />
      </div>

      <Separator />

      <div className="space-y-4">
        <div>
          <Label>Export Your Data</Label>
          <p className="text-xs text-muted-foreground mb-2">
            Download all your conversations, documents, and flashcards
          </p>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <div>
          <Label className="text-destructive">Delete Account</Label>
          <p className="text-xs text-muted-foreground mb-2">
            Permanently delete your account and all associated data
          </p>
          <Button variant="destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Account
          </Button>
        </div>
      </div>
    </div>
  );
}

export function SettingsModal() {
  const { isSettingsOpen, closeSettings } = useUIStore();

  return (
    <Dialog open={isSettingsOpen} onOpenChange={(open) => {
      if (!open) closeSettings();
    }}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="preferences" className="w-full">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="preferences" className="text-xs sm:text-sm">
              <MessageSquare className="mr-2 h-4 w-4 hidden sm:inline" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="ai" className="text-xs sm:text-sm">
              <Zap className="mr-2 h-4 w-4 hidden sm:inline" />
              AI
            </TabsTrigger>
            <TabsTrigger value="appearance" className="text-xs sm:text-sm">
              <Palette className="mr-2 h-4 w-4 hidden sm:inline" />
              Theme
            </TabsTrigger>
            <TabsTrigger value="privacy" className="text-xs sm:text-sm">
              <Shield className="mr-2 h-4 w-4 hidden sm:inline" />
              Privacy
            </TabsTrigger>
          </TabsList>

          <div className="mt-4 overflow-y-auto max-h-[50vh]">
            <TabsContent value="preferences" className="mt-0">
              <PreferencesTab />
            </TabsContent>

            <TabsContent value="ai" className="mt-0">
              <AIProviderTab />
            </TabsContent>

            <TabsContent value="appearance" className="mt-0">
              <AppearanceTab />
            </TabsContent>

            <TabsContent value="privacy" className="mt-0">
              <PrivacyTab />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
