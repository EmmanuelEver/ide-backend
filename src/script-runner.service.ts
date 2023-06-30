import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { randomBytes } from 'crypto';

@Injectable()
export class ScriptService {

  runCScript(script: string): Promise<{ result?: string | null; error?: boolean, errorType?: string, message: string, lineNumber?: number | undefined }> {
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
          resolve({ message: 'Error saving script file.', error: true,  result: null, errorType: "FileSystemError"});
        } else {
          // Compile the script using the `gcc` command (assuming GCC is installed)
          const compiledScriptPath = `${scriptPath}.out`;
          exec(`gcc ${scriptPath} -o ${compiledScriptPath}`, (compileError, compileStdout, compileStderr) => {
            if (compileError) {
              const errorLines = compileStderr.split('\n');
              const regex = /^(.+?):(\d+):(\d+:)?\s+error:(.+)/;
              const match = errorLines[0].match(regex);
              if (match) {
                const [, , lineNumber, , error] = match;
                const formattedError = `Error compiling script at line ${lineNumber}: ${error.trim()}`;
                resolve({ error: true, result: formattedError, message: `Error compiling script: ${compileError.message}`, lineNumber: parseInt(lineNumber), errorType: "CompilationError"});
              } else {
                resolve({ error: true, result: compileError.message, message: `Error compiling script: ${compileError.message}`, errorType: "CompilationError"});
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
                  console.error(execError)
                  resolve({ message: `Error executing script: ${execError.message}`, error: true, lineNumber: -1, errorType: "ExecutionError"});
                } else {
                  // Resolve with the stdout output
                  resolve({ result: execStdout, error: false, message: "success running script", errorType: "" });
                }
              });
            }
          });
        }
      });
    });
  }

  runPythonScript(script: string): Promise<{ result?: string | null; error?: boolean, errorType?: string, message: string, lineNumber?: number | undefined }> {
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
          resolve({ message: 'Error saving script file.', error: true,  result: null, lineNumber: -1, errorType: "FileSystemError"});
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
                  resolve({ error: true, result: readableError, message: `Error executing script: ${readableError}`, lineNumber: parseInt(lineNumber), errorType: "ExecutionError"});
                } catch (error) {
                  resolve({ error: true, result: errorMessage, message: `Error executing script: ${errorMessage}`, lineNumber: parseInt(lineNumber), errorType: "ExecutionError"});
                }
              } else {
                resolve({ error: true, result: execError.message, message: `Error executing script: ${execError.message}`, lineNumber: -1, errorType: "ExecutionError"});
              }
            } else {
              // Resolve with the stdout output
              resolve({ result: execStdout, error: false, message: "success running script"});
            }
          });
        }
      });
    });
  }

  private getPythonReadableError(stderr: string): string {
    const filePath = stderr?.match(/File "(.*?)",/);
    const filePathRegex = new RegExp(filePath[0], 'g');
    const cleanedErrorLine = stderr.replace(filePathRegex, '');

    return cleanedErrorLine.trim();
  }
}
