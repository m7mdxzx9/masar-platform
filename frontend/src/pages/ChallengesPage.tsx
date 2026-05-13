import { useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Keyboard, Clock, Star } from 'lucide-react'

const challenges = [
  {
    id: 'lr_01',
    title: 'Alphabet Warrior',
    description: 'أكمل تهجئة أول 20 مصطلحًا تقنيًا إنجليزيًا في أقل من دقيقة',
    difficulty: 'easy',
    points: 100,
    words: [
      { word: 'algorithm', hint: 'خطوات محددة لحل مشكلة' },
      { word: 'regression', hint: 'تنبؤ بقيم مستمرة' },
      { word: 'gradient', hint: 'ميل أو انحدار' },
      { word: 'neural', hint: 'متعلق بالخلايا العصبية' },
      { word: 'perceptron', hint: 'وحدة عصبية صناعية بسيطة' },
    ],
  },
  {
    id: 'lr_02',
    title: 'Tech Terminator',
    description: 'أكمل تهجئة 30 مصطلحًا متقدمًا في مجال الذكاء الاصطناعي',
    difficulty: 'medium',
    points: 200,
    words: [],
  },
  {
    id: 'lr_03',
    title: 'AI Professor',
    description: 'أكمل تهجئة 50 مصطلحًا احترافيًا في أقل من 3 دقائق',
    difficulty: 'hard',
    points: 500,
    words: [],
  },
]

const leaderboard = [
  { rank: 1, name: 'AhmedK', score: 15420, achievements: 12 },
  { rank: 2, name: 'Fatima_AI', score: 14850, achievements: 11 },
  { rank: 3, name: 'DevOmar', score: 14200, achievements: 10 },
  { rank: 4, name: 'SaraML', score: 13800, achievements: 9 },
  { rank: 5, name: 'Khalid_DS', score: 12400, achievements: 8 },
]

export default function ChallengesPage() {
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(null)
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'finished'>('idle')
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [input, setInput] = useState('')
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(60)
  const [results, setResults] = useState<{ word: string; correct: boolean }[]>([])

  const currentChallenge = challenges.find((c) => c.id === selectedChallenge)

  const startGame = (challengeId: string) => {
    setSelectedChallenge(challengeId)
    setGameState('playing')
    setCurrentWordIndex(0)
    setInput('')
    setScore(0)
    setTimeLeft(60)
    setResults([])
  }

  const handleSubmit = () => {
    if (!currentChallenge || !currentChallenge.words[currentWordIndex]) return

    const currentWord = currentChallenge.words[currentWordIndex]
    const isCorrect = input.toLowerCase().trim() === currentWord.word.toLowerCase()

    setResults((prev) => [...prev, { word: currentWord.word, correct: isCorrect }])
    if (isCorrect) setScore((prev) => prev + 10)
    setInput('')

    if (currentWordIndex + 1 < currentChallenge.words.length) {
      setCurrentWordIndex((prev) => prev + 1)
    } else {
      setGameState('finished')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit()
  }

  if (gameState === 'playing' && currentChallenge) {
    const currentWordData = currentChallenge.words[currentWordIndex]

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-2xl mx-auto text-center space-y-8"
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-masar-warning" />
            <span className="text-2xl font-bold">{timeLeft}s</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-masar-cyan" />
            <span className="text-2xl font-bold">{score}</span>
          </div>
        </div>

        <div className="card p-8">
          <p className="text-masar-text-muted mb-4">تهجئة الكلمة:</p>
          <h2 className="text-4xl font-bold text-masar-cyan mb-4">{currentWordData?.word}</h2>
          <p className="text-masar-text-dark mb-6">💡 {currentWordData?.hint}</p>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="input text-center text-2xl w-64"
            placeholder="اكتب الكلمة..."
            autoFocus
          />
          <button onClick={handleSubmit} className="btn-primary mt-4 px-8">
            التالي
          </button>
        </div>

        <p className="text-masar-text-muted">
          {currentWordIndex + 1} / {currentChallenge.words.length}
        </p>
      </motion.div>
    )
  }

  if (gameState === 'finished') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-2xl mx-auto text-center space-y-6 card p-8"
      >
        <h2 className="text-3xl font-bold">انتهت اللعبة!</h2>
        <p className="text-5xl font-bold text-masar-cyan">{score} نقطة</p>
        <div className="text-right space-y-2">
          {results.map((r, i) => (
            <div key={i} className={`flex justify-between ${r.correct ? 'text-masar-success' : 'text-masar-error'}`}>
              <span>{r.word}</span>
              <span>{r.correct ? '✓' : '✗'}</span>
            </div>
          ))}
        </div>
        <button onClick={() => setGameState('idle')} className="btn-primary px-8">
          العب مرة أخرى
        </button>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <h1 className="text-3xl font-bold">التحديات</h1>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            تحديات سباق الحروف
          </h2>
          {challenges.map((challenge) => (
            <div key={challenge.id} className="card card-glow p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold">{challenge.title}</h3>
                <span className={`px-2 py-1 rounded text-xs ${
                  challenge.difficulty === 'easy' ? 'bg-masar-success/20 text-masar-success' :
                  challenge.difficulty === 'medium' ? 'bg-masar-warning/20 text-masar-warning' :
                  'bg-masar-error/20 text-masar-error'
                }`}>
                  {challenge.difficulty}
                </span>
              </div>
              <p className="text-masar-text-muted text-sm mb-4">{challenge.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-masar-cyan">{challenge.points} نقطة</span>
                <button
                  onClick={() => startGame(challenge.id)}
                  className="btn-primary px-4 text-sm"
                >
                  ابدأ
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-masar-warning" />
            لوحة المتصدرين
          </h2>
          <div className="space-y-3">
            {leaderboard.map((player) => (
              <div
                key={player.rank}
                className={`flex items-center gap-3 p-2 rounded ${
                  player.rank <= 3 ? 'bg-masar-warning/10' : ''
                }`}
              >
                <span className={`w-8 h-8 flex items-center justify-center rounded-full font-bold ${
                  player.rank === 1 ? 'bg-yellow-500 text-black' :
                  player.rank === 2 ? 'bg-gray-400 text-black' :
                  player.rank === 3 ? 'bg-amber-600 text-white' :
                  'bg-masar-surface'
                }`}>
                  {player.rank}
                </span>
                <div className="flex-1">
                  <p className="font-medium">{player.name}</p>
                  <p className="text-xs text-masar-text-muted">{player.achievements} إنجازات</p>
                </div>
                <span className="text-masar-cyan font-bold">{player.score.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}