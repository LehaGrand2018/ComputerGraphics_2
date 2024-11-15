

const processImage = (originalCanvas) => {


  const src = cv.imread(originalCanvas);

  // Низкочастотный фильтр (сглаживание)
  const smoothed = new cv.Mat();
  cv.GaussianBlur(src, smoothed, new cv.Size(49, 49), 0, 0, cv.BORDER_DEFAULT);
  displayResult(smoothed, 'smoothedCanvas');
  
  // Линейное контрастирование для цветного изображения в RGB
  const linearContrastRGB = new cv.Mat();
  src.convertTo(linearContrastRGB, -1, 1.5, 0);
  displayResult(linearContrastRGB, 'linearContrastRGBCanvas');

  // Выравнивание гистограммы в RGB
  const equalizedRGB = new cv.Mat();
  const channels = new cv.MatVector();
  cv.split(src, channels);
  for (let i = 0; i < channels.size(); i++) {
    cv.equalizeHist(channels.get(i), channels.get(i));
  }
  cv.merge(channels, equalizedRGB);
  displayResult(equalizedRGB, 'equalizedRGBCanvas');


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
  displayResult(hsvEqualized, 'equalizedHSVCanvas');

}


const imageUploadHandler = (e) => {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
          const originalCanvas = document.getElementById('originalCanvas');
          const ctx = originalCanvas.getContext('2d');
          
          const scale = Math.min(originalCanvas.width / img.width, originalCanvas.height / img.height);
          const x = (originalCanvas.width / 2) - (img.width / 2) * scale;
          const y = (originalCanvas.height / 2) - (img.height / 2) * scale;

          ctx.clearRect(0, 0, originalCanvas.width, originalCanvas.height);
          ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

          processImage(originalCanvas);
      };
      img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}


const displayResult = (mat, canvasId) => {
  const canvas = document.getElementById(canvasId);
  cv.imshow(canvas, mat);
}

document.getElementById('imageUpload').addEventListener('change', imageUploadHandler);