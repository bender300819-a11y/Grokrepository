# Risha Companion

AI-компаньон «Риша» — персональный помощник и собеседник в стиле персонажа из *Star Wars: The Old Republic*.

## Возможности

- Чат с Ришей (характер: саркастичная, умная, циничная)
- Поддержка настоящего ИИ через API (OpenAI / xAI Grok / любой OpenAI-совместимый)
- Сохранение истории чата (AsyncStorage)
- Красивый тёмный интерфейс
- Готово к сборке APK и AAB для Google Play

## Быстрый старт

```bash
git clone https://github.com/bender300819-a11y/Grokrepository.git
cd Grokrepository
npm install
npx expo start
```

## Подключение настоящего ИИ

Открой файл `App.tsx` и замени:

```ts
const API_KEY = 'YOUR_API_KEY_HERE';
const API_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o-mini';
```

На свои значения.  
Примеры:
- OpenAI: `https://api.openai.com/v1/chat/completions` + модель `gpt-4o-mini`
- xAI Grok: `https://api.x.ai/v1/chat/completions` + модель `grok-beta` или `grok-2`

Если ключ не указан — приложение работает на простых заготовленных ответах.

## Сборка для Google Play

1. Установи EAS CLI:
```bash
npm install -g eas-cli
eas login
```

2. Настрой проект:
```bash
eas build:configure
```

3. Собери APK (для теста):
```bash
eas build --platform android --profile preview
```

4. Собери AAB (для публикации в Google Play):
```bash
eas build --platform android --profile production
```

После сборки Expo даст ссылку на скачивание файла.

## Структура проекта

- `App.tsx` — весь интерфейс и логика
- `app.json` — настройки приложения
- `eas.json` — профили сборки
- `package.json` — зависимости

## Что можно улучшить дальше

- Добавить настоящий аватар (картинку)
- Голосовой ввод / озвучка
- Темы оформления
- Облачная синхронизация истории

---

Создано с помощью Grok.