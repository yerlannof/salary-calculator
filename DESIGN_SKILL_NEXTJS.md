# DESIGN SKILL — GameOver Salary Calculator (Next.js)

## 🎯 ОБЛАСТЬ РАБОТЫ

**ТОЛЬКО ФАЗА 1 — КАЛЬКУЛЯТОР ЗП**

Не трогать:
- Фаза 2 (team-sales, рейтинг команды)
- Фаза 3 (employee, данные сотрудника)
- API routes
- Синхронизацию с МойСклад
- Supabase логику

Работаем только с:
- `src/app/page.tsx` — главная страница калькулятора
- `src/components/` — компоненты калькулятора
- `src/app/globals.css` — стили
- `tailwind.config.ts` — конфиг Tailwind

---

## 📋 ЧТО СДЕЛАТЬ СНАЧАЛА

**Перед любыми изменениями:**

1. **Изучи структуру проекта:**
   ```bash
   # Посмотри все компоненты
   ls -la src/components/
   
   # Посмотри главную страницу
   cat src/app/page.tsx
   
   # Посмотри текущие стили
   cat src/app/globals.css
   cat tailwind.config.ts
   ```

2. **Используй Context7** для проверки актуального синтаксиса:
   - framer-motion (анимации)
   - next-themes (темы)
   - tailwindcss (стили)
   - next/font (шрифты)

3. **Сохрани текущую логику:**
   - Формулы расчёта зарплат
   - Прогрессивную шкалу (3%, 4%, 5%, 7%, 8%, 9%)
   - Sticky-поведение ползунка
   - Реактивное обновление значений
   - Переключение локаций/должностей

---

## ⚠️ КРИТИЧЕСКИ ВАЖНО — НЕ ТРОГАТЬ ФУНКЦИОНАЛ

Вся логика расчётов остаётся **БЕЗ ИЗМЕНЕНИЙ**!

### Что сохранить обязательно:
- Формулы расчёта зарплат
- Прогрессивную шкалу процентов
- Оклады по должностям
- Sticky-поведение ползунка (остаётся видимым при скролле)
- Реактивное обновление всех значений при изменении ползунка
- Переключение между локациями/должностями
- Все существующие фичи и UX-решения

### Что улучшаем:
- Визуальный стиль (цвета, тени, градиенты)
- Анимации и переходы (60fps, без фризов)
- Типографику
- Добавляем тёмную/светлую тему
- Микровзаимодействия (hover, active, tap)
- Плавность всех анимаций

---

## 🎨 ПРОБЛЕМА ТЕКУЩЕГО ДИЗАЙНА

Сейчас дизайн выглядит как "Bootstrap шаблон" — функционально, но скучно:
- Плоский белый фон без глубины
- Случайные иконки (не единый стиль)
- Нет премиального ощущения
- Отсутствуют тени, свечение, градиенты
- Типичный "AI-generated UI"

## 🎯 ЦЕЛЬ

Сделать как **топовое fintech приложение** (Revolut, Cash App, Robinhood):
- Глубина и объём (не плоско!)
- Glassmorphism — стеклянные эффекты
- Неоновое свечение на акцентах
- Плавные микро-анимации
- Две темы (светлая/тёмная)

---

## 📦 УСТАНОВКА ЗАВИСИМОСТЕЙ

```bash
npm install next-themes
# framer-motion уже установлен
```

## 🔤 ШРИФТЫ (в layout.tsx)

```tsx
import { Unbounded, Manrope } from 'next/font/google'

const unbounded = Unbounded({ 
  subsets: ['cyrillic', 'latin'],
  variable: '--font-unbounded',
  weight: ['400', '600', '800'],
  display: 'swap',
})

const manrope = Manrope({ 
  subsets: ['cyrillic', 'latin'],
  variable: '--font-manrope',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

// В className body:
<body className={`${unbounded.variable} ${manrope.variable} font-sans`}>
```

---

## 🎨 CSS VARIABLES (globals.css)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* ===== LIGHT THEME ===== */
    --bg-primary: 248 249 252;
    --bg-secondary: 241 243 248;
    --bg-card: 255 255 255;
    
    --text-primary: 26 26 46;
    --text-secondary: 107 114 128;
    --text-muted: 156 163 175;
    
    --accent-primary: 16 185 129;
    --accent-secondary: 59 130 246;
    --accent-warning: 245 158 11;
    --accent-danger: 239 68 68;
    
    --border-subtle: 226 232 240;
    
    --shadow-soft: 0 4px 24px -4px rgb(0 0 0 / 0.08);
    --shadow-medium: 0 8px 32px -8px rgb(0 0 0 / 0.12);
    --shadow-glow: 0 0 40px rgb(16 185 129 / 0.2);
  }

  .dark {
    /* ===== DARK THEME ===== */
    --bg-primary: 10 10 15;
    --bg-secondary: 18 18 26;
    --bg-card: 24 24 36;
    
    --text-primary: 255 255 255;
    --text-secondary: 136 136 170;
    --text-muted: 85 85 102;
    
    --accent-primary: 0 255 136;
    --accent-secondary: 77 159 255;
    
    --border-subtle: 42 42 58;
    
    --shadow-soft: 0 4px 24px -4px rgb(0 0 0 / 0.4);
    --shadow-medium: 0 8px 32px -8px rgb(0 0 0 / 0.5);
    --shadow-glow: 0 0 60px rgb(0 255 136 / 0.25);
  }
}

/* ===== GRAIN TEXTURE OVERLAY ===== */
body::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  opacity: 0.015;
  pointer-events: none;
  z-index: 9999;
}

.dark body::before {
  opacity: 0.03;
}
```

---

## ⚙️ TAILWIND CONFIG (tailwind.config.ts)

```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-unbounded)', 'sans-serif'],
        sans: ['var(--font-manrope)', 'sans-serif'],
      },
      colors: {
        bg: {
          primary: 'rgb(var(--bg-primary) / <alpha-value>)',
          secondary: 'rgb(var(--bg-secondary) / <alpha-value>)',
          card: 'rgb(var(--bg-card) / <alpha-value>)',
        },
        text: {
          primary: 'rgb(var(--text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--text-secondary) / <alpha-value>)',
          muted: 'rgb(var(--text-muted) / <alpha-value>)',
        },
        accent: {
          primary: 'rgb(var(--accent-primary) / <alpha-value>)',
          secondary: 'rgb(var(--accent-secondary) / <alpha-value>)',
          warning: 'rgb(var(--accent-warning) / <alpha-value>)',
          danger: 'rgb(var(--accent-danger) / <alpha-value>)',
        },
        border: {
          subtle: 'rgb(var(--border-subtle) / <alpha-value>)',
        },
      },
      boxShadow: {
        'soft': 'var(--shadow-soft)',
        'medium': 'var(--shadow-medium)',
        'glow': 'var(--shadow-glow)',
      },
      backgroundImage: {
        'gradient-accent': 'linear-gradient(135deg, rgb(var(--accent-primary)) 0%, rgb(var(--accent-secondary)) 100%)',
      },
    },
  },
  plugins: [],
}

export default config
```

---

## 🏗️ КОМПОНЕНТЫ

### 1. Layout с фоновыми эффектами

```tsx
// components/AppBackground.tsx
'use client'

export function AppBackground() {
  return (
    <>
      {/* Gradient orbs - создают глубину */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-accent-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[400px] h-[400px] bg-accent-secondary/10 rounded-full blur-[100px] pointer-events-none" />
    </>
  )
}
```

### 2. Главная карточка зарплаты

```tsx
// components/SalaryCard.tsx
'use client'
import { motion } from 'framer-motion'

interface SalaryCardProps {
  salary: number
  base: number
  bonus: number
  level: string
  levelPercent: number
  progress: number // 0-100
}

export function SalaryCard({ salary, base, bonus, level, levelPercent, progress }: SalaryCardProps) {
  const circumference = 2 * Math.PI * 90
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-3xl bg-gradient-accent p-8"
    >
      {/* Glass overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none" />
      
      {/* Animated glow pulse */}
      <motion.div 
        className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(255,255,255,0.1)_0%,transparent_60%)] pointer-events-none"
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      
      <div className="relative z-10 flex flex-col items-center text-white">
        {/* Circular progress */}
        <div className="relative w-52 h-52 mb-6">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
            {/* Background circle */}
            <circle
              cx="100" cy="100" r="90"
              fill="none"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="12"
            />
            {/* Progress circle */}
            <motion.circle
              cx="100" cy="100" r="90"
              fill="none"
              stroke="white"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{ filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.5))' }}
            />
          </svg>
          
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xs uppercase tracking-widest opacity-80 mb-1">
              Зарплата
            </span>
            <motion.span
              key={salary}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl font-display font-extrabold"
            >
              {Math.round(salary / 1000)}к
            </motion.span>
            <span className="text-sm opacity-70 mt-1">
              {salary.toLocaleString('ru-RU')} ₸
            </span>
          </div>
        </div>
        
        {/* Base + Bonus pills */}
        <div className="flex items-center gap-3 mb-4">
          <span className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-sm">
            Оклад {base / 1000}к
          </span>
          <span className="text-white/50">+</span>
          <span className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-sm font-semibold">
            Бонус {(bonus / 1000).toFixed(1)}к
          </span>
        </div>
        
        {/* Level badge */}
        <div className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm flex items-center gap-2">
          <span className="text-lg">🎯</span>
          <span className="font-semibold">{level}</span>
          <span className="opacity-70">•</span>
          <span className="font-display font-bold">{levelPercent}%</span>
        </div>
      </div>
    </motion.div>
  )
}
```

### 3. Кастомный слайдер с glow

```tsx
// components/SalesSlider.tsx
'use client'
import { motion } from 'framer-motion'
import { useState } from 'react'

interface SalesSliderProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
}

export function SalesSlider({ 
  value, 
  onChange, 
  min = 0, 
  max = 6000000, 
  step = 50000 
}: SalesSliderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const percentage = ((value - min) / (max - min)) * 100

  return (
    <div className="bg-bg-card rounded-2xl p-6 shadow-soft border border-border-subtle">
      <div className="flex justify-between items-center mb-4">
        <span className="text-text-secondary">Продажи за месяц</span>
        <motion.span 
          key={value}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-2xl font-display font-bold text-text-primary"
        >
          {(value / 1000000).toFixed(2)} млн
        </motion.span>
      </div>
      
      {/* Custom slider */}
      <div className="relative h-3 mb-6">
        {/* Background track */}
        <div className="absolute inset-0 bg-bg-secondary rounded-full" />
        
        {/* Filled track with glow */}
        <motion.div 
          className="absolute inset-y-0 left-0 bg-gradient-accent rounded-full"
          style={{ width: `${percentage}%` }}
          animate={{ 
            width: `${percentage}%`,
            boxShadow: isDragging 
              ? '0 0 30px rgb(var(--accent-primary) / 0.5)' 
              : '0 0 20px rgb(var(--accent-primary) / 0.3)'
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
        
        {/* Native input (invisible) */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
        />
        
        {/* Custom thumb */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-7 h-7 bg-white rounded-full border-4 border-accent-primary pointer-events-none"
          style={{ left: `calc(${percentage}% - 14px)` }}
          animate={{ 
            scale: isDragging ? 1.2 : 1,
            boxShadow: isDragging 
              ? '0 0 30px rgb(var(--accent-primary) / 0.6)' 
              : '0 4px 12px rgb(0 0 0 / 0.15)'
          }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        />
      </div>
      
      {/* Quick select buttons */}
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((mil) => (
          <motion.button
            key={mil}
            onClick={() => onChange(mil * 1000000)}
            whileTap={{ scale: 0.95 }}
            className={`
              flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
              ${value >= mil * 1000000 && value < (mil + 1) * 1000000
                ? 'bg-gradient-accent text-white shadow-glow' 
                : 'bg-bg-secondary text-text-secondary hover:bg-bg-card hover:text-text-primary'
              }
            `}
          >
            {mil}М
          </motion.button>
        ))}
      </div>
    </div>
  )
}
```

### 4. Переключатель темы

```tsx
// components/ThemeToggle.tsx
'use client'
import { useTheme } from 'next-themes'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="relative w-14 h-8 bg-bg-secondary rounded-full p-1 transition-colors border border-border-subtle"
      aria-label="Toggle theme"
    >
      <motion.div
        className="w-6 h-6 bg-gradient-accent rounded-full shadow-medium flex items-center justify-center"
        animate={{ x: theme === 'dark' ? 24 : 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <span className="text-xs">
          {theme === 'dark' ? '🌙' : '☀️'}
        </span>
      </motion.div>
    </button>
  )
}
```

### 5. ThemeProvider (в layout.tsx)

```tsx
// app/layout.tsx
import { ThemeProvider } from 'next-themes'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${unbounded.variable} ${manrope.variable} font-sans`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

---

## ⚡ FRAMER MOTION — BEST PRACTICES (2024-2025)

### Производительность (60fps без фризов)

```tsx
// ✅ ХОРОШО — GPU-ускоренные свойства
<motion.div animate={{ x: 100, opacity: 1, scale: 1.1 }} />

// ❌ ПЛОХО — триггерят layout reflow
<motion.div animate={{ width: 200, height: 100, left: 50 }} />
```

### Оптимизация анимаций

```tsx
// Используй layoutId для shared element transitions
<motion.div layoutId="card" />

// Используй variants для переиспользования
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

// Stagger для списков (элементы появляются по очереди)
const container = {
  visible: {
    transition: { staggerChildren: 0.05 }
  }
}

// AnimatePresence для exit анимаций — КОРОТКИЕ!
<AnimatePresence mode="wait">
  {isVisible && (
    <motion.div
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }} // Максимум 150-200ms для exit
    />
  )}
</AnimatePresence>
```

### Spring физика (более естественно чем duration)

```tsx
// Для интерактивных элементов (кнопки, hover)
transition={{ type: "spring", stiffness: 400, damping: 25 }}

// Для появления контента
transition={{ type: "spring", stiffness: 300, damping: 30 }}

// Для плавных переходов
transition={{ type: "spring", stiffness: 200, damping: 25 }}
```

### willChange для GPU

```tsx
// Подсказка браузеру об анимируемых свойствах
<motion.div
  style={{ willChange: 'transform, opacity' }}
  animate={{ x: 100, opacity: 1 }}
/>
```

---

## 🎨 UI ТРЕНДЫ 2025 (что применить)

### 1. Glassmorphism — стеклянные карточки
```tsx
className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl"
```

### 2. Gradient Orbs — цветные размытые круги на фоне
```tsx
<div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-accent-primary/10 rounded-full blur-[120px]" />
```

### 3. Glow Effects — свечение на акцентных элементах
```tsx
className="shadow-glow" // 0 0 40px rgb(var(--accent-primary) / 0.2)
```

### 4. Microinteractions — анимации на каждое действие
```tsx
<motion.button
  whileHover={{ scale: 1.02, y: -2 }}
  whileTap={{ scale: 0.98 }}
  transition={{ type: "spring", stiffness: 400, damping: 25 }}
>
```

### 5. Grain Texture — лёгкий шум поверх всего (добавляет глубину)

### 6. Animated Numbers — цифры анимируются при изменении
```tsx
<motion.span
  key={value}
  initial={{ opacity: 0, y: -10 }}
  animate={{ opacity: 1, y: 0 }}
>
  {value}
</motion.span>
```

---

## ✅ ЧЕКЛИСТ ПЕРЕД КОММИТОМ

- [ ] Изучил структуру проекта перед изменениями
- [ ] Использовал Context7 для проверки синтаксиса библиотек
- [ ] Логика расчётов НЕ изменена
- [ ] Sticky ползунок работает как раньше
- [ ] Шрифты Unbounded + Manrope подключены через next/font
- [ ] CSS variables настроены для светлой и тёмной темы
- [ ] Переключатель темы работает корректно
- [ ] Gradient orbs на фоне (создают глубину)
- [ ] Grain texture overlay
- [ ] Главная карточка с gradient и glass эффектом
- [ ] Круговой прогресс анимируется плавно
- [ ] Слайдер кастомный с glow при drag
- [ ] Числа анимируются при изменении значений
- [ ] Все интерактивные элементы имеют hover/active состояния
- [ ] Анимации 60fps без фризов
- [ ] Проверено на мобильных устройствах
- [ ] TypeScript типизация корректная
- [ ] Нет дублирования кода

---

## 🔗 РЕФЕРЕНСЫ ДЛЯ ВДОХНОВЕНИЯ

- **Revolut** — fintech с премиальным UI
- **Cash App** — простота + стиль
- **Robinhood** — визуализация финансовых данных
- **Linear** — чистый минимализм, отличные анимации
- **Stripe Dashboard** — профессиональные дашборды

---

## 💬 ЧТО СКАЗАТЬ CLAUDE CODE

```
Прочитай файл DESIGN_SKILL_NEXTJS.md в корне проекта.

Задача: переделать визуал калькулятора ЗП (Фаза 1) по этому гайду.

ВАЖНО:
1. Сначала изучи структуру проекта (src/components, src/app/page.tsx)
2. Используй Context7 для проверки синтаксиса framer-motion, next-themes, tailwind
3. Логику расчётов НЕ ТРОГАТЬ — только визуал
4. Фазы 2 и 3 не трогать

Что сделать:
1. Добавить шрифты Unbounded + Manrope через next/font
2. Настроить CSS variables для светлой/тёмной темы  
3. Добавить gradient orbs на фон и grain texture
4. Переделать компоненты по примерам из файла
5. Добавить переключатель темы
6. Все анимации 60fps без фризов
```

---

*ТОЛЬКО ВИЗУАЛ! Логика расчётов не меняется!*
