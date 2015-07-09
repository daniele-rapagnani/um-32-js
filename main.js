var fs = require('fs');
var readlineSync = require('readline-sync');

var UniversalMachine = require('./um.js');

if (process.argv.length <= 2) {
	console.log("Please specify a program file to be loaded");
	process.exit();
}

UniversalMachine.prototype.loadProgramFile = function(file) {
	var programBuffer = fs.readFileSync(file);

	this.memory[0] = new Uint32Array(programBuffer.length / 4);

	for (var i = 0; i < programBuffer.length; i += 4) {
		this.memory[0][i / 4] = programBuffer.readUInt32BE(i);
	}
};

UniversalMachine.prototype.readLine = function() {
	return readlineSync.question('')+"\n";
};

UniversalMachine.prototype.printChar = function(c) {
	process.stdout.write(c);
};

UniversalMachine.prototype.halt = function() {
	process.exit();
};

var um = new UniversalMachine();
um.loadProgramFile(process.argv[2]);
um.run();
