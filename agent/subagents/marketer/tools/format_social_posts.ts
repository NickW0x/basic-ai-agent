import { defineTool } from "eve/tools";
import { z } from "zod";
import { formatSocialPostVariants } from "../../../lib/social-post-limits";

const platformSchema = z.enum([
  "x",
  "linkedin",
  "instagram",
  "facebook",
  "email",
]);

export default defineTool({
  description:
    "Validate and truncate social post drafts to each platform's character limit.",
  inputSchema: z.object({
    variants: z
      .array(
        z.object({
          platform: platformSchema,
          text: z.string().min(1),
        }),
      )
      .min(1),
  }),
  async execute({ variants }) {
    const formatted = formatSocialPostVariants(variants);

    return {
      variants: formatted,
    };
  },
});
