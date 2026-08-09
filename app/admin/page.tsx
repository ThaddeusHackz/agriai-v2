"use client";

// ─── Admin Panel — main dashboard ────────────────────────────────────────────

import React, { useState } from "react";
import AdminShell, { type TabKey } from "@/components/admin/AdminShell";
import DashboardTab from "@/components/admin/DashboardTab";
import ContentTab from "@/components/admin/ContentTab";
import AppearanceTab from "@/components/admin/AppearanceTab";
import AITab from "@/components/admin/AITab";
import PricesTab from "@/components/admin/PricesTab";
import KnowledgeTab from "@/components/admin/KnowledgeTab";
import MessagesTab from "@/components/admin/MessagesTab";
import UsersTab from "@/components/admin/UsersTab";
import FeedbackTab from "@/components/admin/FeedbackTab";
import SubscribersTab from "@/components/admin/SubscribersTab";
import SettingsTab from "@/components/admin/SettingsTab";

export default function AdminPage() {
  const [tab, setTab] = useState<TabKey>("dashboard");

  return (
    <AdminShell active={tab} onNavigate={setTab}>
      {tab === "dashboard" && <DashboardTab />}
      {tab === "content" && <ContentTab />}
      {tab === "appearance" && <AppearanceTab />}
      {tab === "ai" && <AITab />}
      {tab === "prices" && <PricesTab />}
      {tab === "knowledge" && <KnowledgeTab />}
      {tab === "messages" && <MessagesTab />}
      {tab === "users" && <UsersTab />}
      {tab === "feedback" && <FeedbackTab />}
      {tab === "subscribers" && <SubscribersTab />}
      {tab === "settings" && <SettingsTab />}
    </AdminShell>
  );
}
