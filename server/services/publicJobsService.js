import { publicJobsFilter } from "../utils/jobAvailability.js";

export const createPublicJobsHandler = ({ JobModel }) => async (req, res) => {
  res.set("Cache-Control", "no-store");
  try {
    const jobs = await JobModel.find(publicJobsFilter()).sort({ createdAt: -1 });
    return res.status(200).json(jobs);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
