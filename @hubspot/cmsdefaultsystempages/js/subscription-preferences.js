(function() {
  const parentContainer = document.querySelector(".email-prefs");
  const emailGlobalUnsub = document.querySelector('input[name="globalunsub"]');
  const emailSubCheckboxes = document.querySelectorAll('#email-prefs-form .item input');

  function domReady(callback) {
    if (['interactive', 'complete'].indexOf(document.readyState) >= 0) {
      callback();
    } else {
      document.addEventListener('DOMContentLoaded', callback);
    }
  }

  function uncheckUnsubIndividualCheckboxes () {
    emailSubCheckboxes.forEach((element) => {
      element.checked = false;
    });
  }

  function uncheckUnsubAllCheckbox() {
    emailGlobalUnsub.checked = false;
  }
  function handleCheckboxChange (event) {
    if (event.target.type === 'checkbox' && event.target.checked) {
      if (event.target.name === 'globalunsub') {
        uncheckUnsubIndividualCheckboxes();
      } else {
        uncheckUnsubAllCheckbox();
      }
    }
  }

  domReady(() => {
    if (!document.body) {
      return;
    } else if (parentContainer) {
      parentContainer.addEventListener('change', handleCheckboxChange);
    }
  });
})();
