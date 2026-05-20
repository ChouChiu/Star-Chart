<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{ modelValue: string }>();
const emit = defineEmits<{ "update:modelValue": [value: string] }>();

const expanded = ref<string | number | undefined>(undefined);
</script>

<template>
  <var-collapse v-model="expanded" :divider="false" :elevation="0">
    <var-collapse-item
      name="token"
      title="GitHub Token (optional — increases rate limit)"
    >
      <var-space direction="column" size="8">
        <var-input
          type="password"
          placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
          size="small"
          variant="outlined"
          :model-value="props.modelValue"
          class="token-field"
          @update:model-value="emit('update:modelValue', $event as string)"
        />
        <p class="token-hint">
          Paste a GitHub
          <var-link
            type="primary"
            href="https://github.com/settings/tokens"
            target="_blank"
            rel="noopener"
            underline="always"
          >
            Personal Access Token
          </var-link>
          to raise the API limit from 60 to 5,000 req/hr.
        </p>
      </var-space>
    </var-collapse-item>
  </var-collapse>
</template>

<style scoped>
:deep(.var-collapse-item) {
  border-radius: 12px;
}
:deep(.var-collapse-item__content) {
  overflow: visible;
}
:deep(.var-collapse-item__content-wrap) {
  padding-top: 8px;
}
.token-field {
  max-width: 360px;
}
.token-hint {
  font-size: var(--font-size-xs);
  color: var(--color-on-surface-variant);
  margin: 0;
}
</style>
