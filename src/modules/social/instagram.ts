/**
 * Instagram Graph API adapter.
 *
 * Publishing to Instagram requires:
 * - INSTAGRAM_ACCESS_TOKEN: long-lived page access token from Meta Business Manager
 * - INSTAGRAM_BUSINESS_ACCOUNT_ID: the numeric Instagram Business Account ID
 *
 * Flow: create media container → publish container → get post ID.
 */

const IG_BASE = "https://graph.facebook.com/v21.0";

interface InstagramPost {
  imageUrl: string | null;
  caption: string;
  hashtags: string[];
}

export class InstagramAdapter {
  private readonly token = process.env.INSTAGRAM_ACCESS_TOKEN;
  private readonly accountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

  private get configured(): boolean {
    return Boolean(this.token && this.accountId);
  }

  async createMediaContainer(imageUrl: string, caption: string): Promise<string> {
    if (!this.configured) throw new Error("Instagram not configured");
    const res = await fetch(`${IG_BASE}/${this.accountId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_url: imageUrl, caption, access_token: this.token }),
    });
    if (!res.ok) throw new Error(`Instagram create container error ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as { id?: string };
    if (!data.id) throw new Error("No container ID returned");
    return data.id;
  }

  async publishMedia(creationId: string): Promise<{ id: string }> {
    if (!this.configured) throw new Error("Instagram not configured");
    const res = await fetch(`${IG_BASE}/${this.accountId}/media_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creation_id: creationId, access_token: this.token }),
    });
    if (!res.ok) throw new Error(`Instagram publish error ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as { id?: string };
    if (!data.id) throw new Error("No post ID returned");
    return { id: data.id };
  }

  async publish(post: InstagramPost): Promise<{ id: string }> {
    if (!this.configured) throw new Error("Instagram not configured (set INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_BUSINESS_ACCOUNT_ID)");
    if (!post.imageUrl) throw new Error("Instagram requires an image URL");
    const fullCaption = `${post.caption}\n\n${post.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ")}`;
    const containerId = await this.createMediaContainer(post.imageUrl, fullCaption);
    return this.publishMedia(containerId);
  }
}

export const instagramAdapter = new InstagramAdapter();
