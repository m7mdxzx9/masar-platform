import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
export default function NotFoundPage() { return <div className="not-found"><Compass size={56} /><p>404</p><h1>هذه الصفحة غير موجودة</h1><p>يمكنك العودة إلى مساحتك الدراسية أو البحث عن القسم المطلوب.</p><Link className="primary-action" to="/dashboard">العودة إلى لوحة التحكم</Link></div> }
