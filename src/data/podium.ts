export type PodiumEntry = {
  id: number;
  name: string;
  team: string;
  points: number;
  city: string;
};

const BASE_ENTRIES: PodiumEntry[] = [
  { id: 1, name: "Ana Martínez", team: "Locals FC", points: 112, city: "CDMX" },
  { id: 2, name: "Luisa Hernández", team: "Locals FC", points: 108, city: "Guadalajara" },
  { id: 3, name: "Carolina Patiño", team: "Locals FC", points: 104, city: "Monterrey" },
  { id: 4, name: "Jimena Torres", team: "Locals FC", points: 99, city: "CDMX" },
  { id: 5, name: "María Fernanda Ruiz", team: "Locals FC", points: 96, city: "Puebla" },
  { id: 6, name: "Diana Bautista", team: "Locals FC", points: 94, city: "Toluca" },
  { id: 7, name: "Paola Guillén", team: "Locals FC", points: 90, city: "Tijuana" },
  { id: 8, name: "Renata Salcedo", team: "Locals FC", points: 88, city: "Querétaro" },
  { id: 9, name: "Alexa Campos", team: "Locals FC", points: 85, city: "León" },
  { id: 10, name: "Sofía Aguirre", team: "Locals FC", points: 82, city: "CDMX" },
];

const EXTRA_NAMES = [
  "Mariana López",
  "Camila Herrera",
  "Fernanda Salinas",
  "Valeria Prieto",
  "Ximena Aguilar",
  "Alejandra Mendoza",
  "Andrea Cabrera",
  "Daniela Zúñiga",
  "Regina Treviño",
  "Montserrat Castañeda",
  "Pamela Robles",
  "Adriana Godoy",
  "Claudia Rivera",
  "Ilse Morales",
  "Ivonne Nájera",
  "Brisa Vega",
  "Karen Limón",
  "Lina Saucedo",
  "Majo Fierro",
  "Pilar Vázquez",
];

export const PODIUM_ENTRIES: PodiumEntry[] = (() => {
  const entries: PodiumEntry[] = [...BASE_ENTRIES];
  let id = BASE_ENTRIES.length + 1;
  let points = 81;

  for (let cycle = 0; cycle < 10; cycle += 1) {
    for (const name of EXTRA_NAMES) {
      entries.push({
        id,
        name,
        team: cycle % 2 === 0 ? "Locals FC" : "Amarillas MX",
        points,
        city: ["CDMX", "Guadalajara", "Monterrey", "León", "Tijuana"][cycle % 5],
      });
      id += 1;
      points = Math.max(10, points - 1);
    }
  }

  return entries;
})();

export const TOP_RANKING = PODIUM_ENTRIES.slice(0, 5);
