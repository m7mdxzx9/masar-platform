import { useState } from 'react'
import { motion } from 'framer-motion'

const courses = [
  {
    id: 1,
    title: 'الشبكات العصبية العميقة',
    description: 'تعلم كيفية بناء وتدريب الشبكات العصبية للتعلم العميق',
    modules: 24,
    completed: 18,
    difficulty: 'متقدم',
    category: 'deep-learning',
  },
  {
    id: 2,
    title: 'التعلم الآلي المتقدم',
    description: 'خوارزميات متقدمة بما في ذلك SVM, Random Forest, Gradient Boosting',
    modules: 32,
    completed: 14,
    difficulty: 'متوسط',
    category: 'ml',
  },
  {
    id: 3,
    title: 'معالجة اللغات الطبيعية',
    description: 'تقنيات NLP من Transformers إلى chatbots',
    modules: 18,
    completed: 4,
    difficulty: 'متوسط',
    category: 'nlp',
  },
  {
    id: 4,
    title: 'الرؤية الحاسوبية',
    description: 'تحليل الصور والفيديو باستخدام الشبكات العصبية الالتفافية',
    modules: 20,
    completed: 0,
    difficulty: 'متقدم',
    category: 'cv',
  },
]

const categories = ['الكل', 'deep-learning', 'ml', 'nlp', 'cv']
const difficulties = ['الكل', 'مبتدئ', 'متوسط', 'متقدم']

export default function LearningPage() {
  const [selectedCategory, setSelectedCategory] = useState('الكل')
  const [selectedDifficulty, setSelectedDifficulty] = useState('الكل')

  const filtered = courses.filter((c) => {
    if (selectedCategory !== 'الكل' && c.category !== selectedCategory) return false
    if (selectedDifficulty !== 'الكل' && c.difficulty !== selectedDifficulty) return false
    return true
  })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <h1 className="text-3xl font-bold">مسارات التعلم</h1>

      <div className="flex gap-4 flex-wrap">
        <div>
          <label className="text-sm text-masar-text-muted mb-1 block">الفئة</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input w-48"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm text-masar-text-muted mb-1 block">الصعوبة</label>
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="input w-48"
          >
            {difficulties.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      <motion.div
        className="grid grid-cols-2 gap-4"
        layout
      >
        {filtered.map((course) => (
          <motion.div
            key={course.id}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="card card-glow cursor-pointer"
          >
            <div className="flex justify-between items-start mb-3">
              <span className={`px-2 py-1 rounded text-xs ${
                course.difficulty === 'متقدم' ? 'bg-masar-error/20 text-masar-error' :
                course.difficulty === 'متوسط' ? 'bg-masar-warning/20 text-masar-warning' :
                'bg-masar-success/20 text-masar-success'
              }`}>
                {course.difficulty}
              </span>
              <span className="text-masar-text-muted text-sm">
                {course.completed}/{course.modules} درس
              </span>
            </div>
            <h3 className="text-lg font-semibold mb-2">{course.title}</h3>
            <p className="text-masar-text-muted text-sm mb-4">{course.description}</p>
            <div className="h-2 bg-masar-bg rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-masar-blue to-masar-cyan rounded-full"
                style={{ width: `${(course.completed / course.modules) * 100}%` }}
              />
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  )
}
