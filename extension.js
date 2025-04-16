// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const sudo = require('@vscode/sudo-prompt');

const extensionDisplayName = 'VS Code Modernized'; // Used for sudo prompt
const injectionMarker = '<!--vscode-modernized-->';

/**
 * Finds the path to the workbench.html file.
 * @returns {string | null} The path to workbench.html or null if not found.
 */
function findWorkbenchPath() {
    const possiblePaths = [
        // Locate workbench.html based on VSCode's installation structure
        // Adjust these paths based on typical VSCode installations on Windows
        path.join(vscode.env.appRoot, 'out', 'vs', 'code', 'electron-sandbox', 'workbench', 'workbench.html'),
        path.join(vscode.env.appRoot, '..', 'workbench', 'workbench.html') // For older versions or different structures
    ];

    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            console.log(`Found workbench.html at: ${p}`);
            return p;
        }
    }
    console.error('Could not find workbench.html path.');
    return null;
}

/**
 * Reads the content of a file.
 * @param {string} filePath
 * @returns {Promise<string>}
 */
async function readFileAsync(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf-8', (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

/**
 * Writes content to a file, attempting sudo if direct write fails.
 * @param {string} filePath
 * @param {string} content
 * @returns {Promise<void>}
 */
async function writeFileAsyncSudo(filePath, content) {
    return new Promise((resolve, reject) => {
        fs.writeFile(filePath, content, 'utf-8', async (err) => {
            if (err) {
                if (err.code === 'EPERM' || err.code === 'EACCES') {
                    console.log('Permission denied, attempting sudo...');
                    const tempDir = require('os').tmpdir();
                    const tempFile = path.join(tempDir, `workbench.html.${Date.now()}`);
                    try {
                        await fs.promises.writeFile(tempFile, content, 'utf-8');
                        const command = process.platform === 'win32'
                            ? `move "${tempFile}" "${filePath}"`
                            : `mv "${tempFile}" "${filePath}"`;

                        sudo.exec(command, { name: extensionDisplayName }, (error) => {
                            if (error) {
                                console.error('Sudo execution failed:', error);
                                fs.promises.unlink(tempFile).catch(console.error); // Clean up temp file
                                reject(new Error(`Failed to write with sudo: ${error.message}. Please try running VS Code as Administrator.`));
                            } else {
                                console.log('Sudo write successful.');
                                resolve();
                            }
                        });
                    } catch (sudoError) {
                        console.error('Error during sudo attempt:', sudoError);
                        reject(new Error(`Failed to write file even with sudo attempt: ${sudoError.message}`));
                    }
                } else {
                    console.error('Failed to write file:', err);
                    reject(new Error(`Failed to write file: ${err.message}`));
                }
            } else {
                console.log('Direct write successful.');
                resolve();
            }
        });
    });
}

/**
 * Removes previously injected code from workbench.html content.
 * @param {string} htmlContent
 * @returns {string}
 */
function clearInjection(htmlContent) {
    const regex = new RegExp(`\n*?${injectionMarker}.*?${injectionMarker}\n*?`, 'gs');
    return htmlContent.replace(regex, '\n\n');
}

/**
 * Applies the custom styles and script.
 * @param {vscode.ExtensionContext} context
 */
async function applyStyles(context) {
    const workbenchPath = findWorkbenchPath();
    if (!workbenchPath) {
        vscode.window.showErrorMessage(`${extensionDisplayName}: Could not find VS Code's workbench.html file.`);
        return;
    }

    try {
        let htmlContent = await readFileAsync(workbenchPath);
        htmlContent = clearInjection(htmlContent);

        // Read CSS and JS files
        const cssPath = path.join(context.extensionPath, 'styles', 'styles.css');
        const jsPath = path.join(context.extensionPath, 'styles', 'quickInputWidget.js');

        let cssContent = '';
        let jsContent = '';

        if (fs.existsSync(cssPath)) {
            cssContent = await readFileAsync(cssPath);
        } else {
            vscode.window.showWarningMessage(`${extensionDisplayName}: styles.css not found.`);
        }

        if (fs.existsSync(jsPath)) {
            jsContent = await readFileAsync(jsPath);
        } else {
            vscode.window.showWarningMessage(`${extensionDisplayName}: quickInputWidget.js not found.`);
        }

        const injectionCode = `
${injectionMarker}
<style>
${cssContent}
</style>
<script>
(function() {
${jsContent}
})();
</script>
${injectionMarker}
`;

        // Inject code before </html>
        // Also remove Content-Security-Policy which can block the script
        const finalHtml = htmlContent
            .replace(/<meta.*http-equiv="Content-Security-Policy".*?>/gs, '') // Remove CSP meta tag
            .replace(/\n*?<\/html>/, `${injectionCode}\n</html>`);

        await writeFileAsyncSudo(workbenchPath, finalHtml);

        vscode.window.showInformationMessage(`${extensionDisplayName}: Styles applied. Reload window for changes to take effect.`, 'Reload Window')
            .then(selection => {
                if (selection === 'Reload Window') {
                    vscode.commands.executeCommand('workbench.action.reloadWindow');
                }
            });
    } catch (error) {
        console.error('Error applying styles:', error);
        vscode.window.showErrorMessage(`${extensionDisplayName}: Failed to apply styles. ${error.message}`);
    }
}

/**
 * Removes the custom styles and script.
 */
async function removeStyles() {
    const workbenchPath = findWorkbenchPath();
    if (!workbenchPath) {
        vscode.window.showErrorMessage(`${extensionDisplayName}: Could not find VS Code's workbench.html file.`);
        return;
    }

    try {
        let htmlContent = await readFileAsync(workbenchPath);
        const cleanedHtml = clearInjection(htmlContent);

        if (htmlContent === cleanedHtml) {
            vscode.window.showInformationMessage(`${extensionDisplayName}: No styles found to remove.`);
            return;
        }

        await writeFileAsyncSudo(workbenchPath, cleanedHtml);

        vscode.window.showInformationMessage(`${extensionDisplayName}: Styles removed. Reload window for changes to take effect.`, 'Reload Window')
            .then(selection => {
                if (selection === 'Reload Window') {
                    vscode.commands.executeCommand('workbench.action.reloadWindow');
                }
            });
    } catch (error) {
        console.error('Error removing styles:', error);
        vscode.window.showErrorMessage(`${extensionDisplayName}: Failed to remove styles. ${error.message}`);
    }
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

    console.log(`Congratulations, your extension "${extensionDisplayName}" is now active!`);

    // Register the commands
    let applyStylesCommand = vscode.commands.registerCommand('vscode-modernized.applyStyles', () => applyStyles(context));
    let removeStylesCommand = vscode.commands.registerCommand('vscode-modernized.removeStyles', removeStyles);

    context.subscriptions.push(applyStylesCommand);
    context.subscriptions.push(removeStylesCommand);

    // Optional: Check on startup if styles were previously applied and maybe notify user?
    // This might be complex due to needing to read workbench.html on startup.
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
    activate,
    deactivate
}