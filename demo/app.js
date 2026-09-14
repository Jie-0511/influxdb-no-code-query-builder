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
        ]

      }

    }

  }

};


// ==========================================
// Application State
// ==========================================

let queries = [];

let currentQueryId = 1;

let nextQueryId = 2;

let hierarchy = [];


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

const startDate = document.getElementById("startDate");
const startClock = document.getElementById("startClock");
const stopDate = document.getElementById("stopDate");
const stopClock = document.getElementById("stopClock");

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


const hierarchyTagKey =
  document.getElementById("hierarchyTagKey");

const hierarchyTagValue =
  document.getElementById("hierarchyTagValue");

const hierarchyTree =
  document.getElementById("hierarchyTree");

const addHierarchyButton =
  document.getElementById("addHierarchyButton");

const resetHierarchyButton =
  document.getElementById("resetHierarchyButton");


// ==========================================
// Query State Helpers
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

    startDate: "",
    startClock: "",
    stopDate: "",
    stopClock: "",

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
      query.id === currentQueryId
  );

}


// ==========================================
// Populate Select Helpers
// ==========================================

function setSelectOptions(
  select,
  values,
  selectedValue
) {

  select.innerHTML = "";

  values.forEach(value => {

    const option =
      document.createElement("option");

    option.value = value;

    option.textContent = value;

    select.appendChild(option);

  });


  if (
    values.includes(selectedValue)
  ) {

    select.value =
      selectedValue;

  }

}


// ==========================================
// Dynamic Query Data
// ==========================================

function populateBuckets() {

  const query =
    getCurrentQuery();

  const buckets =
    Object.keys(mockData);

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


  const tagKeys =
    Object.keys(tags);


  if (
    !tagKeys.includes(
      query.tagKey
    )
  ) {

    query.tagKey =
      tagKeys[0];

  }


  setSelectOptions(
    tagKeySelect,
    tagKeys,
    query.tagKey
  );

}


function populateTagValues() {

  const query =
    getCurrentQuery();


  const tagValues =
    mockData[
      query.bucket
    ][
      query.measurement
    ].tags[
      query.tagKey
    ];


  if (
    !tagValues.includes(
      query.tagValue
    )
  ) {

    query.tagValue =
      tagValues[0];

  }


  setSelectOptions(
    tagValueSelect,
    tagValues,
    query.tagValue
  );

}


// ==========================================
// Render Query Tabs
// ==========================================

function renderQueryTabs() {

  queryTabs.innerHTML = "";


  queries.forEach(query => {

    const tab =
      document.createElement("div");


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
      document.createElement("span");

    title.textContent =
      `Query ${query.id}`;


    title.addEventListener(
      "click",
      () => {

        saveCurrentUIState();

        currentQueryId =
          query.id;

        render();

      }
    );


    tab.appendChild(title);


    if (
      queries.length > 1
    ) {

      const remove =
        document.createElement(
          "button"
        );

      remove.className =
        "query-remove";

      remove.textContent =
        "×";


      remove.addEventListener(
        "click",
        event => {

          event.stopPropagation();

          removeQuery(
            query.id
          );

        }
      );


      tab.appendChild(
        remove
      );

    }


    queryTabs.appendChild(
      tab
    );

  });

}


// ==========================================
// Add / Remove Query
// ==========================================

function addQuery() {

  saveCurrentUIState();


  const newQuery =
    createDefaultQuery(
      nextQueryId
    );


  queries.push(
    newQuery
  );


  currentQueryId =
    nextQueryId;


  nextQueryId++;


  render();

}


function removeQuery(id) {

  if (
    queries.length === 1
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

    const fallback =
      queries[
        Math.max(
          0,
          index - 1
        )
      ];


    currentQueryId =
      fallback.id;

  }


  render();

}


// ==========================================
// Save Current UI State
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

  query.startDate = startDate.value;
  
  query.startClock = startClock.value;
  
  query.stopDate = stopDate.value;
  
  query.stopClock = stopClock.value;

  query.aggregationFunction =
    aggregationFunction.value;

  query.aggregationInterval =
    aggregationInterval.value;

}


// ==========================================
// Render Current Query
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


  startDate.value = query.startDate;
  startClock.value = query.startClock;
  stopDate.value = query.stopDate;
  stopClock.value = query.stopClock;

  if (
    query.timeMode ===
    "custom"
  ) {

    customTimeFields
      .classList
      .remove(
        "hidden"
      );

    relativeTime
      .classList
      .add(
        "hidden"
      );

  }

  else {

    customTimeFields
      .classList
      .add(
        "hidden"
      );

    relativeTime
      .classList
      .remove(
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


  updateHierarchySelectors();

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


  if (
    save
  ) {

    saveCurrentUIState();

  }

}


// ==========================================
// Flux Query Generation
// ==========================================

function buildFluxQuery() {

  saveCurrentUIState();


  const query =
    getCurrentQuery();


  let rangeClause;


  if (
  query.timeMode === "custom" &&
  query.startDate &&
  query.startClock &&
  query.stopDate &&
  query.stopClock
) {

    const startISO = new Date(
  `${query.startDate}T${query.startClock}`
).toISOString();
    const stopISO = new Date(
      `${query.stopDate}T${query.stopClock}`
    ).toISOString();
    
    rangeClause =
      `|> range(start: time(v: "${startISO}"), stop: time(v: "${stopISO}"))`;
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


  return flux;

}


// ==========================================
// Copy Query
// ==========================================

async function copyQuery() {

  const query =
    getCurrentQuery();


  if (
    !query.generatedQuery
  ) {

    buildFluxQuery();

  }


  try {

    await navigator.clipboard.writeText(
      getCurrentQuery()
        .generatedQuery
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

  const query =
    getCurrentQuery();


  if (
    !query.generatedQuery
  ) {

    buildFluxQuery();

  }


  queryEditor.value =
    getCurrentQuery()
      .generatedQuery;


  editorPanel
    .classList
    .remove(
      "hidden"
    );


  editorPanel.scrollIntoView({
    behavior: "smooth"
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
      ).toISOString(),

      "41.9",

      query.tagValue
    ],

    [
      new Date(
        Date.now() -
        120000
      ).toISOString(),

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


  const link =
    document.createElement(
      "a"
    );


  link.href =
    URL.createObjectURL(
      blob
    );


  link.download =
    `query-${query.id}-results.csv`;


  link.click();


  URL.revokeObjectURL(
    link.href
  );

}


// ==========================================
// User Defined Hierarchy
// ==========================================

function updateHierarchySelectors() {

  const query =
    getCurrentQuery();


  const tags =
    mockData[
      query.bucket
    ][
      query.measurement
    ].tags;


  const keys =
    Object.keys(tags);


  setSelectOptions(
    hierarchyTagKey,
    keys,
    hierarchyTagKey.value ||
    keys[0]
  );


  updateHierarchyValues();

}


function updateHierarchyValues() {

  const query =
    getCurrentQuery();


  const values =
    mockData[
      query.bucket
    ][
      query.measurement
    ].tags[
      hierarchyTagKey.value
    ] || [];


  setSelectOptions(
    hierarchyTagValue,
    values,
    hierarchyTagValue.value ||
    values[0]
  );

}


function addHierarchyItem() {

  const item = {

    key:
      hierarchyTagKey.value,

    value:
      hierarchyTagValue.value

  };


  hierarchy.push(
    item
  );


  renderHierarchy();

}


function renderHierarchy() {

  hierarchyTree.innerHTML =
    "";


  if (
    hierarchy.length === 0
  ) {

    hierarchyTree.innerHTML =
      '<p class="section-description">No hierarchy items added yet.</p>';

    return;

  }


  hierarchy.forEach(
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
        `<strong>${index + 1}. ${item.key}</strong>
         <div class="hierarchy-child">
           ↳ ${item.value}
         </div>`;


      hierarchyTree.appendChild(
        node
      );

    }
  );

}


function resetHierarchy() {

  hierarchy = [];

  renderHierarchy();

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


    render();

  }
);


fieldSelect.addEventListener(
  "change",
  () => {

    getCurrentQuery()
      .field =
      fieldSelect.value;

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


    populateTagValues();

    updateHierarchySelectors();

  }
);


tagValueSelect.addEventListener(
  "change",
  () => {

    getCurrentQuery()
      .tagValue =
      tagValueSelect.value;

  }
);


// ==========================================
// Time Events
// ==========================================

timeMode.addEventListener(
  "change",
  () => {

    getCurrentQuery()
      .timeMode =
      timeMode.value;

    render();

  }
);


relativeTime.addEventListener(
  "change",
  () => {

    getCurrentQuery()
      .relativeTime =
      relativeTime.value;

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


customModeButton.addEventListener(
  "click",
  () => {

    setAggregationMode(
      "custom"
    );

  }
);


autoModeButton.addEventListener(
  "click",
  () => {

    setAggregationMode(
      "auto"
    );

  }
);


aggregationFunction.addEventListener(
  "change",
  saveCurrentUIState
);


aggregationInterval.addEventListener(
  "change",
  saveCurrentUIState
);


hierarchyTagKey.addEventListener(
  "change",
  updateHierarchyValues
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
