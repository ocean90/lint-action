const commandExists = require("../../vendor/command-exists");
const { run } = require("../utils/action");
const { initLintResult } = require("../utils/lint-result");

const PARSE_REGEX = /^(.*):([0-9]+):[0-9]+: \w+: \((\w+)\) (.*)\.$/gm;

/**
 * https://github.com/nicklockwood/SwiftFormat
 */
class SwiftFormat {
	static get name() {
		return "SwiftFormat";
	}

	/**
	 * Verifies that all required programs are installed. Throws an error if programs are missing
	 * @param {string} dir - Directory to run the linting program in
	 * @param {string} prefix - Prefix to the run command
	 */
	static async verifySetup(dir, prefix = "") {
		// Verify that SwiftFormat is installed
		if (!(await commandExists("swiftformat"))) {
			throw new Error(`${this.name} is not installed`);
		}
	}

	/**
	 * Runs the linting program and returns the command output
	 * @param {string} dir - Directory to run the linter in
	 * @param {string[]} extensions - File extensions which should be linted
	 * @param {string} args - Additional arguments to pass to the linter
	 * @param {boolean} fix - Whether the linter should attempt to fix code style issues automatically
	 * @param {string} prefix - Prefix to the run command
	 * @returns {{status: number, stdout: string, stderr: string}} - Output of the lint command
	 */
	static lint(dir, extensions, args = "", fix = false, prefix = "") {
		if (extensions.length !== 1 || extensions[0] !== "swift") {
			throw new Error(`${this.name} error: File extensions are not configurable`);
		}

		const fixArg = fix ? "" : "--lint";
		return run(`${prefix} swiftformat ${fixArg} ${args} "."`, {
			dir,
			ignoreErrors: true,
		});
	}

	/**
	 * Parses the output of the lint command. Determines the success of the lint process and the
	 * severity of the identified code style violations
	 * @param {string} dir - Directory in which the linter has been run
	 * @param {{status: number, stdout: string, stderr: string}} output - Output of the lint command
	 * @returns {{isSuccess: boolean, warning: [], error: []}} - Parsed lint result
	 */
	static parseOutput(dir, output) {
		const lintResult = initLintResult();
		lintResult.isSuccess = output.status === 0;

		const matches = output.stderr.matchAll(PARSE_REGEX);
		for (const match of matches) {
			const [_, pathFull, line, rule, message] = match;
			const path = pathFull.substring(dir.length + 1);
			const lineNr = parseInt(line, 10);
			// SwiftFormat only seems to use the "warning" level, which this action will therefore
			// categorize as errors
			lintResult.error.push({
				path,
				firstLine: lineNr,
				lastLine: lineNr,
				message: `${message} (${rule})`,
			});
		}

		return lintResult;
	}
}

module.exports = SwiftFormat;
