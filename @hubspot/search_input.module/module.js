var hsSearch = function (_instance) {
  var TYPEAHEAD_LIMIT = 3;
  var KEYS = {
    TAB: 'Tab',
    ESC: 'Esc', // IE11 & Edge 16 value for Escape
    ESCAPE: 'Escape',
    UP: 'Up', // IE11 & Edge 16 value for Arrow Up
    ARROW_UP: 'ArrowUp',
    DOWN: 'Down', // IE11 & Edge 16 value for Arrow Down
    ARROW_DOWN: 'ArrowDown',
  };
  var searchTerm = '';
  var searchForm = _instance;
  var searchField = _instance.querySelector('.hs-search-field__input');
  var searchResults = _instance.querySelector('.hs-search-field__suggestions');

  const addTypeParamsFromUrl = function (formParams) {
    const validContentTypesElement = document.getElementById('hs-search-input__valid-content-types');

    if (validContentTypesElement) {
      try {
        const validContentTypes = Object.freeze(JSON.parse(validContentTypesElement.textContent));
        const urlParams = new URLSearchParams(window.location.search);
        const typeParams = urlParams.getAll('type');
        let newParams = [];

        typeParams.forEach(function (typeValue) {
          // Skip if the type is not in the valid content types
          if (!validContentTypes.includes(typeValue)) {
            return;
          }

          // Add the type param if it's not already in the form params
          const typeParam = 'type=' + encodeURIComponent(typeValue);
          newParams.push(typeParam);
        });

        return newParams.length > 0 ? newParams : formParams;
      } catch (e) {
        console.warn('Error parsing valid content types:', e); // eslint-disable-line no-
      }
    }

    /*
     * If no valid content types, return the original form params
     * Ensures that the search still works if the valid content types element is not present
     */

    return formParams;
  };

  const searchOptions = function () {
    let formParams = [];
    const form = _instance.querySelector('form');
    for (let i = 0; i < form.querySelectorAll('input[type=hidden]').length; i++) {
      const e = form.querySelectorAll('input[type=hidden]')[i];
      if (e.name !== 'limit') {
        formParams.push(encodeURIComponent(e.name) + '=' + encodeURIComponent(e.value));
      }
    }

    const newParams = addTypeParamsFromUrl(formParams);

    return newParams.join('&');
  };

  var debounce = function (func, wait, immediate) {
    var timeout;
    return function () {
      var context = this;
      var args = arguments;
      var later = function () {
        timeout = null;
        if (!immediate) {
          func.apply(context, args);
        }
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait || 200);
      if (callNow) {
        func.apply(context, args);
      }
    };
  };
  var emptySearchResults = function () {
    searchResults.innerHTML = '';
    searchField.focus();
    searchForm.classList.remove('hs-search-field--open');
  };
  var fillSearchResults = function (response) {
    var items = [];
    items.push("<li id='results-for'>Results for \"" + response.searchTerm + '"</li>');
    response.results.forEach(function (val, index) {
      items.push("<li id='result" + index + "'><a href='" + val.url + "'>" + val.title + '</a></li>');
    });

    emptySearchResults();
    searchResults.innerHTML = items.join('');
    searchForm.classList.add('hs-search-field--open');
  };
  var getSearchResults = function () {
    var request = new XMLHttpRequest();
    var requestUrl =
      '/_hcms/search?&term=' +
      encodeURIComponent(searchTerm) +
      '&limit=' +
      encodeURIComponent(TYPEAHEAD_LIMIT) +
      '&autocomplete=true&analytics=true&' +
      searchOptions();

    request.open('GET', requestUrl, true);
    request.onload = function () {
      if (request.status >= 200 && request.status < 400) {
        var data = JSON.parse(request.responseText);
        if (data.total > 0) {
          fillSearchResults(data);
          trapFocus();
        } else {
          emptySearchResults();
        }
      } else {
        console.error('Server reached, error retrieving results.');
      }
    };
    request.onerror = function () {
      console.error('Could not reach the server.');
    };
    request.send();
  };
  var trapFocus = function () {
    var tabbable = [];
    tabbable.push(searchField);
    var tabbables = searchResults.getElementsByTagName('A');
    for (var i = 0; i < tabbables.length; i++) {
      tabbable.push(tabbables[i]);
    }
    var firstTabbable = tabbable[0];
    var lastTabbable = tabbable[tabbable.length - 1];
    var tabResult = function (e) {
      if (e.target == lastTabbable && !e.shiftKey) {
        e.preventDefault();
        firstTabbable.focus();
      } else if (e.target == firstTabbable && e.shiftKey) {
        e.preventDefault();
        lastTabbable.focus();
      }
    };
    var nextResult = function (e) {
      e.preventDefault();
      if (e.target == lastTabbable) {
        firstTabbable.focus();
      } else {
        tabbable.forEach(function (el) {
          if (el == e.target) {
            tabbable[tabbable.indexOf(el) + 1].focus();
          }
        });
      }
    };
    var lastResult = function (e) {
      e.preventDefault();
      if (e.target == firstTabbable) {
        lastTabbable.focus();
      } else {
        tabbable.forEach(function (el) {
          if (el == e.target) {
            tabbable[tabbable.indexOf(el) - 1].focus();
          }
        });
      }
    };

    searchForm.addEventListener('keydown', function (e) {
      switch (e.key) {
        case KEYS.TAB:
          tabResult(e);
          break;
        case KEYS.ESC:
        case KEYS.ESCAPE:
          emptySearchResults();
          break;
        case KEYS.UP:
        case KEYS.ARROW_UP:
          lastResult(e);
          break;
        case KEYS.DOWN:
        case KEYS.ARROW_DOWN:
          nextResult(e);
          break;
      }
    });
  };
  var isSearchTermPresent = debounce(function () {
    searchTerm = searchField.value;
    if (searchTerm.length > 2) {
      getSearchResults();
    } else if (searchTerm.length == 0) {
      emptySearchResults();
    }
  }, 250);
  var init = (function () {
    searchField.addEventListener('input', function (e) {
      if (searchTerm != searchField.value) {
        isSearchTermPresent();
      }
    });

    searchForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const form = e.target;
      const searchInput = form.querySelector('.hs-search-field__input');
      const searchTerm = encodeURIComponent(searchInput.value);

      // Get the action URL from the form
      let redirectUrl = form.getAttribute('action');

      // Append the search term to the URL
      redirectUrl += (redirectUrl.includes('?') ? '&' : '?') + 'term=' + searchTerm;

      // Get the current form parameters
      const currentParams = searchOptions();

      // Append the current parameters to the redirect URL
      if (currentParams) {
        redirectUrl += '&' + currentParams;
      }

      // Redirect to the search results page
      window.location.href = redirectUrl;
    });
  })();
};

if (document.attachEvent ? document.readyState === 'complete' : document.readyState !== 'loading') {
  var searchResults = document.querySelectorAll('.hs-search-field');
  Array.prototype.forEach.call(searchResults, function (el) {
    var hsSearchModule = hsSearch(el);
  });
} else {
  document.addEventListener('DOMContentLoaded', function () {
    var searchResults = document.querySelectorAll('.hs-search-field');
    Array.prototype.forEach.call(searchResults, function (el) {
      var hsSearchModule = hsSearch(el);
    });
  });

  // Watch for event listeners on the search form
}
