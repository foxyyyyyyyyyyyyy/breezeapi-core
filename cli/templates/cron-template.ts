export const cronConfig =  {
        enabled: true, // Enable the cron job
        useTime: true, // Use timeBetween
        cronTime: '0 0 0 * * *', // Every day at midnight
        timeZone: 'Asia/Kolkata', // Timezone for the cron job
        timeBetween: '1d', // Run every 1 day only if useTime is true
        runOnStart: false, // Run the cron job on start
}

export default async function Testcron() {
    // Now you can use cronConfig directly here
    console.log('Running cron with config:', cronConfig);
}