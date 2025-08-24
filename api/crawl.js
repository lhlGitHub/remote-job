import { main } from "../index.js";

export default async function handler(req, res) {
  try {
    const newJobs = await main();
    res.status(200).json({ success: true, newJobsCount: newJobs.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
}
