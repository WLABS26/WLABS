"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { INDUSTRIES } from "@/modules/shared/constants";

import { createLeadAction, type CreateLeadState } from "./actions";

const initialState: CreateLeadState = {};

export function NewLeadForm() {
  const [state, formAction, pending] = useActionState(createLeadAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="businessName">Business name</Label>
        <Input id="businessName" name="businessName" required />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="industry">Industry</Label>
        <Select id="industry" name="industry" defaultValue="other">
          {INDUSTRIES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="websiteUrl">Website URL</Label>
          <Input id="websiteUrl" name="websiteUrl" type="text" placeholder="https://example.com" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contactEmail">Contact email</Label>
          <Input id="contactEmail" name="contactEmail" type="email" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contactPhone">Contact phone</Label>
          <Input id="contactPhone" name="contactPhone" type="tel" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contactPerson">Contact person</Label>
          <Input id="contactPerson" name="contactPerson" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="country">Country</Label>
          <Input id="country" name="country" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={4} />
      </div>

      {state?.error && (
        <p role="alert" className="text-sm text-red-400">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Creating..." : "Create lead"}
      </Button>
    </form>
  );
}
