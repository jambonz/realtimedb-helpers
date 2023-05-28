function generateSortedSetValue(value) {
  return `${Date.now()}:${value}`;
}

function resolveSortedSetValue(value) {
  const idx = value.indexOf(':');
  if (idx) {
    value = value.substring(idx + 1);
  }
  return value;
}

module.exports = {
  generateSortedSetValue,
  resolveSortedSetValue
};
