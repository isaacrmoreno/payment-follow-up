"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { driver } from "driver.js";
import { useToast } from "@/components/toast";

const TOUR_SEEN_KEY = "payment-follow-up:onboarding-seen";
const TOUR_STAGE_KEY = "payment-follow-up:onboarding-stage";
const TOUR_AUTO_STARTED_KEY = "payment-follow-up:onboarding-auto-started";
const START_TOUR_EVENT = "payment-follow-up:start-tour";

type TourStage = "clients" | "invoices" | "reminders";
type TourStep = {
  element?: string;
  popover?: {
    title: string;
    description: string;
    side?: "top" | "right" | "bottom" | "left";
    align?: "start" | "center" | "end";
    onDoneClick?: () => void;
  };
};

const STAGES: Record<
  TourStage,
  {
    path: string;
    next?: TourStage;
    steps: TourStep[];
  }
> = {
  clients: {
    path: "/clients",
    next: "invoices",
    steps: [
      {
        popover: {
          title: "Quick walkthrough",
          description: "We will keep this short. First add a client, then create the invoice, then review the reminder setup.",
          side: "bottom",
          align: "center",
        },
      },
      {
        element: "#tour-clients-header",
        popover: {
          title: "Start with clients",
          description: "This is where you keep the people or companies you need to follow up with.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: "#tour-add-client",
        popover: {
          title: "Add the contact first",
          description: "Create the client here so your invoice has someone attached to it right away.",
          side: "left",
          align: "center",
        },
      },
      {
        element: "#tour-clients-list",
        popover: {
          title: "Your client list",
          description: "Once a client is here, the next step is creating the invoice and reminder flow for them.",
          side: "top",
          align: "start",
        },
      },
    ],
  },
  invoices: {
    path: "/invoices",
    next: "reminders",
    steps: [
      {
        element: "#tour-invoices-header",
        popover: {
          title: "Next, create the invoice",
          description: "Invoices are where the due date, reminder plan, and payment link all come together.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: "#tour-add-invoice",
        popover: {
          title: "Add an invoice",
          description: "Pick the client, set the amount and due date, then choose how many reminders should go out.",
          side: "left",
          align: "center",
        },
      },
      {
        element: "#tour-invoice-filters",
        popover: {
          title: "Filter the queue",
          description: "Use these filters to stay focused on open work, paid invoices, or anything you already closed out.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: "#tour-invoice-list",
        popover: {
          title: "Run follow-up from here",
          description: "Preview reminder timing, send a reminder, review history, or update the invoice from this list.",
          side: "top",
          align: "start",
        },
      },
    ],
  },
  reminders: {
    path: "/reminders",
    steps: [
      {
        element: "#tour-reminders-header",
        popover: {
          title: "Set your defaults",
          description: "This page controls the reminder language and cadence your future invoices start from.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: "#tour-template-list",
        popover: {
          title: "Keep your message ready",
          description: "Soft, Firm, and Final templates give you a reusable sequence without rewriting the email every time.",
          side: "top",
          align: "start",
        },
      },
      {
        element: "#tour-edit-cadence",
        popover: {
          title: "Set the default timing",
          description: "These defaults help with new invoices. An invoice can still keep its own locked schedule after it is created.",
          side: "left",
          align: "center",
        },
      },
      {
        popover: {
          title: "You are set",
          description: "That is the core workflow. Add a client, create the invoice, and let reminders keep the follow-up moving.",
          side: "bottom",
          align: "center",
        },
      },
    ],
  },
};

export function OnboardingTour() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const driverRef = useRef<ReturnType<typeof driver> | null>(null);
  const transitionRef = useRef(false);
  const startedStageRef = useRef<TourStage | null>(null);

  const clearTourState = useCallback((markSeen = true) => {
    localStorage.removeItem(TOUR_STAGE_KEY);
    startedStageRef.current = null;

    if (markSeen) {
      localStorage.setItem(TOUR_SEEN_KEY, "true");
    }
  }, []);

  const runStage = useCallback((stage: TourStage) => {
    if (startedStageRef.current === stage) {
      return;
    }

    startedStageRef.current = stage;
    transitionRef.current = false;

    const stageConfig = STAGES[stage];
    const tour = driver({
      animate: true,
      showProgress: true,
      allowClose: true,
      overlayColor: "#09090b",
      overlayOpacity: 0.45,
      popoverClass: "payment-follow-up-tour",
      nextBtnText: "Next",
      prevBtnText: "Back",
      doneBtnText: stageConfig.next ? "Next" : "Finish",
      steps: stageConfig.steps,
      onDestroyStarted: (_, __, options) => {
        if (transitionRef.current) {
          options.driver.destroy();
          return;
        }

        clearTourState(true);
        options.driver.destroy();
      },
      onDestroyed: () => {
        if (!transitionRef.current) {
          startedStageRef.current = null;
        }
      },
    });

    const lastStepIndex = stageConfig.steps.length - 1;
    const lastStep = stageConfig.steps[lastStepIndex];
    if (lastStep?.popover) {
      lastStep.popover.onDoneClick = () => {
        if (stageConfig.next) {
          transitionRef.current = true;
          driverRef.current?.destroy();
          driverRef.current = null;
          localStorage.setItem(TOUR_STAGE_KEY, stageConfig.next);
          startedStageRef.current = null;
          router.push(STAGES[stageConfig.next].path);
          return;
        }

        transitionRef.current = false;
        driverRef.current?.destroy();
        driverRef.current = null;
        clearTourState(true);
        toast("Tour finished. You are ready to go.", "success");
      };
    }

    driverRef.current = tour;
    tour.drive();
  }, [clearTourState, router, toast]);

  const startFromBeginning = useCallback(() => {
    localStorage.removeItem(TOUR_SEEN_KEY);
    localStorage.setItem(TOUR_STAGE_KEY, "clients");
    sessionStorage.setItem(TOUR_AUTO_STARTED_KEY, "true");
    startedStageRef.current = null;

    if (pathname !== STAGES.clients.path) {
      router.push(STAGES.clients.path);
      return;
    }

    window.setTimeout(() => runStage("clients"), 150);
  }, [pathname, router, runStage]);

  useEffect(() => {
    function handleStartTour() {
      startFromBeginning();
    }

    window.addEventListener(START_TOUR_EVENT, handleStartTour);
    return () => {
      window.removeEventListener(START_TOUR_EVENT, handleStartTour);
    };
  }, [startFromBeginning]);

  useEffect(() => {
    const activeStage = localStorage.getItem(TOUR_STAGE_KEY) as TourStage | null;

    if (activeStage && STAGES[activeStage]?.path === pathname) {
      window.setTimeout(() => runStage(activeStage), 150);
      return;
    }

    const hasSeenTour = localStorage.getItem(TOUR_SEEN_KEY) === "true";
    const autoStarted = sessionStorage.getItem(TOUR_AUTO_STARTED_KEY) === "true";

    if (!hasSeenTour && !autoStarted && pathname === STAGES.clients.path) {
      sessionStorage.setItem(TOUR_AUTO_STARTED_KEY, "true");
      localStorage.setItem(TOUR_STAGE_KEY, "clients");
      window.setTimeout(() => runStage("clients"), 300);
    }
  }, [pathname, runStage]);

  useEffect(() => {
    return () => {
      driverRef.current?.destroy();
      driverRef.current = null;
    };
  }, []);

  return null;
}
