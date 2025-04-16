# VS Code Modernized ✨

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://marketplace.visualstudio.com/items?itemName=your-publisher-name.vscode-modernized) <!-- TODO: Update publisher name and link -->
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Applies custom styles and UI enhancements to Visual Studio Code for a sleek, modern look and feel. This extension injects custom CSS and JavaScript to modify the appearance beyond what standard themes allow.

---

**⚠️ Important Note:** This extension modifies VS Code's core files (`workbench.html`) to apply the custom styles. This is an **unsupported** method by Microsoft and might break with future VS Code updates.

*   After applying the styles, VS Code will likely show a **"Your Code installation appears to be corrupt. Please reinstall."** warning. This is expected because we modified a core file. You can safely dismiss this warning by clicking the gear icon on the notification and selecting "Don't Show Again".
*   The extension may require **administrative privileges** (sudo/run as administrator) to write the necessary changes to the VS Code installation directory.

---

## Features

*   Applies a custom, modern UI theme (using `styles/styles.css`).
*   Enhances the command palette appearance and behavior (using `styles/quickInputWidget.js`).
*   Provides commands to easily enable or disable the custom styles.

## Screenshots

<!-- TODO: Add screenshots here -->
<!-- Example: -->
<!-- ![Screenshot 1](assets/screenshot1.png) -->
<!-- ![Screenshot 2](assets/screenshot2.png) -->

*(Consider adding a carousel or more detailed images showing the UI changes)*

## Installation

1.  **Prerequisites:**
    *   Ensure you have VS Code installed (tested with v1.75.0+, might work on others).
    *   *(Optional but Recommended)* Install the [Geist Mono](https://vercel.com/font/mono) font for the intended look.
2.  **Install the Extension:**
    *   **(Recommended) From VS Code Marketplace:** Search for "VS Code Modernized" and install. *(Link will be available once published)*
    *   **(Manual) From VSIX:** Download the `.vsix` file from the [Releases](https://github.com/your-username/vscode-modernized/releases) page. Open VS Code, go to the Extensions view (`Ctrl+Shift+X`), click the `...` menu, select "Install from VSIX...", and choose the downloaded file.
3.  **Apply Styles:**
    *   Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`).
    *   Run the command: `VS Code Modernized: Apply Styles`.
    *   If prompted, grant administrative privileges.
    *   VS Code might ask to reload; if not, manually reload the window (`Developer: Reload Window` command) or restart VS Code.
    *   Dismiss the "corrupt installation" warning if it appears.

## Usage

### Commands

Use the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`) to access the following commands:

| Command                             | Title                          | Description                                     |
| :---------------------------------- | :----------------------------- | :---------------------------------------------- |
| `vscode-modernized.applyStyles`   | VS Code Modernized: Apply Styles | Injects the custom CSS and JS into VS Code.     |
| `vscode-modernized.removeStyles`  | VS Code Modernized: Remove Styles | Removes the injected styles, reverting to default. |

### Reverting Changes

To remove the custom styles completely:

1.  Run the command `VS Code Modernized: Remove Styles`.
2.  If prompted, grant administrative privileges.
3.  Reload or restart VS Code.

## Troubleshooting / FAQ

*   **Q: VS Code says my installation is corrupt!**
    *   A: This is expected. See the **Important Note** section above. You can safely ignore it.
*   **Q: Styles didn't apply after running the command.**
    *   A: Ensure you granted administrative privileges if prompted. Try reloading the window (`Developer: Reload Window`) or restarting VS Code completely.
*   **Q: The extension broke after a VS Code update.**
    *   A: This is possible, as the injection method is not officially supported. Try running `VS Code Modernized: Remove Styles`, then `VS Code Modernized: Apply Styles` again. If it still fails, please [open an issue](https://github.com/your-username/vscode-modernized/issues).

## Contributing

Contributions, feedback, and bug reports are welcome! Please feel free to open an issue or submit a pull request on the [GitHub repository](https://github.com/your-username/vscode-modernized).

### Bug Reports & Feature Requests

*   Use the [GitHub Issues](https://github.com/your-username/vscode-modernized/issues) page.
*   For bugs, please include:
    *   Your VS Code version (`Help > About`).
    *   Your Operating System.
    *   Steps to reproduce the issue.
    *   Any relevant error messages or screenshots.
*   For feature requests, describe the desired functionality and its use case.

### Development

1.  Clone the repository: `git clone https://github.com/your-username/vscode-modernized.git`
2.  Navigate to the directory: `cd vscode-modernized`
3.  Install dependencies: `npm install`
4.  Open the project in VS Code.
5.  Press `F5` to start a new Extension Development Host window with the extension loaded.
6.  Make your changes.
7.  Test the `Apply Styles` and `Remove Styles` commands in the development host.
8.  Submit a pull request with your changes.

## License

This project is licensed under the [MIT License](LICENSE).

---

Made with ❤️ by [Your Name] <!-- TODO: Replace with your name/handle -->
