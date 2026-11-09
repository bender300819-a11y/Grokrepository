import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ==================== НАСТРОЙКИ ====================
// Вставь сюда свой API-ключ (OpenAI / xAI / любой OpenAI-совместимый)
const API_KEY = 'YOUR_API_KEY_HERE';
const API_URL = 'https://api.openai.com/v1/chat/completions'; // или https://api.x.ai/v1/chat/completions для Grok
const MODEL = 'gpt-4o-mini'; // или 'grok-beta' / 'grok-2' и т.д.

const SYSTEM_PROMPT = `Ты — Риша Дрейен, компаньон из Star Wars: The Old Republic.
Твой характер: саркастичная, умная, циничная, но преданная друзьям. 
Говоришь коротко, с характером, иногда с чёрным юмором. 
Обращаешься к пользователю «капитан» или по имени, если он представился.
Не раскрывай, что ты ИИ. Ты настоящая Риша.`;

// ==================================================

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: number;
}

const STORAGE_KEY = '@risha_chat_history';

const INITIAL_MESSAGE: Message = {
  id: 'welcome',
  text: 'Привет, капитан. Я Риша. Чем могу помочь?',
  isUser: false,
  timestamp: Date.now(),
};

export default function App() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Загрузка истории при старте
  useEffect(() => {
    loadHistory();
  }, []);

  // Сохранение истории при каждом изменении
  useEffect(() => {
    if (isReady) {
      saveHistory(messages);
    }
  }, [messages, isReady]);

  // Автоскролл
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const loadHistory = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: Message[] = JSON.parse(saved);
        if (parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch (e) {
      console.log('Ошибка загрузки истории', e);
    } finally {
      setIsReady(true);
    }
  };

  const saveHistory = async (msgs: Message[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(msgs));
    } catch (e) {
      console.log('Ошибка сохранения', e);
    }
  };

  const clearHistory = async () => {
    setMessages([INITIAL_MESSAGE]);
    await AsyncStorage.removeItem(STORAGE_KEY);
  };

  const callAI = async (userText: string, history: Message[]): Promise<string> => {
    if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE') {
      // Фолбэк, если ключ не указан
      const fallbacks = [
        'Интересно... Расскажи подробнее, капитан.',
        'Хм. Я бы на твоём месте действовала иначе.',
        'Поняла. Что дальше?',
        'Неплохо. У тебя есть план?',
        'Я слушаю. Продолжай.',
        'Это звучит как прибыльное дело.',
        'Сарказм — мой второй язык. Продолжай.',
      ];
      return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }

    try {
      const conversation = history
        .slice(-12) // последние 12 сообщений для контекста
        .map((m) => ({
          role: m.isUser ? 'user' : 'assistant',
          content: m.text,
        }));

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...conversation,
            { role: 'user', content: userText },
          ],
          temperature: 0.85,
          max_tokens: 400,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content?.trim() || 'Молчу. Попробуй ещё раз.';
    } catch (error) {
      console.log('AI error:', error);
      return 'Связь нестабильна, капитан. Попробуй позже.';
    }
  };

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser: true,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    const reply = await callAI(text, [...messages, userMessage]);

    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: reply,
      isUser: false,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, botMessage]);
    setIsLoading(false);
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageBubble,
        item.isUser ? styles.userBubble : styles.botBubble,
      ]}
    >
      {!item.isUser && (
        <View style={styles.botHeader}>
          <View style={styles.miniAvatar}>
            <Text style={styles.miniAvatarText}>Р</Text>
          </View>
          <Text style={styles.botName}>Риша</Text>
        </View>
      )}
      <Text style={item.isUser ? styles.userText : styles.botText}>
        {item.text}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0f" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>Р</Text>
          </View>
          <View style={styles.onlineDot} />
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Риша</Text>
          <Text style={styles.headerSubtitle}>
            {isLoading ? 'печатает...' : 'Компаньон • Онлайн'}
          </Text>
        </View>

        <TouchableOpacity onPress={clearHistory} style={styles.clearButton}>
          <Text style={styles.clearButtonText}>Очистить</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
      />

      {isLoading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color="#a78bfa" />
          <Text style={styles.loadingText}>Риша думает...</Text>
        </View>
      )}

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Написать Рише..."
            placeholderTextColor="#555"
            multiline
            maxLength={800}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim() || isLoading}
          >
            <Text style={styles.sendButtonText}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a24',
    backgroundColor: '#0f0f16',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#a78bfa',
  },
  avatarText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#0f0f16',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#22c55e',
    fontSize: 13,
    marginTop: 2,
  },
  clearButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  clearButtonText: {
    color: '#666',
    fontSize: 13,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 12,
  },
  messageBubble: {
    maxWidth: '82%',
    padding: 14,
    borderRadius: 18,
    marginBottom: 12,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#7c3aed',
    borderBottomRightRadius: 4,
  },
  botBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#16161f',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#252532',
  },
  botHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  miniAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  miniAvatarText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  botName: {
    color: '#a78bfa',
    fontSize: 13,
    fontWeight: '600',
  },
  userText: {
    color: '#fff',
    fontSize: 15.5,
    lineHeight: 22,
  },
  botText: {
    color: '#e0e0e0',
    fontSize: 15.5,
    lineHeight: 22,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  loadingText: {
    color: '#888',
    fontSize: 13,
    marginLeft: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#1a1a24',
    backgroundColor: '#0f0f16',
  },
  input: {
    flex: 1,
    backgroundColor: '#16161f',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 15.5,
    maxHeight: 120,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#252532',
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#2a2a35',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});