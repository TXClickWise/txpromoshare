import { useState, useMemo, useEffect } from "react";
import { useBlocker, Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Save, Send, Trash2, FileText, CalendarDays, Image, Megaphone, Send as SendIcon, Repeat, Loader2, CheckCircle2, ExternalLink, Share2, LayoutList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WizardProgress } from "@/components/event-wizard/WizardProgress";
import { StepBasics } from "@/components/event-wizard/StepBasics";
import { StepDateTime } from "@/components/event-wizard/StepDateTime";
import { StepMedia } from "@/components/event-wizard/StepMedia";
import { StepPromotion } from "@/components/event-wizard/StepPromotion";
import { StepPublish } from "@/components/event-wizard/StepPublish";
import { OccurrencesTab } from "@/components/event-wizard/OccurrencesTab";
import { useEventForm } from "@/components/event-wizard/useEventForm";
import { AnimatePresence } from "framer-motion";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const BASE_STEPS = [
  { id: 1, label: "Basis", icon: FileText },
  { id: 2, label: "Datum & Locatie", icon: CalendarDays },
  { id: 3, label: "Content & Media", icon: Image },
  { id: 4, label: "Promotie", icon: Megaphone },
  { id: 5, label: "Publiceren", icon: SendIcon },
];

const OCCURRENCES_STEP = { id: 6, label: "Datums", icon: Repeat };

function formatRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 5) return "zojuist";
  if (seconds < 60) return `${seconds}s geleden`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min geleden`;
  return date.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
}

function SaveIndicator({ saving, autosaving, isDirty, lastSavedAt }: {
  saving: boolean; autosaving: boolean; isDirty: boolean; lastSavedAt: Date | null;
}) {
  // Force re-render every 15s for relative time updates
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!lastSavedAt) return;
    const t = setInterval(() => setTick(x => x + 1), 15000);
    return () => clearInterval(t);
  }, [lastSavedAt]);

  if (saving || autosaving) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="w-3 h-3 animate-spin" />
        Opslaan…
      </span>
    );
  }
  if (isDirty) {
    return <span className="text-xs text-highlight">• Niet opgeslagen</span>;
  }
  if (lastSavedAt) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-accent">
        <CheckCircle2 className="w-3 h-3" />
        Concept opgeslagen · {formatRelativeTime(lastSavedAt)}
      </span>
    );
  }
  return null;
}

export default function CreateEventPage() {
  const ctx = useEventForm();
  const [currentStep, setCurrentStep] = useState(1);

  const showOccurrences = ctx.isEditing && ctx.form.isRecurring;
  const STEPS = showOccurrences ? [...BASE_STEPS, OCCURRENCES_STEP] : BASE_STEPS;

  // In-app navigation guard for unsaved changes
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      ctx.isDirty && !ctx.saving && !ctx.autosaving && currentLocation.pathname !== nextLocation.pathname
  );

  const completedSteps = useMemo(() => {
    const completed: number[] = [];
    if (ctx.form.title.trim()) completed.push(1);
    if (ctx.form.startDate && ctx.form.startTime) completed.push(2);
    if (completed.includes(1)) completed.push(3);
    if (completed.includes(1)) completed.push(4);
    if (completed.includes(1) && completed.includes(2)) completed.push(5);
    if (showOccurrences && completed.includes(2)) completed.push(6);
    return completed;
  }, [ctx.form.title, ctx.form.startDate, ctx.form.startTime, showOccurrences]);

  const maxStep = STEPS[STEPS.length - 1].id;

  const canGoNext = () => ctx.validateStep(currentStep).isValid;

  const goNext = () => {
    if (currentStep < maxStep && canGoNext()) {
      const ids = STEPS.map(s => s.id);
      const i = ids.indexOf(currentStep);
      if (i < ids.length - 1) setCurrentStep(ids[i + 1]);
    }
  };

  const goPrev = () => {
    const ids = STEPS.map(s => s.id);
    const i = ids.indexOf(currentStep);
    if (i > 0) setCurrentStep(ids[i - 1]);
  };

  if (ctx.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const publicUrl = ctx.form.slug ? `${window.location.origin}/e/${ctx.form.slug}` : "";

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm -mx-4 lg:-mx-6 px-4 lg:px-6 py-3 border-b border-border mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => ctx.navigate(-1)}
            className="p-2 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
            aria-label="Terug"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-display font-bold text-foreground truncate">
              {ctx.isEditing ? (ctx.form.title || "Evenement bewerken") : (ctx.form.title || "Nieuw evenement")}
            </h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Stap {STEPS.findIndex(s => s.id === currentStep) + 1} van {STEPS.length}</span>
              <span aria-hidden>·</span>
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
              <Button variant="outline" size="sm" onClick={ctx.handleDelete} className="gap-2 text-destructive hover:text-destructive" aria-label="Verwijderen">
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
              <span className="hidden sm:inline">{ctx.saving ? "Opslaan…" : "Concept"}</span>
            </Button>
            <Button
              size="sm"
              onClick={ctx.handlePublish}
              disabled={ctx.saving || !completedSteps.includes(5)}
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Publiceren</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Wizard Progress */}
      <div className="mb-8">
        <WizardProgress
          steps={STEPS}
          currentStep={currentStep}
          onStepClick={setCurrentStep}
          completedSteps={completedSteps}
        />
      </div>

      {/* Step Content */}
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
        {currentStep === 6 && showOccurrences && ctx.id && ctx.tenantId && (
          <OccurrencesTab
            key="occurrences"
            eventId={ctx.id}
            tenantId={ctx.tenantId}
            defaultStartTime={ctx.form.startTime}
            defaultEndTime={ctx.form.endTime}
          />
        )}
      </AnimatePresence>

      {/* Navigation buttons */}
      <div className="mt-8 pt-6 border-t border-border space-y-3">
        {!canGoNext() && currentStep < maxStep && (
          <div className="rounded-lg bg-highlight/5 border border-highlight/20 px-3 py-2">
            <p className="text-[11px] text-muted-foreground">
              <span className="text-highlight font-medium">Bijna goed</span> — vul nog in:{" "}
              {ctx.validateStep(currentStep).errors.join(" · ")}
            </p>
          </div>
        )}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={goPrev} disabled={currentStep === STEPS[0].id} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Vorige
          </Button>

          {currentStep < maxStep ? (
            <Button onClick={goNext} disabled={!canGoNext()} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              Volgende
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : currentStep !== 6 ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={ctx.handleSave}
                disabled={ctx.saving || (!ctx.isDirty && !!ctx.lastSavedAt)}
                className="gap-2"
              >
                <Save className="w-4 h-4" />
                Concept
              </Button>
              <Button onClick={ctx.handlePublish} disabled={ctx.saving || !ctx.validateStep(5).isValid} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                <Send className="w-4 h-4" />
                {ctx.form.publishAt ? "Inplannen" : "Publiceren"}
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Unsaved-changes guard (in-app navigation) */}
      <AlertDialog open={blocker.state === "blocked"} onOpenChange={(open) => { if (!open) blocker.reset?.(); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Onopgeslagen wijzigingen</AlertDialogTitle>
            <AlertDialogDescription>
              Je hebt nog niet-opgeslagen wijzigingen. Wil je deze pagina verlaten? Je wijzigingen gaan dan verloren.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => blocker.reset?.()}>Op deze pagina blijven</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => blocker.proceed?.()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Verlaten zonder opslaan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
              {ctx.publishedStatus === "scheduled" ? "Evenement ingepland" : "Je event is live"}
            </DialogTitle>
            <DialogDescription>
              {ctx.publishedStatus === "scheduled"
                ? `Het event wordt automatisch gepubliceerd op ${ctx.form.publishAt ? new Date(ctx.form.publishAt).toLocaleString("nl-NL", { dateStyle: "long", timeStyle: "short" }) : "de ingestelde datum"}.`
                : "Je event is direct zichtbaar voor bezoekers en kan nu gedeeld worden."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-col gap-2 sm:gap-2 sm:space-x-0">
            {ctx.publishedStatus === "published" && publicUrl && (
              <Button asChild className="w-full gap-2">
                <a href={publicUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="w-4 h-4" />
                  Bekijk publieke pagina
                </a>
              </Button>
            )}
            {ctx.publishedEventId && (
              <Button variant="outline" asChild className="w-full gap-2">
                <Link to={`/app/distribution?event=${ctx.publishedEventId}`} onClick={() => ctx.dismissPublishSuccess()}>
                  <Share2 className="w-4 h-4" />
                  Nu delen
                </Link>
              </Button>
            )}
            <Button
              variant="ghost"
              className="w-full gap-2 text-muted-foreground"
              onClick={() => { ctx.dismissPublishSuccess(); ctx.navigate("/app/events"); }}
            >
              <LayoutList className="w-4 h-4" />
              Naar overzicht
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
