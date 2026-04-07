/* global Splide */

// This is a fallback config in the event that the module json config is not found in the DOM.
const DEFAULT_MODULE_CONFIG = Object.freeze({
  /* eslint-disable camelcase */
  show_thumbnails: 'false',
  show_main_arrows: 'true',
  loop_slides: 'false',
  auto_advance: 'false',
  auto_advance_speed_seconds: '5',
  image_settings_sizing: 'static',
  image_settings_transition: 'slide',
  image_settings_caption_position: 'below',
  /* eslint-enable camelcase */
});

const getModuleConfig = moduleName => {
  const configJSONScript = document.querySelector(`[data-gallery_slider-config="config_${moduleName}"]`);
  if (configJSONScript) {
    return JSON.parse(configJSONScript.textContent);
  }
  return DEFAULT_MODULE_CONFIG;
};

const cleanAndWatchImages = sliderRoot => {
  const images = sliderRoot.querySelectorAll('img');

  // Options for the observer (which mutations to observe)
  const config = {
    attributes: true,
    attributeFilter: ['loading', 'height', 'width'],
  };

  const observer = new MutationObserver(mutationList => {
    /*
     * Splide removes `data-splide-lazy` attribute from images after they are loaded.
     * If the attribute is still present, remove the attributes that could affect the image loading.
     */

    for (const mutation of mutationList) {
      if (mutation.type === 'attributes' && mutation.target.dataset.splideLazy) {
        mutation.target.removeAttribute('loading');
        mutation.target.removeAttribute('width');
        mutation.target.removeAttribute('height');
      }
    }
  });

  // Clean up the images before, then observe them for changes.
  images.forEach(image => {
    image.removeAttribute('loading');
    image.removeAttribute('width');
    image.removeAttribute('height');

    observer.observe(image, config);
  });
};

const initGallerySliders = () => {
  const gallerySliders = document.querySelectorAll('[data-gallery_slider]');

  if (gallerySliders.length > 0) {
    gallerySliders.forEach(gallerySlider => {
      const sliderModuleName = gallerySlider.dataset.gallery_slider;
      const sliderConfig = getModuleConfig(sliderModuleName);
      const mainSlider = gallerySlider.querySelector('.splide__main');
      const thumbnailNav = gallerySlider.querySelector('.splide__nav');

      if (mainSlider) {
        const mainSliderConfig = {
          lazyLoad: 'nearby',
          classes: { arrows: 'splide__arrows hs-gallery-slider-main__arrow' },
        };

        if (sliderConfig?.slides_per_page > 1) {
          mainSliderConfig.perPage = parseInt(sliderConfig.slides_per_page, 10);
          mainSliderConfig.gap = parseInt(sliderConfig.gap_between_slides, 10);
        }

        mainSliderConfig.direction = sliderConfig?.direction || 'ltr';

        mainSliderConfig.arrows = sliderConfig?.show_main_arrows === 'true';
        mainSliderConfig.pagination = sliderConfig?.show_dots === 'true';

        mainSliderConfig.autoplay = sliderConfig?.auto_advance === 'true';
        mainSliderConfig.interval = sliderConfig?.auto_advance_speed_seconds ? parseInt(sliderConfig.auto_advance_speed_seconds, 10) * 1000 : 5000;

        mainSliderConfig.type = sliderConfig?.image_transition ? sliderConfig.image_transition : 'slide';

        if (sliderConfig?.loop_slides === 'true') {
          if (mainSliderConfig.type === 'slide') {
            mainSliderConfig.type = 'loop';
          } else {
            mainSliderConfig.rewind = true;
          }
        }

        if (sliderConfig?.splidei18n) {
          mainSliderConfig.i18n = sliderConfig.splidei18n;
        }

        const main = new Splide(mainSlider, mainSliderConfig);

        cleanAndWatchImages(main.root);

        if (thumbnailNav) {
          const thumbSliderConfig = {
            lazyLoad: 'nearby',
            preloadPages: 6,
            fixedWidth: parseInt(sliderConfig.thumbnail_width, 10),
            autoHeight: true,
            gap: 6,
            pagination: false,
            isNavigation: true,
            classes: { arrows: 'splide__arrows hs-gallery-slider-nav__arrow' },
            breakpoints: { 768: { fixedWidth: 135 } },
          };

          thumbSliderConfig.direction = sliderConfig?.direction || 'ltr';

          if (sliderConfig?.splidei18n) {
            thumbSliderConfig.i18n = sliderConfig.splidei18n;
          }

          const thumbnails = new Splide(thumbnailNav, thumbSliderConfig);

          cleanAndWatchImages(thumbnails.root);

          main.sync(thumbnails);
          main.mount();
          thumbnails.mount();
        } else {
          main.mount();
        }
      }
    });
  }
};

// Waits for Splide to be explicitly loaded before initializing the gallery sliders to account for embeds
const waitForSplide = () => {
  return new Promise(resolve => {
    // If Splide is already available, resolve immediately
    if (typeof window.Splide !== 'undefined') {
      resolve();
      return;
    }

    // Set up a property descriptor to watch for Splide being defined
    let value = window.Splide;
    Object.defineProperty(window, 'Splide', {
      configurable: true,
      enumerable: true,
      get() {
        return value;
      },
      set(newValue) {
        if (newValue !== undefined) {
          value = newValue;
          Object.defineProperty(window, 'Splide', {
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

// Initialize the gallery sliders when Splide is loaded
waitForSplide().then(() => {
  initGallerySliders();
});
