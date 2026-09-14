// ==========================================
// Mock Data
// ==========================================

const mockData = {

  "bucket-test": {

    cpu: {

      fields: [
        "occupancy",
        "usage_user",
        "usage_system"
      ],

      tags: {

        host: [
          "server-01",
          "server-02",
          "server-03"
        ],

        region: [
          "adelaide",
          "sydney",
          "melbourne"
        ],

        environment: [
          "development",
          "testing",
          "production"
        ]

      }

    },


    memory: {

      fields: [
        "used_percent",
        "available",
        "cached"
      ],

      tags: {

        host: [
          "server-01",
          "server-02"
        ],

        environment: [
          "testing",
          "production"
        ]

      }

    }

  },


  "sensor-data": {

    temperature: {

      fields: [
        "value",
        "humidity"
      ],

      tags: {

        location: [
          "room-a",
          "room-b",
          "room-c"
        ],

        sensor: [
          "sensor-01",
          "sensor-02"
        ]

      }

    },


    pressure: {

      fields: [
        "value"
      ],

      tags: {

        location: [
          "lab-a",
          "lab-b"
        ],

        sensor: [
          "sensor-03",
          "sensor-04"
        ]

      }

    }

  }

};


// ==========================================
// State
// ==========================================

let queries = [];

let currentQueryId = 1;

let nextQueryId = 2;

let hierarchyItems = [];


// ==========================================
// DOM Elements
// ==========================================

const queryTabs =
  document.getElementById("queryTabs");

const addQueryButton =
  document.getElementById("addQueryButton");


const bucketSelect =
  document.getElementById("bucket");

const measurementSelect =
  document.getElementById("measurement");

const fieldSelect =
  document.getElementById("field");

const tagKeySelect =
  document.getElementById("tagKey");

const tagValueSelect =
  document.getElementById("tagValue");


const timeMode =
  document.getElementById("timeMode");

const relativeTime =
  document.getElementById("relativeTime");

const customTimeFields =
  document.getElementById("customTimeFields");

const startTimeInput =
  document.getElementById("startTime");

const stopTimeInput =
  document.getElementById("stopTime");


const validationMessage =
  document.getElementById("validationMessage");


const customModeButton =
  document.getElementById("customModeButton");

const autoModeButton =
  document.getElementById("autoModeButton");

const aggregationContainer =
  document.getElementById("aggregationContainer");

const aggregationFunction =
  document.getElementById("aggregationFunction");

const aggregationInterval =
  document.getElementById("aggregationInterval");


const generateButton =
  document.getElementById("generateButton");

const csvButton =
  document.getElementById("csvButton");

const copyButton =
  document.getElementById("copyButton");

const openEditorButton =
  document.getElementById("openEditorButton");


const queryOutput =
  document.getElementById("queryOutput");


const editorPanel =
  document.getElementById("editorPanel");

const queryEditor =
  document.getElementById("queryEditor");

const closeEditorButton =
  document.getElementById("closeEditorButton");

const applyEditorButton =
  document.getElementById("applyEditorButton");


// Hierarchy

const hierarchyQueryStatus =
  document.getElementById(
    "hierarchyQueryStatus"
  );

const hierarchyTagKey =
  document.getElementById(
    "hierarchyTagKey"
  );

const hierarchyTagValue =
  document.getElementById(
    "hierarchyTagValue"
  );

const addHierarchyButton =
  document.getElementById(
    "addHierarchyButton"
  );

const resetHierarchyButton =
  document.getElementById(
    "resetHierarchyButton"
  );

const hierarchyTree =
  document.getElementById(
    "hierarchyTree"
  );


// ==========================================
// Flatpickr
// ==========================================

const startPicker =
  flatpickr(
    startTimeInput,
    {

      enableTime: true,

      time_24hr: true,

      dateFormat:
        "Y-m-d H:i",

      defaultHour: 9,

      minuteIncrement: 5,

      locale: "default",

      onChange:
        function (
          selectedDates,
          dateStr
        ) {

          const query =
            getCurrentQuery();

          query.startTime =
            dateStr;

        }

    }
  );


const stopPicker =
  flatpickr(
    stopTimeInput,
    {

      enableTime: true,

      time_24hr: true,

      dateFormat:
        "Y-m-d H:i",

      defaultHour: 17,

      minuteIncrement: 5,

      locale: "default",

      onChange:
        function (
          selectedDates,
          dateStr
        ) {

          const query =
            getCurrentQuery();

          query.stopTime =
            dateStr;

        }

    }
  );


// ==========================================
// Query Model
// ==========================================

function createDefaultQuery(id) {

  return {

    id,

    bucket:
      "bucket-test",

    measurement:
      "cpu",

    field:
      "occupancy",

    tagKey:
      "host",

    tagValue:
      "server-01",

    timeMode:
      "relative",

    relativeTime:
      "-1h",

    startTime:
      "",

    stopTime:
      "",

    aggregationMode:
      "custom",

    aggregationFunction:
      "mean",

    aggregationInterval:
      "5m",

    generatedQuery:
      ""

  };

}


function getCurrentQuery() {

  return queries.find(
    query =>
      query.id ===
      currentQueryId
  );

}


// ==========================================
// Helpers
// ==========================================

function setSelectOptions(
  select,
  values,
  selectedValue
) {

  select.innerHTML =
    "";


  values.forEach(
    value => {

      const option =
        document.createElement(
          "option"
        );


      option.value =
        value;


      option.textContent =
        value;


      select.appendChild(
        option
      );

    }
  );


  if (
    values.includes(
      selectedValue
    )
  ) {

    select.value =
      selectedValue;

  }

}


// ==========================================
// Populate Query Options
// ==========================================

function populateBuckets() {

  const query =
    getCurrentQuery();


  const buckets =
    Object.keys(
      mockData
    );


  setSelectOptions(
    bucketSelect,
    buckets,
    query.bucket
  );

}


function populateMeasurements() {

  const query =
    getCurrentQuery();


  const measurements =
    Object.keys(
      mockData[
        query.bucket
      ]
    );


  if (
    !measurements.includes(
      query.measurement
    )
  ) {

    query.measurement =
      measurements[0];

  }


  setSelectOptions(
    measurementSelect,
    measurements,
    query.measurement
  );

}


function populateFields() {

  const query =
    getCurrentQuery();


  const fields =
    mockData[
      query.bucket
    ][
      query.measurement
    ].fields;


  if (
    !fields.includes(
      query.field
    )
  ) {

    query.field =
      fields[0];

  }


  setSelectOptions(
    fieldSelect,
    fields,
    query.field
  );

}


function populateTagKeys() {

  const query =
    getCurrentQuery();


  const tags =
    mockData[
      query.bucket
    ][
      query.measurement
    ].tags;


  const keys =
    Object.keys(
      tags
    );


  if (
    !keys.includes(
      query.tagKey
    )
  ) {

    query.tagKey =
      keys[0];

  }


  setSelectOptions(
    tagKeySelect,
    keys,
    query.tagKey
  );

}


function populateTagValues() {

  const query =
    getCurrentQuery();


  const values =
    mockData[
      query.bucket
    ][
      query.measurement
    ].tags[
      query.tagKey
    ];


  if (
    !values.includes(
      query.tagValue
    )
  ) {

    query.tagValue =
      values[0];

  }


  setSelectOptions(
    tagValueSelect,
    values,
    query.tagValue
  );

}


// ==========================================
// Query Tabs
// ==========================================

function renderQueryTabs() {

  queryTabs.innerHTML =
    "";


  queries.forEach(
    query => {

      const tab =
        document.createElement(
          "div"
        );


      tab.className =
        "query-tab";


      if (
        query.id ===
        currentQueryId
      ) {

        tab.classList.add(
          "active"
        );

      }


      const title =
        document.createElement(
          "span"
        );


      title.textContent =
        `Query ${query.id}`;


      title.addEventListener(
        "click",
        () => {

          saveCurrentUIState();

          currentQueryId =
            query.id;

          clearValidation();

          render();

        }
      );


      tab.appendChild(
        title
      );


      if (
        queries.length > 1
      ) {

        const removeButton =
          document.createElement(
            "button"
          );


        removeButton.className =
          "query-remove";


        removeButton.textContent =
          "×";


        removeButton.setAttribute(
          "aria-label",
          `Remove Query ${query.id}`
        );


        removeButton.addEventListener(
          "click",
          event => {

            event.stopPropagation();

            removeQuery(
              query.id
            );

          }
        );


        tab.appendChild(
          removeButton
        );

      }


      queryTabs.appendChild(
        tab
      );

    }
  );

}


// ==========================================
// Add Query
// ==========================================

function addQuery() {

  saveCurrentUIState();


  const query =
    createDefaultQuery(
      nextQueryId
    );


  queries.push(
    query
  );


  currentQueryId =
    nextQueryId;


  nextQueryId++;


  clearValidation();

  render();

}


// ==========================================
// Remove Query
// ==========================================

function removeQuery(id) {

  if (
    queries.length <= 1
  ) {

    return;

  }


  const index =
    queries.findIndex(
      query =>
        query.id === id
    );


  queries =
    queries.filter(
      query =>
        query.id !== id
    );


  if (
    currentQueryId === id
  ) {

    const fallbackIndex =
      Math.max(
        0,
        index - 1
      );


    currentQueryId =
      queries[
        fallbackIndex
      ].id;

  }


  clearValidation();

  render();

}


// ==========================================
// Save Current UI
// ==========================================

function saveCurrentUIState() {

  const query =
    getCurrentQuery();


  if (!query) {

    return;

  }


  query.bucket =
    bucketSelect.value;


  query.measurement =
    measurementSelect.value;


  query.field =
    fieldSelect.value;


  query.tagKey =
    tagKeySelect.value;


  query.tagValue =
    tagValueSelect.value;


  query.timeMode =
    timeMode.value;


  query.relativeTime =
    relativeTime.value;


  query.startTime =
    startTimeInput.value;


  query.stopTime =
    stopTimeInput.value;


  query.aggregationFunction =
    aggregationFunction.value;


  query.aggregationInterval =
    aggregationInterval.value;

}


// ==========================================
// Render
// ==========================================

function render() {

  const query =
    getCurrentQuery();


  renderQueryTabs();


  populateBuckets();

  populateMeasurements();

  populateFields();

  populateTagKeys();

  populateTagValues();


  timeMode.value =
    query.timeMode;


  relativeTime.value =
    query.relativeTime;


  if (
    query.startTime
  ) {

    startPicker.setDate(
      query.startTime,
      false
    );

  }

  else {

    startPicker.clear();

  }


  if (
    query.stopTime
  ) {

    stopPicker.setDate(
      query.stopTime,
      false
    );

  }

  else {

    stopPicker.clear();

  }


  if (
    query.timeMode ===
    "custom"
  ) {

    relativeTime
      .classList
      .add(
        "hidden"
      );


    customTimeFields
      .classList
      .remove(
        "hidden"
      );

  }

  else {

    relativeTime
      .classList
      .remove(
        "hidden"
      );


    customTimeFields
      .classList
      .add(
        "hidden"
      );

  }


  setAggregationMode(
    query.aggregationMode,
    false
  );


  aggregationFunction.value =
    query.aggregationFunction;


  aggregationInterval.value =
    query.aggregationInterval;


  queryOutput.textContent =
    query.generatedQuery ||
    'Select query options and click "Generate Current Query".';


  updateHierarchyIntegration();

}


// ==========================================
// Aggregation Mode
// ==========================================

function setAggregationMode(
  mode,
  save = true
) {

  const query =
    getCurrentQuery();


  query.aggregationMode =
    mode;


  customModeButton
    .classList
    .toggle(
      "active",
      mode === "custom"
    );


  autoModeButton
    .classList
    .toggle(
      "active",
      mode === "auto"
    );


  aggregationContainer
    .classList
    .toggle(
      "hidden",
      mode === "auto"
    );


  if (save) {

    saveCurrentUIState();

  }

}


// ==========================================
// Validation
// ==========================================

function showValidation(message) {

  validationMessage
    .textContent =
    message;


  validationMessage
    .classList
    .remove(
      "hidden"
    );

}


function clearValidation() {

  validationMessage
    .textContent =
    "";


  validationMessage
    .classList
    .add(
      "hidden"
    );

}


// ==========================================
// Local Date Parser
// ==========================================

function parseFlatpickrDate(
  value
) {

  if (!value) {

    return null;

  }


  const match =
    value.match(
      /^(\d{4})-(\d{2})-(\d{2})\s(\d{2}):(\d{2})$/
    );


  if (!match) {

    return null;

  }


  const year =
    Number(
      match[1]
    );

  const month =
    Number(
      match[2]
    ) - 1;

  const day =
    Number(
      match[3]
    );

  const hour =
    Number(
      match[4]
    );

  const minute =
    Number(
      match[5]
    );


  const date =
    new Date(
      year,
      month,
      day,
      hour,
      minute,
      0
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return null;

  }


  return date;

}


// ==========================================
// Flux Generation
// ==========================================

function buildFluxQuery() {

  clearValidation();

  saveCurrentUIState();


  const query =
    getCurrentQuery();


  let rangeClause;


  if (
    query.timeMode ===
    "custom"
  ) {

    const startDate =
      parseFlatpickrDate(
        query.startTime
      );


    const stopDate =
      parseFlatpickrDate(
        query.stopTime
      );


    if (
      !startDate ||
      !stopDate
    ) {

      showValidation(
        "Please select both the start and end date/time."
      );

      return null;

    }


    if (
      startDate >=
      stopDate
    ) {

      showValidation(
        "The start date/time must be earlier than the end date/time."
      );

      return null;

    }


    rangeClause =
      `|> range(start: time(v: "${startDate.toISOString()}"), stop: time(v: "${stopDate.toISOString()}"))`;

  }

  else {

    rangeClause =
      `|> range(start: ${query.relativeTime})`;

  }


  let flux =
`from(bucket: "${query.bucket}")
  ${rangeClause}
  |> filter(fn: (r) => r._measurement == "${query.measurement}")
  |> filter(fn: (r) => r._field == "${query.field}")
  |> filter(fn: (r) => r.${query.tagKey} == "${query.tagValue}")`;


  if (
    query.aggregationMode ===
    "auto"
  ) {

    flux +=
`
  |> aggregateWindow(every: 5m, fn: mean, createEmpty: false)
  |> yield(name: "auto")`;

  }

  else {

    flux +=
`
  |> aggregateWindow(every: ${query.aggregationInterval}, fn: ${query.aggregationFunction}, createEmpty: false)
  |> yield(name: "${query.aggregationFunction}")`;

  }


  query.generatedQuery =
    flux;


  queryOutput.textContent =
    flux;


  updateHierarchyIntegration();


  return flux;

}


// ==========================================
// Copy Query
// ==========================================

async function copyQuery() {

  let query =
    getCurrentQuery();


  if (
    !query.generatedQuery
  ) {

    const generated =
      buildFluxQuery();


    if (!generated) {

      return;

    }


    query =
      getCurrentQuery();

  }


  try {

    await navigator
      .clipboard
      .writeText(
        query.generatedQuery
      );


    copyButton.textContent =
      "Copied!";


    setTimeout(
      () => {

        copyButton.textContent =
          "Copy";

      },
      1500
    );

  }

  catch {

    copyButton.textContent =
      "Copy failed";

  }

}


// ==========================================
// Query Editor
// ==========================================

function openEditor() {

  let query =
    getCurrentQuery();


  if (
    !query.generatedQuery
  ) {

    const generated =
      buildFluxQuery();


    if (!generated) {

      return;

    }


    query =
      getCurrentQuery();

  }


  queryEditor.value =
    query.generatedQuery;


  editorPanel
    .classList
    .remove(
      "hidden"
    );


  editorPanel
    .scrollIntoView({
      behavior:
        "smooth"
    });

}


function closeEditor() {

  editorPanel
    .classList
    .add(
      "hidden"
    );

}


function applyEditorChanges() {

  const query =
    getCurrentQuery();


  query.generatedQuery =
    queryEditor.value;


  queryOutput.textContent =
    query.generatedQuery;


  updateHierarchyIntegration();


  closeEditor();

}


// ==========================================
// CSV Export
// ==========================================

function exportCSV() {

  saveCurrentUIState();


  const query =
    getCurrentQuery();


  const rows = [

    [
      "timestamp",
      query.field,
      query.tagKey
    ],

    [
      new Date()
        .toISOString(),

      "42.7",

      query.tagValue
    ],

    [
      new Date(
        Date.now() -
        60000
      )
        .toISOString(),

      "41.9",

      query.tagValue
    ],

    [
      new Date(
        Date.now() -
        120000
      )
        .toISOString(),

      "43.1",

      query.tagValue
    ]

  ];


  const csv =
    rows
      .map(
        row =>
          row.join(",")
      )
      .join("\n");


  const blob =
    new Blob(
      [csv],
      {
        type:
          "text/csv"
      }
    );


  const url =
    URL.createObjectURL(
      blob
    );


  const link =
    document.createElement(
      "a"
    );


  link.href =
    url;


  link.download =
    `query-${query.id}-results.csv`;


  document.body
    .appendChild(
      link
    );


  link.click();


  link.remove();


  URL.revokeObjectURL(
    url
  );

}


// ==========================================
// Hierarchy Integration
// ==========================================

function updateHierarchyIntegration() {

  const query =
    getCurrentQuery();


  const hasQuery =
    Boolean(
      query.generatedQuery
    );


  hierarchyTagKey.disabled =
    !hasQuery;


  hierarchyTagValue.disabled =
    !hasQuery;


  addHierarchyButton.disabled =
    !hasQuery;


  hierarchyQueryStatus
    .classList
    .toggle(
      "active",
      hasQuery
    );


  if (!hasQuery) {

    hierarchyQueryStatus.textContent =
      "Generate a Flux query first to enable this integration.";


    hierarchyTagKey.innerHTML =
      "";


    hierarchyTagValue.innerHTML =
      "";


    return;

  }


  hierarchyQueryStatus.textContent =
    `Active query: Query ${query.id} — ${query.bucket} / ${query.measurement} / ${query.field}`;


  populateHierarchyTagKeys();

}


function populateHierarchyTagKeys() {

  const query =
    getCurrentQuery();


  const keys =
    Object.keys(
      mockData[
        query.bucket
      ][
        query.measurement
      ].tags
    );


  setSelectOptions(
    hierarchyTagKey,
    keys,
    hierarchyTagKey.value ||
    keys[0]
  );


  populateHierarchyTagValues();

}


function populateHierarchyTagValues() {

  const query =
    getCurrentQuery();


  const key =
    hierarchyTagKey.value;


  const values =
    mockData[
      query.bucket
    ][
      query.measurement
    ].tags[
      key
    ] || [];


  setSelectOptions(
    hierarchyTagValue,
    values,
    hierarchyTagValue.value ||
    values[0]
  );

}


function addHierarchyItem() {

  const query =
    getCurrentQuery();


  if (
    !query.generatedQuery
  ) {

    return;

  }


  const item = {

    queryId:
      query.id,

    key:
      hierarchyTagKey.value,

    value:
      hierarchyTagValue.value

  };


  hierarchyItems.push(
    item
  );


  renderHierarchy();

}


function resetHierarchy() {

  hierarchyItems =
    [];


  renderHierarchy();

}


function renderHierarchy() {

  hierarchyTree.innerHTML =
    "";


  if (
    hierarchyItems.length === 0
  ) {

    hierarchyTree.innerHTML =
      `
      <p class="empty-state">
        No hierarchy items added yet.
      </p>
      `;


    return;

  }


  hierarchyItems.forEach(
    (
      item,
      index
    ) => {

      const node =
        document.createElement(
          "div"
        );


      node.className =
        "hierarchy-node";


      node.innerHTML =
        `
        <div class="hierarchy-node-key">
          ${index + 1}. ${item.key}
          <span>
            (Query ${item.queryId})
          </span>
        </div>

        <div class="hierarchy-node-value">
          ↳ ${item.value}
        </div>
        `;


      hierarchyTree
        .appendChild(
          node
        );

    }
  );

}


// ==========================================
// Cascading Select Events
// ==========================================

bucketSelect.addEventListener(
  "change",
  () => {

    const query =
      getCurrentQuery();


    query.bucket =
      bucketSelect.value;


    const measurements =
      Object.keys(
        mockData[
          query.bucket
        ]
      );


    query.measurement =
      measurements[0];


    query.field =
      mockData[
        query.bucket
      ][
        query.measurement
      ].fields[0];


    const tagKeys =
      Object.keys(
        mockData[
          query.bucket
        ][
          query.measurement
        ].tags
      );


    query.tagKey =
      tagKeys[0];


    query.tagValue =
      mockData[
        query.bucket
      ][
        query.measurement
      ].tags[
        query.tagKey
      ][0];


    query.generatedQuery =
      "";


    render();

  }
);


measurementSelect.addEventListener(
  "change",
  () => {

    const query =
      getCurrentQuery();


    query.measurement =
      measurementSelect.value;


    query.field =
      mockData[
        query.bucket
      ][
        query.measurement
      ].fields[0];


    const tagKeys =
      Object.keys(
        mockData[
          query.bucket
        ][
          query.measurement
        ].tags
      );


    query.tagKey =
      tagKeys[0];


    query.tagValue =
      mockData[
        query.bucket
      ][
        query.measurement
      ].tags[
        query.tagKey
      ][0];


    query.generatedQuery =
      "";


    render();

  }
);


fieldSelect.addEventListener(
  "change",
  () => {

    const query =
      getCurrentQuery();


    query.field =
      fieldSelect.value;


    query.generatedQuery =
      "";


    queryOutput.textContent =
      'Select query options and click "Generate Current Query".';


    updateHierarchyIntegration();

  }
);


tagKeySelect.addEventListener(
  "change",
  () => {

    const query =
      getCurrentQuery();


    query.tagKey =
      tagKeySelect.value;


    query.tagValue =
      mockData[
        query.bucket
      ][
        query.measurement
      ].tags[
        query.tagKey
      ][0];


    query.generatedQuery =
      "";


    populateTagValues();


    queryOutput.textContent =
      'Select query options and click "Generate Current Query".';


    updateHierarchyIntegration();

  }
);


tagValueSelect.addEventListener(
  "change",
  () => {

    const query =
      getCurrentQuery();


    query.tagValue =
      tagValueSelect.value;


    query.generatedQuery =
      "";


    queryOutput.textContent =
      'Select query options and click "Generate Current Query".';


    updateHierarchyIntegration();

  }
);


// ==========================================
// Time Events
// ==========================================

timeMode.addEventListener(
  "change",
  () => {

    const query =
      getCurrentQuery();


    query.timeMode =
      timeMode.value;


    query.generatedQuery =
      "";


    clearValidation();

    render();

  }
);


relativeTime.addEventListener(
  "change",
  () => {

    const query =
      getCurrentQuery();


    query.relativeTime =
      relativeTime.value;


    query.generatedQuery =
      "";


    queryOutput.textContent =
      'Select query options and click "Generate Current Query".';


    updateHierarchyIntegration();

  }
);


// ==========================================
// Aggregation Events
// ==========================================

customModeButton.addEventListener(
  "click",
  () => {

    const query =
      getCurrentQuery();


    query.generatedQuery =
      "";


    setAggregationMode(
      "custom"
    );


    queryOutput.textContent =
      'Select query options and click "Generate Current Query".';


    updateHierarchyIntegration();

  }
);


autoModeButton.addEventListener(
  "click",
  () => {

    const query =
      getCurrentQuery();


    query.generatedQuery =
      "";


    setAggregationMode(
      "auto"
    );


    queryOutput.textContent =
      'Select query options and click "Generate Current Query".';


    updateHierarchyIntegration();

  }
);


aggregationFunction.addEventListener(
  "change",
  () => {

    const query =
      getCurrentQuery();


    saveCurrentUIState();


    query.generatedQuery =
      "";


    queryOutput.textContent =
      'Select query options and click "Generate Current Query".';


    updateHierarchyIntegration();

  }
);


aggregationInterval.addEventListener(
  "change",
  () => {

    const query =
      getCurrentQuery();


    saveCurrentUIState();


    query.generatedQuery =
      "";


    queryOutput.textContent =
      'Select query options and click "Generate Current Query".';


    updateHierarchyIntegration();

  }
);


// ==========================================
// Button Events
// ==========================================

addQueryButton.addEventListener(
  "click",
  addQuery
);


generateButton.addEventListener(
  "click",
  buildFluxQuery
);


copyButton.addEventListener(
  "click",
  copyQuery
);


csvButton.addEventListener(
  "click",
  exportCSV
);


openEditorButton.addEventListener(
  "click",
  openEditor
);


closeEditorButton.addEventListener(
  "click",
  closeEditor
);


applyEditorButton.addEventListener(
  "click",
  applyEditorChanges
);


hierarchyTagKey.addEventListener(
  "change",
  populateHierarchyTagValues
);


addHierarchyButton.addEventListener(
  "click",
  addHierarchyItem
);


resetHierarchyButton.addEventListener(
  "click",
  resetHierarchy
);


// ==========================================
// Initialise
// ==========================================

queries.push(
  createDefaultQuery(1)
);


render();

renderHierarchy();
