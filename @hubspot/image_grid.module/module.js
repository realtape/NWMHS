/* global basicLightbox */
/* global fitty */

/**
 * Grab JSON configuration for the module from the HubL data.
 */

const getModuleConfig = moduleName => {
  const configJSONScript = document.querySelector(`[data-${moduleName}-config]`);
  if (configJSONScript) {
    return JSON.parse(configJSONScript.textContent);
  }
  return {};
};

const moduleConfig = getModuleConfig('image_grid');

const gridsToLightbox = document.querySelectorAll('[data-grid_action_type="lightbox"]');

const contentToFit = document.querySelectorAll('.hs-image__grid__item__overlay__content--fit');

const parser = new DOMParser();

const renderCloseButton = ariaLabel => {
  const closeButton = document.createElement('button');
  const closeButtonX = parser.parseFromString('&#x2715', 'text/html');
  closeButton.classList.add('hs-image__grid__lightbox__button--close');
  closeButton.setAttribute('aria-hidden', 'true');
  closeButton.setAttribute('aria-label', ariaLabel);
  closeButton.appendChild(closeButtonX.body.firstChild);
  return closeButton;
};

const renderNavButton = (direction, ariaLabel, iconMarkup) => {
  const button = document.createElement('button');
  const icon = parser.parseFromString(iconMarkup, 'text/html');
  button.setAttribute('data-direction', direction);
  button.setAttribute('aria-label', ariaLabel);
  button.classList.add('hs-image__grid__lightbox__button');
  button.classList.add(`hs-image__grid__lightbox__button--${direction === 1 ? 'next' : 'prev'}`);
  button.classList.add('hs-image__grid__lightbox__button--hide');
  button.appendChild(icon.body.firstChild);
  return button;
};

const renderLightboxImage = (link, data) => {
  const image = document.createElement('img');
  image.classList.add('hs-image__grid__lightbox__image');
  image.src = data.lb_image_src;
  if (link.url?.href) {
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', link.url.href);
    linkElement.setAttribute('rel', link.rel);
    if (link.open_in_new_tab) {
      linkElement.setAttribute('target', '_blank');
    }
    linkElement.appendChild(image);
    return linkElement;
  }
  return image;
};

const renderLightboxElement = data => {
  const link = data.lb_href !== 'null' ? JSON.parse(data.lb_href) : false;
  const lightboxElement = document.createElement('div');
  lightboxElement.classList.add(moduleConfig.name_class);
  lightboxElement.classList.add('hs-image__grid__lightbox');

  lightboxElement.appendChild(renderNavButton(-1, moduleConfig.aria_previous_button_label, moduleConfig?.previous_page_icon_markup));
  lightboxElement.appendChild(renderLightboxImage(link, data));
  lightboxElement.appendChild(renderNavButton(1, moduleConfig.aria_next_button_label, moduleConfig?.next_page_icon_markup));
  lightboxElement.appendChild(renderCloseButton(moduleConfig.aria_close_button_label));

  return lightboxElement;
};

const trapLightboxFocus = lightBox => {
  const focusableElements = 'button:not(.hs-image__grid__lightbox__button--hide), [href], [tabindex]:not([tabindex="-1"])';

  const firstFocusableElement = lightBox.querySelectorAll(focusableElements)[0]; // get first element to be focused inside modal
  const focusableContent = lightBox.querySelectorAll(focusableElements);
  const lastFocusableElement = focusableContent[focusableContent.length - 1]; // get last element to be focused inside modal

  document.addEventListener('keydown', function (e) {
    let isTabPressed = e.key === 'Tab';

    if (!isTabPressed) {
      return;
    }

    if (e.shiftKey && document.activeElement === firstFocusableElement) {
      // if shift key pressed for shift + tab combination
      lastFocusableElement.focus(); // add focus for the last focusable element
      e.preventDefault();
    } else if (!e.shiftKey && document.activeElement === lastFocusableElement) {
      /*
       * if tab key is pressed
       * if focused has reached to last focusable element then focus first focusable element after pressing tab
       */
      firstFocusableElement.focus(); // add focus for the first focusable element
      e.preventDefault();
    }
  });

  firstFocusableElement.focus();
};

const activateCloseButton = lightBox => {
  lightBox.element().addEventListener('click', () => {
    lightBox.close();
  });
};

const activateLightboxKeyboardNav = lightBox => {
  trapLightboxFocus(lightBox.element());
  activateCloseButton(lightBox);
};

const initGridLightbox = gridListItems => {
  // Skip if this grid's items are already initialized
  if (gridListItems.dataset.lightboxInitialized) {
    return;
  }

  const lightboxItems = Array.from(gridListItems.querySelectorAll('.hs-image__grid__list__item')).map(item => {
    const lightBoxElement = basicLightbox.create(renderLightboxElement(item.dataset));

    item.addEventListener('click', () => {
      lightBoxElement.show(activateLightboxKeyboardNav);
    });

    return lightBoxElement;
  });

  // Mark this grid as initialized
  gridListItems.dataset.lightboxInitialized = 'true';

  if (lightboxItems.length > 1) {
    lightboxItems.forEach(lightBoxElement => {
      const lightBoxButtons = lightBoxElement.element().querySelectorAll('button.hs-image__grid__lightbox__button');

      lightBoxButtons.forEach(button => {
        const direction = parseInt(button.dataset.direction, 10);
        const currentLightbox = lightboxItems.indexOf(lightBoxElement);
        const nextLightbox = currentLightbox + direction;

        if (nextLightbox >= 0 && nextLightbox <= lightboxItems.length - 1) {
          button.classList.remove('hs-image__grid__lightbox__button--hide');
        }

        button.addEventListener('click', () => {
          lightBoxElement.close(() => {
            lightboxItems[nextLightbox].show(activateLightboxKeyboardNav);
          });
        });
      });
    });
  }
};

const initImageGrid = () => {
  const inEditor = moduleConfig?.in_editor;
  const overlayFontMaxSize = moduleConfig?.overlay_font_max_size || 32;

  if (gridsToLightbox && !inEditor) {
    gridsToLightbox.forEach(gridListItems => {
      initGridLightbox(gridListItems);
    });
  }

  if (contentToFit) {
    fitty('.hs-image__grid__item__overlay__content--fit', {
      minSize: 12,
      maxSize: parseInt(overlayFontMaxSize, 10),
    });
    setTimeout(() => {
      fitty.fitAll();
    }, 200);
  }
};

// Wait for a specific library to be loaded
const waitForLibrary = (libraryName) => {
  return new Promise(resolve => {
    // If library is already available, resolve immediately
    if (typeof window[libraryName] !== 'undefined') {
      resolve();
      return;
    }

    // Set up a property descriptor to watch for library being defined
    let value = window[libraryName];
    Object.defineProperty(window, libraryName, {
      configurable: true,
      enumerable: true,
      get() {
        return value;
      },
      set(newValue) {
        if (newValue !== undefined) {
          value = newValue;
          Object.defineProperty(window, libraryName, {
            configurable: true,
            enumerable: true,
            writable: true,
            value: value,
          });
          resolve();
          return;
        }
      },
    });
  });
};

// Wait for both libraries to be loaded before initializing
Promise.all([
  waitForLibrary('fitty'),
  waitForLibrary('basicLightbox')
]).then(() => {
  initImageGrid();
});
