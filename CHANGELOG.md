# Changelog

All notable changes to the VS Code Modernized extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v1.1.0] - 2025-08-31

### Added

- **Jupyter Notebook Support** - Added comprehensive modern styling for Jupyter notebooks in VS Code. [#1](https://github.com/Sukarth/VS-Code-Modernized/issues/1)
  - Rounded corners for notebook cells using the extension's border-radius variable
  - Enhanced cell toolbars with consistent styling and hover effects
  - Improved visual separation between cell inputs and outputs
  - Modern styling for markdown cells with proper backgrounds
  - Focus and hover effects for better interaction feedback
  - Consistent spacing between cells using the extension's spacing variables
  - Styled run buttons and cell controls with smooth transitions
- Updated README.md to document new Jupyter notebook support features

## [v1.0.1] - 2025-08-07

### Added

- Added additional paths to `workbench.html` for different versions of VS Code, allowing the extension to now support VS Code Insiders. [#2](https://github.com/Sukarth/VS-Code-Modernized/issues/2)

### Changed

- Minor bug fixes and code and style improvements in `src/extension.ts`, `styles/quickInputWidget.js`, and `styles/styles.css` for better UI consistency and performance.
- Improved `.gitignore` to exclude `.vscode/`, `build/`, and `out/` folders.

### Fixed

- Fixed a bug where the extension was unable to find the "workbench.html" file ([#7](https://github.com/Sukarth/VS-Code-Modernized/issues/7))
- Fixed a bug where editor tabs would render underneath the title bar in certain occasions. [#6](https://github.com/Sukarth/VS-Code-Modernized/issues/6)
- Fixed bug where the extensions list would not render completely, and was cut off. [#4](https://github.com/Sukarth/VS-Code-Modernized/issues/4)

## [Released]

## [v1.0.0] - 2025-04-20

### Added

- Initial release of VS Code Modernized.
- Main extension file `extension.ts` with organized structure.
- Functionality to inject custom CSS ([`styles/styles.css`](https://github.com/Sukarth/VS-Code-Modernized/blob/main/styles/styles.css)) and JavaScript ([`styles/quickInputWidget.js`](https://github.com/Sukarth/VS-Code-Modernized/blob/main/styles/quickInputWidget.js)) into VS Code's `workbench.html` to apply UI modifications (rounded corners, custom spacing, etc.)
- Command `VS Code Modernized: Apply Styles` to inject styles and optionally apply the theme.
- Command `VS Code Modernized: Remove Styles` to remove injected styles and optionally revert the theme.
- Included a default color theme: [`Deep Blue Modern`](https://github.com/Sukarth/VS-Code-Modernized/blob/main/themes/deep-blue-theme.json).
- Configuration settings (`vscode-modernized.autoApplyTheme`, `vscode-modernized.ui.spacing`, `vscode-modernized.ui.borderRadius`, `vscode-modernized.ui.tabSpacing`) to customize behavior and appearance.
- Input validation for configuration settings.
- Startup check to automatically re-apply styles/theme if previously enabled and after updates.
- Use of `@vscode/sudo-prompt` for handling file write permissions.
- README.md with installation, usage, configuration, and contribution instructions.
- [`CHANGELOG.md`](https://github.com/Sukarth/VS-Code-Modernized/blob/main/CHANGELOG.md) to track changes.
- [`.vscodeignore`](https://github.com/Sukarth/VS-Code-Modernized/blob/main/.vscodeignore) and [`.gitignore`](https://github.com/Sukarth/VS-Code-Modernized/blob/main/.gitignore) files.
- Basic [`package.json`](https://github.com/Sukarth/VS-Code-Modernized/blob/main/package.json) setup.
- Added MIT [`LICENSE`](https://github.com/Sukarth/VS-Code-Modernized/blob/main/LICENSE).
- Error handling during style/script injection and file operations.


[Released]: https://github.com/Sukarth/VS-Code-Modernized/releases/
[v1.0.0]: https://github.com/Sukarth/VS-Code-Modernized/releases/tag/v1.0.0
[v1.0.1]: https://github.com/Sukarth/VS-Code-Modernized/releases/tag/v1.0.1
[v1.1.0]: https://github.com/Sukarth/VS-Code-Modernized/releases/tag/v1.1.0
