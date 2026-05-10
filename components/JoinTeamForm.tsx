"use client";

import { SportConfig } from "@/config/sports.config";
import type { RegisteredInfo } from "@/components/SportPageClient";

// Join flow has been disabled. Captain now adds all members directly at registration.
interface JoinTeamFormProps {
  sport: SportConfig;
  onRegistered: (info: RegisteredInfo) => void;
}

export default function JoinTeamForm(_props: JoinTeamFormProps) {
  return null;
}
