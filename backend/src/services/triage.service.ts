export type TriageLevel = 'rouge' | 'orange' | 'jaune' | 'vert';

export interface TriageResult {
  level: TriageLevel;
  score: number;
  flags: string[];
}

// Signes déclenchant une alerte rouge (score +50)
const RED_FLAGS = ['Difficultés respiratoires'];

// Signes déclenchant une alerte orange (score +25)
const ORANGE_FLAGS = ['Fièvre', 'Éruption cutanée', 'Vomissements'];

// Signes contribuant au score jaune (score +10)
const YELLOW_FLAGS = ['Toux', 'Diarrhée', 'Douleur abdominale', 'Maux de tête'];

// Comportements préoccupants (score +10)
const CONCERNING_BEHAVIORS = ['Somnolence excessive', 'Pleurs inhabituels'];

function getAgeInMonths(birthDate: string): number {
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return 99;
  const now = new Date();
  return (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
}

export function computeTriageScore(params: {
  clinicalSigns: string[];
  behaviorChanges: string[];
  worryLevel: string;
  duration: string;
  childBirthDate: string;
}): TriageResult {
  let score = 0;
  const flags: string[] = [];

  const { clinicalSigns, behaviorChanges, worryLevel, duration, childBirthDate } = params;
  const signs = clinicalSigns ?? [];
  const behaviors = behaviorChanges ?? [];

  // Âge de l'enfant
  const ageMonths = getAgeInMonths(childBirthDate);
  if (ageMonths < 3) {
    score += 40;
    flags.push('Nourrisson < 3 mois');
  } else if (ageMonths < 12) {
    score += 20;
    flags.push('Nourrisson < 12 mois');
  }

  // Signes cliniques
  for (const sign of signs) {
    if (RED_FLAGS.includes(sign)) {
      score += 50;
      flags.push(sign);
    } else if (ORANGE_FLAGS.includes(sign)) {
      score += 25;
      flags.push(sign);
    } else if (YELLOW_FLAGS.includes(sign)) {
      score += 10;
    }
  }

  // Comportements
  for (const behavior of behaviors) {
    if (CONCERNING_BEHAVIORS.includes(behavior)) {
      score += 10;
      flags.push(behavior);
    }
  }

  // Niveau d'inquiétude du parent
  if (worryLevel.includes('Très')) {
    score += 15;
  } else if (worryLevel.includes('Modéré') || worryLevel.includes('Modéré')) {
    score += 5;
  }

  // Durée
  if (duration.includes('24h')) score += 10;
  else if (duration.includes('semaine')) score -= 5;

  const level: TriageLevel =
    score >= 60 ? 'rouge' :
    score >= 35 ? 'orange' :
    score >= 15 ? 'jaune' : 'vert';

  return { level, score, flags };
}
