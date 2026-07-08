export type SocialPlatform =
  | "x"
  | "linkedin"
  | "instagram"
  | "facebook"
  | "email";

export const SOCIAL_PLATFORM_LIMITS: Record<SocialPlatform, number> = {
  x: 280,
  linkedin: 3000,
  instagram: 2200,
  facebook: 500,
  email: 10_000,
};

export interface SocialPostVariantInput {
  platform: SocialPlatform;
  text: string;
}

export interface SocialPostVariantOutput {
  platform: SocialPlatform;
  text: string;
  charCount: number;
  limit: number;
  withinLimit: boolean;
  truncated: boolean;
}

// Validates and truncates social copy to platform-specific character limits.
export function formatSocialPostVariants(
  variants: SocialPostVariantInput[],
): SocialPostVariantOutput[] {
  return variants.map((variant) => {
    const limit = SOCIAL_PLATFORM_LIMITS[variant.platform];
    const charCount = variant.text.length;
    const withinLimit = charCount <= limit;
    const text = withinLimit ? variant.text : variant.text.slice(0, limit);

    return {
      platform: variant.platform,
      text,
      charCount: text.length,
      limit,
      withinLimit,
      truncated: !withinLimit,
    };
  });
}
