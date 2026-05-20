<script setup lang="ts">
import { ref } from "vue";

const emit = defineEmits<{ add: [fullName: string] }>();
const input = ref("");
const error = ref("");

function submit() {
  const val = input.value.trim();
  if (!val) return;

  const match = val.match(/^(?:https?:\/\/github\.com\/)?([^/]+)\/([^/]+?)(?:\.git)?$/);
  if (!match) {
    error.value = 'Invalid format. Use "owner/repo" or a GitHub URL.';
    return;
  }

  error.value = "";
  emit("add", `${match[1]}/${match[2]}`);
  input.value = "";
}
</script>

<template>
  <div class="repo-input">
    <div class="input-row">
      <input
        v-model="input"
        class="repo-field"
        placeholder="owner/repo  or  https://github.com/owner/repo"
        @keydown.enter="submit"
      />
      <button class="add-btn" @click="submit">Add</button>
    </div>
    <p v-if="error" class="input-error">{{ error }}</p>
  </div>
</template>

<style scoped>
.repo-input {
  margin-bottom: 12px;
}
.input-row {
  display: flex;
  gap: 8px;
}
.repo-field {
  flex: 1;
  max-width: 480px;
  padding: 8px 12px;
  font-family: monospace;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 4px;
  outline: none;
}
.repo-field:focus {
  border-color: #2563eb;
}
.add-btn {
  padding: 8px 20px;
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}
.add-btn:hover {
  background: #1d4ed8;
}
.input-error {
  margin-top: 4px;
  font-size: 12px;
  color: #dc2626;
}
</style>
