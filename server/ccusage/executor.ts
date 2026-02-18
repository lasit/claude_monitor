import { exec } from "node:child_process";
import { config } from "../config.js";

let activeCount = 0;
const queue: Array<() => void> = [];

function tryDequeue() {
  while (queue.length > 0 && activeCount < config.ccusage.maxConcurrent) {
    activeCount++;
    const next = queue.shift()!;
    next();
  }
}

/**
 * Execute a ccusage CLI command with semaphore-limited concurrency.
 * Returns raw stdout string.
 */
export function execCcusage(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const run = () => {
      // Build command string - args are controlled by us, not user input
      const cmd = `npx ccusage ${args.join(" ")}`;

      exec(
        cmd,
        {
          timeout: config.ccusage.timeout,
          maxBuffer: 50 * 1024 * 1024, // 50MB
          env: {
            ...process.env,
            TZ: config.timezone,
          },
        },
        (error, stdout, stderr) => {
          activeCount--;
          tryDequeue();

          if (error) {
            reject(new Error(`ccusage ${args.join(" ")} failed: ${error.message}\nstderr: ${stderr}`));
          } else {
            resolve(stdout);
          }
        }
      );
    };

    if (activeCount < config.ccusage.maxConcurrent) {
      activeCount++;
      run();
    } else {
      queue.push(run);
    }
  });
}
