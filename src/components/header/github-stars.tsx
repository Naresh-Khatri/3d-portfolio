import { config } from "@/data/config";
import { getGithubStars } from "@/lib/github-stars";
import { GitHubStarsButton } from "../ui/shadcn-io/github-stars-button";

export default async function GitHubStars({ className }: { className?: string }) {
  if (!config.githubUsername || !config.githubRepo) return null;

  let stars: number;
  try {
    stars = await getGithubStars();
  } catch (err) {
    // don't fail the render/build on a github outage or rate limit
    console.error(err);
    return null;
  }

  return (
    <GitHubStarsButton
      username={config.githubUsername}
      repo={config.githubRepo}
      stars={stars}
      className={className}
    />
  );
}
