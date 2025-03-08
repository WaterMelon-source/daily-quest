// Инициализация переменных
let video;
let poseNet;
let squatCount = 0;
let isSquatting = false;
const targetSquats = 100;

// Подключение к камере
async function setupCamera() {
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

  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;
  
  return new Promise(resolve => {
    video.onloadedmetadata = () => {
      video.play();
      resolve(video);
    };
  });
}

// Загрузка модели PoseNet
async function loadPoseNetModel() {
  return posenet.load({
    architecture: 'MobileNetV1',
    outputStride: 16,
    inputResolution: { width: 640, height: 480 },
    multiplier: 0.75
  });
}

// Расчет угла колена
function calculateKneeAngle(hip, knee, ankle) {
  const hipKnee = Math.atan2(knee.y - hip.y, knee.x - hip.x);
  const kneeAnkle = Math.atan2(ankle.y - knee.y, ankle.x - knee.x);
  return (hipKnee - kneeAnkle) * (180 / Math.PI);
}

// Основная функция отслеживания
async function trackSquats() {
  const pose = await poseNet.estimateSinglePose(video);
  
  const leftHip = pose.keypoints.find(kp => kp.part === 'leftHip');
  const leftKnee = pose.keypoints.find(kp => kp.part === 'leftKnee');
  const leftAnkle = pose.keypoints.find(kp => kp.part === 'leftAnkle');

  if (leftHip.score > 0.5 && leftKnee.score > 0.5 && leftAnkle.score > 0.5) {
    const angle = calculateKneeAngle(leftHip.position, leftKnee.position, leftAnkle.position);
    
    // Логика подсчета приседаний
    if (angle < 90 && !isSquatting) {
      isSquatting = true;
      squatCount = Math.min(squatCount + 1, targetSquats);
      updateProgress('squats', squatCount);
    } else if (angle > 120) {
      isSquatting = false;
    }
  }
  
  requestAnimationFrame(trackSquats);
}

// Инициализация приложения
async function init() {
  try {
    video = await setupCamera();
    poseNet = await loadPoseNetModel();
    trackSquats();
  } catch (err) {
    console.error('Ошибка инициализации:', err);
    alert('Не удалось получить доступ к камере или загрузить модель');
  }
}

// Функция обновления прогресса
function updateProgress(exercise, current) {
  const progressElement = document.getElementById(exercise);
  if (progressElement) {
    progressElement.textContent = current;
    
    // Добавляем анимацию для чекбокса при достижении цели
    if (exercise === 'squats' && current >= targetSquats) {
      const checkbox = document.querySelector(`#quest-line:nth-child(2) #checkbox`);
      checkbox.style.opacity = 1;
      checkbox.style.transform = 'scale(1.2)';
    }
  }
}

// Запуск при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  init();
  
  // Инициализация начальных значений
  updateProgress('squats', 0);
});
