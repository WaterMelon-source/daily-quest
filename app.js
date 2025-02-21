// Глобальные переменные для хранения последнего движения
let lastUpdate = Date.now();
const threshold = 15; // Чем выше, тем больше нужно движения

// Функция обновления прогресса
function updateProgress(exercise, max) {
	let span = document.getElementById(exercise);
	if (!span) {
		console.error(`Element with ID "${exercise}" not found.`);
		return;
	}

	let count = parseInt(span.textContent);
	if (isNaN(count)) {
		console.error(`Invalid count value for "${exercise}".`);
		return;
	}

	if (count < max) {
		count++;
		span.textContent = count;
	} else {
		console.log(`Max progress reached for "${exercise}".`);
	}
}

if (window.DeviceMotionEvent) {
	console.log("DeviceMotionEvent is supported.");
	if (typeof DeviceMotionEvent.requestPermission === "function") {
		console.log("Requesting permission for DeviceMotionEvent...");
		DeviceMotionEvent.requestPermission()
			.then((permissionState) => {
				if (permissionState === "granted") {
					console.log("Permission granted.");
					window.addEventListener("devicemotion", handleMotion);
				} else {
					console.warn("Permission denied.");
				}
			})
			.catch((error) => {
				console.error("Error requesting permission:", error);
			});
	} else {
		console.log("Adding devicemotion event listener directly.");
		window.addEventListener("devicemotion", handleMotion);
	}
} else {
	console.warn("DeviceMotionEvent is NOT supported on this device.");
}

// Обработчик движения
function handleMotion(event) {
	const acceleration = event.accelerationIncludingGravity;
	if (!acceleration) {
		console.warn("Acceleration data is unavailable.");
		return;
	}

	const { x, y, z } = acceleration;
	const totalAcceleration = Math.sqrt(x * x + y * y + z * z);
	const now = Date.now();

	console.log(`Acceleration: x=${x}, y=${y}, z=${z}`);
	console.log(`Total Acceleration: ${totalAcceleration}`);

	let logc = document.getElementById("console-log");

	logc.textContent = `Acceleration: x=${x}, y=${y}, z=${z} Total Acceleration: ${totalAcceleration}`;

	if (totalAcceleration > threshold && now - lastUpdate > 500) {
		console.log("Motion detected! Updating progress...");
		updateProgress("pushups", 100); // Update the counter
		lastUpdate = now;
	}
}
