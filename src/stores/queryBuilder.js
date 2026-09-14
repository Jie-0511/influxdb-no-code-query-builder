// INFLUX-UI-PG-1/frontend/influx-web-app/src/stores/queryBuilder.js
import { defineStore } from 'pinia'
import axios from 'axios'

let seq = 1
const qid = () => `q${seq++}`

// 预设映射（用于 range 的 start）Preset Mapping (for range start)
const TIME_PRESETS = {
  past_1m: '-1m',
  past_5m: '-5m',
  past_15m: '-15m',
  past_1h: '-1h',
  past_3h: '-3h',
  past_6h: '-6h',
  past_12h: '-12h',
  past_24h: '-24h',
  past_2d: '-2d',
  past_7d: '-7d',
  past_30d: '-30d'
}

// 后端基址（保持与现有项目一致）
const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:5000'

// 统一 axios 实例，确保携带 cookie（前端不接触 Influx Token）
// Make sure to bring cookies
const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
})

export const useQueryBuilderStore = defineStore('queryBuilder', {
  state: () => ({
    // 供组件读取的结构：{ [bucket]: { measurements: { [m]: string[]fields }, tag?: string[] } }
    structure: null,

    isLoading: false,
    selectedBucket: null,
    selectedMeasurements: [],
    selectedFields: [],
    timeRange: [],
    filters: [{ key: '', value: '' }],

    queries: [],

    // 前端缓存 Front-end cache
    cache: {
      buckets: null,           // string[]
      measurements: {},        // { [bucket]: string[] }
      fields: {},              // { [`${bucket}|${m1,m2}`]: string[] }
      tagKeys: {},             // { [bucket]: string[] }
      tagValues: {},           // { [`${bucket}|${tagKey}`]: string[] }  // 目前后端未提供，预留
    },

    generatedQuery: ""   // Flux 预览
  }),

  actions: {
    // ─────────── 结构注入与转换 ───────────

    /**
     * 登录成功后：直接注入“组件使用形状”的 structure
     * After successful login: directly inject the structure of "component usage shape"
     */
    setStructure(struct) {
      try {
        this.structure = struct || {}
        sessionStorage.setItem('influxdb_structure', JSON.stringify(this.structure))
        // 重置 cache，让下拉框刷新
        //Reset cache and refresh the drop-down box
        this.cache.buckets = null
        this.cache.measurements = {}
        this.cache.fields = {}
      } catch { }
    },

    /**
     * 兼容 /structure 或 /meta/bootstrap 返回的 meta 结构：
     * meta = { org, defaults, buckets: { [bucket]: { measurement:[], field:[], tag:[] } } }
     * 转换为：{ [bucket]: { measurements: { [m]: string[]fields }, tag: string[] } }
     */
    // setStructureFromMeta(meta) {
    //   if (!meta) return
    //   if (meta.buckets && typeof meta.buckets === 'object') {
    //     const converted = {}
    //     const tagKeysCache = {}
    //     Object.entries(meta.buckets).forEach(([bucket, info]) => {
    //       const mList = Array.isArray(info?.measurement) ? info.measurement : []
    //       const fList = Array.isArray(info?.field) ? info.field : []
    //       const tList = Array.isArray(info?.tag) ? info.tag : []
    //       const measurements = {}
    //       // 将 field 平铺给每个 measurement
    //       //Flatten the field to each measurement
    //       mList.forEach(m => { measurements[m] = fList.slice() })
    //       converted[bucket] = { measurements, tag: tList }
    //       tagKeysCache[bucket] = tList.slice()
    //     })
    //     this.cache.tagKeys = tagKeysCache
    //     this.setStructure(converted)
    //   } else {
    //     // 如果后端直接返回的就是组件形状，也直接存
    //     //If the backend directly returns the component shape, it is also directly stored
    //     this.setStructure(meta)
    //   }
    // },

    //  1017tag
    setStructureFromMeta(meta) {
      if (!meta) return
      if (meta.buckets && typeof meta.buckets === 'object') {
        const converted = {}
        const tagKeysCache = {}

        Object.entries(meta.buckets).forEach(([bucket, info]) => {
          const mList = Array.isArray(info?.measurement) ? info.measurement : []
          const fList = Array.isArray(info?.field) ? info.field : []

          // ✅ 修改的这一行：支持对象形式的 tags（例如 {p0: [...], p1: [...]}）
          const tList = Array.isArray(info?.tag)
            ? info.tag
            : (info?.tags ? Object.keys(info.tags) : [])

          const measurements = {}
          // 将 field 平铺给每个 measurement
          mList.forEach(m => { measurements[m] = fList.slice() })

          converted[bucket] = { measurements, tag: tList }
          tagKeysCache[bucket] = tList.slice()
        })

        this.cache.tagKeys = tagKeysCache
        this.setStructure(converted)
      } else {
        // 如果后端直接返回的就是组件形状，也直接存
        this.setStructure(meta)
      }
    },






    // 设置/覆盖当前生成的 Flux 文本（供编辑器保存时调用）
    //Set/override the currently generated Flux text (called when the editor is saved)
    setGeneratedQuery(flux) {
      this.generatedQuery = typeof flux === 'string' ? flux : ''
    },


    loadStructureFromStorage() {
      if (this.structure && Object.keys(this.structure).length) return
      try {
        const s = sessionStorage.getItem('influxdb_structure') || localStorage.getItem('influxdb_structure')
        if (s) this.structure = JSON.parse(s)
      } catch { }
    },

    /**
     * 取结构（只前端）：优先从内存/存储，还没有就调 /structure，失败降级 /meta/bootstrap
     * 注意：此处不处理登录，调用方保证已 /login 成功
     */
    async fetchStructure(username) {
      // 先看内存/存储 First look at memory/storage
      if (!this.structure) this.loadStructureFromStorage()
      if (this.structure && Object.keys(this.structure).length) return this.structure

      if (this.isLoading) return this.structure
      this.isLoading = true
      try {
        // 1) /structure
        let res
        try {
          res = await api.post('/structure', username ? { username } : {})
        } catch {
          // 2) 降级 /meta/bootstrap
          res = await api.post('/meta/bootstrap', username ? { username } : {})
        }
        const meta = res?.data || {}
        this.setStructureFromMeta(meta)
      } finally {
        this.isLoading = false
      }
      return this.structure || {}
    },

    // ========= Time range related =========

    // 设置预设时间范围（作用在指定 query）Set a preset time range
    setTimePreset(queryId, presetKey) {
      const q = this.queries.find(x => x.id === queryId)
      if (!q) return
      if (!q.timeRange) q.timeRange = { mode: 'preset', preset: 'past_24h', start: null, stop: null }
      // 非法 key 时回退 24h Fallback 24h when invalid key
      q.timeRange.mode = 'preset'
      q.timeRange.preset = TIME_PRESETS[presetKey] ? presetKey : 'past_24h'
      q.timeRange.start = null
      q.timeRange.stop = null
    },

    // 设置自定义时间范围（Date 对象或时间戳毫秒）Set a custom time range
    setTimeCustom(queryId, { start, stop }) {
      const q = this.queries.find(x => x.id === queryId)
      if (!q) return
      if (!q.timeRange) q.timeRange = { mode: 'preset', preset: 'past_24h', start: null, stop: null }
      if (!start || !stop) return
      // 纠正顺序 Correction order
      const s = new Date(start).getTime()
      const e = new Date(stop).getTime()
      const [sOk, eOk] = s <= e ? [s, e] : [e, s]
      q.timeRange.mode = 'custom'
      q.timeRange.preset = null
      q.timeRange.start = new Date(sOk)
      q.timeRange.stop = new Date(eOk)
    },


    // ========= Aggregation related 1015=========
    setAggregation(queryId, agg) {
      const q = this.queries.find(x => x.id === queryId)
      if (!q) return
      q.aggregation = agg
    },





    // ─────────── Query construction and linkage ───────────

    async addQuery() {
      const id = qid()
      const q = {
        id,
        tags:{},  // ✅ 1017 新增 Tag 过滤支持
        columns: [
          {
            type: 'from',
            key: 'bucket',
            label: 'Bucket',
            value: null,
            options: [],
            multi: false,
            required: true,
            placeholder: 'Search buckets',
            timeRange: { mode: 'preset', preset: 'past_24h', start: null, stop: null } // ★ 为每条 query 加 timeRange（默认 24h）
          }
        ]
      }
      this.queries.push(q)
      await this.ensureBuckets(q)
      return id
    },

    removeQuery(id) {
      this.queries = this.queries.filter(q => q.id !== id)
    },

    async onSelect(queryId, key, value) {
      const q = this.queries.find(x => x.id === queryId)
      if (!q) return
      const idx = q.columns.findIndex(c => c.key === key)
      if (idx === -1) return

      q.columns[idx].value = value
      // 清除右侧列 Clear right column
      q.columns.splice(idx + 1)

      if (key === 'bucket' && value) {
        // 新增 measurement 列 Added measurement column
        q.columns.push({
          type: 'filter',
          key: 'measurement',
          label: 'Measurement',
          value: [],
          options: [],
          multi: true,
          required: true,
          placeholder: 'Search measurements'
        })
        await this.ensureMeasurements(q)
        return
      }

      if (key === 'measurement' && Array.isArray(value) && value.length) {
        // 新增 field 列 Add a new field column
        q.columns.push({
          type: 'filter',
          key: 'field',
          label: 'Field',
          value: [],
          options: [],
          multi: true,
          required: true,
          placeholder: 'Search fields'
        })
        await this.ensureFields(q)

        // 追加 Tag Key（如果后端 meta 有提供）Append Tag Key (if provided by backend meta)
        q.columns.push({
          type: 'filter',
          key: 'tagKey',
          label: 'Tag Key',
          value: null,
          options: [],
          multi: false,
          required: false,
          placeholder: 'Search tag keys'
        })
        await this.ensureTagKeys(q)
        return
      }

      // ✅ 1017新增：选完 Field 后，保留并重新加载 Tag Key / Tag Value
      if (key === 'field' && Array.isArray(value) && value.length) {
        // 确保 Tag Key 列存在（如果被 splice 清掉则重新加上）
        const existingTagKey = this._col(q, 'tagKey')
        if (!existingTagKey) {
          q.columns.push({
            type: 'filter',
            key: 'tagKey',
            label: 'Tag Key',
            value: null,
            options: [],
            multi: false,
            required: false,
            placeholder: 'Search tag keys'
          })
          await this.ensureTagKeys(q)
        }
        return
      }


      if (key === 'tagKey') {
        // 当前不支持选择 tag value，移除已有 tag 过滤
        q.tags = {}
        return
      }


      if (key === 'bucket') this.selectedBucket = value
      if (key === 'measurement') this.selectedMeasurements = value
      if (key === 'field') this.selectedFields = value
    },

    // ─────────── Option Acquisition ───────────

    async ensureBuckets(q) {
      // 确保已拿到结构Make sure you have the structure（支持从 /structure 获取）
      await this.fetchStructure()
      if (!this.cache.buckets) {
        const keys = Object.keys(this.structure || {})
        this.cache.buckets = keys
      }
      if (q?.columns?.[0]) q.columns[0].options = this.cache.buckets
    },

    async ensureMeasurements(q) {
      await this.fetchStructure()
      const bucket = this._get(q, 'bucket')
      if (!bucket) return

      if (!this.cache.measurements[bucket]) {
        const fromStruct = Object.keys(this.structure?.[bucket]?.measurements || {})
        this.cache.measurements[bucket] = fromStruct
      }
      const col = this._col(q, 'measurement')
      if (col) col.options = this.cache.measurements[bucket]
    },

    async ensureFields(q) {
      await this.fetchStructure()
      const bucket = this._get(q, 'bucket')
      const ms = this._get(q, 'measurement') || []
      if (!bucket || !ms.length) return

      const cacheKey = `${bucket}|${ms.join(',')}`
      if (!this.cache.fields[cacheKey]) {
        const union = new Set()
        for (const m of ms) {
          const fromStruct = this.structure?.[bucket]?.measurements?.[m] || []
          if (Array.isArray(fromStruct) && fromStruct.length) {
            fromStruct.forEach(v => union.add(v))
          }
        }
        this.cache.fields[cacheKey] = [...union]
      }
      const col = this._col(q, 'field')
      if (col) col.options = this.cache.fields[cacheKey]
    },

    async ensureTagKeys(q) {
      await this.fetchStructure()
      const bucket = this._get(q, 'bucket')
      if (!bucket) return

      // ✅ 优先从 structure.tags 取
      const fromStruct =
        Object.keys(this.structure?.[bucket]?.tags || {}) ||
        this.structure?.[bucket]?.tag ||
        []

      // ✅ 更新缓存和下拉框选项
      this.cache.tagKeys[bucket] = fromStruct
      const col = this._col(q, 'tagKey')
      if (col) col.options = Array.isArray(fromStruct) ? fromStruct : []

      console.log(`✅ Tag keys loaded for ${bucket}:`, fromStruct)
    },


    // ─────────── 工具 ───────────
    _col(q, key) { return q.columns.find(c => c.key === key) },
    _get(q, key) { const c = this._col(q, key); return c ? c.value : null },

    addFilter() { this.filters.push({ key: '', value: '' }) },
    removeFilter(index) { this.filters.splice(index, 1) },

    // 格式化 RFC3339（Flux 用） // Format RFC3339 (for Flux)
    _formatRFC3339(d) {
      if (!d) return null
      const iso = (d instanceof Date ? d : new Date(d)).toISOString()
      // 例如 "2025-10-06T08:30:00.000Z"
      return iso
    },

    // ─────────── Export Flux Preview ───────────
    exportQuery(q) {
      const bucket = this._get(q, 'bucket')
      const measurements = this._get(q, 'measurement') || []
      const fields = this._get(q, 'field') || []

      // 计算 range 子句 Evaluating range clauses
      let rangePart = '|> range(start: -24h)' // default 24h
      const tr = q?.timeRange || { mode: 'preset', preset: 'past_24h' }
      if (tr.mode === 'preset' && tr.preset && TIME_PRESETS[tr.preset]) {
        rangePart = `|> range(start: ${TIME_PRESETS[tr.preset]})`
      } else if (tr.mode === 'custom' && tr.start && tr.stop) {
        const s = this._formatRFC3339(tr.start)
        const e = this._formatRFC3339(tr.stop)
        if (s && e) {
          rangePart = `|> range(start: time(v: "${s}"), stop: time(v: "${e}"))`
        }
      }

      let flux = bucket ? `from(bucket:"${bucket}") ${rangePart}` : ""
      if (measurements.length) {
        flux += ` |> filter(fn: (r) => ${measurements.map(m => `r._measurement == "${m}"`).join(" or ")})`
      }
      if (fields.length) {
        flux += ` |> filter(fn: (r) => ${fields.map(f => `r._field == "${f}"`).join(" or ")})`
      }


      // ✅ 1017 新增：Tag filter 拼接
      if (q.tags && Object.keys(q.tags).length > 0) {
        const tagFilters = []
        for (const [key, val] of Object.entries(q.tags)) {
          if (Array.isArray(val)) {
            // 多个值时用 or 连接
            tagFilters.push(val.map(v => `r["${key}"] == "${v}"`).join(' or '))
          } else {
            // 单个值
            tagFilters.push(`r["${key}"] == "${val}"`)
          }
        }
        flux += ` |> filter(fn: (r) => ${tagFilters.join(' or ')})`
      }






      // ✅ 1015聚合函数拼接 Aggregation part
      if (q.aggregation && q.aggregation.functions && q.aggregation.functions.length > 0) {
        q.aggregation.functions.forEach(fn => {
          flux += ` |> aggregateWindow(every: 4m, fn: ${fn}, createEmpty: false)`
          flux += ` |> yield(name: "${fn}")`
        })
      }


      this.generatedQuery = flux
      return flux
    },


    // ─────────── Export Grafana Query1016 ───────────
    /**
     * 生成 Grafana Dashboard JSON model 所需的 query 字符串
     * - 保留 InfluxDB 查询逻辑
     * - 转义双引号为 \"
     * - 将每个管道符前加上 \r\n 以符合 Grafana 格式
     * - 不影响前端 preview（仍使用 generatedQuery）
     */
    exportGrafanaQuery(q) {
      const flux = this.exportQuery(q)
      if (!flux) return ""

      // 转换为 Grafana 格式字符串
      let g = flux
        .replace(/"/g, '\\"')              // 转义引号
        .replace(/\|>/g, '\\r\\n  |>' )    // 每个管道符前换行
        .trim()

      // 仅保存内部使用，不展示在前端
      this.grafanaQuery = g
      return g
    },




    // （可选）供“Open in Editor → 保存”调用 Called by "Open in Editor → Save"
    setGeneratedQuery(flux) {
      this.generatedQuery = typeof flux === 'string' ? flux : ''
    }

  }
})
