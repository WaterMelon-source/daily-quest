let video;
let poseNet;
let squatCount = 0;
let isSquatting = false;
const targetSquats = 100;
let cameraStream = null; // Для хранения потока камеры

async function setupCamera() {
  try {
    // Удаляем предыдущий элемент видео если существует
    if (video) {
      document.body.removeChild(video);
      if (cameraStream) {
        const tracks = cameraStream.getTracks();
        tracks.forEach(track => track.stop());
      }
    }

    video = document.createElement('video');
    video.setAttribute('autoplay', '');
    video.setAttribute('playsinline', '');
    video.style.transform = 'scaleX(-1)';
    video.style.position = 'fixed';
    video.style.top = '20px';
    video.style.right = '20px';
    video.style.width = '320px';
    video.style.height = '240px';
    document.body.appendChild(video);

    cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = cameraStream;

    return new Promise((resolve, reject) => {
      video.onloadedmetadata = () => {
        video.play()
          .then(() => resolve(video))
          .catch(err => reject(err));
      };
      video.onerror = (e) => {
        reject(`Ошибка воспроизведения видео: ${e}`);
      };
    });

  } catch (err) {
    console.error('Ошибка доступа к камере:', err);
    throw err; // Пробрасываем ошибку дальше
  }
}

async function loadPoseNetModel() {
  try {
    return await posenet.load({
      architecture: 'MobileNetV1',
      outputStride: 16,
      inputResolution: { width: 640, height: 480 },
      multiplier: 0.75
    });
  } catch (err) {
    console.error('Ошибка загрузки модели:', err);
    throw err;
  }
}

async function trackSquats() {
  try {
    const pose = await poseNet.estimateSinglePose(video);
    // ... (оставьте существующую логику обработки позы)
    
    requestAnimationFrame(trackSquats);
  } catch (err) {
    console.error('Ошибка трекинга:', err);
    // Перезапускаем систему при ошибке
    cleanup();
    showError('Ошибка трекинга. Перезагрузите страницу.');
  }
}

function cleanup() {
  if (video) {
    document.body.removeChild(video);
    video = null;
  }
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
  }
  poseNet = null;
}

function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.style.color = 'red';
  errorDiv.style.position = 'fixed';
  errorDiv.style.bottom = '20px';
  errorDiv.style.right = '20px';
  errorDiv.textContent = message;
  document.body.appendChild(errorDiv);
}

async function init() {
  cleanup(); // Очистка предыдущих ресурсов
  
  try {
    video = await setupCamera();
    poseNet = await loadPoseNetModel();
    await trackSquats(); // Начинаем трекинг
  } catch (err) {
    console.error('Инициализация не удалась:', err);
    showError('Не удалось инициализировать систему. Проверьте доступ к камере и перезагрузите страницу.');
  }
}

// Перезапуск по клику на ошибку
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('error-message')) {
    init();
  }
});

// При первой загрузке
document.addEventListener('DOMContentLoaded', () => {
  init();
  updateProgress('squats', 0);
});
