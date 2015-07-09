document.addEventListener("DOMContentLoaded", function(event) {
	var consoleDiv = document.getElementById("console");
	var programFile = document.getElementById("program-file");
	var preloadedProgram = document.getElementById("preloaded-program");
	var consoleInput = document.getElementById("console-input");
	var worker = new Worker("worker.js");

	consoleInput.onkeypress = function(e) {
		if (e.keyCode == 13) {
			worker.postMessage({action: "readLineDone", data: consoleInput.value + "\n" });
			consoleInput.value = "";
			consoleInput.disabled = true;
		}
	};

	programFile.addEventListener("change", function(event) {
		var fileReader = new FileReader();

		fileReader.onload = function(e) {
			var fileData = fileReader.result;
			worker.postMessage({action: "loadProgram", program: fileData});
		}

		fileReader.readAsArrayBuffer(programFile.files[0]);
	});

	preloadedProgram.addEventListener("change", function(event) {
		var name = preloadedProgram.value;
		if (name && window.preloadedPrograms[name]) {
			var base64 = window.preloadedPrograms[name];
			var binary = atob(base64);
			var buffer = new ArrayBuffer(binary.length);
			var view = new Uint8Array(buffer);

			for (var i = 0; i < binary.length; i++) {
				view[i] = binary.charCodeAt(i);
			};

			worker.postMessage({action: "loadProgram", program: buffer});
		}
	});

	var print = function(msg) {
		consoleDiv.innerHTML += msg;
		consoleDiv.scrollTop = consoleDiv.scrollHeight;
	};

	worker.onmessage = function(e) {
		if (e.data.action == "print") {
			print(e.data.data);
		} else if (e.data.action == "programLoaded") {
			print("*** PROGRAM LOADED ***<br/>");
		} else if (e.data.action == "readLine") {
			consoleInput.disabled = false;
			consoleInput.focus();
		}
	};
});
