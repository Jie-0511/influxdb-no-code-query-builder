<!-- INFLUX-UI-PG-1/frontend/influx-web-app/src/components/QueryBuilder.vue -->
<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useQueryBuilderStore } from '../stores/queryBuilder'
import QueryColumn from './QueryColumn.vue'
import { Close } from '@element-plus/icons-vue'
import { queryInflux } from '@/services/query'
import AggregationSelector from './AggregationSelector.vue'



const store = useQueryBuilderStore()
const activeId = ref(null)
const queries = computed(() => store.queries)
const active = computed(() => queries.value.find(q => q.id === activeId.value))

// ---------- Time Range ----------
const timeOptions = [
  { label: 'Custom Time Range', value: 'custom' },
  { label: 'divider', value: 'divider' },
  { label: 'Past 1m',  value: 'past_1m'  },
  { label: 'Past 5m',  value: 'past_5m'  },
  { label: 'Past 15m', value: 'past_15m' },
  { label: 'Past 1h',  value: 'past_1h'  },
  { label: 'Past 3h',  value: 'past_3h'  },
  { label: 'Past 6h',  value: 'past_6h'  },
  { label: 'Past 12h', value: 'past_12h' },
  { label: 'Past 24h', value: 'past_24h' }, // 默认default
  { label: 'Past 2d',  value: 'past_2d'  },
  { label: 'Past 7d',  value: 'past_7d'  },
  { label: 'Past 30d', value: 'past_30d' }
]


const aggMode = ref('CUSTOM')
const selectedAggs = ref(['mean'])

// UI runner state: only CSV text kept (raw view & submit removed)
const qr = reactive({ csv: null })


function formatRangeForBackend(value, fallback = null) {
  if (!value) return fallback
  if (typeof value === 'string') {
    // 预设字符串（如 -24h / now() / time(v: "...")）直接返回
    return value
  }
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return fallback
  return `time(v: "${date.toISOString()}")`
}

function formatRangeForDisplay(value) {
  if (!value) return ''
  if (typeof value === 'string') {
    const match = value.match(/time\(v: "(.+)"\)/)
    return match ? match[1] : value
  }
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString()
}



// 自定义时间的本地值Custom local time value（Element Plus datetimerange 需要数组）
const customRange = ref([null, null])

// 当前选择的预设值（没有则默认 24h）The currently selected preset value (default is 24h if none)
const selectedPreset = computed(() => {
  const tr = active.value?.timeRange
  if (!tr) return 'past_24h'
  return tr.mode === 'custom' ? 'custom' : (tr.preset || 'past_24h')
})

function onPresetChange(v) {
  const q = active.value
  if (!q) return
  if (v === 'custom') {
    // 切到自定义，等待用户选择时间 Waiting time for user selection
    q.timeRange = { mode: 'custom', preset: null, start: null, stop: null }
  } else {
    store.setTimePreset(q.id, v) // 写入 1m/5m/24h 等预设 Write presets such as 1m/5m/24h
  }
}

function onCustomChange(v) {
  const q = active.value
  if (!q) return
  const [start, stop] = v || []
  if (start && stop) store.setTimeCustom(q.id, { start, stop })
}
// ---------- /Time Range ----------

// 增删 Query (Add or delete a query)

async function add() {
  const id = await store.addQuery()
  activeId.value = id
  // 默认 24h Default 24 hours
  store.setTimePreset(id, 'past_24h')
}

function remove(id) {
  store.removeQuery(id)
  if (activeId.value === id) activeId.value = store.queries[0]?.id || null
}

async function onSelect(queryId, key, value) {
  await store.onSelect(queryId, key, value)
}

async function exportCur() {
  if (!active.value) return



  // ✅ 1015新增：写入 aggregation 到当前 query
  active.value.aggregation = {
    mode: aggMode.value,                // CUSTOM / AUTO
    functions: selectedAggs.value || [] // ['mean', 'max', ...]
  }


  // 🔹 生成 Flux 查询语句（你原本已有的逻辑）
  const flux = store.exportQuery(active.value)
  console.log('Generated Flux Query:', flux)
  store.generatedQuery = flux

  // 🔹 当前 Query 对象
  const q = active.value

  // 获取时间范围
  let start, end
  if (q.timeRange?.mode === 'custom') {
    // 自定义时间（来自 Element Plus 时间选择器）
    start = formatRangeForBackend(q.timeRange.start, '-24h')
    end = formatRangeForBackend(q.timeRange.stop, 'now()')
  } else {
    // 预设时间（如 past_24h）
    const preset = q.timeRange?.preset || 'past_24h'
    start = '-' + preset.replace('past_', '') // 例如 past_24h → -24h
    end = 'now()'
  }

  // 构造发送给 Flask 后端的 payload
// ✅ 正确方式：从 store 结构读取真实值
  const payload = {
    bucket: store._get(q, 'bucket'),
    measurements: store._get(q, 'measurement') || [],
    fields: store._get(q, 'field') || [],
    start,
    end
  }

  // 预先构建 CSV，确保生成查询后即可下载
  qr.csv = buildLocalCsv(payload, q)

  console.log("🔍 Active query object:", q)

  console.log('🔹 Sending payload to backend:', payload)

  try {
    const res = await queryInflux(payload)
    console.log('✅ The data returned from the back end:', res)

    // 可选：把结果存到 store 或显示在控制台
    // store.queryResult = res.results
    return { payload, json: res }
  } catch (err) {
    console.error('❌ Query failed:', err)
    return { payload, json: null, error: err }
  }
}

function buildLocalCsv(payload, query) {
  const aggModeText = query?.aggregation?.mode || ''
  const aggFns = Array.isArray(query?.aggregation?.functions)
    ? query.aggregation.functions.join('; ')
    : ''

  const rows = [
    ['Bucket', payload.bucket || ''],
    ['Measurements', (payload.measurements || []).join('; ')],
    ['Fields', (payload.fields || []).join('; ')],
    ['Time Start', formatRangeForDisplay(payload.start)],
    ['Time End', formatRangeForDisplay(payload.end)],
    ['Aggregation Mode', aggModeText],
    ['Aggregation Functions', aggFns]
  ]

  const escape = value => {
    const str = String(value ?? '')
    return `"${str.replace(/"/g, '""')}"`
  }

  return rows.map(row => row.map(escape).join(',')).join('\n')
}

// submit and raw view are removed; CSV is prepared during exportCur()

function onDownloadCsv() {
  if (!qr.csv) return
  const blob = new Blob([qr.csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `query_${new Date().toISOString()}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}


onMounted(async () => {
  if (!queries.value.length) {
    await add() // add() 内部已默认 24h
  } else if (active.value && !active.value.timeRange) {
    // 兼容已有 query 但未设置 timeRange 的场景
    store.setTimePreset(active.value.id, 'past_24h')
  }
})
</script>

<template>
  <el-card class="qb" header="Visual Query Builder">
    <!-- 顶部：Query 标签 + ➕ -->
    <div class="qb-tabs">
      <div
        v-for="(q, i) in queries"
        :key="q.id"
        :class="['qb-tab', q.id === activeId ? 'active' : '']"
        @click="activeId = q.id"
      >
        Query {{ i + 1 }}
        <el-icon class="tab-close" @click.stop="remove(q.id)"><Close /></el-icon>
      </div>
      <el-button type="primary" link @click="add"> ➕ Add Query</el-button>

      <!-- Time range selection -->
      <div class="timebar">
        <span class="time-label">Time</span>
        <el-select
          :model-value="selectedPreset"
          placeholder="Past 24h"
          class="time-select"
          @change="onPresetChange"
        >
          <el-option-group label="Time Range">
            <el-option label="Custom Time Range" value="custom" />
            <el-option disabled label="──────────" value="divider" />
            <el-option
              v-for="o in timeOptions.slice(2)"
              :key="o.value"
              :label="o.label"
              :value="o.value"
            />
          </el-option-group>
        </el-select>

        <el-date-picker
          v-if="active?.timeRange?.mode === 'custom'"
          v-model="customRange"
          type="datetimerange"
          range-separator="to"
          start-placeholder="Start"
          end-placeholder="Stop"
          unlink-panels
          format="YYYY-MM-DD HH:mm:ss"
          value-format="YYYY-MM-DDTHH:mm:ss[Z]"
          class="time-picker"
          @change="onCustomChange"
        />
      </div>

      <!-- Actions: CSV only -->
        <div class="qb-actions" style="display:flex; gap:10px; align-items:center; margin:8px 0;">
          <button class="btn" :disabled="!qr.csv" @click="onDownloadCsv">CSV</button>
        </div>


        <!-- 🧱 Aggregation Function Section -->
        <div class="agg-section">
          <div class="agg-title">AGGREGATE FUNCTION</div>

          <el-radio-group v-model="aggMode" size="small" class="agg-toggle">
            <el-radio-button label="CUSTOM">CUSTOM</el-radio-button>
            <el-radio-button label="AUTO">AUTO</el-radio-button>
          </el-radio-group>

          <!-- 调用新组件 -->
          <AggregationSelector v-model="selectedAggs" :mode="aggMode" />
        </div>




  <!-- Right side: Generate current Query button -->
  <el-button class="ml-auto" @click="exportCur">Generate Current Query</el-button>
    </div>

    <!-- 下方：从左到右动态延伸的“垂直表单列” A "vertical form column" that dynamically extends from left to right-->
    <div v-if="active" class="qb-cols">
      <QueryColumn
        v-for="col in active.columns"
        :key="col.key"
        :query-id="active.id"
        :column="col"
        :on-select="onSelect"
      />
    </div>
  </el-card>
</template>

<style scoped>
.qb {
  border-radius: 14px;
  border: 1px solid var(--card-border);
  box-shadow: 0 6px 18px rgba(37, 99, 235, 0.08);
  overflow: hidden;
  background: var(--card-bg);
}
.qb-tabs {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 4px 2px;
}
.qb-tab {
  padding: 8px 12px;
  border-radius: 10px;
  background: linear-gradient(180deg, #f8fbff, #f3f7ff);
  border: 1px solid #e5efff;
  cursor: pointer;
  display: flex;
  gap: 8px;
  align-items: center;
  transition: all .18s ease;
  font-weight: 600;
}
.qb-tab:hover { transform: translateY(-1px); box-shadow: 0 2px 8px rgba(37, 99, 235, .18); }
.qb-tab.active {
  background: linear-gradient(180deg, #eef5ff, #e6f0ff);
  border-color: #bfdbfe;
  color: var(--brand-600);
  font-weight: 600;
}
.tab-close { font-size: 14px; color: #94a3b8; }
.qb-cols { display: flex; gap: 14px; overflow-x: auto; padding: 10px 0; }
.qb-cols::-webkit-scrollbar { height: 8px; }
.qb-cols::-webkit-scrollbar-thumb { background: #bfdbfe; border-radius: 8px; }
.qb-cols::-webkit-scrollbar-track { background: #eaf2ff; }
.ml-auto { margin-left: auto }


/* —— Time range style —— */
.timebar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: 8px;
  padding: 6px 10px;
  background: #f8fbff;
  border: 1px solid #e5efff;
  border-radius: 10px;
}
.time-label { font-size: 12px; color: var(--text-secondary); font-weight: 600; letter-spacing: .02em; }
.time-select { width: 200px; }
.time-picker { width: 380px; }

/* —— Actions —— */
.qb-actions { color: var(--text-primary); }
.qb-actions {
  background: #f8fbff;
  border: 1px solid #e5efff;
  border-radius: 10px;
  padding: 6px 10px;
}
.btn {
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid #e5efff;
  background: #ffffff;
  color: var(--text-primary);
  cursor: pointer;
  transition: all .18s ease;
}
.btn:hover { transform: translateY(-1px); box-shadow: 0 4px 10px rgba(37, 99, 235, .18); }
.btn:disabled { opacity: .55; cursor: not-allowed; transform: none; box-shadow: none; }
.btn.primary { background: var(--brand-600); color: #fff; border-color: var(--brand-600); }
.btn.primary:hover { background: var(--brand-700); border-color: var(--brand-700); }

.btn:focus-visible { outline: 2px solid #93c5fd; outline-offset: 2px; }

/* —— Aggregation section —— */
.agg-section {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  margin: 2px 0 4px;
  background: #f8fbff;
  border: 1px solid #e5efff;
  border-radius: 10px;
}
.agg-title { font-size: 12px; color: var(--text-secondary); font-weight: 700; letter-spacing: .04em; }
.agg-toggle { --el-radio-button-checked-bg-color: var(--brand-600); }

/* Element Plus tweaks inside scoped */
:deep(.el-card__header) {
  background: linear-gradient(180deg, #ffffff, #f8fbff);
  font-weight: 700;
  letter-spacing: .02em;
}
:deep(.el-select) { --el-color-primary: var(--brand-600); }
:deep(.el-radio-button__inner) { padding: 6px 10px; }
:deep(.el-date-editor.el-input__wrapper) { box-shadow: none; background: #fff; border-radius: 10px; }
:deep(.el-input__wrapper) { border-radius: 10px; transition: box-shadow .18s ease, border-color .18s ease; }
:deep(.el-input__wrapper.is-focus),
:deep(.el-input__wrapper:hover) { box-shadow: 0 0 0 3px rgba(37,99,235,.15); }
:deep(.el-select .el-input__wrapper) { padding: 2px 10px; }

/* subtle divider rhythm */
.qb-tabs + .timebar { margin-top: 2px; }
.timebar + .qb-actions { margin-top: 8px; }
.agg-section + .ml-auto { margin-left: auto; }

/* emphasize the Generate button on the right */
:deep(.el-button.ml-auto) {
  border-radius: 10px;
  background: linear-gradient(180deg, var(--brand-600), var(--brand-700));
  color: #fff;
  border: 1px solid var(--brand-700);
  box-shadow: 0 4px 10px rgba(29,78,216,.25);
}
:deep(.el-button.ml-auto:hover) {
  filter: brightness(1.05);
  transform: translateY(-1px);
}
</style>