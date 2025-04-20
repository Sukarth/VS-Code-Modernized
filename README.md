# VS Code Modernized ✨

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://marketplace.visualstudio.com/items?itemName=sukarth.VS-Code-Modernized)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Repo-blue?logo=github)](https://github.com/sukarth/VS-Code-Modernized)

**Elevate your Visual Studio Code experience!**
VS Code Modernized applies a sleek, custom UI redesign, going beyond standard themes by offering customizable spacing, rounded corners, and a refined dark aesthetic. By applying custom CSS and JavaScript, it provides a more polished and visually appealing development environment.

## Features

- Applies a custom, modern UI theme with rounded corners, shadows, etc.
- Includes the 'Deep Blue Modern' theme, which is applied by default for the best visual experience.
- Enhances the command palette appearance and behavior to match the modern theme.
- Provides commands to easily enable or disable the custom styles.
- **Completely Open Source:** Available on GitHub under the MIT license. Feel free to explore the code, contribute, or report issues on our [GitHub repository](https://github.com/sukarth/VS-Code-Modernized).

## Preview

Either let the extension do the work for you and set the Deep Blue Modern color theme automatically... <br>
![Screenshot 1](https://raw.githubusercontent.com/sukarth/VS-Code-Modernized/main/assets/vscodeModernizedThemeSwitchDemo.gif)
<br>
Or, disable the default behavior using the `vscode-modernized.autoApplyTheme` setting (see [configuration](#configuration)), so that the extension uses the theme of your choice. <br>
![Screenshot 2](https://raw.githubusercontent.com/sukarth/VS-Code-Modernized/main/assets/vscodeModernizedNoThemeSwitchDemo.gif)

<!-- *(Consider adding a carousel or more detailed images showing the UI changes)* -->

## Installation

**Note:** This extension works best with the included **'Deep Blue Modern'** theme. While the custom styles might work with other themes, the visual appearance might not be optimal.

1.  **Prerequisites:**
    - Ensure you have VS Code installed (tested with v1.99.0+, might also work on other versions).
    <!-- *   *(Optional but Recommended)* Install the [Geist Mono](https://vercel.com/font/mono) font for the intended look. -->
2.  **Install the Extension:**
    - **From VS Code Marketplace (Recommended):** Search for "VS Code Modernized" and install directly from VS Code, or use this link. _(Link will be available once published)_
    - **From VSIX (Manual):** Download the `.vsix` file from the [Releases](https://github.com/sukarth/VS-Code-Modernized/releases) page. Open VS Code, go to the Extensions view (`Ctrl+Shift+X`), click the `...` menu, select "Install from VSIX...", and choose the downloaded file.
    - **⚠️ Note:** If you uninstall this extension later, you MUST run the `VS Code Modernized: Remove Styles` command first. See the [important note](#⚠️-important-note) section for details.
3.  **Apply Styles:**
    - Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`).
    - Use the command: `VS Code Modernized: Apply Styles` (type to search if necessary).
    - If prompted, grant administrative privileges.
    - VS Code might ask to reload; if not, restart VS Code or manually reload the window (`Ctrl + R`).
    - Dismiss the "corrupt installation" warning if it appears (see [important note](#⚠️-important-note) section below).
    - By default, the extension will also switch your color theme to 'Deep Blue Modern' for the optimal visual experience. You can disable this behavior in the settings (see [configuration](#configuration)).

## Usage

### Commands

Use the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`) to access the following commands:

| Command                          | Title                             | Description                                                                                              |
| :------------------------------- | :-------------------------------- | :------------------------------------------------------------------------------------------------------- |
| `vscode-modernized.applyStyles`  | VS Code Modernized: Apply Styles  | Applies the custom styles to VS Code.                                                                    |
| `vscode-modernized.removeStyles` | VS Code Modernized: Remove Styles | Removes the custom styles from VS Code, reverting to default. (Does not automatically revert the theme). |

### Reverting Changes

To remove the custom styles completely:

1.  Run the command `VS Code Modernized: Remove Styles`.
2.  If prompted, grant administrative privileges.
3.  Reload or restart VS Code.

## Configuration

This extension provides the following configuration setting (accessible via `File > Preferences > Settings` and searching for `VS Code Modernized`):

- **`vscode-modernized.autoApplyTheme`**: (Default: `true`)

  - When enabled, the extension automatically applies the 'Deep Blue Modern' theme when you run the `Apply Styles` command.
  - Disable this if you want to use the custom UI styles with your own preferred color theme.

- **`vscode-modernized.ui.spacing`**: (Default: `0.35rem`)

  - Controls the general spacing used for margins and padding around UI elements (e.g., sidebar, editor group).
  - Use positive CSS units like `rem`, `px`, `em` (e.g., '0.5rem', '10px').
  - **Warning:** Setting extreme values might negatively impact usability or make VS Code difficult to use.

- **`vscode-modernized.ui.borderRadius`**: (Default: `0.5rem`)

  - Controls the roundness of corners for elements like tabs, sidebar, panels, buttons, and inputs.
  - Use positive CSS units like `rem`, `px`, `em` (e.g., '0.5rem', '8px').
  - **Warning:** Setting extreme values might negatively impact usability or make VS Code difficult to use.

- **`vscode-modernized.ui.tabSpacing`**: (Default: `0.2rem`)
  - Controls the spacing between editor tabs.
  - Use positive CSS units like `rem`, `px`, `em` (e.g., '0.2rem', '4px').
  - **Warning:** Setting extreme values might negatively impact usability or make VS Code difficult to use.

## ⚠️ Important Note

This extension modifies VS Code's files (mainly `workbench.html`) to apply/inject the custom styles. This is an unsupported method by Microsoft and might break with future VS Code updates.

- After applying the styles, VS Code will likely show a **"Your Code installation appears to be corrupt. Please reinstall."** warning. This is expected because a core file was modified. You can safely dismiss this warning by clicking the gear icon on the notification and selecting "Don't Show Again".
- Due to this, the extension may require **administrative privileges** (sudo/run as administrator) to write the necessary changes to the VS Code installation directory.
- **⚠️ IMPORTANT:** Before uninstalling or disabling this extension, you MUST run the `VS Code Modernized: Remove Styles` command to revert the modifications made to VS Code's files. Failing to do so will leave the styles enabled in VS Code until you re-install the extension and disable/remove them.

## Troubleshooting / FAQ

- **Q: VS Code says my installation is corrupt!**
  - A: This is expected. See the **Important Note** section above. You can safely ignore it.
- **Q: Styles didn't apply after running the command.**
  - A: Ensure you granted administrative privileges if prompted. Try restarting VS Code completely or reloading the window (`Ctrl + R`).
- **Q: The extension broke after a VS Code update.**
  - A: This is possible, as the styles injection method is not officially supported. Try running `VS Code Modernized: Remove Styles`, then `VS Code Modernized: Apply Styles` again. If it still fails, please [open an issue](https://github.com/sukarth/VS-Code-Modernized/issues).

## Contributing

Contributions, feedback, and bug reports are welcome! Please feel free to open an issue, provide feature suggestions/improvements, or submit a pull request on the [GitHub repository](https://github.com/sukarth/VS-Code-Modernized).

### Bug Reports & Feature Requests

- Use the [GitHub Issues](https://github.com/sukarth/VS-Code-Modernized/issues) page.
- For bugs, please include:
  - Your VS Code version (`Help > About`).
  - Your Operating System.
  - Steps to reproduce the issue.
  - Relevant error messages or screenshots.
- For feature requests, describe the desired functionality and its use case.

### Development

1.  Clone the repository: `git clone https://github.com/sukarth/VS-Code-Modernized.git`
2.  Navigate to the directory: `cd VS-Code-Modernized`
3.  Install dependencies: `npm install`
4.  Open the project in VS Code.
5.  Press `F5` to start a new Extension Development Host window with the extension loaded.
6.  Make your changes.
7.  Test the `Apply Styles` and `Remove Styles` commands in the development host.
8.  Submit a pull request with your changes.

## License

This project is licensed under the [MIT License](LICENSE).

---

Made with ❤️ by Sukarth Acharya
