const MIN_COMPARABLES = 3;
const MAX_COMPARABLES = 10;
const DEFAULT_DECIMALS = 0;
const DEFAULT_COMPARABLES = 3;
const SAMPLE_ROWS = [
  { weight: 25, price: 410000 },
  { weight: 35, price: 425000 },
  { weight: 40, price: 438000 },
  { weight: 0, price: 0 },
  { weight: 0, price: 0 },
  { weight: 0, price: 0 },
  { weight: 0, price: 0 },
  { weight: 0, price: 0 },
  { weight: 0, price: 0 },
  { weight: 0, price: 0 },
];

const state = {
  comparableCount: DEFAULT_COMPARABLES,
  decimals: DEFAULT_DECIMALS,
  comparables: Array.from({ length: MAX_COMPARABLES }, () => ({
    weight: '',
    price: '',
  })),
};

function clampComparableCount(value) {
  return Math.min(MAX_COMPARABLES, Math.max(MIN_COMPARABLES, value));
}

function parseNumericInput(value) {
  if (value === '' || value === null || Number.isNaN(Number(value))) {
    return null;
  }

  return Number(value);
}

function formatNumber(value, decimals = state.decimals) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

function formatCurrency(value, decimals = state.decimals) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

function getStatusMessage(calculation) {
  if (!calculation.validRows) {
    return 'Enter at least one weight and adjusted sale price to begin calculating.';
  }

  if (calculation.totalWeight <= 0) {
    return 'Total weight must be greater than 0 to calculate a weighted average.';
  }

  return `Weighted average updated from ${calculation.validRows} populated comparable${calculation.validRows === 1 ? '' : 's'}.`;
}

function calculateTotals() {
  let totalWeight = 0;
  let totalContribution = 0;
  let validRows = 0;

  const rowResults = state.comparables.slice(0, state.comparableCount).map((comparable) => {
    const weight = parseNumericInput(comparable.weight);
    const price = parseNumericInput(comparable.price);

    if (weight !== null && price !== null) {
      const contribution = weight * price;
      totalWeight += weight;
      totalContribution += contribution;
      validRows += 1;

      return { weight, price, contribution, complete: true };
    }

    return { weight, price, contribution: 0, complete: false };
  });

  const weightedAverage = totalWeight > 0 ? totalContribution / totalWeight : 0;

  return {
    totalWeight,
    totalContribution,
    weightedAverage,
    validRows,
    rowResults,
  };
}

function updateStatus(message, type = 'info') {
  const statusMessage = document.querySelector('#status-message');

  if (!statusMessage) {
    return;
  }

  statusMessage.textContent = message;
  statusMessage.dataset.status = type;
}

function updateSummary(calculation) {
  const totalWeightCell = document.querySelector('#total-weight-cell');
  const totalContributionCell = document.querySelector('#total-contribution-cell');
  const weightedAverageCell = document.querySelector('#weighted-average-cell');
  const precisionLabel = document.querySelector('#precision-label');
  const copyButton = document.querySelector('#copy-button');

  if (totalWeightCell) {
    totalWeightCell.textContent = formatNumber(calculation.totalWeight);
  }

  if (totalContributionCell) {
    totalContributionCell.textContent = formatCurrency(calculation.totalContribution);
  }

  if (weightedAverageCell) {
    weightedAverageCell.textContent = formatCurrency(calculation.weightedAverage);
  }

  if (precisionLabel) {
    precisionLabel.textContent = `Display precision: ${state.decimals} decimal${state.decimals === 1 ? '' : 's'}`;
  }

  if (copyButton) {
    copyButton.disabled = calculation.validRows === 0 || calculation.totalWeight <= 0;
  }
}

function syncRowValues(rowElement, comparable, rowResult, index) {
  const label = rowElement.querySelector('[data-role="label"]');
  const weightInput = rowElement.querySelector('[data-field="weight"]');
  const priceInput = rowElement.querySelector('[data-field="price"]');
  const contributionValue = rowElement.querySelector('[data-role="contribution"]');

  if (label) {
    label.textContent = `Comp ${index + 1}`;
  }

  if (weightInput) {
    weightInput.value = comparable.weight;
    weightInput.setAttribute('aria-label', `Comparable ${index + 1} weight`);
  }

  if (priceInput) {
    priceInput.value = comparable.price;
    priceInput.setAttribute('aria-label', `Comparable ${index + 1} adjusted sale price`);
  }

  if (contributionValue) {
    contributionValue.textContent = rowResult.complete
      ? formatCurrency(rowResult.contribution)
      : 'Awaiting data';
    contributionValue.classList.toggle('value-chip--muted', !rowResult.complete);
  }
}

function updateRenderedRows(calculation) {
  const rows = document.querySelectorAll('#comparable-rows tr');

  rows.forEach((rowElement, index) => {
    syncRowValues(rowElement, state.comparables[index], calculation.rowResults[index], index);
  });
}

function handleComparableInput(event) {
  const index = Number(event.target.dataset.index);
  const field = event.target.dataset.field;

  if (Number.isNaN(index) || !field) {
    return;
  }

  state.comparables[index][field] = event.target.value;
  refreshCalculatedDisplay();
}

function createRow(index, comparable, rowResult) {
  const template = document.querySelector('#row-template');

  if (!template) {
    return null;
  }

  const rowFragment = template.content.cloneNode(true);
  const rowElement = rowFragment.querySelector('tr');
  const weightInput = rowElement.querySelector('[data-field="weight"]');
  const priceInput = rowElement.querySelector('[data-field="price"]');

  if (weightInput) {
    weightInput.dataset.index = String(index);
    weightInput.addEventListener('input', handleComparableInput);
  }

  if (priceInput) {
    priceInput.dataset.index = String(index);
    priceInput.addEventListener('input', handleComparableInput);
  }

  syncRowValues(rowElement, comparable, rowResult, index);
  return rowFragment;
}

function renderRows() {
  const tableBody = document.querySelector('#comparable-rows');

  if (!tableBody) {
    return;
  }

  const calculation = calculateTotals();
  tableBody.innerHTML = '';

  for (let index = 0; index < state.comparableCount; index += 1) {
    const row = createRow(index, state.comparables[index], calculation.rowResults[index]);

    if (row) {
      tableBody.appendChild(row);
    }
  }

  updateSummary(calculation);
  updateStatus(getStatusMessage(calculation), calculation.totalWeight > 0 ? 'success' : 'info');
}

function refreshCalculatedDisplay() {
  const calculation = calculateTotals();
  updateRenderedRows(calculation);
  updateSummary(calculation);
  updateStatus(getStatusMessage(calculation), calculation.totalWeight > 0 ? 'success' : 'info');
}

function setComparableCount(count) {
  state.comparableCount = clampComparableCount(count);
  renderRows();
}

function setDecimals(value) {
  state.decimals = Number(value);
  refreshCalculatedDisplay();
}

function resetValues() {
  state.comparables = Array.from({ length: MAX_COMPARABLES }, () => ({
    weight: '',
    price: '',
  }));
  renderRows();
}

function loadSampleData() {
  state.comparableCount = DEFAULT_COMPARABLES;
  state.comparables = SAMPLE_ROWS.map((row) => ({
    weight: row.weight ? String(row.weight) : '',
    price: row.price ? String(row.price) : '',
  }));

  const comparableCount = document.querySelector('#comparable-count');
  if (comparableCount) {
    comparableCount.value = String(DEFAULT_COMPARABLES);
  }

  renderRows();
}

async function exportPreviewImage() {
  const preview = document.querySelector('#report-preview');

  if (!preview || typeof window.htmlToImage?.toBlob !== 'function') {
    updateStatus('Image export library is unavailable in this browser.', 'error');
    return;
  }

  try {
    updateStatus('Generating report image for clipboard export...', 'info');

    const blob = await window.htmlToImage.toBlob(preview, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
    });

    if (!blob) {
      throw new Error('Image export returned an empty file.');
    }

    if (navigator.clipboard && window.ClipboardItem) {
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);

      updateStatus('Report copied as an image. You can now paste it into the appraisal report.', 'success');
      return;
    }

    const downloadUrl = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = downloadUrl;
    downloadLink.download = 'weighted-average-report.png';
    downloadLink.click();
    URL.revokeObjectURL(downloadUrl);
    updateStatus('Clipboard image copy is not supported here, so the PNG was downloaded instead.', 'info');
  } catch (error) {
    updateStatus(`Unable to export the report image: ${error.message}`, 'error');
  }
}

function bindControls() {
  const comparableCount = document.querySelector('#comparable-count');
  const decimalControls = document.querySelectorAll('input[name="decimals"]');
  const sampleButton = document.querySelector('#sample-button');
  const resetButton = document.querySelector('#reset-button');
  const copyButton = document.querySelector('#copy-button');

  comparableCount?.addEventListener('change', (event) => {
    setComparableCount(Number(event.target.value));
  });

  decimalControls.forEach((control) => {
    control.addEventListener('change', (event) => {
      setDecimals(event.target.value);
    });
  });

  sampleButton?.addEventListener('click', loadSampleData);
  resetButton?.addEventListener('click', resetValues);
  copyButton?.addEventListener('click', exportPreviewImage);
}

function initializeApp() {
  bindControls();
  renderRows();
}

document.addEventListener('DOMContentLoaded', initializeApp);
