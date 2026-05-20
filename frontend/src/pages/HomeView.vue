<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'

const router = useRouter()

const goToRegister = () => router.push('/register')
const goToLogin = () => router.push('/login')
const goToParentDemo = () => router.push('/pre-consultation')
</script>

<template>
  <div class="bg-[var(--color-bg)] text-[var(--color-ink)]">
    <!-- ─── HERO ─────────────────────────────────────────────────────── -->
    <section class="mx-auto grid w-full max-w-[1180px] gap-12 px-5 py-16 md:grid-cols-[1.05fr_0.95fr] md:items-center md:gap-16 md:px-10 md:py-24">
      <div>
        <p class="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-1.5 text-[12px] font-medium uppercase tracking-[0.08em] text-[var(--color-ink-2)]">
          <span aria-hidden="true" class="size-1.5 rounded-full bg-primary"></span>
          Pour les cabinets pédiatriques
        </p>
        <h1 class="mt-5 font-display text-[40px] font-medium leading-[1.05] tracking-[-0.028em] text-[var(--color-ink)] md:text-[54px] md:leading-[1.02] md:tracking-[-0.032em]">
          Vos parents arrivent
          <em class="not-italic text-primary">déjà préparés</em>
          à la consultation.
        </h1>
        <p class="mt-5 max-w-[520px] text-[16.5px] leading-relaxed text-[var(--color-ink-2)] md:text-[18px]">
          Pediguide envoie un court questionnaire pré-consultation par SMS aux parents.
          Vous recevez une synthèse structurée — motifs, antécédents, signaux d'alerte —
          avant qu'ils ne passent la porte.
        </p>

        <div class="mt-8 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
          <Button size="md" @click="goToRegister">
            Créer un compte cabinet
            <svg viewBox="0 0 16 16" class="size-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 8h10" /><path d="M9 4l4 4-4 4" />
            </svg>
          </Button>
          <Button variant="secondary" size="md" @click="goToParentDemo">
            Voir l'expérience parent
          </Button>
        </div>

        <ul class="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-[var(--color-muted-strong)]">
          <li class="inline-flex items-center gap-1.5">
            <svg viewBox="0 0 16 16" class="size-3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3.5" y="7" width="9" height="6" rx="1.2" />
              <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
            </svg>
            Hébergement HDS
          </li>
          <li class="inline-flex items-center gap-1.5">
            <svg viewBox="0 0 16 16" class="size-3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <path d="M8 1l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" />
              <path d="M5 11v3M8 11v3M11 11v3" />
            </svg>
            RPPS vérifié
          </li>
          <li class="inline-flex items-center gap-1.5">
            <svg viewBox="0 0 16 16" class="size-3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="8" cy="8" r="6" />
              <path d="M5 8.5l2 2 4-4.5" />
            </svg>
            RGPD · données en France
          </li>
        </ul>
      </div>

      <!-- Visual: 3 floating preview cards on a soft tinted board -->
      <div aria-hidden="true" class="relative aspect-[1.05/1] overflow-hidden rounded-[22px] border border-[var(--color-line)] bg-[var(--color-surface)] shadow-[0_30px_80px_-40px_color-mix(in_oklab,var(--color-primary-base)_60%,transparent)]">
        <span class="pointer-events-none absolute inset-0" style="background: radial-gradient(ellipse 70% 60% at 30% 0%, color-mix(in oklab, var(--color-primary-base) 18%, transparent), transparent 65%), radial-gradient(ellipse 50% 50% at 90% 100%, color-mix(in oklab, var(--color-primary-base) 10%, transparent), transparent 60%);"></span>

        <!-- k1 — top -->
        <div class="absolute left-5 right-5 top-5 flex items-center gap-3 rounded-[var(--r-md)] border border-[var(--color-line)] bg-[var(--color-surface)] px-3.5 py-2.5 text-[12.5px] shadow-[0_8px_24px_-12px_color-mix(in_oklab,var(--color-ink)_40%,transparent)] md:left-9 md:right-9 md:top-9">
          <span class="inline-block size-2 animate-pulse rounded-full bg-primary"></span>
          <div>
            <p class="font-medium text-[var(--color-ink)]">5 questionnaires reçus</p>
            <p class="text-[11.5px] text-[var(--color-muted-strong)]">aujourd'hui, dont 1 prioritaire</p>
          </div>
        </div>

        <!-- k2 — center -->
        <div class="absolute left-1/2 top-1/2 w-[80%] max-w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-[var(--r-md)] border border-[var(--color-line)] bg-[var(--color-surface)] p-5 text-[13px] shadow-[0_16px_40px_-16px_color-mix(in_oklab,var(--color-ink)_40%,transparent)]">
          <p class="font-display text-[16px] font-medium text-[var(--color-ink)]">Léa, 18 mois</p>
          <ul class="mt-3 space-y-1.5">
            <li class="flex items-start gap-2 text-[var(--color-ink)]">
              <span aria-hidden="true" class="mt-0.5 inline-flex size-3.5 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-primary">
                <svg viewBox="0 0 16 16" class="size-2.5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 8.5l3.5 3.5L13 5" />
                </svg>
              </span>
              Fièvre 39,2 °C depuis 24 h
            </li>
            <li class="flex items-start gap-2 text-[var(--color-ink)]">
              <span aria-hidden="true" class="mt-0.5 inline-flex size-3.5 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-primary">
                <svg viewBox="0 0 16 16" class="size-2.5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 8.5l3.5 3.5L13 5" />
                </svg>
              </span>
              Refus alimentaire
            </li>
            <li class="flex items-start gap-2 text-[var(--color-ink-2)]">
              <span aria-hidden="true" class="mt-0.5 size-3.5 rounded-full border border-[var(--color-line-2)]"></span>
              Pas de signe de gravité respiratoire
            </li>
          </ul>
          <p class="mt-3 text-[11px] text-[var(--color-muted-strong)]">Transmis il y a 14 min · vu</p>
        </div>

        <!-- k3 — bottom -->
        <div class="absolute bottom-5 left-5 right-5 flex items-center gap-3 rounded-[var(--r-md)] border border-[var(--color-line)] bg-[var(--color-surface)] px-3.5 py-2.5 text-[12.5px] shadow-[0_8px_24px_-12px_color-mix(in_oklab,var(--color-ink)_40%,transparent)] md:bottom-9 md:left-9 md:right-9">
          <span class="font-display text-[22px] font-medium text-primary tabular-nums">3<span class="ml-0.5 text-[11px] font-normal text-[var(--color-muted-strong)]"> min</span></span>
          <div>
            <p class="font-medium text-[var(--color-ink)]">Temps moyen côté parent</p>
            <p class="text-[11.5px] text-[var(--color-muted-strong)]">Sur 1 200 questionnaires</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── FEATURES ─────────────────────────────────────────────────── -->
    <section id="features" class="border-t border-[var(--color-line)]">
      <div class="mx-auto w-full max-w-[1180px] px-5 py-16 md:px-10 md:py-20">
        <header class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p class="text-[12px] font-medium uppercase tracking-[0.1em] text-[var(--color-muted-strong)]">
              Ce que vous y trouvez
            </p>
            <h2 class="mt-2 font-display text-[28px] font-medium tracking-[-0.018em] text-[var(--color-ink)] md:text-[34px]">
              Une vue clinique du dossier, avant la consultation.
            </h2>
          </div>
          <p class="max-w-[360px] text-[14.5px] text-[var(--color-ink-2)] md:text-right">
            Conçu avec des pédiatres libéraux pour des questions qui changent quelque chose à la consultation.
          </p>
        </header>

        <div class="mt-10 grid gap-4 md:grid-cols-3">
          <article class="flex min-h-[220px] flex-col gap-3 rounded-[var(--r-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-6">
            <span class="text-[13px] font-medium text-primary">01</span>
            <h3 class="font-display text-[20px] font-medium tracking-[-0.014em] text-[var(--color-ink)]">
              Questionnaire pré-consultation
            </h3>
            <p class="text-[14.5px] leading-relaxed text-[var(--color-ink-2)]">
              5 étapes, 3 minutes côté parent. Adapté à l'âge de l'enfant.
              Tout est optionnel sauf l'essentiel.
            </p>
            <div class="mt-auto flex flex-wrap gap-1.5">
              <span class="rounded-full border border-[var(--color-line)] bg-[var(--color-surface-2)] px-2 py-0.5 text-[11px] text-[var(--color-ink-2)]">Symptômes</span>
              <span class="rounded-full border border-[var(--color-line)] bg-[var(--color-surface-2)] px-2 py-0.5 text-[11px] text-[var(--color-ink-2)]">Chronologie</span>
              <span class="rounded-full border border-[var(--color-line)] bg-[var(--color-surface-2)] px-2 py-0.5 text-[11px] text-[var(--color-ink-2)]">Antécédents</span>
              <span class="rounded-full border border-[var(--color-line)] bg-[var(--color-surface-2)] px-2 py-0.5 text-[11px] text-[var(--color-ink-2)]">Photo</span>
            </div>
          </article>

          <article class="flex min-h-[220px] flex-col gap-3 rounded-[var(--r-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-6">
            <span class="text-[13px] font-medium text-primary">02</span>
            <h3 class="font-display text-[20px] font-medium tracking-[-0.014em] text-[var(--color-ink)]">
              Synthèse clinique automatique
            </h3>
            <p class="text-[14.5px] leading-relaxed text-[var(--color-ink-2)]">
              Pediguide extrait les motifs principaux, calcule des signaux d'alerte par âge,
              et résume le tout en moins d'une page.
            </p>
            <div class="mt-auto flex flex-wrap gap-1.5">
              <span class="rounded-full border border-[var(--color-line)] bg-[var(--color-surface-2)] px-2 py-0.5 text-[11px] text-[var(--color-ink-2)]">Motif principal</span>
              <span class="rounded-full border border-[var(--color-line)] bg-[var(--color-surface-2)] px-2 py-0.5 text-[11px] text-[var(--color-ink-2)]">Points d'attention</span>
              <span class="rounded-full border border-[var(--color-line)] bg-[var(--color-surface-2)] px-2 py-0.5 text-[11px] text-[var(--color-ink-2)]">Priorité</span>
            </div>
          </article>

          <article class="flex min-h-[220px] flex-col gap-3 rounded-[var(--r-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-6">
            <span class="text-[13px] font-medium text-primary">03</span>
            <h3 class="font-display text-[20px] font-medium tracking-[-0.014em] text-[var(--color-ink)]">
              Modèles personnalisables
            </h3>
            <p class="text-[14.5px] leading-relaxed text-[var(--color-ink-2)]">
              Le questionnaire par défaut couvre la plupart des cas.
              Vous pouvez créer vos propres modèles pour des suivis spécifiques.
            </p>
            <div class="mt-auto flex flex-wrap gap-1.5">
              <span class="rounded-full border border-[var(--color-line)] bg-[var(--color-surface-2)] px-2 py-0.5 text-[11px] text-[var(--color-ink-2)]">Builder</span>
              <span class="rounded-full border border-[var(--color-line)] bg-[var(--color-surface-2)] px-2 py-0.5 text-[11px] text-[var(--color-ink-2)]">5 types de questions</span>
              <span class="rounded-full border border-[var(--color-line)] bg-[var(--color-surface-2)] px-2 py-0.5 text-[11px] text-[var(--color-ink-2)]">Modèle par défaut</span>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- ─── HOW IT WORKS ──────────────────────────────────────────────── -->
    <section id="how" class="border-t border-[var(--color-line)]">
      <div class="mx-auto w-full max-w-[1180px] px-5 py-16 md:px-10 md:py-20">
        <header>
          <p class="text-[12px] font-medium uppercase tracking-[0.1em] text-[var(--color-muted-strong)]">
            Comment ça marche
          </p>
          <h2 class="mt-2 font-display text-[28px] font-medium tracking-[-0.018em] text-[var(--color-ink)] md:text-[34px]">
            Trois étapes — pas de compte côté parent.
          </h2>
        </header>

        <div class="mt-10 grid divide-y divide-[var(--color-line)] rounded-[var(--r-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] md:grid-cols-3 md:divide-x md:divide-y-0">
          <div class="flex flex-col gap-2 p-7">
            <p class="text-[28px] font-medium text-primary">01</p>
            <h3 class="font-display text-[18px] font-medium tracking-[-0.012em] text-[var(--color-ink)]">
              Vous envoyez le lien
            </h3>
            <p class="text-[14px] leading-relaxed text-[var(--color-ink-2)]">
              Depuis votre tableau de bord, un clic envoie un SMS ou email au parent avec un lien unique.
            </p>
          </div>
          <div class="flex flex-col gap-2 p-7">
            <p class="text-[28px] font-medium text-primary">02</p>
            <h3 class="font-display text-[18px] font-medium tracking-[-0.012em] text-[var(--color-ink)]">
              Le parent répond
            </h3>
            <p class="text-[14px] leading-relaxed text-[var(--color-ink-2)]">
              Sur son téléphone, 3 minutes, sans téléchargement ni création de compte. Reprise possible.
            </p>
          </div>
          <div class="flex flex-col gap-2 p-7">
            <p class="text-[28px] font-medium text-primary">03</p>
            <h3 class="font-display text-[18px] font-medium tracking-[-0.012em] text-[var(--color-ink)]">
              Vous lisez avant le RDV
            </h3>
            <p class="text-[14px] leading-relaxed text-[var(--color-ink-2)]">
              Une synthèse clinique vous attend dans votre boîte. Vous gagnez 4 à 6 minutes par consultation.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── CTA ─────────────────────────────────────────────────────── -->
    <section id="trust" class="border-t border-[var(--color-line)]">
      <div class="mx-auto w-full max-w-[1180px] px-5 py-16 md:px-10 md:py-20">
        <div class="grid gap-8 rounded-[var(--r-xl)] bg-[var(--color-ink)] p-8 text-white md:grid-cols-2 md:items-center md:gap-10 md:p-12">
          <div>
            <h2 class="font-display text-[26px] font-medium leading-tight tracking-[-0.018em] md:text-[32px]">
              Une consultation mieux préparée — sans rien changer à votre logiciel métier.
            </h2>
            <p class="mt-3 max-w-[420px] text-[15px] text-white/70">
              Compte vérifié sous 48 h via votre numéro RPPS. Période d'essai sans engagement,
              données hébergées chez un HDS français.
            </p>
          </div>
          <div class="flex flex-col gap-2.5 md:items-end">
            <Button size="md" variant="secondary" class="md:self-end" @click="goToRegister">
              Créer un compte cabinet
              <svg viewBox="0 0 16 16" class="size-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 8h10" /><path d="M9 4l4 4-4 4" />
              </svg>
            </Button>
            <button
              type="button"
              class="rounded-[var(--r-sm)] border border-white/20 bg-transparent px-4 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-white/30 md:self-end"
              @click="goToLogin"
            >
              J'ai déjà un compte
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
