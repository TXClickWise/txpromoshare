import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Debounced autosave for event copy fields.
 * Maps internal variant ids to DB columns on the `events` table.
 */
export function useEventCopyAutosave(eventId: string | undefined) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<Record<string, string>>({});

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  // Reset state when switching events
  useEffect(() => {
    pending.current = {};
    setSaving(false);
    setSaved(false);
  }, [eventId]);

  function schedule(updates: Record<string, string>) {
    if (!eventId) return;
    pending.current = { ...pending.current, ...updates };
    setSaved(false);

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const payload = pending.current;
      pending.current = {};
      if (!Object.keys(payload).length) return;

      setSaving(true);
      const { error } = await supabase
        .from("events")
        .update(payload as never)
        .eq("id", eventId);
      setSaving(false);

      if (!error) {
        setSaved(true);
        setTimeout(() => setSaved(false), 1800);
      }
    }, 800);
  }

  return { schedule, saving, saved };
}
