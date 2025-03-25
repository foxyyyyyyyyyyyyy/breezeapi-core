
import { CronJob } from 'cron';
import { file } from "bun";
import { join, relative } from "path";
import { readdir } from "node:fs/promises";

// Keep your interfaces as they are - they're TypeScript and work well
export interface CronConfig {
  enabled: boolean;
  useTime: boolean;
  cronTime: string;
  timeZone: string;
  timeBetween: string;
  runOnStart: boolean;
}

interface CronModule {
  cronConfig: CronConfig;
  default: () => Promise<void>;
}

const lastExecutions: Record<string, Date> = {};

// Your time parsing function can remain the same
function parseTimeBetween(time: string): number {
  const unit = time.slice(-1);
  const value = parseInt(time.slice(0, -1), 10);
  
  switch (unit) {
    case 'd': return value * 24 * 60 * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'm': return value * 60 * 1000;
    case 's': return value * 1000;
    default: throw new Error(`Unsupported time unit: ${unit}`);
  }
}

function shouldExecuteTimeBased(jobName: string, timeBetween: string): boolean {
  const now = new Date();
  const lastExecution = lastExecutions[jobName];
  
  if (!lastExecution) return true;
  
  const minTimeBetween = parseTimeBetween(timeBetween);
  const timeDiff = now.getTime() - lastExecution.getTime();
  
  return timeDiff >= minTimeBetween;
}

function registerCronJob(jobName: string, cronModule: CronModule) {
  const { cronConfig, default: cronFunction } = cronModule;
  
  if (!cronConfig.enabled) {
    console.log(`Cron job ${jobName} is disabled`);
    return;
  }

  const onTick = async () => {
    try {
      if (cronConfig.useTime && !shouldExecuteTimeBased(jobName, cronConfig.timeBetween)) {
        console.log(`Skipping ${jobName}: Not enough time passed`);
        return;
      }
      
      console.log(`Running cron job: ${jobName}`);
      await cronFunction();
      lastExecutions[jobName] = new Date();
    } catch (error) {
      console.error(`Error in cron job ${jobName}:`, error);
    }
  };

  const job = new CronJob(
    cronConfig.cronTime,
    onTick,
    null,
    false,
    cronConfig.timeZone
  );

  job.start();
  console.log(`Registered cron job: ${jobName} with schedule ${cronConfig.cronTime}`);
  
  if (cronConfig.runOnStart) {
    console.log(`Running ${jobName} on start`);
    onTick();
  }
}

export async function initializeCronJobs() {
  const cronJobsDir = join(import.meta.dir, 'cronjobs');
  // Check if directory exists using Bun.file
  const dirFile = file(cronJobsDir);
  if (!await dirFile.exists()) {
    console.log('No cronjobs directory found, skipping initialization');
    return;
  }


  const loadCronJobsFromDir = async (dir: string) => {
    const entries = await readdir(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const file = Bun.file(fullPath);
      const exists = await file.exists();
      
      if (exists) {
        if (entry === 'cron.ts' || entry === 'cron.js') {
          try {
            const relativePath = relative(cronJobsDir, dir);
            const jobName = relativePath || 'root';
            
            const cronModule = await import(fullPath) as CronModule;
            registerCronJob(jobName, cronModule);
          } catch (error) {
            console.error(`Error loading cron job from ${fullPath}:`, error);
          }
        }
      }
    }
  };

  console.log('Initializing cron jobs...');
  await loadCronJobsFromDir(cronJobsDir);
  console.log('Cron jobs initialization complete');
}