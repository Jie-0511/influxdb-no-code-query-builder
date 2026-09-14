<script setup>
import { ref } from 'vue'
import { ElDialog, ElInput, ElMessage } from 'element-plus'
import { useQueryBuilderStore } from '../stores/queryBuilder'

const qb = useQueryBuilderStore()

// 编辑器弹窗控制 & 草稿 Editor popup control & draft
const showEditor = ref(false)
const draft = ref('')

// 打开编辑器：若还没生成过，则先基于第一个查询生成一次
// Open the editor: If it has not been generated yet, generate it based on the first query first
function openEditor() {
  if (!qb.generatedQuery && qb.queries?.length) {
    try { qb.exportQuery(qb.queries[0]) } catch (e) { /* ignore */ }
  }
  draft.value = qb.generatedQuery || ''
  showEditor.value = true
}

// 保存：写回 Pinia，顺带提示 Write back to Pinia, with a reminder
function saveEditor() {
  qb.setGeneratedQuery(draft.value.trim())
  showEditor.value = false
  ElMessage.success('Flux has been updated')
}

// 复制辅助（可选）Replication Assistant (optional)
async function copyFlux() {
  try {
    await navigator.clipboard.writeText(qb.generatedQuery || '')
    ElMessage.success('Copied to clipboard')
  } catch { ElMessage.error('Copy failed') }
}
</script>

<template>
  <section class="generated">
    <div class="header">
      <h2>Generated Query</h2>
      <div class="tools">
        <button class="link" @click="copyFlux">Copy</button>
        <span class="sep">·</span>
        <button class="link" @click="openEditor">Open in Editor →</button>
      </div>
    </div>

    <pre class="flux-box">{{ qb.generatedQuery || '(If not generated, please select bucket/measurement/field on the left first)' }}</pre>

    <!-- Popup Editor -->
    <el-dialog v-model="showEditor" title="Edit Flux" width="800px">
      <el-input
        v-model="draft"
        type="textarea"
        :autosize="{ minRows: 14, maxRows: 28 }"
        placeholder="Write Flux here..."
        spellcheck="false"
        style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;"
        @keydown.ctrl.enter.prevent="saveEditor"
        @keydown.meta.enter.prevent="saveEditor"
      />
      <template #footer>
        <div class="dlg-actions">
          <button class="btn ghost" @click="showEditor=false">Cancel</button>
          <button class="btn primary" @click="saveEditor">Save (⌘/Ctrl+Enter)</button>
        </div>
      </template>
    </el-dialog>
  </section>
</template>

<style scoped>
.generated { display: flex; flex-direction: column; gap: 12px; }
.header { display: flex; align-items: center; justify-content: space-between; padding: 4px 2px; }
.header h2 { margin: 0; font-size: 18px; letter-spacing: .02em; font-weight: 800; }
.tools { display: flex; align-items: center; gap: 8px; color: var(--brand-600); }
.tools .link { background: transparent; border: 0; color: inherit; cursor: pointer; padding: 0; }
.tools .sep { color: #9ca3af; }
.flux-box {
  background: var(--panel-dark-bg);
  color: var(--panel-dark-text);
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid var(--panel-dark-border);
  white-space: pre-wrap;
  word-break: break-word;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
  font-size: 13px;
  min-height: 120px;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.05);
}
.dlg-actions { display: flex; justify-content: flex-end; gap: 8px; }
.btn { padding: 8px 14px; border-radius: 10px; cursor: pointer; border: 1px solid #e5e7eb; background: #fff; transition: all .18s ease; }
.btn:hover { transform: translateY(-1px); box-shadow: 0 4px 10px rgba(0,0,0,.06); }
.btn.ghost { background: #f9fafb; }
.btn.primary { background: #2563eb; color: #fff; border-color: #2563eb; }

/* el-dialog fine-tune */
:deep(.el-dialog) { border-radius: 14px; overflow: hidden; }
:deep(.el-dialog__header) { border-bottom: 1px solid #e5e7eb; }
:deep(.el-textarea__inner) { border-radius: 10px; }
</style>
