"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import AppLayout from "@/components/layout/AppLayout";
import { settingsService } from "@/services/settingsService";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    const { data, error } = await settingsService.getProfileAndCompany();

    setLoading(false);

    if (error || !data) {
  console.error("Settings load error:", error);
  toast.error("Failed to load settings.");
  return;
}
    setUserId(data.id);
    setCompanyId(data.company_id);
    setFullName(data.full_name || "");

    const company = Array.isArray(data.companies)
      ? data.companies[0]
      : data.companies;
    setCompanyName(company?.name || "");
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();

    if (!userId) return;

    if (!fullName.trim()) {
      toast.error("Full name is required.");
      return;
    }

    setSavingProfile(true);
    const { error } = await settingsService.updateFullName(
      userId,
      fullName.trim()
    );
    setSavingProfile(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Profile updated!");
  }

  async function handleSaveCompany(e: React.FormEvent) {
    e.preventDefault();

    if (!companyId) return;

    if (!companyName.trim()) {
      toast.error("Business name is required.");
      return;
    }

    setSavingCompany(true);
    const { error } = await settingsService.updateCompanyName(
      companyId,
      companyName.trim()
    );
    setSavingCompany(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Business name updated!");
  }

  if (loading) {
    return (
      <AppLayout>
        <p className="text-gray-500">Loading settings...</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-xl space-y-8">
        <h1 className="text-3xl font-bold">Settings</h1>

        <Card>
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">
                  Full Name
                </label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                />
              </div>

              <Button type="submit" disabled={savingProfile}>
                {savingProfile ? "Saving..." : "Save Profile"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Business Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveCompany} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">
                  Business / Shop Name
                </label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Your business name"
                />
              </div>

              <Button type="submit" disabled={savingCompany}>
                {savingCompany ? "Saving..." : "Save Business Details"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}