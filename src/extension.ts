import * as vscode from 'vscode';
import * as sudo from '@vscode/sudo-prompt';

/** Unique identifier for the extension. */
const EXTENSION_ID = 'vscode-modernized';
/** Start marker for injected content in workbench.html. */
const INJECTION_MARKER_START = `<!-- ${EXTENSION_ID}-start -->`;
/** End marker for injected content in workbench.html. */
const INJECTION_MARKER_END = `<!-- ${EXTENSION_ID}-end -->`;
/** Configuration section name in settings.json. */
const CONFIG_SECTION = 'vscode-modernized';
/** The specific theme ID this extension applies. */
const THEME_ID = 'Deep Blue Modern';
/** Key used in global state to store the user's theme before applying ours. */
const PREVIOUS_THEME_KEY = 'previousTheme';
/** Key used in global state to track if styles have been successfully applied. */
const APPLIED_STATE_KEY = 'stylesApplied';

/** Cached path to the VS Code workbench HTML file. */
let workbenchHtmlPath: vscode.Uri | undefined;
/** The extension context provided during activation. */
let extensionContext: vscode.ExtensionContext;

/**
 * Attempts to find the VS Code workbench HTML file path.
 * Checks common locations within the VS Code installation directory.
 * @returns {Promise<vscode.Uri | undefined>} The URI of the workbench.html file, or undefined if not found.
 */
async function findWorkbenchPath(): Promise<vscode.Uri | undefined> {
    const vscodeRoot = vscode.Uri.file(vscode.env.appRoot);
    const possiblePaths = [
        'out/vs/code/electron-sandbox/workbench/workbench.html',
        'out/vs/code/electron-sandbox/workbench/workbench.esm.html', // Another possible path
    ];

    for (const p of possiblePaths) {
        const uri = vscode.Uri.joinPath(vscodeRoot, p);
        try {
            await vscode.workspace.fs.stat(uri); // Check if the file exists
            console.log(`Found workbench.html at: ${uri.fsPath}`);
            return uri;
        } catch {
            // File not found at this path, continue searching
        }
    }
    console.error('Could not find workbench.html path.');
    return undefined;
}

/**
 * Reads the content of a file specified by URI.
 * @param {vscode.Uri} uri The URI of the file to read.
 * @returns {Promise<string>} The content of the file as a UTF-8 string.
 */
async function readFile(uri: vscode.Uri): Promise<string> {
    const data = await vscode.workspace.fs.readFile(uri);
    return Buffer.from(data).toString('utf8');
}

/**
 * Writes content to a file, attempting direct write first, then using sudo-prompt if permissions fail.
 * Handles creating a temporary file and moving it with elevated privileges.
 * @param {vscode.Uri} targetUri The URI of the file to write to.
 * @param {string} content The content to write.
 * @returns {Promise<boolean>} True if the write was successful (either directly or via sudo), false otherwise.
 */
async function writeFileWithPermissions(targetUri: vscode.Uri, content: string): Promise<boolean> {
    try {
        // Attempt direct write first
        await vscode.workspace.fs.writeFile(targetUri, Buffer.from(content, 'utf8'));
        console.log(`Successfully wrote to ${targetUri.fsPath}`);
        return true;
    } catch (error: any) {
        console.warn(`Direct write failed (likely permissions): ${error.message}`);

        // Fallback to using sudo-prompt
        const tempDirUri = extensionContext.globalStorageUri; // Use extension's global storage for temp file
        await vscode.workspace.fs.createDirectory(tempDirUri); // Ensure temp directory exists
        const tempFileUri = vscode.Uri.joinPath(tempDirUri, 'workbench.html.temp');

        try {
            // Write content to a temporary file
            await vscode.workspace.fs.writeFile(tempFileUri, Buffer.from(content, 'utf8'));
            console.log(`Wrote temporary file to ${tempFileUri.fsPath}`);

            // Determine the correct move command based on the OS
            const moveCommand = process.platform === 'win32' ? 'move' : 'mv';
            // Construct the command to move the temp file to the target location
            const command = `${moveCommand} "${tempFileUri.fsPath}" "${targetUri.fsPath}"`;
            console.log(`Executing sudo command: ${command}`);

            // Execute the move command with elevated privileges using sudo-prompt
            return await new Promise<boolean>((resolve) => {
                sudo.exec(command, { name: 'VS Code Modernized Extension' }, async (sudoError?: Error | string) => {
                    if (sudoError) {
                        console.error(`Sudo command failed: ${sudoError}`);
                        // Attempt to clean up the temporary file even if sudo failed
                        try {
                            await vscode.workspace.fs.delete(tempFileUri);
                            console.log(`Successfully deleted temp file: ${tempFileUri.fsPath}`);
                        } catch (deleteError: any) {
                            console.error(`Failed to delete temp file: ${deleteError.message}`);
                        }
                        vscode.window.showErrorMessage(
                            `Failed to apply styles due to permission error. Please try running VS Code as an administrator/root. Error: ${sudoError}`
                        );
                        resolve(false); // Indicate failure
                    } else {
                        console.log('Sudo command successful.');
                        // Attempt to clean up the temporary file after successful move
                        try {
                            await vscode.workspace.fs.delete(tempFileUri);
                            console.log(`Successfully deleted temp file after move: ${tempFileUri.fsPath}`);
                        } catch (deleteError: any) {
                            // Log warning if deletion fails (might already be gone)
                            console.warn(`Could not delete temp file after successful move (might already be gone): ${deleteError.message}`);
                        }
                        resolve(true); // Indicate success
                    }
                });
            });
        } catch (tempWriteError: any) {
            console.error(`Failed to write temporary file: ${tempWriteError.message}`);
            vscode.window.showErrorMessage(`Failed to write temporary file: ${tempWriteError.message}`);
            return false; // Indicate failure
        }
    }
}

/**
 * Generates a <style> block containing CSS variables based on user configuration.
 * Includes validation for CSS units.
 * @returns {string} The generated HTML <style> block.
 */
function generateDynamicCss(): string {
    const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
    const spacing = config.get<string>('ui.spacing', '0.35rem');
    const borderRadius = config.get<string>('ui.borderRadius', '0.5rem');
    const tabSpacing = config.get<string>('ui.tabSpacing', '0.2rem');

    // Basic validation to ensure the value looks like a valid CSS unit
    const isValidUnit = (value: string) => /^\d+(\.\d+)?(rem|em|px|%|vh|vw|vmin|vmax)$/.test(value);

    return `
<style id="${EXTENSION_ID}-dynamic-styles">
  :root {
    --spacing: ${isValidUnit(spacing) ? spacing : '0.35rem'}; /* Use default if invalid */
    --border-radius: ${isValidUnit(borderRadius) ? borderRadius : '0.5rem'}; /* Use default if invalid */
    --tab-spacing: ${isValidUnit(tabSpacing) ? tabSpacing : '0.2rem'}; /* Use default if invalid */
  }
</style>
`;
}

/**
 * Removes previously injected content (marked by start/end markers) from HTML content.
 * @param {string} htmlContent The HTML content to clean.
 * @returns {string} The HTML content with the injection removed.
 */
function clearInjection(htmlContent: string): string {
    // Regex to find the start marker, any content (non-greedy), the end marker, and surrounding newlines
    const regex = new RegExp(`\n*?${INJECTION_MARKER_START}.*?${INJECTION_MARKER_END}\n*?`, 's');
    return htmlContent.replace(regex, '\n'); // Replace with a single newline
}

/**
 * Prompts the user to reload the VS Code window.
 * @param {string} message The message to display in the notification.
 */
function promptReload(message: string) {
    const action = 'Reload Window';
    vscode.window.showInformationMessage(message, action)
        .then(selectedAction => {
            if (selectedAction === action) {
                vscode.commands.executeCommand('workbench.action.reloadWindow');
            }
        });
}

/**
 * Applies the custom styles and scripts to the workbench.html file.
 * Reads existing content, injects CSS/JS links, handles theme switching, and writes back using appropriate permissions.
 */
async function applyStyles() {
    if (!workbenchHtmlPath) {
        vscode.window.showErrorMessage(`Workbench HTML path not found. Cannot apply styles.`);
        return;
    }

    try {
        // Read the current workbench.html content
        let htmlContent = await readFile(workbenchHtmlPath);

        // Get URIs for the extension's CSS and JS files
        const stylesUri = vscode.Uri.joinPath(extensionContext.extensionUri, 'styles', 'styles.css');
        const scriptUri = vscode.Uri.joinPath(extensionContext.extensionUri, 'styles', 'quickInputWidget.js');
        // Note: Reading baseCss and scriptJs here isn't strictly necessary for injection,
        // but could be useful for validation or future modifications.
        // const baseCss = await readFile(stylesUri);
        // const scriptJs = await readFile(scriptUri);

        // Generate dynamic CSS based on user settings
        const dynamicCss = generateDynamicCss();

        // Convert file URIs to vscode-file URIs suitable for injection into workbench.html
        const stylesHref = stylesUri.with({ scheme: 'vscode-file', authority: 'vscode-app' }).toString();
        const scriptSrc = scriptUri.with({ scheme: 'vscode-file', authority: 'vscode-app' }).toString();

        // Construct the HTML block to inject
        const injectionContent = `
${INJECTION_MARKER_START}
  <!-- Base Styles -->
  <link rel="stylesheet" href="${stylesHref}">
  <!-- Dynamic Styles based on settings -->
  ${dynamicCss}
  <!-- Custom Script -->
  <script src="${scriptSrc}"></script>
${INJECTION_MARKER_END}
`;

        // Remove any previous injections first
        htmlContent = clearInjection(htmlContent);

        // Remove existing Content-Security-Policy meta tag to allow loading local resources
        // WARNING: This reduces security. Need to consider alternatives if possible.
        // htmlContent = htmlContent.replace(/<meta.*http-equiv="Content-Security-Policy".*?>/s, '');

        // Inject the new content just before the closing </html> tag
        htmlContent = htmlContent.replace(/\n*?<\/html>/, `\n${injectionContent}\n</html>`);

        // --- Theme Handling --- 
        const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
        const autoApplyTheme = config.get<boolean>('autoApplyTheme', true);
        const currentTheme = vscode.workspace.getConfiguration('workbench').get<string>('colorTheme');

        // If auto-apply is enabled and the current theme isn't the target theme
        if (autoApplyTheme && currentTheme !== THEME_ID) {
            console.log(`Storing current theme: ${currentTheme} to apply ${THEME_ID} after reload`);
            // Store the current theme to revert back to later if needed
            await extensionContext.globalState.update(PREVIOUS_THEME_KEY, currentTheme);
            // Set a flag indicating the theme should be changed after reload
            await extensionContext.globalState.update('pendingThemeChange', THEME_ID);
        } else {
            console.log(`Auto theme apply skipped. AutoApply: ${autoApplyTheme}, Current: ${currentTheme}, Target: ${THEME_ID}`);
            // Clear any previous theme and pending change flags if not applying
            await extensionContext.globalState.update(PREVIOUS_THEME_KEY, undefined);
            await extensionContext.globalState.update('pendingThemeChange', undefined);
        }
        // --- End Theme Handling ---

        // Write the modified HTML content back to workbench.html
        const writeSuccess = await writeFileWithPermissions(workbenchHtmlPath, htmlContent);
        if (!writeSuccess) {
            // If writing failed, revert any pending theme changes
            await extensionContext.globalState.update(PREVIOUS_THEME_KEY, undefined);
            await extensionContext.globalState.update('pendingThemeChange', undefined);
            await extensionContext.globalState.update('pendingThemeRevert', undefined); // Also clear revert flag
            console.error(`Failed to write workbench.html.`);
            // Error message shown within writeFileWithPermissions
            return;
        }

        // Mark styles as successfully applied in global state
        await extensionContext.globalState.update(APPLIED_STATE_KEY, true);

        // Prompt user to reload
        promptReload(`Styles applied successfully. Please reload VS Code to see the changes.`);

    } catch (error: any) {
        console.error(`Error applying styles: ${error}`);
        vscode.window.showErrorMessage(`Failed to apply styles: ${error.message}`);
        // Ensure state reflects failure
        await extensionContext.globalState.update(APPLIED_STATE_KEY, false);
        await extensionContext.globalState.update(PREVIOUS_THEME_KEY, undefined);
        // No need to clear pendingThemeChange here as it wasn't set if write failed earlier
    }
}

/**
 * Removes the injected styles and scripts from the workbench.html file.
 * Cleans the injection markers, handles theme reversion, and writes back using appropriate permissions.
 */
async function removeStyles() {
    if (!workbenchHtmlPath) {
        vscode.window.showErrorMessage(`Workbench HTML path not found. Cannot remove styles.`);
        return;
    }

    // Check if styles are marked as applied in the global state
    const stylesApplied = extensionContext.globalState.get<boolean>(APPLIED_STATE_KEY, false);
    if (!stylesApplied) {
        vscode.window.showInformationMessage(`Styles are not currently applied.`);
        return;
    }

    try {
        // Read the current workbench.html content
        let htmlContent = await readFile(workbenchHtmlPath);

        // Check if the injection markers actually exist in the file
        if (!htmlContent.includes(INJECTION_MARKER_START)) {
            console.warn(`Injection markers not found in workbench.html, but state indicated styles were applied. Resetting state.`);
            // If markers are missing but state says applied, reset the state
            await extensionContext.globalState.update(APPLIED_STATE_KEY, false);
            await extensionContext.globalState.update(PREVIOUS_THEME_KEY, undefined);
            vscode.window.showWarningMessage(`Could not find style markers to remove, but resetting state.`);
            // Don't prompt for reload as no file change was made
            return;
        }

        // Remove the injected content
        htmlContent = clearInjection(htmlContent);

        // --- Theme Handling ---
        const currentTheme = vscode.workspace.getConfiguration('workbench').get<string>('colorTheme');
        const previousTheme = extensionContext.globalState.get<string>(PREVIOUS_THEME_KEY);

        // If the current theme is the one we applied, and we have a stored previous theme
        if (currentTheme === THEME_ID && previousTheme) {
            console.log(`Storing previous theme: ${previousTheme} to revert after reload`);
            // Set a flag to revert to the previous theme after reload
            await extensionContext.globalState.update('pendingThemeRevert', previousTheme);
        } else {
            console.log(`Theme reversion skipped. Current: ${currentTheme}, Target: ${THEME_ID}, Previous: ${previousTheme}`);
            // Clear any pending revert flag if not reverting
            await extensionContext.globalState.update('pendingThemeRevert', undefined);
        }
        // Always clear the stored previous theme after deciding whether to revert
        await extensionContext.globalState.update(PREVIOUS_THEME_KEY, undefined);
        // --- End Theme Handling ---

        // Write the cleaned HTML content back to workbench.html
        const writeSuccess = await writeFileWithPermissions(workbenchHtmlPath, htmlContent);
        if (!writeSuccess) {
            // If writing failed, don't change the state, as styles are technically still applied
            console.error(`Failed to write workbench.html during style removal.`);
            // Error message shown within writeFileWithPermissions
            // We should also probably clear the pendingThemeRevert flag if write failed
            await extensionContext.globalState.update('pendingThemeRevert', undefined);
            return;
        }

        // Clear the stored previous theme key (redundant, but safe)
        await extensionContext.globalState.update(PREVIOUS_THEME_KEY, undefined);
        // Mark styles as no longer applied in global state
        await extensionContext.globalState.update(APPLIED_STATE_KEY, false);

        // Prompt user to reload
        promptReload(`Styles removed successfully. Please reload VS Code to apply the changes.`);

    } catch (error: any) {
        console.error(`Error removing styles: ${error}`);
        vscode.window.showErrorMessage(`Failed to remove styles: ${error.message}`);
        // Leave APPLIED_STATE_KEY as true as the removal likely failed before writing the file.
    }
}

/**
 * VS Code Extension activation function.
 * Called when the extension is first activated (e.g., on startup or command execution).
 * Handles initialization, command registration, update checks, and configuration listeners.
 * @param {vscode.ExtensionContext} context The extension context provided by VS Code.
 */
export async function activate(context: vscode.ExtensionContext) {
    // --- Pending Theme Application (from previous session) ---
    const pendingThemeChange = context.globalState.get<string>('pendingThemeChange');
    const pendingThemeRevert = context.globalState.get<string>('pendingThemeRevert');
    // const stylesApplied = context.globalState.get<boolean>(APPLIED_STATE_KEY, false); // Not needed here

    // Apply theme changes requested in the *previous* session (before reload)
    if (pendingThemeChange) {
        console.log(`Applying pending theme change to: ${pendingThemeChange}`);
        await vscode.workspace.getConfiguration('workbench').update('colorTheme', pendingThemeChange, vscode.ConfigurationTarget.Global);
        await context.globalState.update('pendingThemeChange', undefined); // Clear the flag
    } else if (pendingThemeRevert) {
        console.log(`Applying pending theme revert to: ${pendingThemeRevert}`);
        await vscode.workspace.getConfiguration('workbench').update('colorTheme', pendingThemeRevert, vscode.ConfigurationTarget.Global);
        await context.globalState.update('pendingThemeRevert', undefined); // Clear the flag
    } else {
        console.log('No pending theme changes to apply on activation');
    }
    // --- End Pending Theme Application ---

    console.log(`Activating ${EXTENSION_ID}...`);
    extensionContext = context; // Store context for use in other functions

    // --- Find Workbench Path ---
    workbenchHtmlPath = await findWorkbenchPath();
    if (!workbenchHtmlPath) {
        vscode.window.showWarningMessage(
            `Could not locate VS Code's workbench.html file. Style injection commands will not work.`
        );
        // Continue activation, but commands will show error if path is missing
    }
    // --- End Find Workbench Path ---

    // --- Register Commands ---
    context.subscriptions.push(
        vscode.commands.registerCommand(`${CONFIG_SECTION}.applyStyles`, applyStyles),
        vscode.commands.registerCommand(`${CONFIG_SECTION}.removeStyles`, removeStyles)
    );
    // --- End Register Commands ---

    // --- Version Check & Update Handling ---
    const packageJsonPath = vscode.Uri.joinPath(context.extensionUri, 'package.json');
    let currentVersion = 'unknown';
    try {
        const packageJsonContent = await readFile(packageJsonPath);
        const packageJson = JSON.parse(packageJsonContent);
        currentVersion = packageJson.version;
    } catch (error: any) {
        console.error(`Failed to read package.json: ${error.message}`);
    }

    const storedVersion = context.globalState.get<string>('extensionVersion');
    const stylesAreApplied = context.globalState.get<boolean>(APPLIED_STATE_KEY, false);

    // Check if the extension version has changed since last activation
    if (storedVersion !== currentVersion) {
        console.log(`Version change detected (Stored: ${storedVersion}, Current: ${currentVersion}).`);
        await context.globalState.update('extensionVersion', currentVersion);

        if (!storedVersion) {
            // First time installation message
            vscode.window.showInformationMessage(`VS Code Modernized installed! Run 'VS Code Modernized: Apply Styles' from the Command Palette to activate.`);
        } else if (stylesAreApplied) {
            // Extension updated and styles were previously applied, re-apply them automatically
            console.log(`Re-applying styles after update.`);
            // Run applyStyles asynchronously, don't wait for it to complete activation
            applyStyles().catch(err => console.error("Error during automatic style re-application after update:", err));
            // applyStyles will handle the reload prompt if successful
        }
    }
    // --- End Version Check & Update Handling ---

    // --- Configuration Change Listener ---
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(event => {
            // Check if the changed configuration affects our UI settings
            const affectsOurUi = event.affectsConfiguration(`${CONFIG_SECTION}.ui.spacing`) ||
                event.affectsConfiguration(`${CONFIG_SECTION}.ui.borderRadius`) ||
                event.affectsConfiguration(`${CONFIG_SECTION}.ui.tabSpacing`);

            if (affectsOurUi) {
                console.log(`Relevant configuration changed.`);
                // Check if styles are currently applied before re-applying
                const currentlyApplied = extensionContext.globalState.get<boolean>(APPLIED_STATE_KEY, false);
                if (currentlyApplied) {
                    console.log(`Styles are applied, re-applying due to config change.`);
                    // Re-apply styles asynchronously if settings change and styles are active
                    applyStyles().catch(err => console.error("Error during automatic style re-application after config change:", err));
                    // applyStyles will handle the reload prompt if successful
                } else {
                    console.log(`Config changed, but styles are not currently applied. No action needed.`);
                }
            }
            // Note: Changes to 'autoApplyTheme' are handled implicitly during the next apply/remove cycle.
        })
    );
    // --- End Configuration Change Listener ---

    console.log(`${EXTENSION_ID} activated successfully (Version: ${currentVersion}).`);
}

/**
 * VS Code Extension deactivation function.
 * Called when the extension is deactivated (e.g., on VS Code shutdown).
 * Used for cleanup tasks if necessary.
 */
export function deactivate() {
    console.log(`${EXTENSION_ID} deactivated.`);
    // No specific cleanup needed currently
}