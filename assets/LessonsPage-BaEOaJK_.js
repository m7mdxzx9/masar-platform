import{e as fe,g as be,j as e,S as g,G as Re,i as E,B as Ae,q as Pe,P as Oe,r as Te,t as me,v as K,n as qe,M as De,w as Ie}from"./index-CrsNbkor.js";import{b as n}from"./react-vendor-C_eMylfm.js";import{u as Ee}from"./usePyodide-PvzqCFle.js";import{M as Fe}from"./MarkdownRenderer-B8G637tw.js";import{B as pe}from"./book-marked-COW4PYty.js";import{C as Ge}from"./circle-help-uAApXRY3.js";import{C as he}from"./circle-check-Bfq3ZSPJ.js";import{C as ge}from"./circle-x-WBS7LXdg.js";import{C as ee}from"./code-CUY4vnXb.js";import{C as Be}from"./copy-CzMCAcEv.js";import{M as Ue}from"./mic-off-h0oWUqN4.js";import{S as He}from"./send-DCcYzHio.js";import"./pyodide-zWOYUi3f.js";import"./save-CTeNTUC8.js";/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ve=[["path",{d:"M15 3h6v6",key:"1q9fwt"}],["path",{d:"M10 14 21 3",key:"gplh6r"}],["path",{d:"M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",key:"a6xqqp"}]],Je=fe("ExternalLink",Ve);/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Qe=[["path",{d:"M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17",key:"1q2vi4"}],["path",{d:"m10 15 5-3-5-3z",key:"1jp15x"}]],We=fe("Youtube",Qe),O=[{id:1,title:"المتغيرات وأنواع البيانات في بايثون",category:"programming",description:"تعرف على كيفية تخزين البيانات وتعريف المتغيرات البرمجية وأنواعها الأساسية بالتفصيل.",difficulty:"easy",content:'### المتغيرات وأنواع البيانات (Variables & Data Types)\n\nالمتغيرات هي بمثابة صناديق أو حاويات نستخدمها لتخزين البيانات في ذاكرة الكمبيوتر أثناء تشغيل البرنامج. في لغة بايثون، لا تحتاج لتحديد نوع المتغير مسبقاً (مثل لغة C++ أو Java)؛ حيث تفهم بايثون النوع تلقائياً بناءً على القيمة التي تضعها فيه.\n\n#### الأنواع الأساسية للبيانات في بايثون:\n1. **الأعداد الصحيحة (Integer - `int`):** الأعداد بدون فواصل عشرية مثل `10`, `-5`, `0`.\n2. **الأعداد العشرية (Floating Point - `float`):** الأعداد التي تحتوي على فاصلة عشرية مثل `3.14`, `-0.5`.\n3. **النصوص (String - `str`):** أي نص يوضع بين علامات تنصيص مفردة `\'` أو مزدوجة `"` مثل `"Masar"` أو `\'مرحباً بالذكاء الاصطناعي\'`.\n4. **القيم المنطقية (Boolean - `bool`):** تأخذ قيمتين فقط إما صحيحة `True` أو خاطئة `False` (لاحظ الحرف الأول الكبير).\n\n#### مقارنة أنواع البيانات:\n| نوع البيانات | الاختصار | مثال | الاستخدام الشائع |\n| :--- | :--- | :--- | :--- |\n| صحيح | int | 42 | العدادات، الفهارس |\n| عشري | float | 0.99 | الاحتمالات، قيم الأوزان |\n| نصي | str | "AI" | معالجة اللغات الطبيعية |\n| منطقي | bool | True | الشروط والتحكم |\n\n#### طريقة التسمية والاستخدام:\n* نستخدم علامة `=` لإسناد القيمة للمتغير.\n* أسماء المتغيرات حساسة لحالة الأحرف (فمثلاً `x` يختلف عن `X`).\n* لا يمكن بدء اسم المتغير برقم أو استخدام مسافات.\n\n**جرب تشغيل الكود في المحرر أدناه وشاهد النتيجة!** يمكنك التعديل على الكود وطباعة متغيرات جديدة.',defaultCode:`# تعريف متغيرات بأنواع مختلفة
x = 10                  # عدد صحيح
y = 3.14                # عدد عشري
name = "منصة مسار"      # نص
is_beginner = True      # قيمة منطقية

# طباعة المتغيرات ونوع كل منها باستخدام دالة type()
print("قيمة x هي:", x, "ونوعها هو:", type(x))
print("قيمة y هي:", y, "ونوعها هو:", type(y))
print("الاسم هو:", name, "ونوعه هو:", type(name))
print("هل أنا مبتدئ؟", is_beginner, "ونوع المتغير:", type(is_beginner))

# جرب تعديل الكود لتقوم بحساب مجموع x + y وطباعته!
`,externalResources:[{title:"دورة بايثون للمبتدئين - FreeCodeCamp",url:"https://www.youtube.com/watch?v=rfscVS0vtbw",platform:"youtube"},{title:"Python for Everybody - University of Michigan",url:"https://www.coursera.org/learn/python",platform:"coursera"}]},{id:2,title:"الشروط وحلقات التكرار",category:"programming",description:"تعلم التحكم في مسار البرنامج باستخدام جمل الشرط وحلقات التكرار لتكرار العمليات بكفاءة.",difficulty:"easy",content:`### الشروط وحلقات التكرار (Control Flow & Loops)

تسمح لنا الشروط والتكرار بجعل البرنامج ذكياً وقادراً على اتخاذ القرارات بناءً على المعطيات، وتكرار المهام دون إعادة كتابة الأكواد.

#### 1. الجمل الشرطية (\`if - elif - else\`):
نستخدمها لفحص شرط معين وتنفيذ كود بناءً عليه.
* \`if\`: الشرط الأول الأساسي.
* \`elif\`: (اختصار لـ else if) شروط إضافية إذا لم يتحقق الشرط الأول.
* \`else\`: يُنفذ إذا لم تتحقق جميع الشروط السابقة.
* **ملاحظة هامة:** تعتمد بايثون على **المسافات البادئة (Indentation)** لتحديد الأكواد التابعة للشرط (عادة 4 مسافات).

#### 2. حلقات التكرار (\`Loops\`):
* **حلقة \`for\`:** تستخدم لتكرار كود لعدد معين من المرات أو للمرور على عناصر مجموعة (مثل قائمة). نستخدم دالة \`range(start, end)\` لتوليد سلسلة أرقام.
* **حلقة \`while\`:** تستخدم للتكرار طالما أن هناك شرطاً معيناً لا يزال صحيحاً (\`True\`).

| نوع الحلقة | الاستخدام الأمثل | مثال |
| :--- | :--- | :--- |
| for | تكرار محدد بعدد مرات معروف مسبقاً | المرور على عناصر مصفوفة |
| while | تكرار مستمر حتى يتحقق شرط التوقف | حلقة عمل الوكيل الذكي (Agent Loop) |

**شاهد الكود أدناه وجرب تشغيله لمعرفة الأعداد الزوجية والفردية!**`,defaultCode:`# مثال يجمع بين حلقة التكرار والجمل الشرطية
print("بدء تصنيف الأعداد:")

# تكرار الأرقام من 1 إلى 9
for number in range(1, 10):
    # فحص ما إذا كان العدد يقبل القسمة على 2
    if number % 2 == 0:
        print(f"العدد {number} هو عدد زوجي (Even)")
    else:
        print(f"العدد {number} هو عدد فردي (Odd)")

print("تم الانتهاء من التكرار!")
`,externalResources:[{title:"شرح حلقات التكرار والشروط في بايثون",url:"https://www.youtube.com/watch?v=6iF8Xb7Z3dI",platform:"youtube"},{title:"Python Data Structures - University of Michigan",url:"https://www.coursera.org/learn/python-databases",platform:"coursera"}]},{id:3,title:"الدوال والموديولات",category:"programming",description:"كيفية كتابة أكواد منظمة وقابلة لإعادة الاستخدام باستخدام الدوال واستيراد المكتبات الخارجية.",difficulty:"easy",content:"### الدوال والموديولات (Functions & Modules)\n\nالدالة هي مجموعة من الأسطر البرمجية المرتبة معاً لتأدية مهمة محددة، نقوم بتعريفها مرة واحدة ويمكننا تشغيلها (استدعاؤها) أي عدد من المرات في أماكن مختلفة من البرنامج.\n\n#### مكونات الدالة في بايثون:\n1. كلمة `def` تليها اسم الدالة.\n2. **الوسائط (Parameters):** المدخلات التي تمرر للدالة وتكتب داخل القوسين `()`.\n3. **جسم الدالة (Indented Block):** الأكواد التي ستنفذها الدالة.\n4. **جملة الإرجاع (`return`):** النتيجة النهائية التي تعيدها الدالة عند استدعائها.\n\n#### الموديولات والمكتبات (`Modules`):\nالموديول هو ملف يحتوي على أكواد جاهزة ودوال قام مبرمجون آخرون بكتابتها. يمكننا استخدامها مباشرة باستخدام الأمر `import`. على سبيل المثال موديول `math` للعمليات الرياضية أو `random` لتوليد أرقام عشوائية.\n\n**مثال تفاعلي:** دالة لحساب معدل درجات مادة الذكاء الاصطناعي واستيراد موديول للعمليات الرياضية.",defaultCode:`# استيراد مكتبة الرياضيات الجاهزة
import math

# تعريف دالة لحساب المتوسط الحسابي لقائمة أرقام
def calculate_mean(numbers_list):
    total_sum = sum(numbers_list)
    count = len(numbers_list)
    return total_sum / count

# درجات الطالب في الاختبارات
student_grades = [88, 92, 79, 95, 85]

# استدعاء الدالة وحفظ النتيجة
mean_grade = calculate_mean(student_grades)
print("المتوسط الحسابي للدرجات هو:", mean_grade)

# استخدام موديول math لحساب الجذر التربيعي للمعدل
sqrt_mean = math.sqrt(mean_grade)
print(f"الجذر التربيعي للمعدل هو: {sqrt_mean:.2f}")
`,externalResources:[{title:"دليل الدوال والموديولات في بايثون",url:"https://www.youtube.com/watch?v=9Os0o3wzS_I",platform:"youtube"},{title:"Introduction to Python - Coursera",url:"https://www.coursera.org/learn/python-programming-introduction",platform:"coursera"}]},{id:4,title:"هياكل البيانات: القوائم والقواميس",category:"programming",description:"تعرف على هياكل البيانات الأساسية في بايثون لتخزين وتنظيم مجموعات البيانات بكفاءة.",difficulty:"medium",content:`### هياكل البيانات (Lists & Dictionaries)

في البرمجة وتحديداً في الذكاء الاصطناعي، نادراً ما نتعامل مع متغير واحد بسيط. نحن بحاجة لهياكل بيانات قادرة على تخزين آلاف أو ملايين البيانات (مثل ميزات الصور، نصوص المحاضرات، أو أوزان الشبكة العصبية).

#### 1. القوائم (Lists - \`[]\`):
سلسلة مرتبة من العناصر يمكن تغييرها. نصل لعناصرها عن طريق **الفهرس (Index)** والذي يبدأ دائماً من **الرقم 0**.
* مثال: \`fruits = ["apple", "banana", "cherry"]\`
* للوصول لأول عنصر: \`fruits[0]\`

#### 2. القواميس (Dictionaries - \`{}\`):
هيكل بيانات يخزن القيم على شكل **مفتاح وقيمة (Key-Value Pair)**. هو ممتاز لتخزين خصائص كائن معين أو إعدادات الشبكات العصبية.
* مثال: \`model = {"type": "Regression", "accuracy": 0.95}\`
* للوصول للقة: \`model["accuracy"]\`

**شاهد كيف نستخدم القوائم والقواميس لتمثيل معطيات عصبون اصطناعي (Neuron) في الكود أدناه!**`,defaultCode:`# قائمة تحتوي على قيم المدخلات (Inputs) لعصبون
inputs = [1.5, 2.0, -0.5]

# قائمة تحتوي على الأوزان المقابلة لها (Weights)
weights = [0.8, -0.4, 1.2]

# قاموس يمثل نموذج الذكاء الاصطناعي بالكامل
neural_layer = {
    "layer_name": "Input_to_Hidden",
    "inputs": inputs,
    "weights": weights,
    "bias": 0.5
}

print("اسم الطبقة العصبية:", neural_layer["layer_name"])
print("المدخل الثاني للطبقة:", neural_layer["inputs"][1]) # لاحظ الـ Index 1 هو العنصر الثاني

# جرب تعديل قيمة الانحياز (bias) في القاموس وطباعة القاموس بالكامل!
`,externalResources:[{title:"شرح القوائم والقواميس في بايثون بالتفصيل",url:"https://www.youtube.com/watch?v=9OeznAkyQz4",platform:"youtube"},{title:"Python Data Structures Course - Coursera",url:"https://www.coursera.org/learn/python-data",platform:"coursera"}]},{id:5,title:"البرمجة كائنية التوجه (OOP)",category:"programming",description:"مفهوم الفئات (Classes) والكائنات (Objects) وكيفية استخدامها لبناء بنى نماذج الذكاء الاصطناعي.",difficulty:"medium",content:`### البرمجة كائنية التوجه (Object-Oriented Programming - OOP)

البرمجة كائنية التوجه هي أسلوب برمجة يهدف لتنظيم الكود وجعله قابلاً للتوسع وإعادة الاستخدام من خلال تقسيم البرنامج إلى وحدات تسمى **كائنات (Objects)**. الكائن هو نسخة حقيقية من مخطط عام يسمى **الفئة (Class)**.

#### المفاهيم الأساسية:
1. **الفئة (Class):** القالب أو المخطط الرئيسي (مثل كتابة مواصفات عامة لنموذج الذكاء الاصطناعي).
2. **الكائن (Object):** التطبيق الفعلي أو النموذج المستنسخ من الفئة (مثل إنشاء نموذج ذكاء اصطناعي محدد للتصنيف).
3. **الدالة البنائية (\`__init__\`):** دالة تُنفذ تلقائياً عند إنشاء الكائن لتهيئة المتغيرات الأساسية (الخصائص - Attributes).
4. **الميثودز (Methods):** دوال معرفة داخل الـ Class تمثل الأفعال التي يمكن للكائن القيام بها (مثل تدريب النموذج أو التنبؤ).

في مكتبات الذكاء الاصطناعي مثل PyTorch، يتم تمثيل كل نموذج عصبي كـ Class يرث من فئة رئيسية (\`nn.Module\`).

**في المثال أدناه، سنبني كلاس يمثل عصبوناً اصناعياً بسيطاً (Perceptron) من الصفر:**`,defaultCode:`# تعريف فئة (Class) تمثل عصبوناً اصطناعياً
class Perceptron:
    def __init__(self, num_inputs):
        # تهيئة الأوزان بقيم افتراضية (مثلاً 0.5) والانحياز بقيمة 0.0
        self.weights = [0.5] * num_inputs
        self.bias = 0.0
        print(f"تم إنشاء عصبون يستقبل {num_inputs} مدخلات.")

    # ميثود لحساب مخرجات العصبون (الانتشار الأمامي)
    def predict(self, inputs):
        # حاصل ضرب المدخلات في الأوزان + الانحياز
        total_sum = sum(i * w for i, w in zip(inputs, self.weights)) + self.bias
        # دالة تفعيل بسيطة: إرجاع 1 إذا كان المجموع موجباً، وإلا 0
        return 1 if total_sum > 0 else 0

# إنشاء كائن (Object) لعصبون يستقبل مدخلين (مثلا ميزتين لخلية سرطان)
my_neuron = Perceptron(num_inputs=2)

# تجربة التنبؤ بمدخلات معينة
output = my_neuron.predict([1.0, -2.0])
print("مخرجات العصبون للمدخلات [1.0, -2.0] هي:", output)
`,externalResources:[{title:"مفهوم OOP والـ Classes في بايثون",url:"https://www.youtube.com/watch?v=JeznW_7DlB0",platform:"youtube"},{title:"Object-Oriented Programming in Python - Coursera",url:"https://www.coursera.org/learn/object-oriented-python",platform:"coursera"}]},{id:6,title:"المتجهات والضرب النقطي (Linear Algebra)",category:"math",description:"المعادلة الأساسية لحساب المدخلات في الشبكات العصبية وكيفية تمثيل البيانات كمتجهات.",difficulty:"easy",content:`### المتجهات والضرب النقطي (Vectors & Dot Product)

المتجهات (Vectors) هي العمود الفقري لتمثيل البيانات في الذكاء الاصطناعي. فكل صورة، كلمة، أو قيمة دراسية تتحول في النهاية إلى سلسلة أرقام مرتبة نسميها "متجه".

#### ما هو الضرب النقطي (Dot Product)؟
إذا كان لدينا متجهين بنفس الطول، فإن الضرب النقطي بينهما هو حاصل ضرب كل عنصر من المتجه الأول بالعنصر المقابل له من المتجه الثاني، ثم جمع النواتج معاً للحصول على رقم واحد ثابت (Scalar).

#### المعادلة الرياضية للضرب النقطي:
$$\\vec{a} \\cdot \\vec{b} = a_1 b_1 + a_2 b_2 + \\dots + a_n b_n = \\sum_{i=1}^{n} a_i b_i$$

#### كيفية استخدامه في الشبكات العصبية:
يستقبل كل عصبون اصطناعي متجه مدخلات (inputs) ويرتبط بمتجه أوزان (weights) يمثل أهمية كل مدخل. العملية الأولى والأساسية التي ينفذها العصبون هي **الضرب النقطي** بين متجه المدخلات ومتجه الأوزان، ثم يضاف إليه قيمة الانحياز (bias):
$$\\text{Neuron Input} = (\\vec{x} \\cdot \\vec{w}) + b$$

**شاهد الكود أدناه وجرب تشغيل كود حساب مخرجات العصبون رياضياً يدوياً في بايثون:**`,defaultCode:`# تمثيل المدخلات والأوزان كمتجهات (قوائم في بايثون)
inputs = [2.5, 1.2, 0.8]   # مثلاً: عدد ساعات المذاكرة، الحضور، درجات الواجب
weights = [0.4, 0.3, 0.1]  # الأوزان المقابلة لأهمية كل مدخل
bias = 0.2                  # الانحياز لضبط توازن النموذج

# 1. حساب الضرب النقطي يدوياً باستخدام حلقة التكرار
dot_product = 0
for i in range(len(inputs)):
    dot_product += inputs[i] * weights[i]

# 2. إضافة الانحياز للحصول على القيمة النهائية
neuron_sum = dot_product + bias

print("متجه المدخلات (x):", inputs)
print("متجه الأوزان (w):", weights)
print("------------------------------")
print("حاصل الضرب النقطي (x · w) =", dot_product)
print("مخرجات العصبون قبل التفعيل (x · w + b) =", neuron_sum)
`,externalResources:[{title:"فهم الجبر الخطي والضرب النقطي - 3Blue1Brown",url:"https://www.youtube.com/watch?v=fNk_zzaMoEs",platform:"youtube"},{title:"Mathematics for Machine Learning: Linear Algebra - Coursera",url:"https://www.coursera.org/learn/machine-learning-linear-algebra",platform:"coursera"}]},{id:7,title:"دوال التنشيط (Activation Functions)",category:"math",description:"شرح معادلتي Sigmoid و ReLU ودورهما الأساسي في إدخال الخصائص اللاخطية للشبكات العصبية.",difficulty:"medium",content:`### دوال التنشيط (Activation Functions)

إذا قمنا فقط بالضرب النقطي وجمع الأوزان، فسنحصل دائماً على معادلة خطية (خط مستقيم). الشبكات الخطية لا يمكنها تعلم العلاقات المعقدة في العالم الحقيقي (مثل تمييز وجوه البشر أو قيادة السيارات). هنا يأتي دور **دوال التنشيط** التي تضفي **اللاخطية (Non-linearity)** على النموذج.

#### أهم دوال التنشيط المستخدمة:

#### 1. دالة السجمويد (Sigmoid Function):
تحول أي رقم حقيقي إلى قيمة تقع بين **0 و 1**. وهي ممتازة لتمثيل الاحتماليات (مثل: احتمالية أن تكون الرسالة البريدية سبام).
* **المعادلة:**
$$\\sigma(x) = \\frac{1}{1 + e^{-x}}$$
(حيث $e$ هو العدد النيبيري ويساوي تقريباً $2.718$).

#### 2. دالة وحدة الخطية المصححة (ReLU):
الدالة الأكثر شهرة واستخداماً في الشبكات العصبية العميقة. إذا كانت القيمة سالبة تحولها إلى 0، وإذا كانت موجبة تبقيها كما هي.
* **المعادلة:**
$$\\text{ReLU}(x) = \\max(0, x)$$

| الدالة | المعادلة | المدى (Output Range) | الاستخدام الشائع |
| :--- | :--- | :--- | :--- |
| Sigmoid | 1 / (1 + e^-x) | [0, 1] | الطبقة الأخيرة للتصنيف الثنائي |
| ReLU | max(0, x) | [0, inf) | الطبقات المخفية العميقة |

**شاهد كيف تقوم الدوال بتعديل القيم في الكود التالي وتشغيله:**`,defaultCode:`# استيراد مكتبة الرياضيات لاستخدام الدالة الأسيّة e
import math

def sigmoid(x):
    return 1 / (1 + math.exp(-x))

def relu(x):
    return max(0, x)

# قيم اختبارية (سالبة وموجبة وصفر)
test_values = [-3.0, 0.0, 2.5]

print("تطبيق الدوال على القيم التجريبية:")
print("---------------------------------")
for val in test_values:
    print(f"القيمة الأصلية: {val}")
    print(f"  -> Sigmoid({val}) = {sigmoid(val):.4f}")
    print(f"  -> ReLU({val}) = {relu(val):.4f}")
    print()
`,externalResources:[{title:"دوال التفعيل وشرحها رياضياً وبرمجياً",url:"https://www.youtube.com/watch?v=m0pIlLfpXWE",platform:"youtube"},{title:"Deep Learning Specialization (Neural Networks) - Andrew Ng",url:"https://www.coursera.org/learn/neural-networks-deep-learning",platform:"coursera"}]},{id:8,title:"قياس التشابه الجيب تمامي (Cosine Similarity)",category:"math",description:"المعادلة الرياضية لقياس نسبة التشابه بين النصوص والمتجهات في محركات البحث وأنظمة الـ RAG.",difficulty:"medium",content:`### تشابه جيب التمام (Cosine Similarity)

يعد قياس التشابه بين متجهات البيانات أحد أهم التطبيقات في الذكاء الاصطناعي، خصوصاً في **أنظمة الـ RAG (استرجاع المستندات للذكاء الاصطناعي)** ومحركات البحث. عندما تقوم بكتابة سؤال، يحوله النظام إلى متجه ويقارنه بمتجهات المحاضرات المخزنة لمعرفة المستند الأكثر شبهاً بسؤالك.

#### ما هو تشابه جيب التمام؟
يقيس الزاوية بين متجهين في الفضاء بغض النظر عن حجمهما أو طولهما. وتتراوح النتيجة بين:
* **1:** المتجهان متطابقان تماماً في الاتجاه (تشابه كامل).
* **0:** المتجهان متعامدان (لا يوجد تشابه بينهما).
* **-1:** المتجهان متعاكسان تماماً في الاتجاه.

#### المعادلة الرياضية:
$$\\text{Cosine Similarity}(A, B) = \\frac{A \\cdot B}{\\|A\\| \\|B\\|} = \\frac{\\sum_{i=1}^{n} A_i B_i}{\\sqrt{\\sum_{i=1}^{n} A_i^2} \\sqrt{\\sum_{i=1}^{n} B_i^2}}$$

حيث يمثل البسط الضرب النقطي، ويمثل المقام جداء طول (المعيار L2) المتجهين.

**شاهد تطبيق المعادلة برمجياً لمقارنة جملتين تم تحويلهما لمتجهات مبسطة:**`,defaultCode:`# استيراد مكتبة الرياضيات لحساب الجذور التربيعية
import math

def cosine_similarity(vector_a, vector_b):
    # 1. حساب الضرب النقطي (البسط)
    dot_product = sum(x * y for x, y in zip(vector_a, vector_b))
    
    # 2. حساب معيار المتجه الأول (طول المتجه A)
    magnitude_a = math.sqrt(sum(x**2 for x in vector_a))
    
    # 3. حساب معيار المتجه الثاني (طول المتجه B)
    magnitude_b = math.sqrt(sum(y**2 for y in vector_b))
    
    # تجنب القسمة على صفر
    if magnitude_a == 0 or magnitude_b == 0:
        return 0.0
        
    # 4. حساب التشابه الجيب تمامي
    return dot_product / (magnitude_a * magnitude_b)

# متجهان يمثلان معاني جملتين (مثلا: "تعلم الآلة ممتاز" و "الذكاء الاصطناعي رائع")
sentence_1 = [0.9, 0.1, 0.2, 0.0]
sentence_2 = [0.85, 0.15, 0.18, 0.05]
# متجه لجملة مختلفة تماما (مثلا: "الطقس حار اليوم")
sentence_different = [0.05, 0.0, 0.1, 0.95]

sim_1_2 = cosine_similarity(sentence_1, sentence_2)
sim_1_diff = cosine_similarity(sentence_1, sentence_different)

print(f"التشابه بين الجملة 1 والجملة 2: {sim_1_2:.4f} (نسبة تشابه عالية)")
print(f"التشابه بين الجملة 1 والجملة المختلفة: {sim_1_diff:.4f} (نسبة تشابه منخفضة)")
`,externalResources:[{title:"Cosine Similarity and Vector Databases Explained",url:"https://www.youtube.com/watch?v=e9U0QGPJYMI",platform:"youtube"},{title:"Natural Language Processing in TensorFlow - Coursera",url:"https://www.coursera.org/learn/natural-language-processing-tensorflow",platform:"coursera"}]},{id:9,title:"حساب التفاضل والاشتقاق للتعلم (Calculus & Derivatives)",category:"math",description:"شرح مفهوم المشتقة وميل المنحنى وكيف يتم استخدامه لتوجيه نماذج الذكاء الاصطناعي لتقليل الأخطاء.",difficulty:"hard",content:`### حساب التفاضل والاشتقاق (Calculus & Derivatives)

التفاضل (Calculus) هو لغة التغيير. في التعلم الآلي، لا نستخدم التفاضل لحل معادلات معقدة يدوياً، بل نستخدمه لمعرفة **اتجاه ومقدار التغيير المطلوب** في أوزان النموذج لكي يتحسن أداؤه.

#### ما هي المشتقة (Derivative)؟
المشتقة $f'(x)$ تخبرنا بمعدل تغير قيمة الدالة بالنسبة للتغير in its inputs (ميل المماس للمنحنى عند نقطة ما).
* إذا كان الميل **موجباً**، فهذا يعني أن زيادة المدخل $x$ ستزيد من مخرجات الدالة.
* إذا كان الميل **صفراً**، فهذا يعني أننا وصلنا إلى قمة أو قاع المنحنى (نقطة حرجة).

#### الاستخدام في الذكاء الاصطناعي (Gradient):
خلال تدريب الشبكة العصبية، نقوم بحساب مشتقة دالة الخطأ (Loss) بالنسبة لكل وزن في الشبكة (نسمي هذا الاشتقاق المتعدد بالـ Gradient: $\\frac{\\partial L}{\\partial w}$). هذا الاشتقاق يخبرنا بالضبط كيف نعدل الأوزان لنقلل نسبة الخطأ ونصل لأفضل دقة ممكنة.

**في الكود أدناه سنحسب مشتقة دالة تربيعية بسيطة ونرى كيف تخبرنا باتجاه الحركة:**`,defaultCode:`# تعريف دالة تربيعية بسيطة: f(x) = x^2
def f(x):
    return x ** 2

# المشتقة الرياضية للدالة f(x) = x^2 هي: f'(x) = 2x
def derivative_f(x):
    return 2 * x

# سنقوم بحساب ميل المنحنى عند نقاط مختلفة
points = [-3.0, 0.0, 3.0]

print("حساب ميل المنحنى (المشتقة):")
print("----------------------------")
for pt in points:
    slope = derivative_f(pt)
    print(f"عند النقطة x = {pt}:")
    print(f"  -> قيمة الدالة f(x) = {f(pt):.2f}")
    print(f"  -> مشتقة الدالة f'(x) (الميل) = {slope:.2f}")
    if slope < 0:
        print("  * التوجيه: الميل سالب، التحرك لليمين (زيادة x) يقلل قيمة الدالة.")
    elif slope > 0:
        print("  * التوجيه: الميل موجب، التحرك لليسار (تقليل x) يقلل قيمة الدالة.")
    else:
        print("  * التوجيه: الميل صفر، لقد وصلنا لأقل قيمة ممكنة للدالة (القاع)!")
    print()
`,externalResources:[{title:"جوهر حساب التفاضل والاشتقاق - 3Blue1Brown",url:"https://www.youtube.com/watch?v=WUvTyaaNkzM",platform:"youtube"},{title:"Mathematics for Machine Learning: Multivariate Calculus - Coursera",url:"https://www.coursera.org/learn/multivariate-calculus-machine-learning",platform:"coursera"}]},{id:10,title:"دوال الخسارة والانحدار التدريجي (Optimization)",category:"math",description:"الخوارزمية الذهبية لتدريب النماذج وتقليص الأخطاء خطوة بخطوة بناءً على حساب متوسط مربعات الخطأ.",difficulty:"hard",content:`### دوال الخسارة والانحدار التدريجي (Loss Functions & Gradient Descent)

هذا هو الدرس الختامي الذي يجمع كل ما تعلمناه! كيف يتعلم الذكاء الاصطناعي فعلياً؟ الإجابة تكمن في دمج **دوال الخسارة** مع **خوارزميات التحسين**.

#### 1. دالة الخسارة (Loss Function):
تقيس مدى جودة أو سوء توقعات النموذج مقارنة بالقيم الحقيقية. من أشهر الدوال للقيم المستمرة هي **متوسط مربعات الخطأ (Mean Squared Error - MSE)**:
$$\\text{MSE} = \\frac{1}{N} \\sum_{i=1}^{N} (y_i - \\hat{y}_i)^2$$
(حيث $y_i$ هي القيمة الحقيقية و $\\hat{y}_i$ هي توقع النموذج). نريد دائماً جعل هذه القيمة أقرب ما يمكن للصفر.

#### 2. الانحدار التدريجي (Gradient Descent):
هي خوارزمية تحديث الأوزان تدريجياً لتقليل قيمة دالة الخسارة. نقوم بطرح جزء من المشتقة (مضروباً في سرعة التعلم $\\eta$ - Learning Rate) من الأوزان الحالية:
$$w_{\\text{new}} = w_{\\text{old}} - \\eta \\frac{\\partial L}{\\partial w}$$

**شاهد محاكاة حقيقية لتدريب نموذج (تحديث وزن واحد لتقليص الخطأ خطوة بخطوة):**`,defaultCode:`# محاكاة تدريب عصبون بسيط لتعلم وزن واحد
# الهدف: نريد أن يتعلم النموذج الوزن (w) الذي يجعل توقعاته قريبة من القيمة الحقيقية (target)

w = 10.0            # الوزن الأولي (بداية عشوائية خاطئة جداً)
target = 3.0        # القيمة الصحيحة المستهدفة للوزن
learning_rate = 0.1  # سرعة التعلم (خطوة الحركة)

print(f"بدء التدريب... الوزن الأولي w = {w}")
print("الهدف هو الوصول للوزن المثالي w = 3.0")
print("------------------------------------------")

# سنقوم بعمل 10 دورات تدريبية (Epochs)
for epoch in range(1, 11):
    # 1. حساب قيمة الخطأ (Loss) وهو مربع الفرق: Loss = (w - target)^2
    loss = (w - target) ** 2
    
    # 2. حساب المشتقة بالنسبة لـ w: dLoss/dw = 2 * (w - target)
    gradient = 2 * (w - target)
    
    # 3. تحديث الوزن بالاتجاه المعاكس للمشتقة
    w = w - learning_rate * gradient
    
    print(f"الدورة {epoch:02d}: الخطأ (Loss) = {loss:7.4f} | الوزن الجديد w = {w:.4f}")
    
    # إذا أصبح الخطأ صغيراً جداً نتوقف
    if loss < 0.0001:
        print("-> تم الوصول لدرجة دقة عالية جداً!")
        break
`,externalResources:[{title:"شرح خوارزمية الانحدار التدريجي بالرسوم المتحركة",url:"https://www.youtube.com/watch?v=sDv4f4s2SB8",platform:"youtube"},{title:"Machine Learning Specialization by Andrew Ng - Coursera",url:"https://www.coursera.org/learn/machine-learning",platform:"coursera"}]},{id:11,title:"تجهيز البيانات ومعالجتها (Data Preprocessing)",category:"ai",description:"كيفية تحضير وتطبيع البيانات وتنظيفها وتجهيزها لتدريب نماذج الذكاء الاصطناعي بنجاح.",difficulty:"medium",content:`### تجهيز البيانات ومعالجتها (Data Preprocessing)

في هندسة الذكاء الاصطناعي، هناك قاعدة شهيرة تقول: **"القمامة في الداخل تعني القمامة في الخارج" (Garbage in, Garbage out)**. هذا يعني أنه مهما كان نموذجك ذكياً، فإذا قمت بتغذيته ببيانات سيئة أو غير منظمة، ستحصل على توقعات خاطئة تماماً.

#### المراحل الأساسية لتجهيز البيانات:
1. **معالجة القيم المفقودة (Handling Missing Values):** إما بحذفها أو استبدالها بمتوسط القيم.
2. **الترميز الرقمي (Encoding Categorical Data):** تحويل النصوص (مثل أسماء المدن أو الفئات) إلى أرقام تفهمها النماذج.
3. **تطبيع وتدريج الميزات (Feature Scaling / Normalization):** جعل كل القيم تقع في مدى محدد (مثل من 0 إلى 1 أو من -1 إلى 1). فمثلاً لا يصح مقارنة ميزة "العمر" (من 0 إلى 100) بميزة "الراتب" (من 1000 إلى 50,000) دون تدريج، لأن النموذج سيظن أن الراتب أهم بـ 500 ضعف لمجرد أن أرقامه أكبر!

#### طريقة التدريج الأسهل (Min-Max Scaling):
$$X_{\\text{scaled}} = \\frac{X - X_{\\text{min}}}{X_{\\text{max}} - X_{\\text{min}}}$$

**شاهد كيف نقوم بتجهيز ميزات درجات الطلاب وتطبيعها برمجياً:**`,defaultCode:`# درجات الطلاب الأصلية في الاختبارات (مجموع الدرجة العظمى 150 والدرجة الصغرى 50)
raw_grades = [55, 120, 145, 80, 100, 150, 50]

# حساب القيمة الصغرى والكبرى في البيانات
min_grade = min(raw_grades)
max_grade = max(raw_grades)

print(f"الدرجة الدنيا: {min_grade} | الدرجة العليا: {max_grade}")
print("-------------------------------------------------")

# تطبيق خوارزمية Min-Max Normalization
normalized_grades = []
for grade in raw_grades:
    # المعادلة: (درجة الطالب - أدنى درجة) / (أعلى درجة - أدنى درجة)
    norm = (grade - min_grade) / (max_grade - min_grade)
    normalized_grades.append(norm)

# عرض البيانات بعد تجهيزها وتطبيعها (الآن تقع كلها بين 0.0 و 1.0)
print("الدرجات الأصلية: ", raw_grades)
print("الدرجات المطبعة دلالياً:")
for raw, norm in zip(raw_grades, normalized_grades):
    print(f" الدرجة: {raw:3d}  ===>  المطبعة: {norm:.4f}")
`,externalResources:[{title:"Data Preprocessing in Python - YouTube",url:"https://www.youtube.com/watch?v=yZTBMMd2_80",platform:"youtube"},{title:"Data Preparation for Machine Learning - Coursera",url:"https://www.coursera.org/learn/data-preparation",platform:"coursera"}]},{id:12,title:"الشبكات العصبية الاصطناعية (Neural Networks)",category:"ai",description:"فهم البنية الأساسية للشبكة العصبية (طبقة المدخلات، الطبقات المخفية، المخرجات) والانتشار الأمامي.",difficulty:"hard",content:`### الشبكات العصبية الاصطناعية (Neural Networks)

الشبكة العصبية الاصطناعية (ANN) هي نموذج رياضي مستوحى من طريقة عمل الخلايا العصبية البيولوجية في دماغ الإنسان. تتكون الشبكة من طبقات مرتبة من الخلايا (Neurons):

1. **طبقة المدخلات (Input Layer):** تستقبل ميزات البيانات (مثلاً قيم ميزات صورة أو درجات طالب).
2. **الطبقات المخفية (Hidden Layers):** تقوم بمعالجة واستخراج الأنماط المعقدة من المدخلات.
3. **طبقة المخرجات (Output Layer):** تعطي النتيجة النهائية (توقع فئة معينة أو قيمة مستمرة).

#### ما هو الانتشار الأمامي (Forward Propagation)؟
هو العملية التي تتدفق فيها البيانات من طبقة المدخلات مروراً بالطبقات المخفية وصولاً لطبقة المخرجات. في كل طبقة، يتم حساب حاصل ضرب المدخلات بالأوزان (الضرب النقطي) مضافاً إليه الانحياز، ثم تمرير الناتج عبر دالة التنشيط (مثل ReLU) لتغذية الطبقة التالية.

**سنقوم الآن بكتابة محاكاة لشبكة عصبية مكونة من طبقة مدخلات (2 ميزات)، طبقة مخفية واحدة (2 عصبونات) وطبقة مخرجات (1 عصبون):**`,defaultCode:`# محاكاة شبكة عصبية بسيطة جداً (Forward Pass)
import math

# 1. المدخلات (مثلاً: عدد ساعات النوم، عدد ساعات المذاكرة)
inputs = [0.8, 0.9]

# 2. أوزان الطبقة المخفية الأولى (تحتوي على عصبونين)
# العصبون الأول في الطبقة المخفية
h1_weights = [0.2, 0.5]
h1_bias = -0.1
# العصبون الثاني في الطبقة المخفية
h2_weights = [-0.3, 0.8]
h2_bias = 0.2

# 3. حساب مخرجات الطبقة المخفية مع دالة ReLU
# العصبون الأول
sum_h1 = sum(i * w for i, w in zip(inputs, h1_weights)) + h1_bias
out_h1 = max(0, sum_h1)  # ReLU activation
# العصبون الثاني
sum_h2 = sum(i * w for i, w in zip(inputs, h2_weights)) + h2_bias
out_h2 = max(0, sum_h2)  # ReLU activation

hidden_outputs = [out_h1, out_h2]
print("مخرجات الطبقة المخفية (Hidden Layer Outputs):", hidden_outputs)

# 4. أوزان عصبون المخرج (يأخذ مدخلين من الطبقة المخفية ويعطي مخرجاً واحداً)
output_weights = [0.6, -0.4]
output_bias = 0.1

sum_out = sum(i * w for i, w in zip(hidden_outputs, output_weights)) + output_bias
final_output = 1 / (1 + math.exp(-sum_out))  # Sigmoid لتمثيل احتمالية

print("المخرج النهائي للشبكة العصبية (Final Output):", final_output)
`,externalResources:[{title:"ما هي الشبكات العصبية وكيف تعمل؟ - 3Blue1Brown",url:"https://www.youtube.com/watch?v=aircAruvnKk",platform:"youtube"},{title:"Neural Networks and Deep Learning - Coursera",url:"https://www.coursera.org/learn/neural-networks-deep-learning",platform:"coursera"}]},{id:13,title:"هندسة التوجيه وتطبيقات الـ LLMs",category:"ai",description:"كيفية التخاطب الذكي مع النماذج اللغوية الكبيرة وضبط القوالب واسترداد الإجابات المهيكلة.",difficulty:"medium",content:`### هندسة التوجيه وتطبيقات الـ LLMs (Prompt Engineering)

في هندسة الذكاء الاصطناعي الحديثة، لا يحتاج المهندس دائماً لبناء وتدريب النماذج من الصفر. بدلاً من ذلك، نستخدم **نماذج اللغة الكبيرة الجاهزة (Large Language Models - LLMs)** مثل GPT و Gemini لحل مشاكل معقدة عن طريق كتابة تعليمات برمجية ذكية نوجه بها النموذج وتسمى **هندسة التوجيه (Prompt Engineering)**.

#### عناصر التوجيه الفعال للتطبيقات:
1. **الدور (Role):** تحديد شخصية النموذج (مثلاً: "أنت طبيب خبير" أو "أنت مدقق كود بايثون").
2. **السياق (Context):** تزويد النموذج بالمعلومات والمستندات اللازمة للإجابة.
3. **المهمة (Task):** تحديد ما يجب القيام به بدقة.
4. **التنسيق المطلوب (Format Constraints):** إجبار النموذج على الرد بصيغة محددة قابلة للقراءة برمجياً (مثل صيغة **JSON**).

**شاهد كيف نقوم برمجياً بصياغة توجيه ذكي للحصول على بيانات مهيكلة من الذكاء الاصطناعي:**`,defaultCode:`# قالب توجيه برمجياً (Prompt Template) لاستخلاص المفاهيم
lecture_text = "في الرياضيات، المصفوفة هي مجموعة مستطيلة من الأرقام مرتبة في صفوف وأعمدة. تستخدم لتمثيل أوزان الشبكات."

system_instruction = "أنت محلل محتوى أكاديمي مستخلص للمفاهيم."

prompt = f\\"\\"\\"
قم بتحليل النص التالي المستخلص من المحاضرة، واستخرج المصطلحات العلمية الواردة فيه.
يجب أن يكون ردك بصيغة قائمة JSON فقط، بدون أي مقدمات أو شرح خارج الـ JSON.

النص: "{lecture_text}"

صيغة الرد المطلوبة:
[
  {{"concept": "اسم المفهوم باللغة العربية", "description": "شرحه المبسط بناءً على النص"}}
]
\\"\\"\\"

print("=== التوجيه المرسل للنموذج (Prompt) ===")
print(prompt)
`,externalResources:[{title:"دورة كاملة في هندسة التوجيه (Prompt Engineering) - YouTube",url:"https://www.youtube.com/watch?v=_ZvnD73m40o",platform:"youtube"},{title:"Prompt Engineering for ChatGPT - Coursera",url:"https://www.coursera.org/learn/prompt-engineering",platform:"coursera"}]},{id:14,title:"أنظمة البحث المعزز بالاسترجاع (RAG)",category:"ai",description:"شرح معمارية RAG وكيفية ربط مستندات المذاكرة الخاصة بك بذكاء مع الـ LLM للإجابة منها بدقة.",difficulty:"medium",content:`### أنظمة البحث المعزز بالاسترجاع (Retrieval-Augmented Generation - RAG)

نماذج اللغة الكبيرة (LLMs) ممتازة، ولكنها تعاني من مشكلتين كبيرتين:
1. **الهلوسة (Hallucination):** تأليف معلومات خاطئة بثقة.
2. **قصور المعرفة:** لا تعرف أي شيء عن ملفاتك الخاصة، أو كتبك الجامعية المحددة.

معمارية **RAG** تحل هذه المشكلة عن طريق دمج نظام **البحث واسترجاع المعلومات** مع نموذج اللغة.

#### خطوات عمل نظام الـ RAG:
1. **التقطيع (Chunking):** نقوم بتقسيم كتبك ومحاضراتك الطويلة إلى فقرات صغيرة (مثلاً كل 500 حرف).
2. **التضمين النصي (Embedding):** تحويل كل فقرة إلى متجه رياضي يمثل معناها الدلالي.
3. **البحث الفهرسي (Retrieval):** عندما تكتب سؤالاً، يقوم النظام بتحويل سؤالك لمتجه والبحث عن الفقرات الأكثر صلة في مستنداتك (باستخدام Cosine Similarity).
4. **التوليد (Generation):** نأخذ هذه الفقرات ونرسلها إلى نموذج اللغة كـ "سياق" ونقول له: **"أجب عن السؤال بناءً على هذا السياق فقط"**.

**شاهد كيف نقوم بمحاكاة الخطوة الأخيرة لدمج السياق مع السؤال وإرساله للنموذج:**`,defaultCode:`# محاكاة دمج السياق المسترجع مع سؤال المستخدم في نظام RAG
retrieved_chunks = [
    "الفقرة 1: يُعرف الانحدار الخطي في الإحصاء بأنه نموذج لتوقع قيمة عددية مستمرة بناء على متغيرات مستقلة.",
    "الفقرة 2: نستخدم دالة التكلفة Mean Squared Error لقياس جودة توقعات نموذج الانحدار الخطي وتحديث أوزانه."
]

user_question = "كيف نقيس جودة نموذج الانحدار الخطي وما هو؟"

# دمج السياق المسترجع مع السؤال
context_string = "\\n".join(retrieved_chunks)

final_prompt = f\\"\\"\\"
أنت مساعد دراسي موثوق. أجب عن سؤال الطالب بناءً على السياق المقدم فقط.
إذا لم تكن الإجابة موجودة في السياق، قل بكل صراحة 'لم أجد الإجابة في مستنداتك المرفوعة' لتجنب الهلوسة.

السياق المسترجع من كتب الطالب:
{context_string}

سؤال الطالب:
{user_question}
\\"\\"\\"

print("=== التوجيه النهائي للذكاء الاصطناعي (RAG Prompt) ===")
print(final_prompt)
`,externalResources:[{title:"معمارية RAG وكيفية عملها بالتفصيل - YouTube",url:"https://www.youtube.com/watch?v=T-D1OfcDWUM",platform:"youtube"},{title:"Generative AI: RAG and Agents - Coursera",url:"https://www.coursera.org/learn/generative-ai-rag-agents",platform:"coursera"}]},{id:15,title:"تطبيقات الوكلاء المستقلة (Autonomous AI Agents)",category:"ai",description:"فهم معمارية الوكلاء القادرين على التفكير والتخطيط واتخاذ إجراءات لتنفيذ المهام المعقدة برمجياً.",difficulty:"hard",content:`### تطبيقات الوكلاء المستقلة (Autonomous AI Agents)

تعد **الوكلاء الذكية (AI Agents)** هي ذروة هندسة الذكاء الاصطناعي وتطبيقاته البرمجية اليوم. الوكيل ليس مجرد نموذج يجيب بنص، بل هو **نظام برمجيات متكامل** يتحكم فيه نموذج لغة كبير (LLM) كـ "عقل مدبر" قادر على التخطيط، واستخدام الأدوات (مثل تشغيل الأكواد، البحث في الملفات، أو تصفح الإنترنت)، وحل المشاكل بشكل مستقل.

#### معمارية الوكيل المستقل:
1. **التخطيط (Planning):** تقسيم المهمة الكبيرة إلى خطوات صغيرة.
2. **الذاكرة (Memory):** تخزين المحادثات السابقة والقرارات التي تم اتخاذها.
3. **الأدوات (Tools):** برمجيات بايثون يستدعيها الوكيل لتنفيذ مهمته (مثلاً دالة لحساب تفاضل، أو تشغيل كود).
4. **حلقة الملاحظة والعمل (Action-Observation Loop):** استدعاء الأداة، قراءة نتيجتها، والتعديل بناءً عليها.

**شاهد محاكاة برمجية مبسطة لحلقة تفكير وعمل وكيل ذكي يقوم بتجربة كود بايثون وحل مشكلة:**`,defaultCode:`# محاكاة حلقة ReAct لوكيل ذكاء اصطناعي (Thought -> Action -> Observation)
# المهمة: حساب قيمة دالة الخسارة عند قيمة معينة

# الأدوات المتاحة للوكيل:
def run_python_calculator(expression):
    try:
        # أداة تشغيل تعابير رياضية بأمان
        return eval(expression)
    except Exception as e:
        return f"Error: {str(e)}"

print("--- محاكاة حلقة عمل الوكيل الذكي (Agent Loop) ---")

# الخطوة 1: تفكير الوكيل
print("🧠 تفكير الوكيل: المستخدم يحتاج حساب (w - target)^2 عند w=5 و target=3.")
print("🛠️ إجراء الوكيل: تشغيل حاسبة بايثون بالمعادلة '(5 - 3)**2'")

# الخطوة 2: اتخاذ الإجراء
observation = run_python_calculator("(5 - 3)**2")

# الخطوة 3: ملاحظة النتيجة وتوليد الجواب
print(f"👁️ الملاحظة المسترجعة من الأداة: {observation}")
print(f"🧠 تفكير الوكيل: النتيجة هي {observation}. سأصيغ الجواب النهائي للمستخدم.")
print(f"💬 الجواب النهائي: قيمة دالة الخسارة تساوي {observation}.")
`,externalResources:[{title:"شرح الوكلاء الأذكياء (AI Agents) ومستقبل البرمجة",url:"https://www.youtube.com/watch?v=F8NKVhk0tBY",platform:"youtube"},{title:"Generative AI Agents - DeepLearning.AI",url:"https://www.coursera.org/learn/generative-ai-agents",platform:"coursera"}]}],Xe={1:{question:"في لغة بايثون، لا تحتاج لتحديد نوع المتغير مسبقاً قبل تعريفه. ما هو التسمية العلمية لهذه الميزة؟",options:["الكتابة الديناميكية (Dynamic Typing)","الكتابة الصارمة (Static Typing)","البرمجة كائنية التوجه (OOP)","الجمع التلقائي للمهملات"],correct:"الكتابة الديناميكية (Dynamic Typing)"},2:{question:"ما هي الآلية التي تستخدمها لغة بايثون لتحديد الأكواد التابعة لجملة الشرط (if) أو حلقة التكرار (for)؟",options:["الأقواس المتعرجة { }","المسافات البادئة (Indentation)","علامات التنصيص المزدوجة","الفاصلة المنقوطة ;"],correct:"المسافات البادئة (Indentation)"},3:{question:"أي الكلمات المفتاحية التالية تُستخدم لتعريف دالة جديدة في لغة بايثون؟",options:["function","def","void","define"],correct:"def"},4:{question:"كيف يمكننا تعريف قاموس (Dictionary) فارغ في لغة بايثون؟",options:["d = []","d = ()","d = {}","d = set()"],correct:"d = {}"},5:{question:"ما اسم الدالة المخصصة (Constructor) في بايثون لتهيئة قيم الكائن عند إنشائه؟",options:["__init__","__new__","constructor","create"],correct:"__init__"},6:{question:"في الجبر الخطي، ماذا ينتج عن حاصل الضرب النقطي لمتجهين متعامدين (أي الزاوية بينهما 90 درجة)؟",options:["1","-1","0","حاصل ضرب طوليهما"],correct:"0"},7:{question:"ما هي دالة التنشيط التي تقوم بتحويل أي قيمة مدخلة إلى نطاق يتراوح بين 0 و 1، وتُستخدم بكثرة للتنبؤ بالاحتمالات؟",options:["ReLU","Sigmoid","Tanh","Softmax"],correct:"Sigmoid"},8:{question:"إذا كان جيب تمام الزاوية (Cosine Similarity) بين متجهين يساوي 1 تماماً، فماذا يعني ذلك؟",options:["المتجهان متعامدان تماماً ولا تشابه بينهما","المتجهان لهما نفس الاتجاه تماماً ومتطابقان في المعنى","المتجهان متعاكسان تماماً في الاتجاه","أحد المتجهين فارغ"],correct:"المتجهان لهما نفس الاتجاه تماماً ومتطابقان في المعنى"},9:{question:"في تعلم الآلة، ماذا يمثل المشتق الأول لدالة التكلفة (Cost Function)؟",options:["القيمة الصغرى المطلقة للدالة","سرعة تقارب النموذج","معدل التغير (المنحدر) والاتجاه الذي تزيد فيه الدالة","دقة النموذج النهائية"],correct:"معدل التغير (المنحدر) والاتجاه الذي تزيد فيه الدالة"},10:{question:"ما هي المشكلة التي تحدث عندما يكون معدل التعلم (Learning Rate) كبيراً جداً في خوارزمية الانحدار التدريجي؟",options:["البطء الشديد في الوصول للحل","تجاوز نقطة النهاية الصغرى والتذبذب أو عدم التقارب (Divergence)","توقف النموذج عن التعلم تماماً","تلاشي المشتقات (Vanishing Gradients)"],correct:"تجاوز نقطة النهاية الصغرى والتذبذب أو عدم التقارب (Divergence)"},11:{question:"ما هي عملية تحويل البيانات الفئوية (Categorical Data) إلى شكل رقمي ثنائي (0 أو 1)؟",options:["التقييس (Standardization)","التطبيع (Normalization)","الترميز بنظام One-Hot Encoding","معالجة القيم المفقودة"],correct:"الترميز بنظام One-Hot Encoding"},12:{question:"ما هي العملية التي يتم فيها حساب الأخطاء وتحديث الأوزان من الطبقة الأخيرة إلى الطبقة الأولى في الشبكة العصبية؟",options:["التمرير الأمامي (Forward Propagation)","الانتشار الخلفي للأخطاء (Backpropagation)","التسوية (Regularization)","التهيئة العشوائية للأوزان"],correct:"الانتشار الخلفي للأخطاء (Backpropagation)"},13:{question:"ما هو الاسم المطلق على تقنية كتابة التوجيهات التي نقوم فيها بإعطاء النموذج بضعة أمثلة محلولة قبل السؤال الأساسي؟",options:["Zero-Shot Prompting","Few-Shot Prompting","Chain-of-Thought Prompting","System Prompting"],correct:"Few-Shot Prompting"},14:{question:"ما هي الخطوة الأساسية الأولى في معمارية RAG عند قيام المستخدم بطرح سؤال؟",options:["توليد النص مباشرة باستخدام LLM","استرجاع المستندات ذات الصلة من قاعدة بيانات ناقلات (Vector DB)","إعادة ترتيب جميع المستندات في النظام يدوياً","ترجمة السؤال إلى لغة أخرى"],correct:"استرجاع المستندات ذات الصلة من قاعدة بيانات ناقلات (Vector DB)"},15:{question:"ما الذي يميز الوكيل الذكي (AI Agent) عن نموذج اللغة الضخم (LLM) البسيط عند حل المشكلات المعقدة؟",options:["القدرة على استخدام الأدوات، والتخطيط المتعدد الخطوات، والعمل التكراري المستقل","امتلاكه حجماً أكبر من الذاكرة العشوائية","سرعة المعالجة الفائقة فقط","قدرته على تخزين الصور بدقة أعلى"],correct:"القدرة على استخدام الأدوات، والتخطيط المتعدد الخطوات، والعمل التكراري المستقل"}};function Ye({lessonId:r,onPass:F}){const{theme:s}=be(),z=Xe[r]||{question:"هل قمت بقراءة وفهم المفهومين السابقين للدرس؟",options:["نعم، فهمتهما جيداً ومستعد للمتابعة","لا، أحتاج لإعادة القراءة"],correct:"نعم، فهمتهما جيداً ومستعد للمتابعة"},[y,M]=n.useState(null),[m,R]=n.useState(!1),[f,A]=n.useState(!1),G=()=>{if(!y)return;const j=y===z.correct;A(j),R(!0),j&&setTimeout(()=>{F()},1200)};return e.jsxs("div",{className:"p-6 rounded-2xl border transition-all duration-300",style:{backgroundColor:"rgba(255, 255, 255, 0.02)",borderColor:s.colors.border,boxShadow:`0 0 25px ${s.colors.accent}10`},children:[e.jsxs("h3",{className:"text-sm font-bold mb-3 text-white flex items-center gap-2",children:[e.jsx(g,{size:16,className:"text-yellow-400 animate-pulse"}),"سؤال الفهم السريع: تحقق من استيعابك للمتابعة"]}),e.jsx("p",{className:"text-xs text-slate-200 mb-4",children:z.question}),e.jsx("div",{className:"space-y-2 mb-4",children:z.options.map((j,C)=>{const p=y===j;return e.jsxs("button",{onClick:()=>!m&&M(j),disabled:m,className:"w-full text-right p-3 rounded-xl text-xs transition-all flex items-center justify-between border",style:{backgroundColor:p?`${s.colors.accent}15`:"rgba(255,255,255,0.02)",borderColor:p?s.colors.accent:"rgba(255,255,255,0.08)",color:p?"#fff":s.colors.textMuted},children:[e.jsx("span",{children:j}),e.jsx("div",{className:"w-4 h-4 rounded-full border flex items-center justify-center shrink-0",style:{borderColor:p?s.colors.accent:"rgba(255,255,255,0.3)"},children:p&&e.jsx("div",{className:"w-2 h-2 rounded-full",style:{backgroundColor:s.colors.accent}})})]},C)})}),m?e.jsxs("div",{className:"p-3 rounded-xl text-xs text-center font-semibold transition-all duration-300",style:{backgroundColor:f?"rgba(34, 197, 94, 0.1)":"rgba(239, 68, 68, 0.1)",color:f?"#4ade80":"#f87171",border:`1px solid ${f?"rgba(34,197,94,0.2)":"rgba(239,68,68,0.2)"}`},children:[f?"✓ إجابة صحيحة! جاري فتح باقي الدرس...":"❌ إجابة خاطئة، حاول مرة أخرى.",!f&&e.jsx("button",{onClick:()=>{R(!1),M(null)},className:"block mx-auto mt-2 text-[10px] underline font-bold",style:{color:s.colors.text},children:"أعد المحاولة"})]}):e.jsx("button",{onClick:G,disabled:!y,className:"w-full py-2.5 rounded-xl font-bold text-xs text-white transition-all disabled:opacity-50 shadow-md",style:{background:`linear-gradient(135deg, ${s.colors.secondary}, ${s.colors.accent})`},children:"تحقق من الإجابة"})]})}function xt(){const{theme:r}=be(),{runPython:F}=Ee(),[s,z]=n.useState(O[0]),[y,M]=n.useState(()=>{try{const t=localStorage.getItem("masar_completed_quizzes");return t?JSON.parse(t):{}}catch{return{}}});n.useEffect(()=>{localStorage.setItem("masar_completed_quizzes",JSON.stringify(y))},[y]),n.useEffect(()=>{const t=()=>{try{M(JSON.parse(localStorage.getItem("masar_completed_quizzes")||"{}"))}catch{}};return window.addEventListener("masar-cloud-applied",t),()=>window.removeEventListener("masar-cloud-applied",t)},[]);const[m,R]=n.useState(!1),f=n.useRef(null),A=n.useRef([]),G=async()=>{try{const t=await navigator.mediaDevices.getUserMedia({audio:!0}),o=new MediaRecorder(t);f.current=o,A.current=[],o.ondataavailable=l=>{l.data.size>0&&A.current.push(l.data)},o.onstop=async()=>{const l=new Blob(A.current,{type:"audio/webm"}),u=new File([l],"dictation.webm",{type:"audio/webm"});R(!1),P(!0),h(a=>[...a,{role:"user",content:"🎙️ [جاري تفريغ رسالتك الصوتية...]"}]);try{const c=(await Ie.transcribeFile(u)).data?.text||"";h(i=>{const d=[...i];return d.length>0&&(d[d.length-1]={role:"user",content:c}),d}),c.trim()?await ue(c):(h(i=>[...i,{role:"model",content:"⚠️ عذراً، لم أتمكن من سماع أي صوت واضح. يرجى المحاولة مجدداً."}]),P(!1))}catch(a){h(c=>{const i=[...c];return i.length>0&&(i[i.length-1]={role:"user",content:"🎙️ [فشل تفريغ الصوت]"}),i}),h(c=>[...c,{role:"model",content:`❌ حدث خطأ أثناء التفريغ الصوتي: ${a.message}`}]),P(!1)}t.getTracks().forEach(a=>a.stop())},o.start(),R(!0)}catch(t){alert(`عذراً، لم نتمكن من الوصول للميكروفون: ${t.message}`)}},j=()=>{f.current&&f.current.state!=="inactive"&&f.current.stop()},[C,p]=n.useState(O[0].defaultCode),[we,N]=n.useState(""),[B,te]=n.useState(!1),[k,U]=n.useState("lesson"),[$,re]=n.useState("mcq"),[S,se]=n.useState(!1),[T,H]=n.useState(null),[b,V]=n.useState(null),[oe,J]=n.useState({}),[v,Q]=n.useState(!1),[_,W]=n.useState(null),[ae,ne]=n.useState(!1),[w,q]=n.useState(!1),[X,h]=n.useState([{role:"model",content:"مرحباً! أنا مساعدك الذكي لمسار. يمكنني شرح الرياضيات أو الأكواد البرمجية في هذا الدرس ومساعدتك في حل التمارين."}]),[D,ie]=n.useState(""),[L,P]=n.useState(!1),[ye,le]=n.useState(null),ce=n.useRef(null);n.useEffect(()=>{w&&setTimeout(()=>{ce.current?.scrollIntoView({behavior:"smooth"})},50)},[X,L,w]);const Y=t=>{z(t),p(t.defaultCode),N(""),U("lesson"),H(null),V(null),J({}),Q(!1),W(null),h([{role:"model",content:`مرحباً! أنا مساعدك الذكي لمسار. كيف يمكنني مساعدتك في فهم درس "${t.title}"؟`}])},je=async()=>{try{te(!0),N(`جاري تشغيل الكود في بيئة Python المحلية...
`);const t=await F(C);t.error?N(t.error):N(t.output||"لم يتم إرجاع أي مخرجات من الكود.")}catch(t){N(`❌ خطأ أثناء تشغيل الكود: ${t.message}`)}finally{te(!1)}},ve=()=>{p(s.defaultCode),N("")},de=async()=>{try{se(!0),Q(!1),J({}),W(null),H(null),V(null);const t=await fetch(`${K}/labs/homework/generate`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({lesson_id:s.id,lesson_title:s.title,lesson_category:s.category,lesson_content:s.content,default_code:s.defaultCode,homework_type:$})});if(!t.ok)throw new Error("تعذر توليد الواجب من الخادم");const o=await t.json();$==="mcq"?H(o.questions||[]):V(o)}catch(t){console.error(t),alert(`خطأ في توليد الواجب: ${t.message}`)}finally{se(!1)}},Ne=async()=>{if(b)try{ne(!0);const t=await fetch(`${K}/labs/homework/verify`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({lesson_id:s.id,student_code:C,task_description:b.description})});if(!t.ok)throw new Error("فشل التحقق من الكود");const o=await t.json();W(o)}catch(t){alert(`خطأ أثناء تقييم الكود: ${t.message}`)}finally{ne(!1)}},_e=()=>{b&&(p(b.buggy_code),N(""),alert('تم تحميل كود التمرين في المحرر! قم بمراجعته، وأصلح الأخطاء، ثم انقر على "تشغيل الكود" لتجربته، وعند الانتهاء انقر على "إرسال الكود للتقييم".'))},ue=async t=>{P(!0);try{const o=`أنت معلم ذكاء اصطناعي خبير ومحترف للغاية في تبسيط المفاهيم الأكاديمية ومحاكاة المعلمين في الجامعات والمواقع التعليمية الكبرى (مثل ChatGPT وClaude).
المستخدم يدرس درس "${s.title}" (${s.category==="math"?"رياضيات":"برمجة/ذكاء اصطناعي"}).

محتوى الدرس الحالي للرجوع إليه:
${s.content}

الكود الحالي في محرر الطالب (إذا وجد):
\`\`\`python
${C}
\`\`\`

قواعد وتوجيهات حرجة للإجابة:
1. **التنسيق الاحترافي**: نسّق إجابتك باستخدام لغة Markdown بشكل ممتاز. استخدم العناوين الفرعية (###)، النقاط، الجداول، والمربعات البرمجية المظللة.
2. **المعادلات الرياضية**: أي معادلات رياضية يجب أن تكتب بصيغة LaTeX باستخدام \\( ... \\) للمعادلات السطرية و \\[ ... \\] للمعادلات المستقلة لتظهر بشكل جميل.
3. **منع التكرار**: تجنب تكرار العبارات والفقرات تماماً، وقدم معلومات غنية دون إعادة صياغة لنفس الفكرة بكلمات أخرى.
4. **الأسلوب**: أسلوبك يجب أن يكون ذكياً، أكاديمياً، واضحاً ومباشراً ومحفزاً باللغة العربية الفصحى.
5. **مساعدة الكود**: إذا سأل الطالب عن خطأ في كوده، اشرح له مكان الخطأ بوضوح وصححه له مع تقديم الكود المصحح في قالب كود برمجية (\`\`\`python ... \`\`\`).`,l=X.map(x=>({role:x.role==="model"?"model":"user",parts:[{text:x.content}]})),u=await fetch(`${K}/study/chat`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:t,system_instruction:o,history:l,stream:!0})});if(!u.ok)throw new Error("فشل الرد من الذكاء الاصطناعي");h(x=>[...x,{role:"model",content:""}]);const a=u.body?.getReader(),c=new TextDecoder("utf-8");if(!a)throw new Error("فشل قراءة الاستجابة كبث تدفقي");let i=!1,d="";for(;!i;){const{value:x,done:Z}=await a.read();if(i=Z,x){const ze=c.decode(x,{stream:!i});d+=ze,h(Me=>{const I=[...Me];return I.length>0&&(I[I.length-1]={role:"model",content:d}),I})}}}catch(o){h(l=>[...l,{role:"model",content:`❌ حدث خطأ في الاتصال بالذكاء الاصطناعي: ${o.message}`}])}finally{P(!1)}},Ce=async t=>{if(t.preventDefault(),!D.trim()||L)return;const o=D;ie(""),h(l=>[...l,{role:"user",content:o}]),await ue(o)},ke=async(t,o)=>{try{await navigator.clipboard.writeText(t),le(o),setTimeout(()=>{le(null)},2e3)}catch(l){console.error("Failed to copy text:",l)}},xe=(t=!1)=>e.jsxs("div",{className:`flex flex-col rounded-2xl overflow-hidden border ${t?"w-full h-full border-0 rounded-none bg-slate-950/80":"h-[580px] animate-in slide-in-from-top-4"}`,style:{backgroundColor:t?void 0:"rgba(10, 14, 23, 0.65)",borderColor:t?"transparent":`${r.colors.accent}30`},children:[e.jsxs("div",{className:"px-4 py-3.5 bg-black/50 border-b border-white/5 flex items-center justify-between",children:[e.jsxs("span",{className:"text-xs font-bold flex items-center gap-1.5 text-white/90",children:[e.jsx(g,{size:14,className:"text-indigo-400"})," نقاش: ",s.title]}),e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("button",{onClick:()=>h([{role:"model",content:`مرحباً! أنا مساعدك الذكي لمسار. كيف يمكنني مساعدتك في فهم درس "${s.title}"؟`}]),className:"text-[10px] text-white/50 hover:text-white transition-colors",children:"مسح المحادثة"}),t&&e.jsx("button",{onClick:()=>q(!1),className:"text-xs font-bold text-indigo-400 hover:text-indigo-300 px-2 py-1 rounded hover:bg-white/5 transition-colors",children:"إغلاق"})]})]}),e.jsxs("div",{className:"flex-1 overflow-y-auto p-4 space-y-4 flex flex-col",children:[X.map((o,l)=>{const u=o.role==="user";return e.jsxs("div",{className:`flex gap-2.5 max-w-[90%] items-start ${u?"self-start flex-row-reverse":"self-end flex-row"}`,style:{direction:"rtl"},children:[e.jsx("div",{className:`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold text-white shadow-md ${u?"bg-gradient-to-br from-indigo-500 to-purple-600":"bg-gradient-to-br from-teal-500 to-emerald-500"}`,children:u?"طالب":e.jsx(g,{size:12})}),e.jsxs("div",{className:`p-3 rounded-xl text-xs leading-relaxed shadow-sm relative group transition-all ${u?"bg-indigo-600/35 border border-indigo-500/20 text-white rounded-tr-none":"bg-white/[0.04] border border-white/5 text-white/90 rounded-tl-none"}`,children:[u?e.jsx("span",{className:"whitespace-pre-wrap",children:o.content}):e.jsx("div",{className:"prose prose-invert prose-xs max-w-full",children:e.jsx(Fe,{content:o.content})}),!u&&e.jsx("div",{className:"flex justify-end gap-2 border-t border-white/5 pt-1.5 mt-2 opacity-0 group-hover:opacity-100 transition-opacity",children:e.jsx("button",{type:"button",onClick:()=>ke(o.content,l),className:"p-1 rounded text-white/40 hover:text-white hover:bg-white/5 transition-all flex items-center gap-1 text-[9px] font-medium",children:ye===l?e.jsxs(e.Fragment,{children:[e.jsx(qe,{size:9,className:"text-green-400"}),e.jsx("span",{className:"text-green-400 text-[9px]",children:"تم النسخ"})]}):e.jsxs(e.Fragment,{children:[e.jsx(Be,{size:9}),e.jsx("span",{children:"نسخ الإجابة"})]})})})]})]},l)}),L&&e.jsxs("div",{className:"flex gap-2.5 max-w-[90%] items-start self-end flex-row",style:{direction:"rtl"},children:[e.jsx("div",{className:"w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow-md",children:e.jsx(g,{size:12,className:"animate-spin"})}),e.jsxs("div",{className:"bg-white/[0.04] border border-white/5 text-white/60 p-3 rounded-xl rounded-tl-none text-xs flex items-center gap-2",children:[e.jsx(E,{size:12,className:"animate-spin text-indigo-400 shrink-0"}),"جاري التفكير وصياغة الشرح..."]})]}),e.jsx("div",{ref:ce})]}),e.jsxs("form",{onSubmit:Ce,className:"p-3 bg-black/50 border-t border-white/5 flex gap-2 items-center",children:[e.jsx("input",{type:"text",value:D,onChange:o=>ie(o.target.value),placeholder:m?"جاري الاستماع للتسجيل الصوتي...":"اسألني عن المعادلة أو الكود...",disabled:m,className:"flex-1 bg-white/5 rounded-lg px-3 py-2.5 text-xs outline-none text-white focus:bg-white/10 transition-colors placeholder:text-white/30",style:{direction:"rtl"}}),e.jsx("button",{type:"button",onClick:m?j:G,className:`p-2 rounded-lg text-white transition-all ${m?"bg-red-500 animate-pulse":"bg-white/5 hover:bg-white/10"}`,title:m?"إيقاف التسجيل والإرسال":"إملاء صوتي",children:m?e.jsx(Ue,{size:14}):e.jsx(De,{size:14})}),e.jsx("button",{type:"submit",disabled:L||!D.trim()||m,className:"p-2.5 rounded-lg text-white disabled:opacity-40 transition-all hover:scale-105 shrink-0",style:{background:r.colors.accent},children:e.jsx(He,{size:12})})]})]}),$e=O.filter(t=>t.category==="programming"),Se=O.filter(t=>t.category==="math"),Le=O.filter(t=>t.category==="ai");return e.jsxs("div",{className:"flex flex-col xl:flex-row gap-6 min-h-[calc(100vh-120px)]",style:{color:r.colors.text},children:[e.jsxs("div",{className:"flex-1 flex flex-col gap-6 order-2 xl:order-1",children:[e.jsxs("div",{className:"flex border-b border-white/10 gap-6",children:[e.jsxs("button",{onClick:()=>U("lesson"),className:"pb-3 text-lg font-bold transition-all relative",style:{color:k==="lesson"?r.colors.accent:r.colors.textMuted},children:["الدرس التعليمي",k==="lesson"&&e.jsx("div",{className:"absolute bottom-0 left-0 right-0 h-0.5",style:{backgroundColor:r.colors.accent}})]}),e.jsxs("button",{onClick:()=>U("homework"),className:"pb-3 text-lg font-bold transition-all relative flex items-center gap-2",style:{color:k==="homework"?r.colors.secondary:r.colors.textMuted},children:[e.jsx(g,{size:16,className:"text-yellow-400"}),"الواجب الذكي (AI Homework)",k==="homework"&&e.jsx("div",{className:"absolute bottom-0 left-0 right-0 h-0.5",style:{backgroundColor:r.colors.secondary}})]})]}),k==="lesson"&&e.jsxs("div",{className:"p-6 md:p-8 rounded-2xl backdrop-blur-[20px]",style:{backgroundColor:"rgba(255, 255, 255, 0.03)",border:"1px solid rgba(255, 255, 255, 0.06)",boxShadow:"0 8px 32px 0 rgba(0, 0, 0, 0.2)"},children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-4 mb-6 pb-6 border-b border-white/5",children:[e.jsxs("div",{children:[e.jsx("span",{className:"px-3 py-1 text-xs rounded-full font-bold inline-block mb-3",style:{backgroundColor:s.category==="math"?`${r.colors.secondary}20`:s.category==="programming"?`${r.colors.accent}20`:"rgba(168, 85, 247, 0.2)",color:s.category==="math"?r.colors.secondary:s.category==="programming"?r.colors.accent:"#c084fc",border:`1px solid ${s.category==="math"?r.colors.secondary:s.category==="programming"?r.colors.accent:"#a855f7"}50`},children:s.category==="math"?"رياضيات الذكاء الاصطناعي":s.category==="programming"?"برمجة بايثون":"هندسة الذكاء الاصطناعي"}),e.jsx("h1",{className:"text-3xl font-bold",children:s.title})]}),e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("span",{className:"text-xs",style:{color:r.colors.textMuted},children:"مستوى الصعوبة:"}),e.jsx("span",{className:"px-2 py-0.5 text-xs rounded-md font-bold",style:{backgroundColor:s.difficulty==="easy"?`${r.colors.success}20`:s.difficulty==="medium"?`${r.colors.warning}20`:`${r.colors.error}20`,color:s.difficulty==="easy"?r.colors.success:s.difficulty==="medium"?r.colors.warning:r.colors.error},children:s.difficulty==="easy"?"سهل":s.difficulty==="medium"?"متوسط":"متقدم"})]})]}),e.jsx("div",{className:"prose prose-invert max-w-none space-y-6 text-right",style:{direction:"rtl"},children:(()=>{const t=s.content.split(`

`),o=y[s.id]||!1,l=Math.min(1,t.length-1),u=(a,c)=>{if(a.startsWith("### "))return e.jsx("h3",{className:"text-2xl font-bold text-white mt-8 mb-4",children:a.replace("### ","")});if(a.startsWith("#### "))return e.jsx("h4",{className:"text-lg font-bold text-white/90 mt-6 mb-3",children:a.replace("#### ","")});if(a.startsWith("* "))return e.jsx("ul",{className:"list-disc pr-6 space-y-2 text-white/80",children:a.split(`
`).map((i,d)=>e.jsx("li",{children:i.replace("* ","")},d))});if(a.startsWith("1. "))return e.jsx("ol",{className:"list-decimal pr-6 space-y-2 text-white/80",children:a.split(`
`).map((i,d)=>e.jsx("li",{children:i.replace(/^\d+\.\s*/,"")},d))});if(a.includes("$$")){const i=a.match(/\$\$(.*?)\$\$/s);if(i)return e.jsx("div",{className:"my-6 p-4 rounded-xl text-center overflow-x-auto font-mono text-xl md:text-2xl font-semibold backdrop-blur-md shadow-inner",style:{backgroundColor:"rgba(0, 0, 0, 0.2)",border:"1px solid rgba(255, 255, 255, 0.05)",color:r.colors.secondary},children:i[1]})}return a.startsWith("> ")?e.jsx("div",{className:"p-4 rounded-xl border-r-4 my-4 animate-pulse",style:{backgroundColor:"rgba(255, 255, 255, 0.01)",borderColor:r.colors.accent,color:r.colors.textMuted},children:a.replace("> ","")}):e.jsx("p",{className:"leading-relaxed text-white/80 text-base",children:a})};return t.map((a,c)=>{const i=!o&&c>l,d=e.jsx("div",{className:`transition-all duration-500 ${i?"blur-[6px] select-none pointer-events-none opacity-25":""}`,children:u(a)},c);return c===l&&!o?e.jsxs("div",{className:"space-y-6",children:[d,e.jsx("div",{className:"my-8",children:e.jsx(Ye,{lessonId:s.id,onPass:()=>M(x=>({...x,[s.id]:!0}))})})]},`wrapper-${c}`):c===l&&o?e.jsxs("div",{className:"space-y-6",children:[d,e.jsx("div",{className:"p-3.5 rounded-xl text-xs font-bold text-center border transition-all duration-300",style:{backgroundColor:"rgba(34, 197, 94, 0.04)",borderColor:"rgba(34, 197, 94, 0.15)",color:"#4ade80"},children:"✓ لقد اجتزت سؤال الفهم السريع لهذا القسم بنجاح! تم عرض بقية الدرس."})]},`wrapper-${c}`):d})})()}),s.externalResources&&s.externalResources.length>0&&e.jsxs("div",{className:"mt-8 pt-6 border-t border-white/5",children:[e.jsxs("h3",{className:"text-xl font-bold text-white mb-4 flex items-center gap-2",children:[e.jsx(pe,{size:20,className:"text-indigo-400"}),"مصادر إضافية خارجية للتعلم"]}),e.jsx("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4",children:s.externalResources.map((t,o)=>e.jsxs("a",{href:t.url,target:"_blank",rel:"noopener noreferrer",className:"flex items-center justify-between p-4 rounded-xl transition-all hover:bg-white/[0.04] border border-white/5 bg-white/[0.01]",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:"w-10 h-10 rounded-lg flex items-center justify-center",style:{backgroundColor:t.platform==="youtube"?"rgba(239, 68, 68, 0.1)":"rgba(99, 102, 241, 0.1)"},children:t.platform==="youtube"?e.jsx(We,{size:20,className:"text-red-500"}):e.jsx(Re,{size:20,className:"text-indigo-400"})}),e.jsxs("div",{className:"text-right",children:[e.jsx("p",{className:"text-sm font-bold text-white/95",children:t.title}),e.jsx("p",{className:"text-xs text-white/40 animate-pulse",children:"انقر لزيارة المصدر"})]})]}),e.jsx(Je,{size:16,className:"text-white/30 hover:text-white"})]},o))})]})]}),k==="homework"&&e.jsxs("div",{className:"p-6 md:p-8 rounded-2xl backdrop-blur-[20px]",style:{backgroundColor:"rgba(255, 255, 255, 0.03)",border:"1px solid rgba(255, 255, 255, 0.06)",boxShadow:"0 8px 32px 0 rgba(0, 0, 0, 0.2)"},children:[e.jsxs("div",{className:"pb-6 border-b border-white/5 mb-6",children:[e.jsxs("h2",{className:"text-2xl font-bold flex items-center gap-2 mb-2",children:[e.jsx(g,{className:"text-yellow-400"})," واجب مخصص بالذكاء الاصطناعي"]}),e.jsx("p",{className:"text-sm",style:{color:r.colors.textMuted},children:"قم بتوليد تمارين مخصصة بناءً على سياق الدرس الحالي لقياس مدى تمكنك البرمجي والرياضي."}),e.jsxs("div",{className:"flex flex-col sm:flex-row gap-4 mt-6 items-center",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("span",{className:"text-xs font-semibold",children:"نوع الواجب:"}),e.jsxs("div",{className:"flex bg-black/40 rounded-xl p-1 border border-white/5",children:[e.jsx("button",{onClick:()=>re("mcq"),className:"px-4 py-2 rounded-lg text-xs font-bold transition-all",style:{backgroundColor:$==="mcq"?r.colors.secondary:"transparent",color:$==="mcq"?"#fff":r.colors.textMuted},children:"خيارات متعددة (MCQ)"}),e.jsx("button",{onClick:()=>re("bug_fix"),className:"px-4 py-2 rounded-lg text-xs font-bold transition-all",style:{backgroundColor:$==="bug_fix"?r.colors.secondary:"transparent",color:$==="bug_fix"?"#fff":r.colors.textMuted},children:"إصلاح خطأ برمجي (Bug-Fix)"})]})]}),e.jsx("button",{onClick:de,disabled:S,className:"w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-white transition-transform hover:scale-105",style:{background:`linear-gradient(135deg, ${r.colors.secondary} 0%, ${r.colors.accent} 100%)`},children:S?e.jsxs(e.Fragment,{children:[e.jsx(E,{size:16,className:"animate-spin"}),"جاري التوليد..."]}):e.jsxs(e.Fragment,{children:[e.jsx(g,{size:16}),"توليد الواجب الآن"]})})]})]}),S&&e.jsxs("div",{className:"flex flex-col items-center justify-center py-20 gap-4",children:[e.jsx("div",{className:"w-12 h-12 border-4 border-t-transparent rounded-full animate-spin",style:{borderColor:"rgba(255,255,255,0.05)",borderTopColor:r.colors.secondary}}),e.jsx("p",{className:"text-sm font-semibold text-white/60 animate-pulse",children:"جاري صياغة واجب مخصص لمستواك بالذكاء الاصطناعي..."})]}),!S&&T&&e.jsxs("div",{className:"space-y-8",style:{direction:"rtl"},children:[e.jsxs("div",{className:"p-4 rounded-xl flex items-center gap-2.5",style:{backgroundColor:`${r.colors.secondary}10`},children:[e.jsx(Ge,{size:18,className:"text-indigo-400"}),e.jsx("span",{className:"text-xs font-bold text-indigo-200",children:'قم بحل الأسئلة واضغط "تسليم الإجابات" للحصول على التقييم المباشر.'})]}),T.map((t,o)=>e.jsxs("div",{className:"p-6 rounded-xl bg-white/[0.01] border border-white/5 space-y-4",children:[e.jsxs("h3",{className:"text-lg font-bold text-white/90",children:[o+1,". ",t.question]}),e.jsx("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-3 pt-2",children:t.options.map((l,u)=>{const a=oe[t.id]===u,c=t.correct_index===u;let i="1px solid rgba(255,255,255,0.06)",d="rgba(255,255,255,0.02)",x="rgba(255,255,255,0.8)";return a&&!v?(i=`1px solid ${r.colors.accent}`,d=`${r.colors.accent}15`,x="#fff"):v&&(c?(i="1px solid rgba(34, 197, 94, 0.4)",d="rgba(34, 197, 94, 0.1)",x="#4ade80"):a&&!c&&(i="1px solid rgba(239, 68, 68, 0.4)",d="rgba(239, 68, 68, 0.1)",x="#f87171")),e.jsxs("button",{onClick:()=>{v||J(Z=>({...Z,[t.id]:u}))},disabled:v,className:"text-right p-4 rounded-xl text-xs font-semibold transition-all hover:bg-white/[0.04] flex items-center justify-between",style:{border:i,backgroundColor:d,color:x},children:[e.jsx("span",{children:l}),v&&c&&e.jsx(he,{size:16,className:"text-green-500 shrink-0"}),v&&a&&!c&&e.jsx(ge,{size:16,className:"text-red-500 shrink-0"})]},u)})}),v&&e.jsxs("div",{className:"p-4 rounded-xl text-xs leading-relaxed mt-4 border border-white/5 bg-black/25",style:{color:r.colors.textMuted},children:[e.jsx("strong",{className:"text-white block mb-1",children:"الشرح العلمي:"}),t.explanation]})]},t.id||o)),e.jsx("div",{className:"pt-4 flex gap-4",children:v?e.jsx("button",{onClick:de,className:"px-8 py-3 rounded-xl font-bold text-white transition-all",style:{background:r.colors.secondary},children:"توليد واجب جديد لهذا الدرس"}):e.jsx("button",{onClick:()=>Q(!0),disabled:Object.keys(oe).length<T.length,className:"px-8 py-3 rounded-xl font-bold text-white transition-all disabled:opacity-50",style:{background:r.colors.accent},children:"تسليم الإجابات للتقييم"})})]}),!S&&b&&e.jsxs("div",{className:"space-y-6",style:{direction:"rtl"},children:[e.jsxs("div",{className:"p-6 rounded-xl bg-white/[0.01] border border-white/5 space-y-4",children:[e.jsxs("div",{className:"flex items-center justify-between border-b border-white/5 pb-3",children:[e.jsxs("span",{className:"text-sm font-bold text-yellow-400 flex items-center gap-1.5",children:[e.jsx(ee,{size:18})," تمرين إصلاح الكود المبرمج"]}),e.jsx("button",{onClick:_e,className:"px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-200 border border-indigo-500/30 rounded-xl text-xs font-bold transition-all",children:"تحميل الكود الخاطئ في المحرر 🛠️"})]}),e.jsx("h3",{className:"text-lg font-bold text-white/90",children:"مطلوب منك إصلاح الكود البرمجي ليقوم بالتالي:"}),e.jsx("p",{className:"text-sm leading-relaxed text-white/80",children:b.description}),e.jsxs("div",{className:"pt-2",children:[e.jsx("span",{className:"text-xs font-bold text-white/40 block mb-2",children:"المخرجات المستهدفة المتوقعة:"}),e.jsx("pre",{className:"p-4 rounded-xl bg-black/40 text-xs font-mono text-left text-white/70",style:{direction:"ltr"},children:b.target_output})]})]}),e.jsxs("div",{className:"flex items-center gap-4",children:[e.jsxs("button",{onClick:Ne,disabled:ae,className:"flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white transition-transform hover:scale-105",style:{background:r.colors.accent},children:[ae?e.jsx(E,{size:16,className:"animate-spin"}):e.jsx(g,{size:16}),"إرسال كودي للتقييم بالذكاء الاصطناعي"]}),e.jsx("button",{onClick:()=>{b&&p(b.buggy_code)},className:"px-4 py-3 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10",children:"إعادة الكود الخاطئ الأصلي"})]}),_&&e.jsxs("div",{className:"p-6 rounded-xl border space-y-4",style:{backgroundColor:_.passed?"rgba(34, 197, 94, 0.05)":"rgba(239, 68, 68, 0.05)",borderColor:_.passed?"rgba(34, 197, 94, 0.2)":"rgba(239, 68, 68, 0.2)"},children:[e.jsxs("div",{className:"flex items-center gap-3",children:[_.passed?e.jsx(he,{className:"text-green-500",size:24}):e.jsx(ge,{className:"text-red-500",size:24}),e.jsx("h3",{className:"text-lg font-bold",children:_.passed?"تهانينا! الكود صحيح ومكتمل بنجاح.":"كودك يحتاج لبعض التعديل والحل غير متطابق."})]}),e.jsxs("p",{className:"text-xs leading-relaxed",style:{color:r.colors.textMuted},children:[e.jsx("strong",{className:"text-white block mb-1",children:"التقييم الفني للمعلم المساعد:"}),_.feedback]}),e.jsxs("div",{className:"pt-2",children:[e.jsx("span",{className:"text-xs font-bold text-white/40 block mb-2",children:"الكود النموذجي الصحيح:"}),e.jsx("pre",{className:"p-4 rounded-xl bg-black/40 text-xs font-mono text-left text-green-300 overflow-x-auto",style:{direction:"ltr"},children:_.corrected_code})]})]})]}),!S&&!T&&!b&&e.jsxs("div",{className:"flex flex-col items-center justify-center py-20 text-center gap-6",children:[e.jsx("div",{className:"w-20 h-20 rounded-full bg-white/5 flex items-center justify-center",children:e.jsx(Ae,{size:40,style:{color:r.colors.textMuted}})}),e.jsxs("div",{children:[e.jsx("h3",{className:"text-xl font-bold mb-2",children:"الواجب الذكي غير مولد بعد"}),e.jsxs("p",{className:"text-sm max-w-md mx-auto",style:{color:r.colors.textMuted},children:['اضغط على زر التوليد في الأعلى لإنشاء واجب مخصص لدرس **"',s.title,'"** بناءً على مستواك.']})]})]})]}),e.jsxs("div",{className:"rounded-2xl overflow-hidden backdrop-blur-[20px]",style:{backgroundColor:"rgba(255, 255, 255, 0.02)",border:"1px solid rgba(255, 255, 255, 0.05)",boxShadow:"0 8px 32px 0 rgba(0, 0, 0, 0.2)"},children:[e.jsxs("div",{className:"flex items-center justify-between px-6 py-4 bg-black/40 border-b border-white/5",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsxs("div",{className:"flex gap-1.5",children:[e.jsx("div",{className:"w-3 h-3 rounded-full bg-red-500/80"}),e.jsx("div",{className:"w-3 h-3 rounded-full bg-yellow-500/80"}),e.jsx("div",{className:"w-3 h-3 rounded-full bg-green-500/80"})]}),e.jsxs("span",{className:"text-sm font-mono text-white/60 flex items-center gap-1.5",children:[e.jsx(ee,{size:16})," playground.py"]})]}),e.jsxs("div",{className:"flex gap-2",children:[e.jsxs("button",{onClick:ve,className:"flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 transition-colors",children:[e.jsx(Pe,{size:14})," إعادة التعيين"]}),e.jsxs("button",{onClick:je,disabled:B,className:"flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold text-white transition-transform hover:scale-105",style:{background:`linear-gradient(135deg, ${r.colors.secondary} 0%, ${r.colors.accent} 100%)`},children:[B?e.jsx(E,{size:14,className:"animate-spin"}):e.jsx(Oe,{size:14}),"تشغيل الكود"]})]})]}),e.jsx("div",{className:"relative",children:e.jsx("textarea",{value:C,onChange:t=>p(t.target.value),className:"w-full h-64 p-6 bg-black/30 text-white font-mono text-sm leading-relaxed outline-none resize-none",style:{direction:"ltr"},placeholder:"# اكتب كود بايثون هنا..."})}),e.jsxs("div",{className:"bg-black/60 border-t border-white/5 p-5",children:[e.jsxs("div",{className:"flex items-center justify-between mb-2",children:[e.jsx("span",{className:"text-xs font-bold text-white/40 uppercase tracking-wider",children:"مخرجات الكود (Output Terminal)"}),B&&e.jsx("span",{className:"w-2 h-2 rounded-full bg-green-500 animate-pulse"})]}),e.jsx("pre",{className:"font-mono text-xs text-green-400 overflow-x-auto min-h-[80px] max-h-[200px] leading-relaxed select-text text-left",style:{direction:"ltr"},children:we||'# اكتب الكود الخاص بك وانقر "تشغيل الكود" لمشاهدة المخرجات هنا...'})]})]})]}),e.jsxs("div",{className:"w-full xl:w-[320px] shrink-0 flex flex-col gap-6 order-1 xl:order-2",children:[e.jsx("div",{className:"p-5 rounded-2xl border transition-all cursor-pointer hover:shadow-lg hover:scale-[1.01]",style:{backgroundColor:w?"rgba(99, 102, 241, 0.08)":"rgba(255, 255, 255, 0.03)",borderColor:w?`${r.colors.accent}40`:"rgba(255, 255, 255, 0.06)"},onClick:()=>q(!w),children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:"w-10 h-10 rounded-xl flex items-center justify-center text-white",style:{background:`linear-gradient(135deg, ${r.colors.accent}, ${r.colors.secondary})`},children:e.jsx(g,{size:20,className:L?"animate-pulse":""})}),e.jsxs("div",{children:[e.jsx("h3",{className:"font-bold text-sm",children:"المعلم المساعد الذكي"}),e.jsx("p",{className:"text-xs",style:{color:r.colors.textMuted},children:"اضغط لمناقشة الدرس الحالي"})]})]}),e.jsx(Te,{size:18,className:`transition-transform duration-300 ${w?"-rotate-90":""}`})]})}),w&&e.jsx("div",{className:"hidden xl:block",children:xe(!1)}),w&&e.jsx("div",{className:"fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end justify-center xl:hidden",onClick:()=>q(!1),children:e.jsxs(me.div,{initial:{y:"100%"},animate:{y:0},transition:{type:"spring",damping:25,stiffness:200},className:"w-full max-h-[85vh] bg-[#0c101b] rounded-t-3xl border-t border-white/10 flex flex-col overflow-hidden",onClick:t=>t.stopPropagation(),children:[e.jsx("div",{className:"w-12 h-1.5 bg-white/10 rounded-full mx-auto my-3 shrink-0"}),e.jsx("div",{className:"flex-1 overflow-hidden",children:xe(!0)})]})}),!w&&e.jsx(me.button,{initial:{scale:0,opacity:0},animate:{scale:1,opacity:1},onClick:()=>q(!0),className:"fixed bottom-6 right-6 z-40 xl:hidden w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-105 active:scale-95 transition-all",style:{background:`linear-gradient(135deg, ${r.colors.accent}, ${r.colors.secondary})`,boxShadow:`0 8px 30px ${r.colors.accent}40`},children:e.jsx(g,{size:22,className:L?"animate-pulse":""})}),e.jsxs("div",{className:"p-5 rounded-2xl backdrop-blur-[20px] flex-1 flex flex-col gap-6",style:{backgroundColor:"rgba(255, 255, 255, 0.03)",border:"1px solid rgba(255, 255, 255, 0.06)",boxShadow:"0 8px 32px 0 rgba(0, 0, 0, 0.2)"},children:[e.jsxs("div",{children:[e.jsxs("h3",{className:"text-sm font-bold text-white/40 uppercase tracking-wider mb-3 flex items-center gap-2",children:[e.jsx(ee,{size:16,style:{color:r.colors.accent}})," أساسيات البرمجة ببايثون"]}),e.jsx("div",{className:"space-y-1",children:$e.map(t=>e.jsxs("button",{onClick:()=>Y(t),className:"w-full text-right px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between group transition-all",style:{backgroundColor:s.id===t.id?"rgba(255,255,255,0.06)":"transparent",color:s.id===t.id?r.colors.accent:"rgba(255,255,255,0.7)",border:s.id===t.id?"1px solid rgba(255,255,255,0.08)":"1px solid transparent"},children:[e.jsx("span",{className:"truncate flex-1 pl-2",children:t.title}),e.jsx("span",{className:"w-1.5 h-1.5 rounded-full shrink-0",style:{backgroundColor:s.id===t.id?r.colors.accent:"rgba(255,255,255,0.1)"}})]},t.id))})]}),e.jsxs("div",{children:[e.jsxs("h3",{className:"text-sm font-bold text-white/40 uppercase tracking-wider mb-3 flex items-center gap-2",children:[e.jsx(pe,{size:16,style:{color:r.colors.secondary}})," رياضيات الذكاء الاصطناعي"]}),e.jsx("div",{className:"space-y-1",children:Se.map(t=>e.jsxs("button",{onClick:()=>Y(t),className:"w-full text-right px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between group transition-all",style:{backgroundColor:s.id===t.id?"rgba(255,255,255,0.06)":"transparent",color:s.id===t.id?r.colors.secondary:"rgba(255,255,255,0.7)",border:s.id===t.id?"1px solid rgba(255,255,255,0.08)":"1px solid transparent"},children:[e.jsx("span",{className:"truncate flex-1 pl-2",children:t.title}),e.jsx("span",{className:"w-1.5 h-1.5 rounded-full shrink-0",style:{backgroundColor:s.id===t.id?r.colors.secondary:"rgba(255,255,255,0.1)"}})]},t.id))})]}),e.jsxs("div",{children:[e.jsxs("h3",{className:"text-sm font-bold text-white/40 uppercase tracking-wider mb-3 flex items-center gap-2",children:[e.jsx(g,{size:16,style:{color:"#c084fc"}})," هندسة الذكاء الاصطناعي"]}),e.jsx("div",{className:"space-y-1",children:Le.map(t=>e.jsxs("button",{onClick:()=>Y(t),className:"w-full text-right px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between group transition-all",style:{backgroundColor:s.id===t.id?"rgba(255,255,255,0.06)":"transparent",color:s.id===t.id?"#c084fc":"rgba(255,255,255,0.7)",border:s.id===t.id?"1px solid rgba(255,255,255,0.08)":"1px solid transparent"},children:[e.jsx("span",{className:"truncate flex-1 pl-2",children:t.title}),e.jsx("span",{className:"w-1.5 h-1.5 rounded-full shrink-0",style:{backgroundColor:s.id===t.id?"#c084fc":"rgba(255,255,255,0.1)"}})]},t.id))})]})]})]})]})}export{xt as default};
//# sourceMappingURL=LessonsPage-BaEOaJK_.js.map
