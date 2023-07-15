import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { randomBytes } from 'crypto';
import { ErrorType } from '@prisma/client';
import { promisify } from 'util';

@Injectable()
export class ScriptService {

  runCScript(script: string): Promise<{ result?: string | null; error?: boolean, errorType?: ErrorType, message: string, lineNumber?: number | undefined }> {
    if (script.includes('scanf') || script.includes('gets') || script.includes('getch')) {
      throw new HttpException('Input invocations are not allowed in the script.', HttpStatus.BAD_REQUEST);
    }
    return new Promise((resolve) => {
      // Save the script to a temporary file inside the src folder
      const fileName = randomBytes(6).toString("hex")
      const scriptPath = path.join(process.cwd(), 'src', 'temp', fileName + '.c');
      // The script will be saved in the `src/temp` directory relative to the project root

      // Write the script to the temporary file
      fs.writeFile(scriptPath, script, (err) => {
        if (err) {
          console.error(err)
          resolve({ message: 'Error saving script file.', error: true, result: null, errorType: "FileSystemError" });
        } else {
          // Compile the script using the `gcc` command (assuming GCC is installed)
          const compiledScriptPath = `${scriptPath}.out`;
          exec(`gcc ${scriptPath} -o ${compiledScriptPath}`, (compileError, compileStdout, compileStderr) => {
            if (compileError) {
              const errorLines = compileStderr.split('\n');
              const regex = /^(.+?):(\d+):(\d+:)?\s+error:(.+)/;
              const match = errorLines[0].match(regex);
              const errorType = this.getCompilationErrorType(errorLines[0]);
              if (match) {
                const [, , lineNumber, , error] = match;
                const formattedError = `Error compiling script at line ${lineNumber}: ${error.trim()}`;
                fs.unlink(scriptPath, (unlinkErr) => {
                  if (unlinkErr) {
                    console.error('Error while deleting temporary script file:', unlinkErr);
                  }
                });
                resolve({ error: true, result: formattedError, message: `Error compiling script: ${compileError.message}`, lineNumber: parseInt(lineNumber), errorType: errorType });
              } else {
                fs.unlink(scriptPath, (unlinkErr) => {
                  if (unlinkErr) {
                    console.error('Error while deleting temporary script file:', unlinkErr);
                  }
                });
                resolve({ error: true, result: compileError.message, message: `Error compiling script: ${compileError.message}`, errorType: errorType });
              }

            } else {
              // Execute the compiled script
              exec(compiledScriptPath, (execError, execStdout, execStderr) => {
                // Remove the temporary script and compiled script files
                fs.unlink(scriptPath, (unlinkErr) => {
                  if (unlinkErr) {
                    console.error('Error while deleting temporary script file:', unlinkErr);
                  }
                });
                fs.unlink(compiledScriptPath, (unlinkErr) => {
                  if (unlinkErr) {
                    console.error('Error while deleting compiled script file:', unlinkErr);
                  }
                });

                if (execError) {
                  const lineNumber = this.getExecutionErrorLine(execStderr);
                  const errorType = this.getExecutionErrorType(execError.message);
                  const formattedError = `Error executing script: ${execError.message}`;
                  resolve({result: formattedError, message: `Error executing script: ${execError.message}`, error: true, lineNumber: lineNumber, errorType: errorType });
                } else {
                  // Resolve with the stdout output
                  resolve({ result: execStdout, error: false, message: "success running script" });
                }
              });
            }
          });
        }
      });
    });
  }

  runPythonScript(script: string): Promise<{ result?: string | null; error?: boolean, errorType?: ErrorType, message: string, lineNumber?: number | undefined }> {
    if (script.includes('input') || script.includes('exec')) {
      throw new HttpException('Input invocations are not allowed in the script.', HttpStatus.BAD_REQUEST);
    }
    return new Promise((resolve) => {
      // Save the script to a temporary file inside the src folder
      const fileName = randomBytes(6).toString("hex")
      const scriptPath = path.join(process.cwd(), 'src', 'temp', fileName + '.py');
      // The script will be saved in the `src/temp` directory relative to the project root

      // Write the script to the temporary file
      fs.writeFile(scriptPath, script, (err) => {
        if (err) {
          console.error(err)
          resolve({ message: 'Error saving script file.', error: true, result: null, lineNumber: -1, errorType: "FileSystemError" });
        } else {
          // Execute the script using the `python` command (assuming Python is installed)
          exec(`python ${scriptPath}`, (execError, execStdout, execStderr) => {
            // Remove the temporary script file
            fs.unlink(scriptPath, (unlinkErr) => {
              if (unlinkErr) {
                console.error('Error while deleting temporary script file:', unlinkErr);
              }
            });

            if (execError) {
              const errorMessage = execError.message;
              const matches = errorMessage.match(/line (\d+)/);
              if (matches && matches.length > 1) {
                const lineNumber = matches[1];
                try {
                  const readableError = this.getPythonReadableError(execStderr);
                  resolve({ error: true, result: readableError, message: `Error executing script: ${readableError}`, lineNumber: parseInt(lineNumber), errorType: "ExecutionError" });
                } catch (error) {
                  resolve({ error: true, result: errorMessage, message: `Error executing script: ${errorMessage}`, lineNumber: parseInt(lineNumber), errorType: "ExecutionError" });
                }
              } else {
                resolve({ error: true, result: execError.message, message: `Error executing script: ${execError.message}`, lineNumber: -1, errorType: "ExecutionError" });
              }
            } else {
              // Resolve with the stdout output
              resolve({ result: execStdout, error: false, message: "success running script" });
            }
          });
        }
      });
    });
  }

  async runJavaCode(code: string): Promise<{ result?: string | null; error?: boolean, errorType?: ErrorType, message: string, lineNumber?: number | undefined }> {
    const writeFileAsync = promisify(fs.writeFile);
    const unlinkAsync = promisify(fs.unlink);
    const execAsync = promisify(exec);

    return new Promise((resolve) => {
      const classNameRegex = /class\s+([\w$]+)/;
      const classNameMatch = code.match(classNameRegex);
      const className = classNameMatch[1]
      const dir = path.join(process.cwd(), 'src', 'temp', randomBytes(6).toString("hex"))
      fs.mkdirSync(dir)
      const filePath = dir + "/" + className + '.java';

      writeFileAsync(filePath, code)
        .then(() => {
          execAsync(`javac ${filePath}`)
            .then(({ stdout: compileStdout, stderr: compileStderr }) => {
              if (compileStderr) {
                const errorLines = compileStderr.split("\n");
                const regex = /^(.+?):(\d+):\s+(.+)/;
                const match = errorLines[0].match(regex);
                if (match) {
                  const [, , lineNumber, error] = match;
                  const formattedError = `Error compiling code at line ${lineNumber}: ${error.trim()}`;
                  resolve({
                    error: true,
                    result: formattedError,
                    message: `Error compiling code: ${compileStderr}`,
                    lineNumber: parseInt(lineNumber),
                    errorType: "CompilationError",
                  });
                } else {
                  this.removeDirAndItems(dir)
                  resolve({
                    error: true,
                    result: compileStderr,
                    message: `Error compiling code: ${compileStderr}`,
                    errorType: "CompilationError",
                  });
                }
              } else {
                const className = path.basename(filePath, ".java");
                execAsync(`java -cp ${path.dirname(filePath)} ${className}`)
                  .then(({ stdout: execStdout, stderr: execStderr }) => {
                    unlinkAsync(filePath)
                      .then(() => {
                        if (execStderr) {
                          this.removeDirAndItems(dir)
                          resolve({
                            message: `Error executing code: ${execStderr}`,
                            error: true,
                            lineNumber: -1,
                            errorType: "ExecutionError",
                          });
                        } else {
                          this.removeDirAndItems(dir)
                          resolve({ result: execStdout, error: false, message: "Success running code" });
                        }
                      })
                      .catch((unlinkErr) => {
                        this.removeDirAndItems(dir)
                        console.error("Error while deleting temporary code file:", unlinkErr);
                      });
                  })
                  .catch((execError) => {
                    this.removeDirAndItems(dir)
                    resolve({
                      message: `Error executing code: ${execError.message}`,
                      error: true,
                      lineNumber: -1,
                      errorType: "ExecutionError",
                    });
                  });
              }
            })
            .catch((compileError) => {
              const error = compileError instanceof Error ? compileError.message : compileError;
              if (fs.existsSync(dir)) {
                this.removeDirAndItems(dir)
              }
              resolve({
                error: true,
                result: error,
                message: `Error compiling code: ${error}`,
                errorType: "CompilationError",
              });
            });
        })
        .catch((err) => {
          console.error(err);
          if (fs.existsSync(dir)) {
            this.removeDirAndItems(dir)
          }
          resolve({
            message: "Error saving code file.",
            error: true,
            result: null,
            errorType: "FileSystemError",
          });
        });
    });
  }

  private getCompilationErrorType(errorLine: string): ErrorType {
    console.log(errorLine)
    if (errorLine.includes('error: expected') && errorLine.includes(';')) {
      return 'MissingSemicolonError';
    }
    else if (errorLine.includes('error: undeclared') || errorLine.includes('error: implicit declaration') || errorLine.includes('undeclared identifier')) {
      return 'UndeclaredVariableError';
    } else if (errorLine.includes('incompatible')) {
      return 'IncompatibleTypeError';
    }
    else if (errorLine.includes('error: expected') || errorLine.includes('error: syntax')) {
      return 'SyntaxError';
    }
    else {
      return 'CompilationError';
    }
  }
  
  private getExecutionErrorType(errorMessage: string): ErrorType {
    if (errorMessage.includes('Segmentation fault')) {
      return 'SegmentationFaultError';
    } else if (errorMessage.includes('Floating point exception')) {
      return 'FloatingPointError';
    } else if (errorMessage.includes('Assertion failed')) {
      return 'AssertionError';
    } else if (errorMessage.includes('Infinite loop') || errorMessage.includes('maxBuffer length exceeded')) {
      return 'InfiniteLoopError';
    } else if (errorMessage.includes('System call error')) {
      return 'SystemCallError';
    } else {
      return 'ExecutionError';
    }
  }

  private getExecutionErrorLine(execStderr: string): number {
    const regex = /at line (\d+)/;
    const match = execStderr.match(regex);
    return match ? parseInt(match[1], 10) : -1;
  }

  private getPythonReadableError(stderr: string): string {
    const filePath = stderr?.match(/File "(.*?)",/);
    const filePathRegex = new RegExp(filePath[0], 'g');
    const cleanedErrorLine = stderr.replace(filePathRegex, '');
    return cleanedErrorLine.trim();
  }

  private removeDirAndItems(dir) {
    if (fs.existsSync(dir)) {
      fs.readdir(dir, (err, files) => {
        if (err) throw err;
        for (const file of files) {
          fs.unlinkSync(path.join(dir, file));
        }
        fs.rmdirSync(dir)

      });

    }
  }
}
