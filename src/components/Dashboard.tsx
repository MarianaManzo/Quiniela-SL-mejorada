import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Clock,
  Flag,
  Trophy,
} from "lucide-react";
import { ROLE_LABELS, type UserProfile } from "./LoginScreen";
import { TOP_RANKING } from "../data/podium";
import { obtenerUsuariosParaPodio } from "../services/firestoreService";
import { LIGUILLA_STAGE_METADATA } from "../quiniela/config";
import "../styles/dashboard.css";

interface DashboardProps {
  user: UserProfile;
  onEnterQuiniela: (journeyNumber: number) => void;
  onViewQuiniela?: (journeyCode: string) => void;
  onViewPodium?: () => void;
  journeyCards: DashboardJourneyCard[];
  journeyCode?: string;
  journeyCloseLabel?: string | null;
  journeyClosedLabel?: string | null;
  journeyClosed?: boolean;
  journeySubmittedAt?: string | null;
  previousJourneyClosedLabel?: string | null;
  previousJourneySubmittedAt?: string | null;
  onPreviewBadge?: () => void;
}

interface TournamentSectionState {
  id: string;
  collapsed: boolean;
}

type JourneyTone = "current" | "success" | "warning" | "upcoming";

type JourneyCardAction = "participate" | "view" | null;

type StatusIconComponent = () => JSX.Element;

type JourneyGroup = "regular" | "liguilla";

interface DashboardJourneyCard {
  id: string;
  code: string;
  number: number;
  statusLabel: string;
  meta: string;
  tone: JourneyTone;
  action: JourneyCardAction;
  group: JourneyGroup;
  stageId?: string;
}

interface JourneyCard {
  id: string;
  code: string;
  statusLabel: string;
  meta: string;
  tone: JourneyTone;
  journeyNumber?: number;
  ctaLabel?: string;
  ctaMobileLabel?: string;
  action?: JourneyCardAction;
  group: JourneyGroup;
  stageId?: string;
}

type StatusTagTone = "progress" | "neutral";

interface TournamentSection {
  id: string;
  appearance: "regular" | "elimination";
  title: string;
  subtitle?: string;
  statusTags: { id: string; label: string; tone: StatusTagTone }[];
  cards: JourneyCard[];
}

const DEFAULT_SECTION_ID = "regular";
const SECTION_DEFAULT_STATE: TournamentSectionState[] = [
  { id: "regular", collapsed: false },
  { id: "liguilla", collapsed: true },
];

const journeyStatusIcons: Record<JourneyTone, StatusIconComponent | null> = {
  success: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M8 1.5C6.71442 1.5 5.45772 1.88122 4.3888 2.59545C3.31988 3.30968 2.48676 4.32484 1.99479 5.51256C1.50282 6.70028 1.37409 8.00721 1.6249 9.26809C1.8757 10.529 2.49477 11.6872 3.40381 12.5962C4.31285 13.5052 5.47104 14.1243 6.73192 14.3751C7.99279 14.6259 9.29973 14.4972 10.4874 14.0052C11.6752 13.5132 12.6903 12.6801 13.4046 11.6112C14.1188 10.5423 14.5 9.28558 14.5 8C14.4967 6.27711 13.8108 4.62573 12.5925 3.40746C11.3743 2.18918 9.72289 1.5033 8 1.5ZM11.0938 6.8625L7.43125 10.3625C7.33657 10.4516 7.21125 10.5008 7.08125 10.5C7.01771 10.5009 6.95463 10.4892 6.89563 10.4656C6.83663 10.442 6.78289 10.407 6.7375 10.3625L4.90625 8.6125C4.85546 8.56819 4.81415 8.51406 4.78481 8.45337C4.75547 8.39269 4.73871 8.3267 4.73552 8.25937C4.73233 8.19204 4.7428 8.12476 4.76628 8.06157C4.78975 7.99839 4.82577 7.9406 4.87215 7.89169C4.91853 7.84278 4.97432 7.80375 5.03617 7.77695C5.09802 7.75015 5.16465 7.73614 5.23206 7.73574C5.29946 7.73535 5.36625 7.7486 5.42841 7.77467C5.49056 7.80075 5.54681 7.83913 5.59375 7.8875L7.08125 9.30625L10.4063 6.1375C10.5035 6.05268 10.6297 6.00872 10.7586 6.01482C10.8875 6.02092 11.009 6.0766 11.0978 6.17022C11.1866 6.26384 11.2357 6.38815 11.235 6.51717C11.2342 6.64618 11.1836 6.76992 11.0938 6.8625Z"
        fill="currentColor"
      />
    </svg>
  ),
  warning: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M14.7936 11.75L9.29983 2.24996C9.16831 2.02148 8.97889 1.8317 8.75066 1.69973C8.52243 1.56777 8.26346 1.49829 7.99983 1.49829C7.7362 1.49829 7.47722 1.56777 7.24899 1.69973C7.02077 1.8317 6.83135 2.02148 6.69983 2.24996L1.20608 11.75C1.07262 11.9773 1.00169 12.2359 1.0005 12.4995C0.999313 12.7631 1.0679 13.0223 1.1993 13.2508C1.3307 13.4793 1.52023 13.669 1.74864 13.8006C1.97706 13.9322 2.23623 14.0009 2.49983 14H13.4998C13.7634 14.0009 14.0226 13.9322 14.251 13.8006C14.4794 13.669 14.669 13.4793 14.8004 13.2508C14.9318 13.0223 15.0003 12.7631 14.9992 12.4995C14.998 12.2359 14.927 11.9773 14.7936 11.75ZM7.49983 6.49996C7.49983 6.36735 7.55251 6.24017 7.64627 6.14641C7.74004 6.05264 7.86722 5.99996 7.99983 5.99996C8.13244 5.99996 8.25961 6.05264 8.35338 6.14641C8.44715 6.24017 8.49983 6.36735 8.49983 6.49996V8.99996C8.49983 9.13257 8.44715 9.25975 8.35338 9.35351C8.25961 9.44728 8.13244 9.49996 7.99983 9.49996C7.86722 9.49996 7.74004 9.44728 7.64627 9.35351C7.55251 9.25975 7.49983 9.13257 7.49983 8.99996V6.49996ZM7.99983 12C7.85149 12 7.70649 11.956 7.58315 11.8736C7.45981 11.7912 7.36368 11.674 7.30692 11.537C7.25015 11.3999 7.2353 11.2491 7.26424 11.1036C7.29318 10.9582 7.36461 10.8245 7.4695 10.7196C7.57439 10.6147 7.70802 10.5433 7.85351 10.5144C7.99899 10.4854 8.14979 10.5003 8.28684 10.5571C8.42388 10.6138 8.54102 10.7099 8.62343 10.8333C8.70584 10.9566 8.74983 11.1016 8.74983 11.25C8.74983 11.4489 8.67081 11.6396 8.53016 11.7803C8.3895 11.9209 8.19874 12 7.99983 12Z"
        fill="currentColor"
      />
    </svg>
  ),
  upcoming: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M26 4H23V3C23 2.73478 22.8946 2.48043 22.7071 2.29289C22.5196 2.10536 22.2652 2 22 2C21.7348 2 21.4804 2.10536 21.2929 2.29289C21.1054 2.48043 21 2.73478 21 3V4H11V3C11 2.73478 10.8946 2.48043 10.7071 2.29289C10.5196 2.10536 10.2652 2 10 2C9.73478 2 9.48043 2.10536 9.29289 2.29289C9.10536 2.48043 9 2.73478 9 3V4H6C5.46957 4 4.96086 4.21071 4.58579 4.58579C4.21071 4.96086 4 5.46957 4 6V26C4 26.5304 4.21071 27.0391 4.58579 27.4142C4.96086 27.7893 5.46957 28 6 28H26C26.5304 28 27.0391 27.7893 27.4142 27.4142C27.7893 27.0391 28 26.5304 28 26V6C28 5.46957 27.7893 4.96086 27.4142 4.58579C27.0391 4.21071 26.5304 4 26 4ZM13 23.5C12.2041 23.4992 11.4407 23.1848 10.875 22.625C10.688 22.4375 10.583 22.1835 10.583 21.9188C10.583 21.654 10.688 21.4 10.875 21.2125C10.967 21.1184 11.0768 21.0436 11.1981 20.9925C11.3194 20.9415 11.4497 20.9152 11.5813 20.9152C11.7128 20.9152 11.8431 20.9415 11.9644 20.9925C12.0857 21.0436 12.1955 21.1184 12.2875 21.2125C12.4795 21.396 12.7345 21.4989 13 21.5C13.2652 21.5 13.5196 21.3946 13.7071 21.2071C13.8946 21.0196 14 20.7652 14 20.5C14 20.2348 13.8946 19.9804 13.7071 19.7929C13.5196 19.6054 13.2652 19.5 13 19.5H12.6875L12.6375 19.475H12.6L12.5375 19.45H12.525L12.45 19.4H12.425L12.375 19.3625L12.325 19.325L12.3 19.3L12.2625 19.2625C12.197 19.1871 12.1423 19.103 12.1 19.0125C12.0641 18.946 12.0388 18.8743 12.025 18.8C12.0125 18.7875 12.0125 18.775 12.0125 18.75C12.0131 18.7432 12.0123 18.7364 12.0101 18.73C12.008 18.7235 12.0045 18.7176 12 18.7125V18.5V18.4125C12 18.3875 12.0125 18.375 12.0125 18.3625V18.3125C12.0224 18.2978 12.0269 18.2801 12.025 18.2625C12.0375 18.25 12.0375 18.2375 12.0375 18.2125L12.0625 18.175C12.0625 18.15 12.0625 18.1375 12.075 18.125L12.1 18.075V18.0375L12.125 17.9875L12.15 17.95L12.1875 17.9L12.2125 17.875L12.9125 17H11.5C11.2348 17 10.9804 16.8946 10.7929 16.7071C10.6054 16.5196 10.5 16.2652 10.5 16C10.5 15.7348 10.6054 15.4804 10.7929 15.2929C10.9804 15.1054 11.2348 15 11.5 15H15C15.1879 15.0011 15.3717 15.055 15.5304 15.1558C15.689 15.2565 15.8161 15.3999 15.897 15.5695C15.9779 15.7391 16.0094 15.9281 15.9878 16.1148C15.9662 16.3015 15.8925 16.4783 15.775 16.625L14.675 18.0125C15.2076 18.3716 15.6109 18.8922 15.8256 19.4976C16.0402 20.1031 16.0548 20.7614 15.8673 21.3758C15.6798 21.9902 15.3 22.5282 14.7838 22.9106C14.2676 23.293 13.6424 23.4996 13 23.5ZM21 22.5C21 22.7652 20.8946 23.0196 20.7071 23.2071C20.5196 23.3946 20.2652 23.5 20 23.5C19.7348 23.5 19.4804 23.3946 19.2929 23.2071C19.1054 23.0196 19 22.7652 19 22.5V18L18.6 18.3C18.3867 18.4559 18.1209 18.5223 17.8593 18.4849C17.5977 18.4476 17.3611 18.3094 17.2 18.1C17.0409 17.8878 16.9725 17.6211 17.01 17.3586C17.0476 17.096 17.1878 16.8591 17.4 16.7L19.4 15.2C19.5486 15.0886 19.7252 15.0207 19.9102 15.004C20.0952 14.9874 20.2811 15.0225 20.4472 15.1056C20.6133 15.1886 20.753 15.3163 20.8507 15.4743C20.9483 15.6322 21 15.8143 21 16V22.5ZM26 10H6V6H9V7C9 7.26522 9.10536 7.51957 9.29289 7.70711C9.48043 7.89464 9.73478 8 10 8C10.2652 8 10.5196 7.89464 10.7071 7.70711C10.8946 7.51957 11 7.26522 11 7V6H21V7C21 7.26522 21.1054 7.51957 21.2929 7.70711C21.4804 7.89464 21.7348 8 22 8C22.2652 8 22.5196 7.89464 22.7071 7.70711C22.8946 7.51957 23 7.26522 23 7V6H26V10Z"
        fill="currentColor"
      />
    </svg>
  ),
  current: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M6.5 1H9.5C9.63261 1 9.75979 0.947322 9.85355 0.853553C9.94732 0.759785 10 0.632608 10 0.5C10 0.367392 9.94732 0.240215 9.85355 0.146447C9.75979 0.0526784 9.63261 0 9.5 0H6.5C6.36739 0 6.24021 0.0526784 6.14645 0.146447C6.05268 0.240215 6 0.367392 6 0.5C6 0.632608 6.05268 0.759785 6.14645 0.853553C6.24021 0.947322 6.36739 1 6.5 1Z"
        fill="currentColor"
      />
      <path
        d="M8 2C6.81331 2 5.65328 2.35189 4.66658 3.01118C3.67989 3.67047 2.91085 4.60754 2.45673 5.7039C2.0026 6.80026 1.88378 8.00666 2.11529 9.17054C2.3468 10.3344 2.91825 11.4035 3.75736 12.2426C4.59648 13.0818 5.66558 13.6532 6.82946 13.8847C7.99335 14.1162 9.19975 13.9974 10.2961 13.5433C11.3925 13.0892 12.3295 12.3201 12.9888 11.3334C13.6481 10.3467 14 9.18669 14 8C13.9967 6.40972 13.3635 4.88551 12.239 3.76101C11.1145 2.6365 9.59029 2.0033 8 2ZM10.8313 5.88125L8.35625 8.35625C8.26068 8.44866 8.13294 8.50032 8 8.50032C7.86706 8.50032 7.73932 8.44866 7.64375 8.35625C7.54986 8.26145 7.49719 8.13342 7.49719 8C7.49719 7.86658 7.54986 7.73855 7.64375 7.64375L10.1188 5.16875C10.1636 5.11413 10.2194 5.06949 10.2825 5.03772C10.3456 5.00595 10.4147 4.98775 10.4852 4.98428C10.5558 4.98082 10.6264 4.99216 10.6923 5.0176C10.7582 5.04303 10.8181 5.08198 10.8681 5.13195C10.918 5.18192 10.957 5.24179 10.9824 5.30772C11.0078 5.37365 11.0192 5.44418 11.0157 5.51476C11.0123 5.58534 10.9941 5.65441 10.9623 5.71753C10.9305 5.78065 10.8859 5.83642 10.8313 5.88125Z"
        fill="currentColor"
      />
    </svg>
  ),
};

export function Dashboard({
  user,
  onEnterQuiniela,
  onViewQuiniela,
  onViewPodium,
  journeyCards,
  journeyCode,
  journeyCloseLabel,
  journeyClosedLabel,
  journeyClosed = false,
  journeySubmittedAt,
  previousJourneyClosedLabel: _previousJourneyClosedLabel,
  previousJourneySubmittedAt: _previousJourneySubmittedAt,
  onPreviewBadge,
}: DashboardProps) {
  const [sectionState, setSectionState] = useState<TournamentSectionState[]>(SECTION_DEFAULT_STATE);
  const [topRanking, setTopRanking] = useState(
    TOP_RANKING.slice(0, 4).map((entry, index) => ({
      id: String(entry.id),
      name: entry.name,
      score: `${entry.points} pts`,
      position: index + 1,
    }))
  );

  useEffect(() => {
    let cancelled = false;

    const loadRanking = async () => {
      try {
        const podium = await obtenerUsuariosParaPodio(4);
        if (cancelled || podium.length === 0) {
          return;
        }

        setTopRanking(
          podium.map((entry, index) => ({
            id: entry.id,
            name: entry.nombre,
            score: `${entry.puntosTotales} pts`,
            position: index + 1,
          }))
        );
      } catch (error) {
        console.error("No se pudo cargar el ranking destacado", error);
      }
    };

    void loadRanking();

    return () => {
      cancelled = true;
    };
  }, []);

  const isSectionCollapsed = (sectionId: string) => sectionState.find((state) => state.id === sectionId)?.collapsed;

  const toggleSection = (sectionId: string) => {
    setSectionState((prev) =>
      prev.map((entry) =>
        entry.id === sectionId ? { ...entry, collapsed: !entry.collapsed } : entry
      )
    );
  };

  const orderedJourneyCards = useMemo(() => {
    return [...journeyCards].sort((a, b) => b.number - a.number);
  }, [journeyCards]);

  const firstName = user.name.trim().split(" ")[0] || user.name;
  const hasSubmitted = Boolean(journeySubmittedAt);
  const activeJourneyCard = orderedJourneyCards.find((card) => card.code === journeyCode)
    ?? orderedJourneyCards.find((card) => card.tone === "current")
    ?? null;
  const activeJourneyCode = journeyCode ?? activeJourneyCard?.code ?? "";
  const heroActionType: JourneyCardAction | null = activeJourneyCard?.action ?? (hasSubmitted ? "view" : null);
  const heroButtonLabel = heroActionType === "view"
    ? activeJourneyCode
      ? `Ver ${activeJourneyCode}`
      : "Ver"
    : heroActionType === "participate"
      ? activeJourneyCode
        ? `Participar ${activeJourneyCode}`
        : "Participar"
      : journeyClosed
        ? activeJourneyCode
          ? `Expirada ${activeJourneyCode}`
          : "Expirada"
        : activeJourneyCode
          ? `Ver ${activeJourneyCode}`
          : "Ver";
  const heroActionDisabled = !heroActionType;

  const heroCountdownVisible = heroActionType === "participate" && Boolean(journeyCloseLabel);
  const heroClosedMessage = journeyClosed && heroActionType !== "view" ? journeyClosedLabel ?? "La jornada está cerrada." : null;
  const computedSections: TournamentSection[] = useMemo(() => {
    const regularCardsSource = orderedJourneyCards.filter((card) => card.group === "regular");
    const liguillaCardsSource = orderedJourneyCards.filter((card) => card.group === "liguilla");

    const regularCards: JourneyCard[] = regularCardsSource.map((card) => ({
      id: card.id,
      code: card.code,
      statusLabel: card.statusLabel,
      meta: card.meta,
      tone: card.tone,
      journeyNumber: card.number,
      ctaLabel: card.action === "participate" ? "Participar" : undefined,
      ctaMobileLabel: card.action === "participate" ? "Participa" : undefined,
      action: card.action,
      group: card.group,
      stageId: card.stageId,
    }));

    const liguillaLookup = new Map<string, DashboardJourneyCard>(
      liguillaCardsSource
        .filter((card) => card.stageId)
        .map((card) => [card.stageId as string, card])
    );

    const liguillaCards: JourneyCard[] = Object.entries(LIGUILLA_STAGE_METADATA)
      .map(([stageId, stageMeta]) => {
        const existing = liguillaLookup.get(stageId);
        if (existing) {
          return {
            id: existing.id,
            code: existing.code,
            statusLabel: existing.statusLabel,
            meta: existing.meta,
            tone: existing.tone,
            journeyNumber: existing.number,
            ctaLabel: existing.action === "participate" ? "Participar" : undefined,
            ctaMobileLabel: existing.action === "participate" ? "Participa" : undefined,
            action: existing.action,
            group: existing.group,
            stageId,
          } satisfies JourneyCard;
        }

        return {
          id: `liguilla-${stageId.toLowerCase()}`,
          code: stageMeta.code,
          statusLabel: stageMeta.label,
          meta: stageMeta.description,
          tone: "upcoming",
          journeyNumber: stageMeta.order,
          action: null,
          group: "liguilla",
          stageId,
        } satisfies JourneyCard;
      })
      .sort((a, b) => (a.journeyNumber ?? 0) - (b.journeyNumber ?? 0));

    return [
      {
        id: DEFAULT_SECTION_ID,
        appearance: "regular",
        title: "Torneo Regular",
        statusTags: [],
        cards: regularCards,
      },
      {
        id: "liguilla",
        appearance: "elimination",
        title: "Liguilla",
        statusTags: [],
        cards: liguillaCards,
      },
    ];
  }, [orderedJourneyCards]);

  const handleHeroAction = () => {
    if (!heroActionType) {
      return;
    }

    if (heroActionType === "view") {
      const targetCode = activeJourneyCode || orderedJourneyCards[0]?.code;
      if (targetCode) {
        onViewQuiniela?.(targetCode);
      }
      return;
    }

    const targetJourneyNumber = activeJourneyCard?.number ?? orderedJourneyCards[0]?.number ?? null;
    if (targetJourneyNumber === null) {
      return;
    }

    onEnterQuiniela(targetJourneyNumber);
  };

  return (
    <div className="dashboard-page">
      <section className="dashboard-section dashboard-hero">
        <div className="hero-banner">
          <span className="hero-badge">
            <Flag size={16} aria-hidden="true" />
            Quiniela
          </span>
          <h1 className="hero-title">Hola {firstName}, la quiniela te espera</h1>
          <p className="hero-text">
            Sumemos voz a la liga femenil con intuición y juego limpio. Completa tu pronóstico, compártelo con tu equipo
            y celebremos cada gol juntas.
          </p>
          <div className="hero-actions">
            {heroCountdownVisible && journeyCloseLabel ? (
              <div className="hero-action__label" role="status">
                <Clock size={18} aria-hidden="true" />
                <span>{journeyCloseLabel}</span>
              </div>
            ) : null}
            {!heroCountdownVisible && heroClosedMessage ? (
              <div className="hero-action__label hero-action__label--muted" role="status">
                <AlertTriangle size={18} aria-hidden="true" />
                <span>{heroClosedMessage}</span>
              </div>
            ) : null}
            <div className="hero-action__buttons">
              <button
                type="button"
                className="btn btn-primary hero-action__button"
                onClick={handleHeroAction}
                disabled={heroActionDisabled}
                aria-disabled={heroActionDisabled}
              >
                <span className="btn__label btn__label--desktop">{heroButtonLabel}</span>
                <span className="btn__label btn__label--mobile">{heroButtonLabel}</span>
                {!heroActionDisabled ? <ArrowRight size={18} /> : null}
              </button>
            </div>
          </div>
        </div>

        <aside className="hero-card hero-card--ranking" aria-labelledby="hero-card-title">
          <span id="hero-card-title" className="hero-card__chip">
            <Trophy size={16} aria-hidden="true" />
            Pódium
          </span>
          <ul className="ranking-list ranking-list--featured">
            {topRanking.map((entry) => (
              <li key={entry.id} className="ranking-item">
                <span className="ranking-position">{entry.position}</span>
                <span className="ranking-name">{entry.name}</span>
                <span className="ranking-score">{entry.score}</span>
              </li>
            ))}
          </ul>
          <button type="button" className="btn btn-secondary ranking-fullboard-button" onClick={() => onViewPodium?.()}>
            <span>Ver ranking completo</span>
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        </aside>
      </section>

      <section className="dashboard-section tournament-panel">
        <div className="tournament-panel__stack">
          {computedSections.map((section) => {
            const collapsed = Boolean(isSectionCollapsed(section.id));

            return (
              <article
                key={section.id}
                className="tournament-panel__block"
                data-collapsed={collapsed}
                data-scheme={section.appearance}
              >
                <header className="tournament-panel__header">
                  <div className="tournament-panel__title-group">
                    <h2 className="tournament-panel__title">{section.title}</h2>
                    <p className="tournament-panel__subtitle" data-hidden={Boolean(section.subtitle)}>
                      {section.subtitle}
                    </p>
                  </div>

                  <div className="tournament-panel__header-actions">
                    <div className="tournament-panel__tags">
                      {section.statusTags.map((tag) => (
                        <span key={tag.id} className="tournament-tag" data-tone={tag.tone}>
                          {tag.label}
                        </span>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="tournament-panel__action"
                      onClick={() => toggleSection(section.id)}
                      aria-label={collapsed ? "Expandir sección" : "Contraer sección"}
                    >
                      {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                    </button>
                  </div>
                </header>

              <div className="tournament-panel__grid" data-hidden={collapsed} data-section={section.id}>
                {section.cards.map((card) => {
                  return (
                    <article
                      key={card.id}
                      className={`journey-card journey-card--${card.tone}`}
                      data-tone={card.tone}
                    >
                      <header className="journey-card__header">
                        <div className="journey-card__main">
                          <span className="journey-card__code">{card.code}</span>
                          <span className="journey-card__status-tag" data-tone={card.tone}>
                            <span className="journey-card__status-icon" aria-hidden="true">
                              {journeyStatusIcons[card.tone]?.()}
                            </span>
                            <span>{card.statusLabel}</span>
                          </span>
                        </div>
                        <div className="journey-card__actions" data-empty={
                          !(card.ctaLabel || card.tone === "success")
                        }>
                          {card.ctaLabel ? (
                            <button
                              type="button"
                              className="journey-card__cta"
                              data-tone={card.tone}
                              onClick={() => {
                                if (card.journeyNumber !== undefined) {
                                  onEnterQuiniela(card.journeyNumber);
                                }
                              }}
                              style={{ borderRadius: "18px" }}
                            >
                              <span className="journey-card__cta-label journey-card__cta-label--desktop">
                                {card.ctaLabel}
                              </span>
                              <span className="journey-card__cta-label journey-card__cta-label--mobile">
                                {card.ctaMobileLabel ?? card.ctaLabel}
                              </span>
                            </button>
                          ) : null}
                          {card.action === "view" ? (
                            <button
                              type="button"
                              className="journey-card__link journey-card__link--inline"
                              onClick={() => onViewQuiniela?.(card.code)}
                              style={{ borderRadius: "18px" }}
                            >
                              Ver
                            </button>
                          ) : null}
                        </div>
                      </header>
                    </article>
                  );
                })}
              </div>
            </article>
          );
          })}

        </div>
      </section>
    </div>
  );
}
