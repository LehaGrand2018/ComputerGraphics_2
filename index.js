const processImage = (originalCanvas) => {
  const src = cv.imread(originalCanvas);

  // Низкочастотный фильтр (сглаживание)
  const smoothed = new cv.Mat();
  cv.GaussianBlur(src, smoothed, new cv.Size(49, 49), 0, 0, cv.BORDER_DEFAULT);
  displayResult(smoothed, "smoothedCanvas");

  // Линейное контрастирование для цветного изображения в RGB
  const linearContrastRGB = new cv.Mat();
  src.convertTo(linearContrastRGB, -1, 1.5, 0);
  displayResult(linearContrastRGB, "linearContrastRGBCanvas");

  // Выравнивание гистограммы в RGB
  const equalizedRGB = new cv.Mat();
  const channels = new cv.MatVector();
  cv.split(src, channels);
  for (let i = 0; i < channels.size(); i++) {
    cv.equalizeHist(channels.get(i), channels.get(i));
  }
  cv.merge(channels, equalizedRGB);
  displayResult(equalizedRGB, "equalizedRGBCanvas");

  // Выравнивание гистограммы в HSV
  const hsv = new cv.Mat();
  const hsvEqualized = new cv.Mat();
  cv.cvtColor(src, hsv, cv.COLOR_RGBA2RGB);
  cv.cvtColor(hsv, hsv, cv.COLOR_RGB2HSV);

  const hsvChannels = new cv.MatVector();
  cv.split(hsv, hsvChannels);
  cv.equalizeHist(hsvChannels.get(2), hsvChannels.get(2)); // Эквализация только по яркости
  cv.merge(hsvChannels, hsvEqualized);
  cv.cvtColor(hsvEqualized, hsvEqualized, cv.COLOR_HSV2RGB);
  displayResult(hsvEqualized, "equalizedHSVCanvas");

  // Полутоновое изображение
  const gray = new cv.Mat();
  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
  displayResult(gray, "grayscaleCanvas");

  // Бинаризация изображения
  const binary = new cv.Mat();
  cv.threshold(gray, binary, 128, 255, cv.THRESH_BINARY);
  displayResult(binary, "binaryCanvas");

  // Построение гистограммы
  drawHistogram(gray, "histogramCanvas");
  drawColorHistograms(src, "histogramCanvasColors")
};

const drawHistogram = (gray, canvasId) => {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext('2d');

  // Расчет гистограммы
  const histSize = 256;
  const hist = new cv.Mat();
  const mask = new cv.Mat();
  const ranges = [0, 256];

  // Создаем вектор для каналов
  const channels = new cv.MatVector();
  channels.push_back(gray); // Добавляем только один канал (gray)

  // Вычисление гистограммы
  cv.calcHist(channels, [0], mask, hist, [histSize], ranges);

  // Нормализация гистограммы для отображения
  const normalizedHist = new cv.Mat();
  cv.normalize(hist, normalizedHist, 0, canvas.height, cv.NORM_MINMAX);

  // Очистка canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#e3e3e3';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Отрисовка гистограммы
  ctx.strokeStyle = 'black';
  ctx.beginPath();

  const binWidth = canvas.width / histSize;

  for (let i = 0; i < histSize; i++) {
      const value = normalizedHist.data32F[i];
      const x = i * binWidth;
      const y = canvas.height - value;
      ctx.moveTo(x, canvas.height);
      ctx.lineTo(x, y);
  }

  ctx.stroke();

  // Очистка памяти
  hist.delete();
  mask.delete();
  normalizedHist.delete();
  channels.delete();
};

const drawColorHistograms = (src, canvasId) => {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext('2d');

  // Увеличиваем размер гистограммы для большей детализации
  const histSize = 512; // Используем 512 уровней яркости для более детализированного представления
  const histR = new cv.Mat();
  const histG = new cv.Mat();
  const histB = new cv.Mat();
  const mask = new cv.Mat();
  const ranges = [0, 256];

  // Разделяем изображение на каналы RGB
  const channels = new cv.MatVector();
  cv.split(src, channels);

  // Вычисляем гистограмму для каждого канала
  cv.calcHist(channels, [0], mask, histB, [histSize], ranges); // Синий канал
  cv.calcHist(channels, [1], mask, histG, [histSize], ranges); // Зеленый канал
  cv.calcHist(channels, [2], mask, histR, [histSize], ranges); // Красный канал

  // Нормализация гистограмм для отображения
  const normalizedHistR = new cv.Mat();
  const normalizedHistG = new cv.Mat();
  const normalizedHistB = new cv.Mat();
  cv.normalize(histR, normalizedHistR, 0, canvas.height, cv.NORM_MINMAX);
  cv.normalize(histG, normalizedHistG, 0, canvas.height, cv.NORM_MINMAX);
  cv.normalize(histB, normalizedHistB, 0, canvas.height, cv.NORM_MINMAX);

  // Очистка canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#e3e3e3';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Отрисовка гистограммы для каждого канала с плавными линиями
  const binWidth = canvas.width / histSize;

  // Отрисовка красного канала (с плавной линией)
  ctx.strokeStyle = 'red';
  ctx.lineWidth = 1; // Тонкая линия для плавности
  ctx.beginPath();
  for (let i = 0; i < histSize; i++) {
      const value = normalizedHistR.data32F[i];
      const x = i * binWidth;
      const y = canvas.height - value;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y); // Линия между точками
  }
  ctx.stroke();

  // Отрисовка зеленого канала
  ctx.strokeStyle = 'green';
  ctx.beginPath();
  for (let i = 0; i < histSize; i++) {
      const value = normalizedHistG.data32F[i];
      const x = i * binWidth;
      const y = canvas.height - value;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Отрисовка синего канала
  ctx.strokeStyle = 'blue';
  ctx.beginPath();
  for (let i = 0; i < histSize; i++) {
      const value = normalizedHistB.data32F[i];
      const x = i * binWidth;
      const y = canvas.height - value;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Обновление масштаба канвы с учетом изменения размера
  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth * 0.8;  // Масштабируем канвас относительно окна
    canvas.height = window.innerHeight * 0.4;
    drawResponsiveColorHistograms(src, canvasId);  // Перерисовываем гистограмму
  });

  // Очистка памяти
  histR.delete();
  histG.delete();
  histB.delete();
  normalizedHistR.delete();
  normalizedHistG.delete();
  normalizedHistB.delete();
  mask.delete();
  channels.delete();
};

const imageUploadHandler = (e) => {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      const originalCanvas = document.getElementById("originalCanvas");
      const ctx = originalCanvas.getContext("2d");

      const scale = Math.min(
        originalCanvas.width / img.width,
        originalCanvas.height / img.height
      );
      const x = originalCanvas.width / 2 - (img.width / 2) * scale;
      const y = originalCanvas.height / 2 - (img.height / 2) * scale;

      ctx.clearRect(0, 0, originalCanvas.width, originalCanvas.height);
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

      processImage(originalCanvas);
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
};

const displayResult = (mat, canvasId) => {
  const canvas = document.getElementById(canvasId);
  cv.imshow(canvas, mat);
};

document
  .getElementById("imageUpload")
  .addEventListener("change", imageUploadHandler);
