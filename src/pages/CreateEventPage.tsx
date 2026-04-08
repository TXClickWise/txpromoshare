import { useState, useMemo } from "react";
import { ArrowLeft, ArrowRight, Save, Send, Trash2, FileText, CalendarDays, Image, Megaphone, Send as SendIcon, Clock, Repeat } from "lucide-react";
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

const BASE_STEPS = [
  { id: 1, label: "Basis", icon: FileText },
  { id: 2, label: "Datum & Locatie", icon: CalendarDays },
  { id: 3, label: "Content & Media", icon: Image },
  { id: 4, label: "Promotie", icon: Megaphone },
  { id: 5, label: "Publiceren", icon: SendIcon },
];

const OCCURRENCES_STEP = { id: 6, label: "Datums", icon: Repeat };

export default function CreateEventPage() {
  const ctx = useEventForm();
  const [currentStep, setCurrentStep] = useState(1);

  // Show occurrences tab only when editing a recurring event
  const showOccurrences = ctx.isEditing && ctx.form.isRecurring;
  const STEPS = showOccurrences ? [...BASE_STEPS, OCCURRENCES_STEP] : BASE_STEPS;

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

  const canGoNext = () => {
    const v = ctx.validateStep(currentStep);
    return v.isValid;
  };

  const goNext = () => {
    if (currentStep < maxStep && canGoNext()) {
      const nextStepIds = STEPS.map(s => s.id);
      const currentIdx = nextStepIds.indexOf(currentStep);
      if (currentIdx < nextStepIds.length - 1) {
        setCurrentStep(nextStepIds[currentIdx + 1]);
      }
    }
  };

  const goPrev = () => {
    const stepIds = STEPS.map(s => s.id);
    const currentIdx = stepIds.indexOf(currentStep);
    if (currentIdx > 0) setCurrentStep(stepIds[currentIdx - 1]);
  };

  if (ctx.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm -mx-4 lg:-mx-6 px-4 lg:px-6 py-3 border-b border-border mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => {
            if (ctx.isDirty && !confirm("Je hebt onopgeslagen wijzigingen. Weet je zeker dat je wilt teruggaan?")) return;
            ctx.navigate(-1);
          }} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-display font-bold text-foreground truncate">
              {ctx.isEditing ? (ctx.form.title || "Evenement bewerken") : (ctx.form.title || "Nieuw evenement")}
            </h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Stap {STEPS.findIndex(s => s.id === currentStep) + 1} van {STEPS.length}</span>
              {ctx.isDirty && <span className="text-highlight">• Niet opgeslagen</span>}
              {ctx.lastSavedAt && !ctx.isDirty && (
                <span className="text-accent flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Opgeslagen {ctx.lastSavedAt.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {ctx.isEditing && (
              <Button variant="outline" size="sm" onClick={ctx.handleDelete} className="gap-2 text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={ctx.handleSave} disabled={ctx.saving} className="gap-2">
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">{ctx.saving ? "Opslaan..." : "Concept"}</span>
            </Button>
            <Button size="sm" onClick={ctx.handlePublish} disabled={ctx.saving || !completedSteps.includes(5)} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
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
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
        <Button
          variant="outline"
          onClick={goPrev}
          disabled={currentStep === STEPS[0].id}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Vorige
        </Button>

        {currentStep < maxStep ? (
          <Button
            onClick={goNext}
            disabled={!canGoNext()}
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Volgende
            <ArrowRight className="w-4 h-4" />
          </Button>
        ) : currentStep !== 6 ? (
          <div className="flex gap-2">
            <Button variant="outline" onClick={ctx.handleSave} disabled={ctx.saving} className="gap-2">
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
  );
}
