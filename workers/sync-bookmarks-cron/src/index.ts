export interface Env {
  CRON_SECRET: string;
  TARGET_URL: string;
}

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  async scheduled(
    _controller: ScheduledController,
    env: Env,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _ctx: ExecutionContext,
  ): Promise<void> {
    console.log(`Scheduled worker triggered at ${new Date().toISOString()}`);

    const targetUrl =
      env.TARGET_URL || "http://localhost:3000/api/cron/sync-bookmarks";

    try {
      const response = await fetch(targetUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${env.CRON_SECRET}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.text();
      console.log(`Sync completed successfully: ${data}`);
    } catch (error) {
      console.error("Error during sync:", error);
      throw error;
    }
  },
};
