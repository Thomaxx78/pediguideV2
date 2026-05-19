<script setup lang="ts">
interface Props {
  icon: string
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

const icons = import.meta.glob<{ default: string }>('../../assets/icons/*.svg', {
  query: '?raw',
  eager: true,
})

const importedIcon = () => {
  const iconPath = `../../assets/icons/${props.icon}.svg`
  const svgContent = icons[iconPath]?.default
  if (!svgContent) {
    console.warn('No icons found for: ', iconPath)
    return ''
  }
  return svgContent.replace('<svg', '<svg style="width: 100%; height: 100%"')
}
</script>

<template>
  <span
    :class="[props.widthClass, props.heightClass, props.colorClass]"
    class="inline-block"
    :role="props.label ? 'img' : undefined"
    :aria-label="props.label"
    :aria-hidden="props.label ? undefined : 'true'"
    v-html="importedIcon()"
  />
</template>
