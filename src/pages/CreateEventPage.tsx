import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Save, Send, Trash2, FileText, CalendarDays, Image, Megaphone, Send as SendIcon, Repeat, Loader2, CheckCircle2, ExternalLink, Share2, LayoutList, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WizardProgress } from "@/components/event-wizard/WizardProgress";
import { StepBasics } from "@/components/event-wizard/StepBasics";
import { StepDateTime } from "@/components/event-wizard/StepDateTime";
import { StepMedia } from "@/components/event-wizard/StepMedia";
import { StepPromotion } from "@/components/event-wizard/StepPromotion";
import { StepPublish } from "@/components/event-wizard/StepPublish";
import { StepTranslations } from "@/components/event-wizard/StepTranslations";
import { OccurrencesTab } from "@/components/event-wizard/OccurrencesTab";
import { useEventForm } from "@/components/event-wizard/useEventForm";
import { RecurringEditScopeDialog } from "@/components/event-wizard/RecurringEditScopeDialog";
import { AnimatePresence } from "framer-motion";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useUILanguage";

function formatRelativeTime(date: Date, t: (key: string, vars?: Record<string, string>) => string, language: string): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 5) return t("wizard.justNow");
  if (seconds < 60) return t("wizard.secondsAgo", { n: String(seconds) });
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return t("wizard.minutesAgo", { n: String(minutes) });
  return date.toLocaleTimeString(language === "en" ? "en-GB" : "nl-NL", { hour: "2-digit", minute: "2-digit" });
}

function SaveIndicator({ saving, autosaving, isDirty, lastSavedAt }: {
  saving: boolean; autosaving: boolean; isDirty: boolean; lastSavedAt: Date | null;
}) {
  const { t, language } = useTranslation();
  // Force re-render every 15s for relative time updates
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!lastSavedAt) return;
    const timer = setInterval(() => setTick(x => x + 1), 15000);
    return () => clearInterval(timer);
  }, [lastSavedAt]);

  if (saving || autosaving) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="w-3 h-3 animate-spin" />
        {t("wizard.saving")}
      </span>
    );
  }
  if (isDirty) {
    return <span className="text-xs text-warning font-medium">• {t("wizard.notSaved")}</span>;
  }
  if (lastSavedAt) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-success">
        <CheckCircle2 className="w-3 h-3" />
        {t("wizard.draftSaved")} · {formatRelativeTime(lastSavedAt, t, language)}
      </span>
    );
  }
  return null;
}

export default function CreateEventPage() {
  const { t, language } = useTranslation();
  const ctx = useEventForm();
  const [currentStep, setCurrentStep] = useState(1);
  const [activeTab, setActiveTab] = useState<"event" | "dates" | "translations">("event");
  const [visitedSteps, setVisitedSteps] = useState<number[]>([]);

  // Set initial visited steps only once the event is loaded. For existing events
  // every step counts as visited so the progress bar reflects the actual state.
  useEffect(() => {
    if (ctx.loading) return;
    if (ctx.isEditing) {
      setVisitedSteps([1, 2, 3, 4, 5]);
    } else {
      setVisitedSteps([1]);
    }
  }, [ctx.loading, ctx.isEditing]);

  const STEPS = [
    { id: 1, label: t("wizard.step.basics"), icon: FileText },
    { id: 2, label: t("wizard.step.dateLocation"), icon: CalendarDays },
    { id: 3, label: t("wizard.step.contentMedia"), icon: Image },
    { id: 4, label: t("wizard.step.promotion"), icon: Megaphone },
    { id: 5, label: t("wizard.step.publish"), icon: SendIcon },
  ];

  const showDatesTab = ctx.isEditing && ctx.form.isRecurring && !!ctx.id && !!ctx.tenantId;
  const showTranslationsTab = ctx.isEditing && !!ctx.id && !!ctx.tenantId;
  const showTabs = showDatesTab || showTranslationsTab;

  const scrollToWizardTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  };

  const setStep = (step: number) => {
    setCurrentStep(step);
    setVisitedSteps((prev) => (prev.includes(step) ? prev : [...prev, step]));
    scrollToWizardTop();
  };

  // Browser-level guard for unsaved changes (refresh/close tab)
  useEffect(() => {
    if (!ctx.isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [ctx.isDirty]);

  // A step counts as completed only when the user has actually visited it AND
  // it passes its own validation. No derived checkmarks.
  const completedSteps = useMemo(() => {
    return STEPS
      .filter((s) => visitedSteps.includes(s.id) && ctx.validateStep(s.id).isValid)
      .map((s) => s.id);
  }, [visitedSteps, ctx, STEPS]);

  const maxStep = STEPS[STEPS.length - 1].id;

  const canGoNext = () => ctx.validateStep(currentStep).isValid;

  // Forward jumping requires every preceding step to be valid; backward is always allowed.
  const isStepReachable = (target: number) => {
    if (target <= currentStep) return true;
    for (const s of STEPS) {
      if (s.id >= target) break;
      if (!ctx.validateStep(s.id).isValid) return false;
    }
    return true;
  };

  const goNext = () => {
    if (currentStep < maxStep && canGoNext()) {
      const ids = STEPS.map(s => s.id);
      const i = ids.indexOf(currentStep);
      if (i < ids.length - 1) setStep(ids[i + 1]);
    }
  };

  const goPrev = () => {
    const ids = STEPS.map(s => s.id);
    const i = ids.indexOf(currentStep);
    if (i > 0) setStep(ids[i - 1]);
  };

  if (ctx.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const publicUrl = ctx.form.slug ? `${window.location.origin}/e/${ctx.form.slug}` : "";
  const publishReady = ctx.validateStep(5).isValid;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm -mx-4 lg:-mx-6 px-4 lg:px-6 py-3 border-b border-border mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => ctx.navigate(-1)}
            className="p-2 rounded-lg hover:bg-secondary text-muted-foreground transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label={t("wizard.back")}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-lg font-display font-bold text-foreground truncate">
              {ctx.isEditing ? (ctx.form.title || t("wizard.editEvent")) : (ctx.form.title || t("wizard.newEvent"))}
            </h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {activeTab === "event" && (
                <>
                  <span>{t("wizard.stepXofY", { current: String(STEPS.findIndex(s => s.id === currentStep) + 1), total: String(STEPS.length) })}</span>
                  <span aria-hidden>·</span>
                </>
              )}
              <SaveIndicator
                saving={ctx.saving}
                autosaving={ctx.autosaving}
                isDirty={ctx.isDirty}
                lastSavedAt={ctx.lastSavedAt}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {ctx.isEditing && (
              <Button variant="outline" size="sm" onClick={ctx.handleDelete} className="gap-2 text-destructive hover:text-destructive" aria-label={t("wizard.delete")}>
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={ctx.handleSave}
              disabled={ctx.saving || (!ctx.isDirty && !!ctx.lastSavedAt)}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">{ctx.saving ? t("wizard.saving") : t("wizard.draft")}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Edit-only tab strip: Event / Dates / Translations */}
      {showTabs && (
        <div className="mb-4 flex items-center gap-1 border-b border-border">
          {([
            { id: "event" as const, label: t("wizard.tab.event"), icon: FileText, show: true },
            { id: "dates" as const, label: t("wizard.tab.dates"), icon: Repeat, show: showDatesTab },
            { id: "translations" as const, label: t("wizard.tab.translations"), icon: Languages, show: showTranslationsTab },
          ]).filter((t) => t.show).map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "inline-flex items-center gap-2 px-3 py-2 -mb-px border-b-2 text-sm font-medium min-h-[44px] transition-colors",
                  active
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Wizard Progress — only within the Event tab */}
      {activeTab === "event" && (
        <div className="mb-8">
          <WizardProgress
            steps={STEPS}
            currentStep={currentStep}
            onStepClick={setStep}
            completedSteps={completedSteps}
            isStepReachable={isStepReachable}
            lockedReason={t("wizard.stepLocked")}
          />
        </div>
      )}

      {/* Step Content */}
      {activeTab === "event" && (
      <AnimatePresence mode="wait">
        {currentStep === 1 && (
          <StepBasics key="basics" form={ctx.form} updateForm={ctx.updateForm} categories={ctx.availableCategories} />
        )}
        {currentStep === 2 && (
          <StepDateTime key="datetime" form={ctx.form} updateForm={ctx.updateForm} venues={ctx.venues} />
        )}
        {currentStep === 3 && (
          <StepMedia
            key="media"
            form={ctx.form}
            updateForm={ctx.updateForm}
            mediaPickerOpen={ctx.mediaPickerOpen}
            setMediaPickerOpen={ctx.setMediaPickerOpen}
            mediaItems={ctx.mediaItems}
            mediaLoading={ctx.mediaLoading}
            uploading={ctx.uploading}
            fileInputRef={ctx.fileInputRef as React.RefObject<HTMLInputElement>}
            openMediaPicker={ctx.openMediaPicker}
            handleMediaUpload={ctx.handleMediaUpload}
            categories={ctx.availableCategories}
          />
        )}
        {currentStep === 4 && (
          <StepPromotion key="promotion" form={ctx.form} updateForm={ctx.updateForm} />
        )}
        {currentStep === 5 && (
          <StepPublish
            key="publish"
            form={ctx.form}
            updateForm={ctx.updateForm}
            isEditing={ctx.isEditing}
            eventId={ctx.id}
            saving={ctx.saving}
            onSave={ctx.handleSave}
            onPublish={ctx.handlePublish}
            validation={ctx.validateStep(5)}
          />
        )}
      </AnimatePresence>
      )}

      {activeTab === "dates" && showDatesTab && ctx.id && ctx.tenantId && (
        <OccurrencesTab
          eventId={ctx.id}
          tenantId={ctx.tenantId}
          defaultStartTime={ctx.form.startTime}
          defaultEndTime={ctx.form.endTime}
        />
      )}
      {activeTab === "translations" && showTranslationsTab && ctx.id && ctx.tenantId && (
        <StepTranslations
          eventId={ctx.id}
          tenantId={ctx.tenantId}
          form={ctx.form}
        />
      )}

      {/* Navigation buttons — only within Event tab */}
      {activeTab === "event" && (
      <div className="mt-8 pt-6 border-t border-border space-y-3">
        {!canGoNext() && currentStep < maxStep && (
          <div className="rounded-lg bg-warning/10 border border-warning/30 px-3 py-2">
            <p className="text-xs text-foreground">
              <span className="text-warning font-semibold">{t("wizard.almostThere")}</span> — {t("wizard.fillIn")}:{" "}
              {ctx.validateStep(currentStep).errors.join(" · ")}
            </p>
          </div>
        )}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={goPrev} disabled={currentStep === STEPS[0].id} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            {t("wizard.prev")}
          </Button>

          {currentStep < maxStep ? (
            <Button onClick={goNext} disabled={!canGoNext()} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              {t("wizard.next")}
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={ctx.handlePublish} disabled={ctx.saving || !publishReady} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              <Send className="w-4 h-4" />
              {ctx.form.publishAt ? t("wizard.schedule") : t("wizard.publish")}
            </Button>
          )}
        </div>
      </div>
      )}

      {/* Recurring edit-scope dialog */}
      <RecurringEditScopeDialog
        open={!!ctx.pendingRecurringSave}
        onOpenChange={(open) => { if (!open) ctx.cancelRecurringScope(); }}
        onConfirm={(scope) => ctx.confirmRecurringScope(scope)}
        futureCount={ctx.pendingRecurringSave?.futureCount}
        totalCount={ctx.pendingRecurringSave?.totalCount}
        hasManualEdits={ctx.pendingRecurringSave?.hasManualEdits}
        allowSingle={false}
      />

      {/* Publish success modal */}
      <Dialog open={!!ctx.publishedEventId} onOpenChange={(open) => { if (!open) ctx.dismissPublishSuccess(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center mb-2",
              ctx.publishedStatus === "scheduled" ? "bg-accent/15" : "bg-primary/15"
            )}>
              {ctx.publishedStatus === "scheduled"
                ? <CalendarDays className="w-6 h-6 text-accent" />
                : <CheckCircle2 className="w-6 h-6 text-primary" />}
            </div>
            <DialogTitle>
              {ctx.publishedStatus === "scheduled" ? t("wizard.scheduledTitle") : t("wizard.publishedTitle")}
            </DialogTitle>
            <DialogDescription>
              {ctx.publishedStatus === "scheduled"
                ? (ctx.form.publishAt
                    ? t("wizard.scheduledDescAt", { when: new Date(ctx.form.publishAt).toLocaleString(language === "en" ? "en-GB" : "nl-NL", { dateStyle: "long", timeStyle: "short" }) })
                    : t("wizard.scheduledDescFallback"))
                : t("wizard.publishedDesc")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-col gap-2 sm:gap-2 sm:space-x-0">
            {ctx.publishedStatus === "published" && publicUrl && (
              <Button asChild className="w-full gap-2">
                <a href={publicUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="w-4 h-4" />
                  {t("wizard.viewPublicPage")}
                </a>
              </Button>
            )}
            {ctx.publishedEventId && (
              <Button variant="outline" asChild className="w-full gap-2">
                <Link to={`/app/distribution?event=${ctx.publishedEventId}`} onClick={() => ctx.dismissPublishSuccess()}>
                  <Share2 className="w-4 h-4" />
                  {t("wizard.shareNow")}
                </Link>
              </Button>
            )}
            <Button
              variant="ghost"
              className="w-full gap-2 text-muted-foreground"
              onClick={() => { ctx.dismissPublishSuccess(); ctx.navigate("/app/events"); }}
            >
              <LayoutList className="w-4 h-4" />
              {t("wizard.toOverview")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
