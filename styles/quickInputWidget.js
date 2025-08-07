function adjustWebviewHeight() {
  try {
    const editor = document.querySelector('.editor-container');
    const header = document.querySelector('.extension-editor > .header');
    const navbar = document.querySelector('.extension-editor > .body > .navbar');
    const webviewContainer = document.querySelector('div.monaco-workbench > div:has(iframe.webview.ready)');
    if (!editor || !header || !navbar || !webviewContainer) return;

    const targetHeight = editor.offsetHeight - header.offsetHeight - navbar.offsetHeight;
    // Get current height as number (strip px)
    const currentHeight = parseFloat(getComputedStyle(webviewContainer).height);
    if (isNaN(targetHeight) || isNaN(currentHeight)) return;
    if (currentHeight > targetHeight) {
      webviewContainer.style.setProperty('height', targetHeight + 'px', 'important');
    }
  } catch (err) {
    console.error('Error adjusting webview container height:', err);
  }
}
document.addEventListener("DOMContentLoaded", function () {
  const checkElement = setInterval(() => {
    const commandDialog = document.querySelector(".quick-input-widget");
    if (commandDialog) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (
            mutation.type === "attributes" &&
            mutation.attributeName === "style"
          ) {
            if (commandDialog.style.display === "none") {
              handleEscape();
            } else {
              runMyScript();
            }
          }
        });
      });

      observer.observe(commandDialog, { attributes: true });

      clearInterval(checkElement);
    } else {
      console.log("Command dialog not found yet. Retrying...");
    }
  }, 500);

  document.addEventListener(
    "keydown",
    function (event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "p") {
        event.preventDefault();
        setTimeout(runMyScript, 50); // Adding a small delay
      } else if (event.key === "Escape" || event.key === "Esc") {
        event.preventDefault();
        handleEscape();
      }
    },
    true
  );

  function runMyScript() {
    const targetDiv = document.querySelector(".monaco-workbench");

    const existingElement = document.getElementById("command-blur");
    if (existingElement) {
      existingElement.remove();
    }

    const newElement = document.createElement("div");
    newElement.setAttribute("id", "command-blur");

    newElement.addEventListener("click", function () {
      newElement.remove();
    });

    targetDiv.appendChild(newElement);
  }

  function handleEscape() {
    const element = document.getElementById("command-blur");
    if (element) {
      element.remove();
    }
  }
});

// VS Code Modernized: Robust editor container height adjustment

// VS Code Modernized: Efficient background height adjustment
(function runEditorContainerHeightAdjuster() {
  // Cache selectors to minimize DOM queries
  let cachedEditor = null;
  let cachedTabs = null;
  let cachedHeader = null;
  let cachedNavbar = null;
  let cachedWebviewContainer = null;
  let lastEditorHeight = null;
  let lastWebviewHeight = null;

  function getCSSVariableInPixels(variableName) {
    try {
      const root = document.documentElement;
      if (!root) return 0;
      const computed = getComputedStyle(root);
      if (!computed) return 0;
      const cssValue = computed.getPropertyValue(variableName)?.trim();
      if (!cssValue) return 0;
      if (cssValue.endsWith('px')) {
        return parseFloat(cssValue);
      }
      if (cssValue.endsWith('rem')) {
        const rootFontSize = parseFloat(computed.fontSize);
        return parseFloat(cssValue) * (isNaN(rootFontSize) ? 16 : rootFontSize);
      }
      return parseFloat(cssValue);
    } catch (err) {
      console.error('Error in getCSSVariableInPixels:', err);
      return 0;
    }
  }

  function getCachedElement(selector, cache) {
    if (cache && document.contains(cache)) return cache;
    return document.querySelector(selector);
  }

  function adjustEditorHeight() {
    try {
      cachedEditor = getCachedElement('.editor-container', cachedEditor);
      cachedTabs = getCachedElement('.title.tabs', cachedTabs);
      if (!cachedEditor || !cachedTabs || !cachedEditor.parentElement) return;
      const parentHeight = cachedEditor.parentElement.offsetHeight;
      const editorHeight = cachedEditor.offsetHeight;
      const tabsHeight = cachedTabs.offsetHeight;
      if (lastEditorHeight === editorHeight && lastEditorHeight !== null) return; // Only update if changed
      if (parentHeight < (editorHeight + tabsHeight)) {
        const borderRadiusPx = getCSSVariableInPixels('--border-radius');
        cachedEditor.style.height = (editorHeight - borderRadiusPx - 3) + 'px';
        lastEditorHeight = editorHeight;
      }
    } catch (err) {
      console.error('Error adjusting editor container height:', err);
    }
  }

  function adjustWebviewHeight() {
    try {
      // Always get fresh elements to handle dynamic DOM changes and multiple instances
      const editors = document.querySelectorAll('.editor-container');
      const headers = document.querySelectorAll('.extension-editor > .header');
      const navbars = document.querySelectorAll('.extension-editor > .body > .navbar');
      const webviewContainers = document.querySelectorAll('div.monaco-workbench > div:has(iframe.webview.ready)');

      // Use the minimum count to avoid index errors
      const count = Math.min(editors.length, headers.length, navbars.length, webviewContainers.length);
      if (count === 0) return;

      for (let i = 0; i < count; i++) {
        const editor = editors[i];
        const header = headers[i];
        const navbar = navbars[i];
        const webviewContainer = webviewContainers[i];
        if (!editor || !header || !navbar || !webviewContainer) continue;

        const targetHeight = editor.offsetHeight - header.offsetHeight - navbar.offsetHeight;
        const currentHeight = parseFloat(getComputedStyle(webviewContainer).height);
        if (isNaN(targetHeight) || isNaN(currentHeight)) continue;
        if (currentHeight > targetHeight) {
          webviewContainer.style.setProperty('height', targetHeight + 'px', 'important');
        }
      }
    } catch (err) {
      console.error('Error adjusting webview container height:', err);
    }
  }

  // Run every 1000ms for lower resource usage
  setInterval(() => {
    adjustEditorHeight();
    adjustWebviewHeight();
  }, 1000);
})();