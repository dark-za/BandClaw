import { spawn } from 'node:child_process';
import os from 'node:os';

export interface ExecuteOptions {
  timeoutSec?: number;      // Total hard timeout in seconds
  idleTimeoutSec?: number;  // Idle timeout (no output) in seconds
  maxBufferBytes?: number;  // Max output size to keep in RAM
}

export interface ExecuteResult {
  exitCode: number | null;
  signal: string | null;
  stdout: string;
  stderr: string;
  isIdleTimeout: boolean;
  isHardTimeout: boolean;
}

export async function executeCommand(command: string, options: ExecuteOptions = {}): Promise<ExecuteResult> {
  const {
    timeoutSec = 60,
    idleTimeoutSec = 15,
    maxBufferBytes = 5 * 1024 * 1024 // 5MB limit default
  } = options;

  return new Promise((resolve) => {
    // Use proper shell depending on OS
    const shell = process.env.ComSpec || (os.platform() === 'win32' ? 'cmd.exe' : '/bin/bash');

    const child = spawn(command, {
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'], // Prevent stdin from blocking, we run blindly
      windowsHide: true,
    });

    let stdoutData = '';
    let stderrData = '';
    let stdoutBytes = 0;
    let stderrBytes = 0;
    let isIdleTimeout = false;
    let isHardTimeout = false;

    let hardTimer: NodeJS.Timeout;
    let idleTimer: NodeJS.Timeout;

    const resetIdleTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        isIdleTimeout = true;
        child.kill('SIGTERM');
      }, idleTimeoutSec * 1000);
    };

    const handleData = (isError: boolean) => (chunk: Buffer) => {
      resetIdleTimer();
      const text = chunk.toString('utf8');
      
      if (isError) {
        if (stderrBytes < maxBufferBytes) {
          stderrData += text;
          stderrBytes += chunk.length;
          if (stderrBytes >= maxBufferBytes) {
            stderrData += '\n\n[... TRUNCATED DUE TO BUFFER LIMIT ...]';
          }
        }
      } else {
        if (stdoutBytes < maxBufferBytes) {
          stdoutData += text;
          stdoutBytes += chunk.length;
          if (stdoutBytes >= maxBufferBytes) {
            stdoutData += '\n\n[... TRUNCATED DUE TO BUFFER LIMIT ...]';
          }
        }
      }
    };

    if (child.stdout) {
      child.stdout.on('data', handleData(false));
    }
    if (child.stderr) {
      child.stderr.on('data', handleData(true));
    }

    if (timeoutSec > 0) {
      hardTimer = setTimeout(() => {
        isHardTimeout = true;
        child.kill('SIGKILL');
      }, timeoutSec * 1000);
    }

    resetIdleTimer(); // start idle timer initially

    child.on('close', (code, signal) => {
      clearTimeout(hardTimer);
      clearTimeout(idleTimer);

      resolve({
        exitCode: code,
        signal: signal,
        stdout: stdoutData.trim(),
        stderr: stderrData.trim(),
        isIdleTimeout,
        isHardTimeout
      });
    });

    child.on('error', (err: any) => {
      clearTimeout(hardTimer);
      clearTimeout(idleTimer);
      
      resolve({
        exitCode: -1,
        signal: null,
        stdout: stdoutData.trim(),
        stderr: stderrData.trim() + '\n[Spawning Error]: ' + err.message,
        isIdleTimeout: false,
        isHardTimeout: false
      });
    });
  });
}
