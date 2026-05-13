import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowLeft, Target, Layers, Code2, Clock, Star } from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import { Card } from '@/components/ui/Card';
import { useTypewriter } from '@/hooks/useTypewriter';

const domains = [
  { id: 'computer-vision', label: 'رؤية حاسوبية', icon: Target },
  { id: 'nlp', label: 'معالجة لغات طبيعية', icon: Layers },
  { id: 'reinforcement', label: 'التعلم التعزيزي', icon: Sparkles },
  { id: 'generative', label: 'نماذج توليدية', icon: Target },
];

export default function GeneratorPage() {
  const [interests, setInterests] = useState('');
  const [skillLevel, setSkillLevel] = useState('beginner');
  const [domain, setDomain] = useState('computer-vision');
  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState<any>(null);

  const handleGenerate = async () => {
    if (!interests.trim()) return;
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setProject({
      title: 'نظام تحليل المشاعر لللغات العربية',
      description: 'بناء نموذج ذكاء اصطناعي لتحليل مشاعر النصوص العربية من وسائل التواصل الاجتماعي باستخدام Transformers.',
      objectives: ['تعلم معالجة اللغة العربية', 'فهم تمثيلات النصوص', 'بناء نماذج التكييف', 'تقييم نماذج التصنيف'],
      implementation: ['جمع وتنظيف البيانات', 'معالجة النصوص العربية', 'بناء النموذج باستخدام Transformers', 'التدريب والتقييم'],
      tools: ['Python', 'Transformers', 'PyTorch', 'FastAPI', 'React'],
      timeline: '4-6 أسابيع',
      difficulty: 'متوسط',
    });
    setLoading(false);
  };

  return (
    <>
      {!project ? (
        <Card className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <Sparkles size={48} className="text-masar-magenta mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-masar-text mb-2">مولد مشاريع AI</h2>
            <p className="text-masar-text-muted">أخبرنا باهتماماتك ومهاراتك، وسنقترح لك مشروعاً مميزاً</p>
          </div>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-masar-text flex items-center gap-2"><Target size={16} className="text-masar-magenta" /> مجالات اهتمامك</label>
              <input type="text" value={interests} onChange={(e) => setInterests(e.target.value)} placeholder="مثال: رؤية حاسوبية، معالجة لغات..." className="w-full px-4 py-3 rounded-xl bg-masar-bg/50 border border-masar-border/50 text-masar-text focus:outline-none focus:border-masar-cyan/50" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-masar-text flex items-center gap-2"><Layers size={16} className="text-masar-magenta" /> مستوى المهارة</label>
              <div className="grid grid-cols-3 gap-3">
                {['beginner', 'intermediate', 'advanced'].map((level) => (
                  <button key={level} onClick={() => setSkillLevel(level)} className={`p-3 rounded-xl border transition-all ${skillLevel === level ? 'bg-masar-magenta/10 border-masar-magenta/30 text-masar-text' : 'bg-masar-bg/30 border-masar-border/40 text-masar-text-muted'}`}>{level === 'beginner' ? 'مبتدئ' : level === 'intermediate' ? 'متوسط' : 'متقدم'}</button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-masar-text flex items-center gap-2"><Code2 size={16} className="text-masar-magenta" /> المجال التقني</label>
              <div className="grid grid-cols-2 gap-3">
                {domains.map((d) => (
                  <button key={d.id} onClick={() => setDomain(d.id)} className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${domain === d.id ? 'bg-masar-magenta/10 border-masar-magenta/30 text-masar-text' : 'bg-masar-bg/30 border-masar-border/40 text-masar-text-muted'}`}>
                    <d.icon size={20} className="text-masar-magenta" />
                    <span className="text-sm font-medium">{d.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <Button variant="neon" size="lg" fullWidth onClick={handleGenerate} disabled={loading || !interests.trim()}>
              {loading ? <Sparkles size={18} className="animate-spin" /> : <Sparkles size={18} />}
              {loading ? 'جاري التوليد...' : 'توليد فكرة المشروع'}
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          <Button variant="ghost" size="sm" onClick={() => setProject(null)} startIcon={<ArrowLeft size={16} />}>العودة</Button>
          <Card>
            <div className="text-center mb-8">
              <Sparkles size={64} className="text-masar-magenta mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-masar-text mb-2">{project.title}</h2>
              <p className="text-masar-text-muted max-w-2xl mx-auto">{project.description}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {[{ label: 'المدة التقديرية', value: project.timeline, icon: Clock }, { label: 'الصعوبة', value: project.difficulty, icon: Layers }, { label: 'التقييم', value: 'ممتاز', icon: Star }].map((item, i) => (
                <div key={i} className="text-center p-4 rounded-xl bg-masar-bg/30 border border-masar-border/30">
                  <item.icon size={24} className="text-masar-cyan mx-auto mb-2" />
                  <p className="text-sm text-masar-text-muted">{item.label}</p>
                  <p className="font-bold text-masar-text">{item.value}</p>
                </div>
              ))}
            </div>
          </Card>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <h3 className="text-lg font-bold text-masar-text mb-4 flex items-center gap-2"><Target size={20} className="text-masar-cyan" /> الأهداف التعليمية</h3>
              <ul className="space-y-3">{project.objectives.map((o: string, i: number) => <li key={i} className="flex items-start gap-3"><div className="w-6 h-6 rounded-full bg-masar-blue/20 flex items-center justify-center flex-shrink-0"><span className="text-xs font-bold text-masar-cyan">{i+1}</span></div><p className="text-sm text-masar-text">{o}</p></li>)}</ul>
            </Card>
            <Card>
              <h3 className="text-lg font-bold text-masar-text mb-4 flex items-center gap-2"><Code2 size={20} className="text-masar-cyan" /> خطوات التنفيذ</h3>
              <div className="space-y-3">{project.implementation.map((step: string, i: number) => <div key={i} className="flex items-start gap-3"><div className="w-8 h-8 rounded-lg bg-masar-blue/20 flex items-center justify-center"><span className="text-sm font-bold text-masar-cyan">{i+1}</span></div><p className="text-sm text-masar-text">{step}</p></div>)}</div>
            </Card>
          </div>
          <div className="flex items-center justify-center gap-4">
            <Button variant="neon" size="lg" onClick={() => setProject(null)}>توليد فكرة جديدة</Button>
            <Button variant="outline" size="lg">حفظ المشروع</Button>
          </div>
        </div>
      )}
    </>
  );
}
