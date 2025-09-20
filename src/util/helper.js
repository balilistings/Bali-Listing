const sortTags = (tags = []) => {
  const sortArr = ['weekly', 'monthly', 'yearly'];

  const sortedTags = tags.sort((a, b) => {
    const aIndex = sortArr.indexOf(a);
    const bIndex = sortArr.indexOf(b);
    return aIndex - bIndex;
  });

  const capitalizedTags = sortedTags.map(capitaliseFirstLetter);

  return sortedTags;
};

const capitaliseFirstLetter = str => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export { sortTags, capitaliseFirstLetter };
