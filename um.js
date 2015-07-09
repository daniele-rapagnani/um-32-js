UniversalMachine = function() {
	this.registers = new Uint32Array(8);
	this.memory = [null];
	this.pool = [];
	this.pc = 0;
	this.cycle = 0;
	this.running = false;

	for (var i = 0; i < this.registers.length; i++) {
		this.registers[i] = 0;
	};

	this.inputLine = "";
	this.awaitingInput = false;
};

UniversalMachine.prototype.fatal = function(string) {
	this.dumpStack();
	throw new Error(string);
};

/**
 * The register A receives the value in register B,
 * unless the register C contains 0.
 */

UniversalMachine.prototype.conditionalMove = function(inst) {
	if (this.registers[inst.c]) {
		this.registers[inst.a] = this.registers[inst.b];
	}
};

/**
 * The register A receives the value stored at offset
 * in register C in the array identified by B.
 */

UniversalMachine.prototype.arrayIndex = function(inst) {
	this.registers[inst.a] = this.readMemory(
		this.registers[inst.b],
		this.registers[inst.c]
	);
};

/**
 * The array identified by A is amended at the offset
 * in register B to store the value in register C.
 */

UniversalMachine.prototype.arrayAmendment = function(inst) {
	this.writeMemory(
		this.registers[inst.a],
		this.registers[inst.b],
		this.registers[inst.c]
	);
};

/**
 * The register A receives the value in register B plus
 * the value in register C, modulo 2^32.
 */

UniversalMachine.prototype.addition = function(inst) {
	this.registers[inst.a] =
		((this.registers[inst.b] + this.registers[inst.c])) >>> 0;
};

/**
 * The register A receives the value in register B times
 * the value in register C, modulo 2^32.
 */

UniversalMachine.prototype.multiplication = function(inst) {
	this.registers[inst.a] =
		((this.registers[inst.b] * this.registers[inst.c])) >>> 0;
};

/**
 * The register A receives the value in register B
 * divided by the value in register C, if any, where
 * each quantity is treated treated as an unsigned 32
 * bit number.
 */

UniversalMachine.prototype.division = function(inst) {
	if (!this.registers[inst.c]) {
		this.fatal("Division by 0");
	}

	this.registers[inst.a] =
		(((this.registers[inst.b] >>> 0) / (this.registers[inst.c] >>> 0))) >>> 0;
};

/**
 * Each bit in the register A receives the 1 bit if
 * either register B or register C has a 0 bit in that
 * position.  Otherwise the bit in register A receives
 * the 0 bit.
 */

UniversalMachine.prototype.notAnd = function(inst) {
	this.registers[inst.a] =
		((~(this.registers[inst.b] & this.registers[inst.c]))) >>> 0;
};

/**
 * The universal machine stops computation.
 */

UniversalMachine.prototype.halt = function() {
	this.running = false;
	this.exit()
};

UniversalMachine.prototype.exit = null;

/**
 * A new array is created with a capacity of platters
 * commensurate to the value in the register C. This
 * new array is initialized entirely with platters
 * holding the value 0. A bit pattern not consisting of
 * exclusively the 0 bit, and that identifies no other
 * active allocated array, is placed in the B register.
 */

UniversalMachine.prototype.allocation = function(inst) {
	var size = this.registers[inst.c];
	var index = null;

	if (this.pool.length) {
		index = this.pool.pop();
		this.memory[index] = new Uint32Array(size);
	} else {
		for (var i = 0; i < this.memory.length; i++) {
			if (!this.memory[i]) {
				index = i;
				this.memory[i] = new Uint32Array(size);
				break;
			}
		};
	}

	if (!index) {
		index = this.memory.length;
		this.memory.push(new Uint32Array(size));
	}

	this.registers[inst.b] = index;
};

/**
 * The array identified by the register C is abandoned.
 * Future allocations may then reuse that identifier.
 */

UniversalMachine.prototype.abandonment = function(inst) {
	if (!this.memory[this.registers[inst.c]]) {
		this.fatal("Can't free unallocated memory: " + this.registers[inst.c]);
	}

	this.memory[this.registers[inst.c]] = null;
	this.pool.push(this.registers[inst.c]);
};

/**
 * The value in the register C is displayed on the console
 * immediately. Only values between and including 0 and 255
 * are allowed.
 */

UniversalMachine.prototype.output = function(inst) {
	this.printChar(String.fromCharCode((this.registers[inst.c] & 0xFF) >>> 0));
};

/**
 * The universal machine waits for input on the console.
 * When input arrives, the register C is loaded with the
 * input, which must be between and including 0 and 255.
 * If the end of input has been signaled, then the
 * register C is endowed with a uniform value pattern
 * where every place is pregnant with the 1 bit.
 */

UniversalMachine.prototype.input = function(inst) {
	if (!this.inputLine) {
		var input = this.readLine();

		// Input will come later because it is
		// collected in an asyncronous manner
		if (!input) {
			this.awaitingInput = true;
			return;
		}

		this.processInput(input);
	}

	var c = 0xFFFFFFFF;

	if (this.inputLine.length) {
		var c = (this.inputLine.substr(0, 1).charCodeAt(0) & 0xFF) >>> 0;
		this.inputLine = this.inputLine.substr(1);
	}

	this.registers[inst.c] = c;
};

/**
 * The array identified by the B register is duplicated
 * and the duplicate shall replace the '0' array,
 * regardless of size. The execution finger is placed
 * to indicate the platter of this array that is
 * described by the offset given in C, where the value
 * 0 denotes the first platter, 1 the second, et
 * cetera.
 *
 * The '0' array shall be the most sublime choice for
 * loading, and shall be handled with the utmost
 * velocity.
 */

UniversalMachine.prototype.loadProgram = function(inst) {
	var progArray = this.registers[inst.b];

	if (!this.memory[progArray]) {
		this.fatal("Invalid program array: " + progArray);
	}

	if (progArray != 0) {
		this.memory[0] = new Uint32Array(this.memory[progArray]);
	}

	this.pc = this.registers[inst.c];
};

/**
 * The value indicated is loaded into the register A
 * forthwith.
 */

UniversalMachine.prototype.orthography = function(inst) {
	this.registers[inst.index] = inst.value;
};

UniversalMachine.opcodes = {
	0: UniversalMachine.prototype.conditionalMove,
	1: UniversalMachine.prototype.arrayIndex,
	2: UniversalMachine.prototype.arrayAmendment,
	3: UniversalMachine.prototype.addition,
	4: UniversalMachine.prototype.multiplication,
	5: UniversalMachine.prototype.division,
	6: UniversalMachine.prototype.notAnd,
	7: UniversalMachine.prototype.halt,
	8: UniversalMachine.prototype.allocation,
	9: UniversalMachine.prototype.abandonment,
	10: UniversalMachine.prototype.output,
	11: UniversalMachine.prototype.input,
	12: UniversalMachine.prototype.loadProgram,
	13: UniversalMachine.prototype.orthography
};

UniversalMachine.prototype.checkMemory = function(arrayIndex, offset) {
	if (arrayIndex >= this.memory.length) {
		this.fatal("Invalid array index: " + arrayIndex);
	}

	if (!this.memory[arrayIndex]) {
		this.fatal("Accessing unallocated array: " + arrayIndex);
	}

	if (offset >= this.memory[arrayIndex].length) {
		this.fatal("Accessing invalid offset in array: " + arrayIndex + " offset: " + offset + " size: " + this.memory[arrayIndex].length);
	}

	return this.memory[arrayIndex];
};

UniversalMachine.prototype.readMemory = function(arrayIndex, offset) {
	var arr = this.checkMemory(arrayIndex, offset);
	return arr[offset];
};

UniversalMachine.prototype.writeMemory = function(arrayIndex, offset, value) {
	var arr = this.checkMemory(arrayIndex, offset);
	this.memory[arrayIndex][offset] = value;
};

UniversalMachine.prototype.readLine = null;

UniversalMachine.prototype.dumpStack = function() {
	console.log("========== MACHINE STATE ===========");
	for (var i = 0; i < this.registers.length; i++) {
		console.log("REG " + i + ": " + this.registers[i]);
	};

	console.log("PC: " + this.pc);
	console.log("CYCLE: " + this.cycle);
	console.log("LAST INST CODE: " + this.memory[0][this.pc].toString(16));
	console.log("====================================");
};

UniversalMachine.prototype.dumpState = function(inst) {
	var out = [
		"code: " + inst.code.toString(16),
		"op: " + inst.opcode,
	];

	if (inst.opcode != 13) {
		out = out.concat([
			"a: " + inst.a,
			"b: " + inst.b,
			"c: " + inst.c
		]);
	} else {
		out = out.concat([
			"a: " + inst.index,
			"data: " + inst.value,
		]);
	}

	this.registers.forEach(function(item, i) {
		out.push("R"+i+": "+(item >>> 0));
	});

	out.push("pc: "+this.pc);
	out.push("cycle: "+this.cycle);

	console.log(out.join(", "));
};

UniversalMachine.prototype.parseInstruction = function(instruction) {
	var opcode = ((instruction >>> 28) & 0xF) >>> 0;

	if (!UniversalMachine.opcodes[opcode]) {
		this.dumpStack();
		this.fatal("Invalid opcode: " + opcode + ", inst: " + instruction.toString(16));
	}

	return {
		code: instruction,
		opcode: opcode,
		a: ((instruction >>> 6) & 7) >>> 0,
		b: ((instruction >>> 3) & 7) >>> 0,
		c: ((instruction & 7)) >>> 0,
		index: ((instruction >>> 25) & 7) >>> 0,
		value: (instruction & 0x1FFFFFF) >>> 0
	};
};

UniversalMachine.prototype.readInstruction = function() {
	if (this.pc >= this.memory[0].length) {
		this.fatal("Invalid program counter: " + this.pc);
	}

	var code = this.memory[0][this.pc++];

	return this.parseInstruction(code);
};

UniversalMachine.prototype.pauseAndWaitForInput = function(inst) {
	var wait = function() {
		if (this.awaitingInput && !this.inputLine) {
			setTimeout(wait, 100);
		} else {
			this.awaitingInput = false;
			this.input(inst);
			this.run();
		}
	}.bind(this);

	setTimeout(wait, 100);
}

UniversalMachine.prototype.run = function() {
	this.running = true;

	while(this.running) {
		var inst = this.readInstruction();
		UniversalMachine.opcodes[inst.opcode].call(this, inst);

		if (this.awaitingInput && !this.inputLine) {
			this.pauseAndWaitForInput(inst);
			break;
		}

		this.cycle++;
	}
};

UniversalMachine.prototype.loadProgramFile = null;
UniversalMachine.prototype.printChar = null;

UniversalMachine.prototype.processInput = function(input) {
	if (this.inputLine) {
		this.inputLine += input;
	} else {
		this.inputLine = input;
	}
}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
	module.exports = UniversalMachine;
} else if (typeof window != 'undefined') {
	window.UniversalMachine = UniversalMachine
}
