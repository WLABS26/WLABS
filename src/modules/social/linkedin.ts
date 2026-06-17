/**
 * LinkedIn UGC Posts API adapter.
 *
 * Publishing to LinkedIn requires:
 * - LINKEDIN_ACCESS_TOKEN: OAuth 2.0 access token with w_organization_social scope
 * - LINKEDIN_ORGANIZATION_ID: numeric organization ID (URN: urn:li:organization:<id>)
 *
 * Flow for image posts: register upload → PUT binary → create ugcPost with asset.
 * Flow for text-only posts: create ugcPost with shareMediaCategory NONE.
 */

const LI_BASE = "https://api.linkedin.com/v2";

interface LinkedInPost {
  imageUrl: string | null;
  caption: string;
  hashtags: string[];
}

export class LinkedInAdapter {
  private readonly token = process.env.LINKEDIN_ACCESS_TOKEN;
  private readonly orgId = process.env.LINKEDIN_ORGANIZATION_ID;

  private get authorUrn(): string {
    return `urn:li:organization:${this.orgId}`;
  }

  private get configured(): boolean {
    return Boolean(this.token && this.orgId);
  }

  private headers(): HeadersInit {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.token}`,
      "LinkedIn-Version": "202406",
    };
  }

  /** Register an image upload and get an upload URL + asset URN. */
  async uploadImage(imageUrl: string): Promise<string> {
    if (!this.configured) throw new Error("LinkedIn not configured");

    // Step 1: Register upload to get an uploadUrl and asset URN
    const registerRes = await fetch(`${LI_BASE}/assets?action=registerUpload`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        registerUploadRequest: {
          recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
          owner: this.authorUrn,
          serviceRelationships: [
            { relationshipType: "OWNER", identifier: "urn:li:userGeneratedContent" },
          ],
        },
      }),
    });
    if (!registerRes.ok) throw new Error(`LinkedIn register upload error ${registerRes.status}`);
    const registerData = (await registerRes.json()) as {
      value?: {
        uploadMechanism?: {
          "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"?: { uploadUrl?: string; headers?: Record<string, string> };
        };
        asset?: string;
      };
    };
    const mechanism = registerData.value?.uploadMechanism?.["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"];
    const uploadUrl = mechanism?.uploadUrl;
    const asset = registerData.value?.asset;
    if (!uploadUrl || !asset) throw new Error("LinkedIn upload registration failed");

    // Step 2: Download the image and upload its binary
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) throw new Error(`Failed to download image for LinkedIn: ${imgRes.status}`);
    const imgBuffer = await imgRes.arrayBuffer();
    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { ...(mechanism?.headers ?? {}), "Content-Type": "image/png" },
      body: imgBuffer,
    });
    if (!uploadRes.ok) throw new Error(`LinkedIn image upload error ${uploadRes.status}`);

    return asset;
  }

  async createPost(caption: string, hashtags: string[], imageAssetUrn?: string): Promise<{ id: string }> {
    if (!this.configured) throw new Error("LinkedIn not configured");
    const text = `${caption}\n\n${hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ")}`;

    const specificContent = imageAssetUrn
      ? {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: { text },
            shareMediaCategory: "IMAGE",
            media: [{ status: "READY", media: imageAssetUrn, description: { text: "" }, title: { text: "" } }],
          },
        }
      : {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: { text },
            shareMediaCategory: "NONE",
          },
        };

    const res = await fetch(`${LI_BASE}/ugcPosts`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        author: this.authorUrn,
        lifecycleState: "PUBLISHED",
        specificContent,
        visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
      }),
    });
    if (!res.ok) throw new Error(`LinkedIn post error ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as { id?: string };
    if (!data.id) throw new Error("No post ID returned from LinkedIn");
    return { id: data.id };
  }

  async publish(post: LinkedInPost): Promise<{ id: string }> {
    if (!this.configured) throw new Error("LinkedIn not configured (set LINKEDIN_ACCESS_TOKEN and LINKEDIN_ORGANIZATION_ID)");
    let assetUrn: string | undefined;
    if (post.imageUrl) {
      try {
        assetUrn = await this.uploadImage(post.imageUrl);
      } catch {
        // Fall back to text-only if image upload fails
      }
    }
    return this.createPost(post.caption, post.hashtags, assetUrn);
  }
}

export const linkedInAdapter = new LinkedInAdapter();
