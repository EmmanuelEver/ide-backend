import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { randomBytes } from 'crypto';

@Injectable()
export class ScriptService {
  runCScript(script: string): Promise<{ result?: string | null; error?: boolean, message: string, lineNumber?: number | undefined }> {
    return new Promise((resolve) => {
      // Save the script to a temporary file inside the src folder
      const fileName = randomBytes(6).toString("hex")
      const scriptPath = path.join(process.cwd(), 'src', 'temp', fileName + '.c');
      // The script will be saved in the `src/temp` directory relative to the project root

      // Write the script to the temporary file
      fs.writeFile(scriptPath, script, (err) => {
        if (err) {
          resolve({ message: 'Error saving script file.', error: true,  result: null});
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
                resolve({ error: true, result: formattedError, message: `Error compiling script: ${compileError.message}`, lineNumber: parseInt(lineNumber)});
              } else {
                resolve({ error: true, result: compileError.message, message: `Error compiling script: ${compileError.message}`});
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
                  resolve({ message: `Error executing script: ${execError.message}`, error: true});
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
}
