import { motion } from 'framer-motion'

const stats = [
  { label: 'الدورات المكتملة', value: '12', icon: '📚', color: 'text-masar-cyan' },
  { label: 'ساعات التعلم', value: '48', icon: '⏱️', color: 'text-masar-success' },
  { label: 'نقاط التحدي', value: '2,450', icon: '🏆', color: 'text-masar-warning' },
  { label: 'السل streak', value: '7', icon: '🔥', color: 'text-masar-error' },
]

const recentCourses = [
  { id: 1, title: 'الشبكات العصبية العميقة', progress: 75, total: 24 },
  { id: 2, title: 'التعلم الآلي المتقدم', progress: 45, total: 32 },
  { id: 3, title: 'معالجة اللغات الطبيعية', progress: 20, total: 18 },
]

const recentActivity = [
  { type: 'course', text: 'أكملت درس Backpropagation', time: 'منذ ساعتين' },
  { type: 'lab', text: 'نفذت كود Python في المختبر', time: 'منذ 4 ساعات' },
  { type: 'challenge', text: 'أكملت تحدي Alphabet Warrior', time: 'منذ يوم' },
  { type: 'agent', text: 'تحدثت مع معلم الرياضيات', time: 'منذ يوم' },
]

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, type: 'spring', stiffness: 100 } },
}

export default function DashboardPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">مرحباً، الطالب!</h1>
        <span className="text-masar-text-muted">الثلاثاء، 9 يناير 2026</span>
      </div>

      <motion.div
        className="grid grid-cols-4 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {stats.map((stat) => (
          <motion.div
            key={stat.label}
            variants={itemVariants}
            className="card p-4"
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">{stat.icon}</span>
              <div>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-sm text-masar-text-muted">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-2 gap-6">
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-xl font-semibold mb-4">الدورات الحالية</h2>
          <div className="space-y-4">
            {recentCourses.map((course) => (
              <div key={course.id} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{course.title}</span>
                  <span className="text-masar-cyan">{course.progress}/{course.total}</span>
                </div>
                <div className="h-2 bg-masar-bg rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-masar-blue to-masar-cyan rounded-full transition-all"
                    style={{ width: `${(course.progress / course.total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-xl font-semibold mb-4">النشاط الأخير</h2>
          <div className="space-y-3">
            {recentActivity.map((activity, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="text-lg">
                  {activity.type === 'course' ? '📖' : activity.type === 'lab' ? '💻' : activity.type === 'challenge' ? '🎮' : '🤖'}
                </span>
                <div className="flex-1">
                  <p>{activity.text}</p>
                  <p className="text-masar-text-dark">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
