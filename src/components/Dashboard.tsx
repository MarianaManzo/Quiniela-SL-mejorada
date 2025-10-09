import { ArrowRight } from "lucide-react";
import { ROLE_LABELS, type UserProfile } from "./LoginScreen";
import logoSomosLocales from "figma:asset/930d5de55d9fd27c0951aa3f3d28301d6e434476.png";
import "../styles/dashboard.css";

interface DashboardProps {
  user: UserProfile;
  onEnterQuiniela: () => void;
}

const manifesto = [
  { id: "01", text: "Completa tu quiniela antes del cierre oficial de la jornada." },
  { id: "02", text: "Comparte la dinámica con tu familia y vive la pasión desde casa." },
  { id: "03", text: "Registra tus jugadas favoritas para potenciar tu instinto local." },
];

const principles = [
  {
    id: "01",
    title: "Apoyar y alentar",
    description: "Impulsamos el fútbol femenil apoyando a nuestro equipo en cada jornada.",
  },
  {
    id: "02",
    title: "Respetar a la afición",
    description: "Honramos a quien vive la pasión como nosotros, dentro y fuera del estadio.",
  },
  {
    id: "03",
    title: "Celebrar el juego limpio",
    description: "Nuestros pronósticos y comentarios elevan la conversación futbolera.",
  },
  {
    id: "04",
    title: "Cuidar instalaciones",
    description: "El espacio que habitamos se mantiene impecable para la siguiente fecha.",
  },
  {
    id: "05",
    title: "Compartir la emoción",
    description: "Invitamos a alguien nuevo a sentir la energía del balompié femenil.",
  },
  {
    id: "06",
    title: "Vibrar los 90 minutos",
    description: "Cada quiniela es una excusa para seguir la liga completa, minuto a minuto.",
  },
];

const communityNotes = [
  "Toda la pasión de la grada se siente en cada pronóstico.",
  "Prepara tus datos, suma intuición y juega con corazón local.",
  "Tu voz inspira a más fans a vivir el fútbol femenil.",
];

const tips = [
  "Revisa la energía con la que llegan tus equipos a la jornada.",
  "Activa recordatorios 30 minutos antes de que cierre la quiniela.",
  "Comparte tus picks en el grupo de la comunidad Somos Locales.",
];

const upcomingJourneys = [
  { id: "j15", title: "Jornada 15", meta: "Cierra 12 de octubre · 18:00 h", status: "Abierta" },
  { id: "j16", title: "Jornada 16", meta: "Arranca 20 de octubre", status: "Próximamente" },
  { id: "liguilla", title: "Liguilla", meta: "Calendario por confirmar", status: "Planeación" },
];

const ranking = [
  { id: 1, name: "Ana Martínez", score: "112 pts" },
  { id: 2, name: "Luis Hernández", score: "108 pts" },
  { id: 3, name: "Carolina Patiño", score: "104 pts" },
];

export function Dashboard({ user, onEnterQuiniela }: DashboardProps) {
  return (
    <div className="dashboard-page">
      <section className="dashboard-section">
        <div className="dashboard-hero">
          <div>
            <h1 className="hero-title">Pasión por el juego</h1>
            <p className="hero-text">
              Hola {user.name.split(" ")[0]}, nuestra misión va más allá de ser espectadores. Impulsamos la asistencia y el
              apoyo al fútbol femenil en México creando una comunidad apasionada y comprometida con cada jornada.
            </p>
            <div className="hero-actions" />
          </div>

          <aside className="hero-card">
            <span className="hero-card__eyebrow">Jornada activa</span>
            <h2 className="hero-card__title">Jornada 15 en juego</h2>
            <ul className="hero-card__list">
              {manifesto.map((item) => (
                <li key={item.id} className="hero-card__item">
                  <span className="hero-card__number">{item.id}</span>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
            <p className="hero-card__note">Registro activo como {ROLE_LABELS[user.role]}.</p>
            <button type="button" className="btn btn-primary" onClick={onEnterQuiniela}>
              Entrar a la quiniela
              <ArrowRight size={18} />
            </button>
          </aside>
        </div>
      </section>

      <section className="dashboard-section">
        <div>
          <h2 className="section-title">Decálogo de la mejor afición</h2>
          <p className="section-subtitle">
            Creamos experiencias que contagian entusiasmo, respeto y apoyo incondicional a la liga femenil.
          </p>
        </div>
        <div className="decalog-grid">
          {principles.map((principle) => (
            <article key={principle.id} className="decalog-item">
              <span className="decalog-number">{principle.id}</span>
              <h3 className="decalog-title">{principle.title}</h3>
              <p className="decalog-text">{principle.description}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="dashboard-spacer" />
    </div>
  );
}
