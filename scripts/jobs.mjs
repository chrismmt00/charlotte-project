const url = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const response = await fetch(`${url}/api/jobs`, {
  method: "POST",
  headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
});
if (!response.ok) {
  console.error(`Job worker failed (${response.status})`);
  process.exitCode = 1;
} else {
  const result = await response.json();
  console.log(`Processed ${result.jobs.length} background jobs.`);
}
