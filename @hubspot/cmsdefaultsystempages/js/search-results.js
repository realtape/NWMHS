const generateResultText = resultCount => {
  return `${resultCount | 'No'} result${resultCount !== 1 ? 's' : ''} found`;
};

const open = XMLHttpRequest.prototype.open;

// Overwrite the native method
XMLHttpRequest.prototype.open = function () {
  // Assign an event listener
  this.addEventListener(
    'load',
    event => {
      const urlString = event.currentTarget.responseURL;
      if (
        urlString.includes('/_hcms/search') &&
         ( 200 <= event.target.status && event.target.status < 400 )
      ) {
        const resultData = JSON.parse(event.currentTarget.responseText);
        const target = document.querySelector('.search-results__page-count');
        target.textContent = generateResultText(resultData.total);
      }
    },
    false
  );
  // Call the stored reference to the native method
  open.apply(this, arguments);
};
