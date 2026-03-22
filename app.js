const DEFAULT_COMPARABLES = 3;

function renderPlaceholderRows(count = DEFAULT_COMPARABLES) {
  const tableBody = document.querySelector('#comparable-rows');
  const template = document.querySelector('#row-template');

  if (!tableBody || !template) {
    return;
  }

  tableBody.innerHTML = '';

  for (let index = 1; index <= count; index += 1) {
    const rowFragment = template.content.cloneNode(true);
    const headingCell = rowFragment.querySelector('th');

    if (headingCell) {
      headingCell.textContent = `Comp ${index}`;
    }

    tableBody.appendChild(rowFragment);
  }
}

function initializeAppShell() {
  renderPlaceholderRows();
}

document.addEventListener('DOMContentLoaded', initializeAppShell);
