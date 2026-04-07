/**
 * Configuration
 */

// Arrow navigation delay
const determineDelay = tabList => {
  if (!tabList.hasAttribute('data-delay')) {
    return 0;
  }
  const delayValue = tabList.getAttribute('data-delay');
  const defaultDelay = 300;
  return delayValue || defaultDelay;
};

/**
 * Utilities
 */

const isOutOfContainerViewport = (container, el) => {
  const bounding = el.getBoundingClientRect();
  const containerBounding = container.getBoundingClientRect();
  const out = {};
  out.top = bounding.top < containerBounding.top;
  out.left = bounding.left < containerBounding.left;
  out.bottom = bounding.bottom > containerBounding.bottom;
  out.right = bounding.right > containerBounding.right;
  out.any = out.top || out.left || out.bottom || out.right;
  out.all = out.top && out.left && out.bottom && out.right;

  return out;
};

const debounce = (callback, wait) => {
  let timeout;
  return (...args) => {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => callback.apply(context, args), wait);
  };
};

/**
 * Helpers
 */

const showNudge = (tabsContainer, nudgeArrowLeft, nudgeArrowRight) => {
  const scrollContainer = tabsContainer.querySelector('.hs-tabs__scroll');
  const allTabs = tabsContainer.querySelectorAll('.hs-tabs__tab');

  if (isOutOfContainerViewport(scrollContainer, allTabs[0]).left) {
    nudgeArrowLeft.classList.add('hs-tabs__nudge--show');
    nudgeArrowLeft.classList.remove('hs-tabs__nudge--mobile-disabled');
  } else {
    nudgeArrowLeft.classList.remove('hs-tabs__nudge--show');
    nudgeArrowLeft.classList.add('hs-tabs__nudge--mobile-disabled');
  }

  if (
    isOutOfContainerViewport(scrollContainer, allTabs[allTabs.length - 1]).right
  ) {
    nudgeArrowRight.classList.add('hs-tabs__nudge--show');
    nudgeArrowRight.classList.remove('hs-tabs__nudge--mobile-disabled');
  } else {
    nudgeArrowRight.classList.remove('hs-tabs__nudge--show');
    nudgeArrowRight.classList.add('hs-tabs__nudge--mobile-disabled');
  }
};

const nextViewableTab = (
  direction,
  tabsContainer,
  nudgeArrowLeft,
  nudgeArrowRight
) => {
  Array.from(tabsContainer.querySelectorAll('.hs-tabs__tab')).every(e => {
    const scrollContainer = tabsContainer.querySelector('.hs-tabs__scroll');
    if (isOutOfContainerViewport(scrollContainer, e)[direction]) {
      e.scrollIntoView({
        block: 'nearest',
        inline: 'center',
        behavior: 'smooth',
      });
      return false;
    }
    showNudge(tabsContainer, nudgeArrowLeft, nudgeArrowRight);
    return true;
  });
};

const toggleScrollNudges = (
  tabsContainer,
  tabsButtonsWrapper,
  nudgeArrowLeft,
  nudgeArrowRight
) => {
  const rightListener = () => {
    nextViewableTab('right', tabsContainer, nudgeArrowLeft, nudgeArrowRight);
  };

  const leftListener = () => {
    nextViewableTab('left', tabsContainer, nudgeArrowLeft, nudgeArrowRight);
  };

  const scrollListener = debounce(() => {
    showNudge(tabsContainer, nudgeArrowLeft, nudgeArrowRight);
  }, 100);

  if (tabsButtonsWrapper.offsetWidth > tabsContainer.offsetWidth) {
    tabsButtonsWrapper.classList.add('hs-tabs__tab-wrapper--has-nudges');

    nudgeArrowRight.addEventListener('click', rightListener);

    nudgeArrowLeft.addEventListener('click', leftListener);

    tabsContainer
      .querySelector('.hs-tabs__scroll')
      .addEventListener('scroll', scrollListener);
  } else {
    tabsButtonsWrapper.classList.remove('hs-tabs__tab-wrapper--has-nudges');
    nudgeArrowLeft.removeEventListener('click', leftListener);
    nudgeArrowRight.removeEventListener('click', rightListener);
    tabsContainer.removeEventListener('scroll', scrollListener);
  }
  showNudge(tabsContainer, nudgeArrowLeft, nudgeArrowRight);
};

/**
 * Tab Panel Initialization
 */

const tabPanel = tabsContainer => {
  // Gather all necessary elements
  const tabs = Array.from(tabsContainer.querySelectorAll('[role="tab"]'));
  const panels = Array.from(
    tabsContainer.querySelectorAll('[role="tabpanel"]')
  );
  const tabsButtonsWrapper = tabsContainer.querySelector(
    '.hs-tabs__tab-wrapper'
  );
  const nudgeArrowRight = tabsContainer.querySelector('.hs-tabs__nudge--right');
  const nudgeArrowLeft = tabsContainer.querySelector('.hs-tabs__nudge--left');

  // Get the delay value for keyboard navigation
  const delay = determineDelay(tabsContainer);

  // Panel action functions
  const deactivateTabs = () => {
    tabs.forEach(tab => {
      tab.setAttribute('tabindex', '-1');
      tab.setAttribute('aria-selected', 'false');
    });

    panels.forEach(panel => {
      panel.classList.remove('hs-tabs__content__panel--visible');
    });
  };

  const activateTab = tab => {
    deactivateTabs();
    tab.setAttribute('aria-selected', 'true');
    tab.removeAttribute('tabindex');

    const panel = document.getElementById(tab.getAttribute('aria-controls'));
    panel.classList.add('hs-tabs__content__panel--visible');
    tab.focus();
  };

  const activateTabIfFocused = tab => {
    activateTab(tab);
  };

  const focusEventHandler = event => {
    const target = event.target;
    setTimeout(activateTabIfFocused, delay, target);
  };

  // Safari does not fire focus on click.
  const clickEventHandler = event => {
    event.target.focus();
  };

  const switchTabOnArrowPress = event => {
    const key = event.key;

    // Add or subtract depending on key pressed
    const direction = Object.freeze({
      ArrowLeft: -1,
      ArrowRight: 1,
    });

    if (direction[key]) {
      const target = event.target;
      if (target.index !== null) {
        const nextTab = tabs.at(target.index + direction[key]) || tabs[0];
        nextTab.focus();
      }
    }
  };

  const keydownEventListener = event => {
    const key = event.key;

    switch (key) {
      case 'End':
        event.preventDefault();
        // Activate last tab
        activateTab(tabs[tabs.length - 1]);
        break;
      case 'Home':
        event.preventDefault();
        // Activate first tab
        activateTab(tabs[0]);
        break;

      case 'ArrowLeft':
      case 'ArrowRight':
        event.preventDefault();
        switchTabOnArrowPress(event);
        break;
      default:
        break;
    }
  };

  // Panel initialization
  tabs.forEach((tab, i) => {
    tab.addEventListener('keydown', keydownEventListener);
    tab.addEventListener('focus', focusEventHandler);
    tab.addEventListener('click', clickEventHandler);
    tab.index = i;
  });

  toggleScrollNudges(
    tabsContainer,
    tabsButtonsWrapper,
    nudgeArrowLeft,
    nudgeArrowRight
  );

  window.addEventListener(
    'resize',
    debounce(() => {
      toggleScrollNudges(
        tabsContainer,
        tabsButtonsWrapper,
        nudgeArrowLeft,
        nudgeArrowRight
      );
    }, 100)
  );
};

const tabsWrapper = document.querySelectorAll('.hs-tabs-wrapper');

if (tabsWrapper) {
  tabsWrapper.forEach(panel => {
    tabPanel(panel);
  });
}
