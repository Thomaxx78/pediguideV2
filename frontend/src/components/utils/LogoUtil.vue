<script setup lang="ts">
interface Props {
  logo: string
  widthClass?: string
  heightClass?: string
  colorClass?: string
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  widthClass: 'w-14',
  heightClass: 'h-14',
  colorClass: 'text-foreground',
})

const icons = import.meta.glob<{ default: string }>('../../assets/*.svg', {
  query: '?raw',
  eager: true,
})

const importedLogo = () => {
  const logoPath = `../../assets/${props.logo}.svg`
  const logoContent = icons[logoPath]?.default
  if (!logoContent) {
    console.warn('No logo found for: ', logoPath)
    return ''
  }
  return logoContent.replace('<svg', '<svg style="width: 100%; height: 100%"')
}
</script>

<template>
  <span
    :class="[props.widthClass, props.heightClass, props.colorClass]"
    class="inline-block"
    :role="props.label ? 'img' : undefined"
    :aria-label="props.label"
    :aria-hidden="props.label ? undefined : 'true'"
    v-html="importedLogo()"
  />
</template>
