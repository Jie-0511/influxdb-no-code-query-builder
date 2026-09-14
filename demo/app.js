const bucket = document.getElementById("bucket");
const measurement = document.getElementById("measurement");
const field = document.getElementById("field");
const tagKey = document.getElementById("tagKey");
const tagValue = document.getElementById("tagValue");
const aggregation = document.getElementById("aggregation");
const timeRange = document.getElementById("timeRange");

const generateButton = document.getElementById("generateButton");
const copyButton = document.getElementById("copyButton");
const queryOutput = document.getElementById("queryOutput");

function generateFluxQuery() {
  const query = `from(bucket: "${bucket.value}")
  |> range(start: ${timeRange.value})
  |> filter(fn: (r) => r._measurement == "${measurement.value}")
  |> filter(fn: (r) => r._field == "${field.value}")
  |> filter(fn: (r) => r.${tagKey.value} == "${tagValue.value}")
  |> aggregateWindow(every: 5m, fn: ${aggregation.value}, createEmpty: false)
  |> yield(name: "${aggregation.value}")`;

  queryOutput.textContent = query;
}

async function copyQuery() {
  const text = queryOutput.textContent;

  if (!text || text.includes("Select your query options")) {
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    copyButton.textContent = "Copied!";

    setTimeout(() => {
      copyButton.textContent = "Copy Query";
    }, 1500);
  } catch (error) {
    copyButton.textContent = "Copy failed";
  }
}

generateButton.addEventListener("click", generateFluxQuery);
copyButton.addEventListener("click", copyQuery);
