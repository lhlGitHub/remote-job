import { main } from "../index.js";

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).end("Unauthorized");
  }

  try {
    const newJobs = await main();
    res.status(200).json({ success: true, newJobsCount: newJobs.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
}
