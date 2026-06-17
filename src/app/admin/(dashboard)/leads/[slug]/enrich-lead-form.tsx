"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { INDUSTRIES } from "@/modules/shared/constants";

import { enrichLeadAction, type EnrichLeadState } from "./actions";

const initial: EnrichLeadState = {};

interface EnrichLeadFormProps {
  leadId: string;
  slug: string;
  defaults: {
    businessName: string;
    industry: string;
    websiteUrl?: string | null;
    city?: string | null;
    country?: string | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
    contactPerson?: string | null;
  };
}

export function EnrichLeadForm({ leadId, slug, defaults }: EnrichLeadFormProps) {
  const [state, formAction, pending] = useActionState(enrichLeadAction, initial);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="leadId" value={leadId} />
      <input type="hidden" name="slug" value={slug} />

      <div className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Contact details</p>

        <div className="space-y-1">
          <Label htmlFor="businessName">Business name</Label>
          <Input id="businessName" name="businessName" defaultValue={defaults.businessName} />
        </div>

        <div className="space-y-1">
          <Label htmlFor="industry">Industry</Label>
          <Select id="industry" name="industry" defaultValue={defaults.industry}>
            {INDUSTRIES.map((ind) => (
              <option key={ind.value} value={ind.value}>
                {ind.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="websiteUrl">Website URL</Label>
          <Input id="websiteUrl" name="websiteUrl" type="url" defaultValue={defaults.websiteUrl ?? ""} placeholder="https://" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="city">City</Label>
            <Input id="city" name="city" defaultValue={defaults.city ?? ""} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="country">Country</Label>
            <Input id="country" name="country" defaultValue={defaults.country ?? ""} />
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="contactEmail">Email</Label>
          <Input id="contactEmail" name="contactEmail" type="email" defaultValue={defaults.contactEmail ?? ""} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="contactPhone">Phone</Label>
            <Input id="contactPhone" name="contactPhone" defaultValue={defaults.contactPhone ?? ""} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="contactPerson">Contact person</Label>
            <Input id="contactPerson" name="contactPerson" defaultValue={defaults.contactPerson ?? ""} />
          </div>
        </div>
      </div>

      <div className="space-y-3 border-t border-white/10 pt-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Website content (optional — unblocks preview)</p>

        <div className="space-y-1">
          <Label htmlFor="contentH1">Headline / H1</Label>
          <Input id="contentH1" name="contentH1" placeholder="Main headline from their site" />
        </div>

        <div className="space-y-1">
          <Label htmlFor="contentMetaDescription">Meta description</Label>
          <Input id="contentMetaDescription" name="contentMetaDescription" placeholder="Page meta description" />
        </div>

        <div className="space-y-1">
          <Label htmlFor="contentAboutText">About / main copy</Label>
          <Textarea
            id="contentAboutText"
            name="contentAboutText"
            rows={4}
            placeholder="Paste the main body text or about section…"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="contentAddressHint">Address</Label>
          <Input id="contentAddressHint" name="contentAddressHint" placeholder="Street, City, Postcode" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="contentBrandColors">Brand colors (hex, comma-separated)</Label>
            <Input id="contentBrandColors" name="contentBrandColors" placeholder="#b22222, #fff" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="contentFontFamily">Font family</Label>
            <Input id="contentFontFamily" name="contentFontFamily" placeholder="Playfair Display" />
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="contentImageUrls">Image URLs (one per line)</Label>
          <Textarea id="contentImageUrls" name="contentImageUrls" rows={3} placeholder="https://example.com/hero.jpg" />
        </div>
      </div>

      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-400">Details saved successfully.</p>}

      <Button type="submit" size="sm" className="w-full" disabled={pending}>
        {pending ? "Saving…" : "Save details"}
      </Button>
    </form>
  );
}
