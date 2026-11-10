// Сгенерировано tools/build_dict.py из tools/hints_{ru,en}.json
window.__HYRU_HINTS = {
"Text to 3D": {
"ru": {
"d": "Модель по текстовому описанию.",
"r": "Описывайте один объект: что это, форма, материал, стиль. Без фона и сцены."
},
"en": {
"d": "Generates a model from a text description.",
"r": "Describe a single object: what it is, shape, material, style. No background or scene."
}
},
"Image to 3D": {
"ru": {
"d": "Модель по одной картинке.",
"r": "Лучше всего: один объект, вид спереди, целиком в кадре, однотонный фон."
},
"en": {
"d": "Generates a model from one image.",
"r": "Works best with one object, front view, fully in frame, plain background."
}
},
"Image/Text to 3D": {
"ru": {
"d": "Главный генератор: модель по картинке или по тексту.",
"r": "Если есть картинка — используйте её, результат точнее, чем по тексту."
},
"en": {
"d": "The main generator: a model from an image or from text.",
"r": "If you have an image, use it — results are more accurate than from text."
}
},
"Sketch to 3D": {
"ru": {
"d": "Модель по наброску от руки + текстовому описанию.",
"r": "Рисуйте чистый контур одного объекта, в тексте поясните материал и стиль."
},
"en": {
"d": "A model from a hand-drawn sketch plus a text description.",
"r": "Draw a clean outline of one object; describe material and style in the text."
}
},
"Multi-View": {
"ru": {
"d": "Несколько фото одного объекта с разных сторон (спереди, сбоку, сзади).",
"r": "Даёт самую точную форму, особенно со спины. Ракурсы должны совпадать по масштабу и свету."
},
"en": {
"d": "Several photos of the same object from different sides (front, side, back).",
"r": "Gives the most accurate shape, especially the back. Views should match in scale and lighting."
}
},
"Multi-View to 3D": {
"ru": {
"d": "Модель по нескольким ракурсам одного объекта.",
"r": "Минимум 2 стандартных вида: спереди + сбоку или сзади."
},
"en": {
"d": "A model from several views of the same object.",
"r": "At least 2 standard views: front + side or back."
}
},
"Model to 3D": {
"ru": {
"d": "Перегенерация своей загруженной модели (FBX/GLB/OBJ).",
"r": "Подходит, чтобы улучшить грубую или сканированную модель."
},
"en": {
"d": "Regenerates your own uploaded model (FBX/GLB/OBJ).",
"r": "Useful to improve a rough or scanned model."
}
},
"Geometry": {
"ru": {
"d": "Только форма модели, без цвета (серая «глина»).",
"r": "Быстрее и дешевле. Текстуру можно сделать потом отдельно."
},
"en": {
"d": "Shape only, no color (grey \"clay\").",
"r": "Faster and cheaper. You can add a texture later."
}
},
"Geometry + Texture": {
"ru": {
"d": "Форма модели сразу с цветной текстурой.",
"r": "Выбирайте, если нужен готовый результат за один шаг."
},
"en": {
"d": "Shape with a color texture in one go.",
"r": "Choose it when you need a finished result in one step."
}
},
"Untextured Model": {
"ru": {
"d": "Модель без текстуры — только геометрия."
},
"en": {
"d": "A model without texture — geometry only."
}
},
"Face Count": {
"ru": {
"d": "Количество полигонов (граней) модели. Больше — детальнее, но тяжелее.",
"r": "Игры/мобилки: 5–30 тыс. ПК-игры: 30–100 тыс. Рендер/печать: можно больше."
},
"en": {
"d": "Number of polygons (faces). More means more detail, but a heavier model.",
"r": "Mobile/games: 5–30k. PC games: 30–100k. Rendering/printing: more is fine."
}
},
"Set Face Count": {
"ru": {
"d": "Задать точное число полигонов вручную.",
"r": "Игры/мобилки: 5–30 тыс. ПК-игры: 30–100 тыс."
},
"en": {
"d": "Set an exact polygon count manually.",
"r": "Mobile/games: 5–30k. PC games: 30–100k."
}
},
"Auto Face Count": {
"ru": {
"d": "Число полигонов подбирается автоматически по сложности объекта.",
"r": "Хороший вариант по умолчанию."
},
"en": {
"d": "Polygon count is chosen automatically based on object complexity.",
"r": "A good default."
}
},
"Smart Topology": {
"ru": {
"d": "Ретопология: превращает тяжёлую «грязную» сетку в аккуратную лёгкую (low-poly) с правильной сеткой.",
"r": "Нужно для игр, анимации и ригинга. Для статичного рендера можно пропустить."
},
"en": {
"d": "Retopology: turns a heavy, messy mesh into a clean, light (low-poly) mesh with proper edge flow.",
"r": "Needed for games, animation and rigging. Can be skipped for static renders."
}
},
"3D Smart Topology": {
"ru": {
"d": "Ретопология: тяжёлая сетка → аккуратная лёгкая low-poly модель.",
"r": "Нужно для игр, анимации и ригинга."
},
"en": {
"d": "Retopology: heavy mesh → clean, light low-poly model.",
"r": "Needed for games, animation and rigging."
}
},
"Topology": {
"ru": {
"d": "Структура сетки модели — как расположены полигоны."
},
"en": {
"d": "The structure of the mesh — how polygons are laid out."
}
},
"Retopology": {
"ru": {
"d": "Пересборка сетки модели в аккуратную и лёгкую.",
"r": "Делайте перед ригом и анимацией."
},
"en": {
"d": "Rebuilds the mesh into a clean and light one.",
"r": "Do it before rigging and animation."
}
},
"Low-Poly": {
"ru": {
"d": "Модель с малым числом полигонов — для игр и реального времени."
},
"en": {
"d": "A model with few polygons — for games and real-time."
}
},
"Low-poly": {
"ru": {
"d": "Модель с малым числом полигонов — для игр и реального времени."
},
"en": {
"d": "A model with few polygons — for games and real-time."
}
},
"High-Poly Model": {
"ru": {
"d": "Детальная тяжёлая модель (сотни тысяч полигонов).",
"r": "Для рендера и печати. В игры — только после ретопологии."
},
"en": {
"d": "A detailed, heavy model (hundreds of thousands of polygons).",
"r": "For rendering and printing. For games, retopologize first."
}
},
"Quads": {
"ru": {
"d": "Сетка из четырёхугольников.",
"r": "Выбирайте, если будете дорабатывать модель в Blender/Maya или анимировать — так удобнее редактировать."
},
"en": {
"d": "A mesh made of four-sided polygons.",
"r": "Choose it if you will edit or animate the model in Blender/Maya — easier to work with."
}
},
"Triangles": {
"ru": {
"d": "Сетка из треугольников.",
"r": "Выбирайте для прямого импорта в игровой движок (Unity/Unreal)."
},
"en": {
"d": "A mesh made of triangles.",
"r": "Choose it for direct import into a game engine (Unity/Unreal)."
}
},
"Low-Poly with Baked Normals": {
"ru": {
"d": "Лёгкая модель + карта нормалей, «запекающая» мелкие детали с тяжёлой модели.",
"r": "Лучший вариант для игр: выглядит детально при малом числе полигонов."
},
"en": {
"d": "A light model plus a normal map that bakes fine detail from the high-poly model.",
"r": "Best option for games: looks detailed with a low polygon count."
}
},
"Low-Poly Without Normal Map": {
"ru": {
"d": "Лёгкая модель без карты нормалей — детали только в геометрии.",
"r": "Для стилизованной графики или если нормали будете делать сами."
},
"en": {
"d": "A light model without a normal map — detail is in the geometry only.",
"r": "For stylized art, or if you will bake normals yourself."
}
},
"Bake": {
"ru": {
"d": "Запекание: перенос деталей (нормали, цвет) с детальной модели на текстуры лёгкой."
},
"en": {
"d": "Baking: transfers detail (normals, color) from a detailed model to the textures of a light one."
}
},
"Bake Normals": {
"ru": {
"d": "Запечь мелкие детали с high-poly в карту нормалей.",
"r": "Нужно для игровых моделей после ретопологии."
},
"en": {
"d": "Bake fine detail from the high-poly model into a normal map.",
"r": "Needed for game models after retopology."
}
},
"UV Unwrap": {
"ru": {
"d": "Развёртка UV — «раскрой» модели на плоскость, чтобы на неё можно было наложить текстуру.",
"r": "Нужно, если будете текстурировать сами (Substance, Blender)."
},
"en": {
"d": "UV unwrapping — \"unfolds\" the model onto a flat plane so a texture can be applied.",
"r": "Needed if you will texture it yourself (Substance, Blender)."
}
},
"UV Unwrapping": {
"ru": {
"d": "Развёртка UV — «раскрой» модели на плоскость для текстуры.",
"r": "Нужно, если будете текстурировать сами."
},
"en": {
"d": "UV unwrapping — \"unfolds\" the model onto a flat plane for texturing.",
"r": "Needed if you will texture it yourself."
}
},
"Semantic UV": {
"ru": {
"d": "Умная развёртка: швы режутся по смысловым частям (рука, голова, ножка стула).",
"r": "Удобнее для ручного текстурирования."
},
"en": {
"d": "Smart unwrapping: seams follow meaningful parts (arm, head, chair leg).",
"r": "Easier for manual texturing."
}
},
"Semantic UV Unwrap": {
"ru": {
"d": "Умная развёртка: швы по смысловым частям модели.",
"r": "Удобнее для ручного текстурирования."
},
"en": {
"d": "Smart unwrapping: seams follow meaningful parts of the model.",
"r": "Easier for manual texturing."
}
},
"Show UV Seams": {
"ru": {
"d": "Показать линии разрезов UV на модели."
},
"en": {
"d": "Show UV seam lines on the model."
}
},
"Texture": {
"ru": {
"d": "Цвет и материал поверхности модели."
},
"en": {
"d": "The color and material of the model's surface."
}
},
"Texture Generation": {
"ru": {
"d": "Генерация текстуры для уже готовой модели (своей или сгенерированной).",
"r": "Можно задать текстом или картинкой-примером."
},
"en": {
"d": "Generates a texture for an existing model (yours or a generated one).",
"r": "Guide it with text or a reference image."
}
},
"3D Texture Generation": {
"ru": {
"d": "Генерация текстуры для готовой модели.",
"r": "Можно задать текстом или картинкой-примером."
},
"en": {
"d": "Generates a texture for an existing model.",
"r": "Guide it with text or a reference image."
}
},
"Text to Texture": {
"ru": {
"d": "Текстура по текстовому описанию.",
"r": "Опишите материал: «ржавый металл», «полированное дерево», «аниме-стиль»."
},
"en": {
"d": "A texture from a text description.",
"r": "Describe the material: \"rusty metal\", \"polished wood\", \"anime style\"."
}
},
"Image to Texture": {
"ru": {
"d": "Текстура по картинке-образцу.",
"r": "Лучше, если картинка совпадает с моделью по ракурсу (вид спереди)."
},
"en": {
"d": "A texture from a reference image.",
"r": "Best when the image matches the model's view (front view)."
}
},
"Multi-View to Texture": {
"ru": {
"d": "Текстура по нескольким ракурсам объекта.",
"r": "Точнее всего покрывает бока и спину."
},
"en": {
"d": "A texture from several views of the object.",
"r": "Covers the sides and back most accurately."
}
},
"Generate PBR Textures": {
"ru": {
"d": "PBR — набор карт для реалистичного материала: цвет, металличность, шероховатость, нормали.",
"r": "Включайте для игр и реалистичного рендера."
},
"en": {
"d": "PBR is a set of maps for realistic materials: color, metallic, roughness, normals.",
"r": "Turn it on for games and realistic rendering."
}
},
"Albedo": {
"ru": {
"d": "Базовый цвет поверхности без света и теней."
},
"en": {
"d": "Base surface color without lighting or shadows."
}
},
"Metallic": {
"ru": {
"d": "Карта металличности: где поверхность металл, а где нет."
},
"en": {
"d": "Metallic map: which parts of the surface are metal."
}
},
"Roughness": {
"ru": {
"d": "Карта шероховатости: матовая (светлое) или глянцевая (тёмное) поверхность."
},
"en": {
"d": "Roughness map: matte (light) or glossy (dark) surface."
}
},
"Normal": {
"ru": {
"d": "Карта нормалей: мелкий рельеф без лишних полигонов."
},
"en": {
"d": "Normal map: fine surface relief without extra polygons."
}
},
"Remove Baked Lighting": {
"ru": {
"d": "Убирает с текстуры «нарисованные» свет и тени, оставляя чистый цвет.",
"r": "Включайте для игр/PBR — свет должен давать движок, а не текстура."
},
"en": {
"d": "Removes painted-in lights and shadows from the texture, leaving clean color.",
"r": "Turn it on for games/PBR — lighting should come from the engine, not the texture."
}
},
"Texture Resolution": {
"ru": {
"d": "Размер текстуры в пикселях.",
"r": "2K — обычно достаточно. 4K — для крупных планов."
},
"en": {
"d": "Texture size in pixels.",
"r": "2K is usually enough. 4K for close-ups."
}
},
"Texture Map Resolution": {
"ru": {
"d": "Размер текстуры в пикселях.",
"r": "2K — обычно достаточно. 4K — для крупных планов."
},
"en": {
"d": "Texture size in pixels.",
"r": "2K is usually enough. 4K for close-ups."
}
},
"Seamless Texture": {
"ru": {
"d": "Бесшовная (тайловая) текстура, которую можно повторять плиткой.",
"r": "Для полов, стен, земли."
},
"en": {
"d": "A seamless (tileable) texture that can repeat like tiles.",
"r": "For floors, walls, terrain."
}
},
"Rigging & Skinning": {
"ru": {
"d": "Риг — скелет внутри модели; скиннинг — привязка сетки к костям. Нужно для анимации.",
"r": "Работает для человекоподобных персонажей. Модель — в позе T/A, лицом вперёд."
},
"en": {
"d": "Rigging adds a skeleton inside the model; skinning binds the mesh to the bones. Required for animation.",
"r": "Works for humanoid characters. Model in T/A pose, facing forward."
}
},
"Automatic Rigging": {
"ru": {
"d": "Автоматическая расстановка костей и привязка сетки.",
"r": "Начните с неё; если кости встали криво — поправьте вручную."
},
"en": {
"d": "Places bones and binds the mesh automatically.",
"r": "Start with this; if bones are off, fix them manually."
}
},
"Manual Rigging": {
"ru": {
"d": "Ручная расстановка ключевых точек скелета (колени, локти и т.п.).",
"r": "Если автоматический риг ошибся."
},
"en": {
"d": "Place key skeleton points (knees, elbows, etc.) by hand.",
"r": "Use it if automatic rigging got it wrong."
}
},
"Rigging & Animation": {
"ru": {
"d": "Риг + анимация персонажа.",
"r": "Нужна модель человека в T/A-позе."
},
"en": {
"d": "Rig plus character animation.",
"r": "Needs a humanoid model in T/A pose."
}
},
"Animation Generation": {
"ru": {
"d": "Анимация для заригованной модели.",
"r": "Выберите шаблон движения или опишите текстом/видео."
},
"en": {
"d": "Animation for a rigged model.",
"r": "Pick a motion template or describe it with text/video."
}
},
"3D Animation Generation": {
"ru": {
"d": "Анимация для заригованной модели.",
"r": "Выберите шаблон движения или опишите текстом/видео."
},
"en": {
"d": "Animation for a rigged model.",
"r": "Pick a motion template or describe it with text/video."
}
},
"Text to Motion": {
"ru": {
"d": "Движение по текстовому описанию («идёт и машет рукой»).",
"r": "Короткие простые действия получаются лучше всего."
},
"en": {
"d": "Motion from a text description (\"walks and waves\").",
"r": "Short, simple actions work best."
}
},
"Video to Motion": {
"ru": {
"d": "Перенос движения с видео человека на модель (мокап по видео).",
"r": "Неподвижная камера, человек целиком в кадре, облегающая одежда."
},
"en": {
"d": "Transfers motion from a video of a person to the model (video mocap).",
"r": "Fixed camera, whole body in frame, fitted clothing."
}
},
"Motion Templates": {
"ru": {
"d": "Готовые движения: ходьба, бег, танцы и т.д."
},
"en": {
"d": "Ready-made motions: walking, running, dancing, etc."
}
},
"Component Split": {
"ru": {
"d": "Разделение модели на отдельные части (детали) — колёса, руки, ящики.",
"r": "Удобно для доработки, перекраски частей и анимации механизмов."
},
"en": {
"d": "Splits the model into separate parts — wheels, arms, drawers.",
"r": "Handy for editing, recoloring parts and animating mechanisms."
}
},
"Component Segmentation": {
"ru": {
"d": "Разделение модели на отдельные части."
},
"en": {
"d": "Splits the model into separate parts."
}
},
"Pre-Split": {
"ru": {
"d": "Предварительное автоматическое разбиение на части перед ручной правкой.",
"r": "Можно нажать несколько раз — результат будет разный."
},
"en": {
"d": "Automatic preliminary split into parts before manual editing.",
"r": "Click it several times — results differ."
}
},
"Part Mode": {
"ru": {
"d": "Режим работы с частями: клик по грани выделяет всю часть."
},
"en": {
"d": "Part editing mode: clicking a face selects the whole part."
}
},
"Seed": {
"ru": {
"d": "Число, задающее случайность генерации. Тот же seed + те же настройки = похожий результат.",
"r": "Меняйте, если хотите другой вариант при тех же настройках."
},
"en": {
"d": "A number that controls randomness. Same seed + same settings = similar result.",
"r": "Change it to get a different variant with the same settings."
}
},
"Style": {
"ru": {
"d": "Художественный стиль результата."
},
"en": {
"d": "Artistic style of the result."
}
},
"Geometry Style": {
"ru": {
"d": "Стиль формы: реалистичная, мультяшная, low-poly и т.п."
},
"en": {
"d": "Shape style: realistic, cartoon, low-poly, etc."
}
},
"Utilize symmetry": {
"ru": {
"d": "Делать модель симметричной.",
"r": "Включайте для персонажей, машин, мебели. Выключайте для асимметричных объектов."
},
"en": {
"d": "Make the model symmetrical.",
"r": "On for characters, vehicles, furniture. Off for asymmetric objects."
}
},
"Model Version": {
"ru": {
"d": "Версия нейросети для генерации.",
"r": "Обычно лучше самая новая; старые — если нравился их стиль."
},
"en": {
"d": "Version of the neural network used for generation.",
"r": "Usually the newest is best; older ones if you liked their style."
}
},
"Credits": {
"ru": {
"d": "Внутренняя валюта: списывается за каждую генерацию."
},
"en": {
"d": "In-app currency charged for each generation."
}
},
"Native Editing": {
"ru": {
"d": "Правка готовой модели текстовыми командами."
},
"en": {
"d": "Edit a finished model with text commands."
}
},
"Text to Scene": {
"ru": {
"d": "3D-сцена/мир по текстовому описанию."
},
"en": {
"d": "A 3D scene/world from a text description."
}
},
"Image to Scene": {
"ru": {
"d": "3D-сцена/мир по картинке."
},
"en": {
"d": "A 3D scene/world from an image."
}
},
"Panorama to Scene": {
"ru": {
"d": "3D-сцена из панорамы 360°."
},
"en": {
"d": "A 3D scene from a 360° panorama."
}
},
"World Model": {
"ru": {
"d": "Генерация целых 3D-миров/сцен, по которым можно ходить."
},
"en": {
"d": "Generates entire walkable 3D worlds/scenes."
}
},
"Select a Format": {
"ru": {
"d": "Формат файла для скачивания.",
"r": "GLB — универсальный (Blender, веб). FBX — Unity/Unreal и анимация. OBJ — простая геометрия. STL — 3D-печать. USDZ — iPhone/AR."
},
"en": {
"d": "File format for download.",
"r": "GLB — universal (Blender, web). FBX — Unity/Unreal and animation. OBJ — plain geometry. STL — 3D printing. USDZ — iPhone/AR."
}
},
"Texture Format": {
"ru": {
"d": "Формат файлов текстур.",
"r": "PNG — без потерь. JPG — легче."
},
"en": {
"d": "File format for textures.",
"r": "PNG — lossless. JPG — smaller."
}
}
};
