import { Palette, PanelsTopLeft, CheckCheck } from "lucide-react";
import ThemeGallery, { ThemeSummary } from "@/components/ThemeGallery";

export default function AppearancePage() {
  return (
    <div className="page-stack appearance-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">تفاصيل صغيرة، تجربة مختلفة</span>
          <h1>
            صمّم مساحتك<span className="heading-dot">.</span>
          </h1>
          <p>أربع شخصيات بصرية، لكل منها طريقة مختلفة للتنقل والتعلم.</p>
        </div>
        <span className="appearance-mark">
          <Palette size={32} />
        </span>
      </div>
      <ThemeSummary />
      <ThemeGallery />
      <div className="appearance-notes">
        <div>
          <PanelsTopLeft size={20} />
          <p>
            <strong>تصميم يتغير بالكامل</strong>
            <span>التنقل، البطاقات، المسافات والخلفيات تتبع الثيم الذي تختاره.</span>
          </p>
        </div>
        <div>
          <CheckCheck size={20} />
          <p>
            <strong>اختيار محفوظ</strong>
            <span>تفتح الأقسام وتعود لاحقًا، وتجد مساحتك كما اخترتها.</span>
          </p>
        </div>
      </div>
    </div>
  );
}
