importScripts("um.js");

UniversalMachine.prototype.loadProgramFile = function(buffer) {
	console.log(buffer.byteLength);
	this.memory[0] = new Uint32Array(buffer.byteLength / 4);
	var arrayView = new DataView(buffer);

	for (var i = 0; i < buffer.byteLength; i += 4) {
		this.memory[0][i/4] = arrayView.getUint32(i, false);
	}
};

UniversalMachine.prototype.readLine = function() {
	postMessage({ action: "readLine" });
};

UniversalMachine.prototype.printChar = function(c) {
	postMessage({ action: "print", data: c.replace(/\n/g, "<br>") });
};

UniversalMachine.prototype.exit = function() {
	um.printChar("*** HALTED ***");
};

var um = null;

onmessage = function(e) {
	if (e.data.action == "loadProgram") {
		um = new UniversalMachine();
		um.loadProgramFile(e.data.program);
		postMessage({ action: "programLoaded" });
		um.run();
	} else if (e.data.action == "readLineDone") {
		um.processInput(e.data.data);
	}
};
