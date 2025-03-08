let video;
let poseNet;
let squatCount = 0;
let isSquatting = false;
const targetSquats = 100;
let cameraStream = null;
let isTracking = false;

// Настройки для мобильных устройств
const mobileSettings = {
	video: {
		facingMode: "user",
		width: { ideal: 360 },
		height: { ideal: 480 },
	},
	model: {
		architecture: "MobileNetV1",
		outputStride: 8,
		inputResolution: { width: 257, height: 257 },
		multiplier: 0.5,
	},
};

// Проверка безопасного контекста
const localhostRegex =
	/^(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)$/;
function isSecureContext() {
	return (
		window.isSecureContext ||
		localhostRegex.test(location.hostname) ||
		location.protocol === "https:"
	);
}

// Функция обновления прогресса
function updateProgress(exercise, current) {
	const progressElement = document.getElementById(exercise);
	if (progressElement) {
		progressElement.textContent = current;

		// Анимация чекбокса при достижении цели
		if (exercise === "squats" && current >= targetSquats) {
			const checkbox = document.querySelector(
				`#quest-line:nth-child(2) #checkbox`
			);
			checkbox.style.opacity = 1;
			checkbox.style.transform = "scale(1.2)";
		}
	}
}

async function setupCamera() {
	try {
		cleanup();

		video = document.createElement("video");
		video.setAttribute("autoplay", "");
		video.setAttribute("playsinline", "");
		video.style.transform = "scaleX(-1)";
		video.style.position = "fixed";
		video.style.top = "10px";
		video.style.right = "10px";
		video.style.width = "160px";
		video.style.height = "120px";
		video.style.border = "2px solid #00bfff";
		video.style.borderRadius = "5px";
		document.body.appendChild(video);

		cameraStream = await navigator.mediaDevices.getUserMedia({
			video: mobileSettings.video,
		});

		video.srcObject = cameraStream;

		return new Promise((resolve, reject) => {
			video.onloadedmetadata = async () => {
				try {
					await video.play();
					resolve(video);
				} catch (err) {
					reject("Не удалось воспроизвести видео");
				}
			};
			video.onerror = () => reject("Ошибка видео");
		});
	} catch (err) {
		console.error("Ошибка камеры:", err);
		throw err;
	}
}

async function loadPoseNetModel() {
	try {
		return await posenet.load(mobileSettings.model);
	} catch (err) {
		console.error("Ошибка модели:", err);
		throw err;
	}
}

function detectSquat(pose) {
	const leftHip = pose.keypoints.find((kp) => kp.part === "leftHip");
	const leftKnee = pose.keypoints.find((kp) => kp.part === "leftKnee");
	const leftAnkle = pose.keypoints.find((kp) => kp.part === "leftAnkle");

	if (leftHip.score < 0.5 || leftKnee.score < 0.5 || leftAnkle.score < 0.5)
		return;

	const hip = leftHip.position;
	const knee = leftKnee.position;
	const ankle = leftAnkle.position;

	const thighAngle = Math.atan2(knee.y - hip.y, knee.x - hip.x);
	const shinAngle = Math.atan2(ankle.y - knee.y, ankle.x - knee.x);
	const angle = (thighAngle - shinAngle) * (180 / Math.PI);

	if (angle < 70 && !isSquatting) {
		isSquatting = true;
		squatCount = Math.min(squatCount + 1, targetSquats);
		updateProgress("squats", squatCount);
	} else if (angle > 110) {
		isSquatting = false;
	}
}

async function trackSquats() {
	if (!video || video.paused || !isTracking) return;

	try {
		const pose = await poseNet.estimateSinglePose(video);
		detectSquat(pose);
		requestAnimationFrame(trackSquats);
	} catch (err) {
		console.error("Ошибка трекинга:", err);
		showError("Ошибка отслеживания. Нажмите чтобы перезапустить.");
	}
}

function cleanup() {
	if (video) {
		document.body.removeChild(video);
		video = null;
	}
	if (cameraStream) {
		cameraStream.getTracks().forEach((track) => track.stop());
		cameraStream = null;
	}
	poseNet = null;
	isTracking = false;
}

function showError(message) {
	const errorBox = document.createElement("div");
	errorBox.className = "error-message";
	errorBox.textContent = message;
	document.body.appendChild(errorBox);

	errorBox.addEventListener("click", () => {
		document.body.removeChild(errorBox);
		init();
	});
}

async function init() {
	cleanup();
	isTracking = true;

	try {
		// Проверка безопасного контекста
		if (!isSecureContext()) {
			throw new Error("Требуется HTTPS или локальный сервер");
		}

		video = await setupCamera();
		poseNet = await loadPoseNetModel();
		trackSquats();
	} catch (err) {
		isTracking = false;
		console.error("Инициализация не удалась:", err);
		showError("Ошибка инициализации. Нажмите чтобы перезапустить.");
	}
}

// Обработчик видимости страницы
document.addEventListener("visibilitychange", () => {
	if (document.hidden) {
		cleanup();
	} else {
		init();
	}
});

// Инициализация при загрузке
document.addEventListener("DOMContentLoaded", () => {
	updateProgress("squats", 0); // Теперь функция определена
	init();
});
