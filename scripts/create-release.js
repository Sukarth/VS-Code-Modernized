const inquirer = require("inquirer");
const fs = require("fs").promises;
const path = require("path");
const { execSync, exec } = require("child_process");
require("dotenv").config(); // Load environment variables from .env file

// --- Configuration ---
const CHANGELOG_PATH = path.join(__dirname, "..", "CHANGELOG.md");
const ROOT_DIR = path.join(__dirname, "..");
const PACKAGE_JSON_PATH = path.join(ROOT_DIR, "package.json");
const DIST_DIR = path.join(ROOT_DIR, "dist");

// Asset file paths will be set during execution
let vsixPath;
let zipPath;
let tarGzPath;

// --- Helper Functions ---

/**
 * Packages the extension as .vsix and creates source code archives
 * @param {string} version - The version being released
 * @returns {Promise<{vsixPath: string, zipPath: string, tarGzPath: string}>} - Paths to created assets
 */
async function packageExtension(version) {
  try {
    // Ensure dist directory exists
    await fs.mkdir(DIST_DIR, { recursive: true });

    // Get package name from package.json
    const packageJsonContent = await fs.readFile(PACKAGE_JSON_PATH, "utf-8");
    const packageData = JSON.parse(packageJsonContent);
    const packageName = packageData.name;

    console.log("📦 Packaging extension as .vsix...");
    // Use vsce to package the extension
    execSync("npx vsce package -o dist/", { cwd: ROOT_DIR, stdio: "inherit" });

    // Set paths for the assets
    const vsixFileName = `${packageName}-${version}.vsix`;
    vsixPath = path.join(DIST_DIR, vsixFileName);

    // Check if the vsix was created successfully
    if (!fs.existsSync(vsixPath)) {
      // Try to find the actual vsix file that was created
      const files = await fs.readdir(DIST_DIR);
      const vsixFiles = files.filter((file) => file.endsWith(".vsix"));
      if (vsixFiles.length > 0) {
        vsixPath = path.join(DIST_DIR, vsixFiles[0]);
        console.log(`Found VSIX at different path: ${vsixPath}`);
      } else {
        throw new Error("VSIX file was not created successfully");
      }
    }

    console.log("📦 Creating source code archives...");
    // Create zip archive
    const zipFileName = `${packageName}-${version}-source.zip`;
    zipPath = path.join(DIST_DIR, zipFileName);
    execSync(`git archive --format=zip --output=${zipPath} HEAD`, {
      cwd: ROOT_DIR,
      stdio: "inherit",
    });

    // Create tar.gz archive
    const tarGzFileName = `${packageName}-${version}-source.tar.gz`;
    tarGzPath = path.join(DIST_DIR, tarGzFileName);
    execSync(`git archive --format=tar.gz --output=${tarGzPath} HEAD`, {
      cwd: ROOT_DIR,
      stdio: "inherit",
    });

    console.log("✅ Successfully created all release assets:");
    console.log(`   - VSIX: ${vsixPath}`);
    console.log(`   - ZIP: ${zipPath}`);
    console.log(`   - TAR.GZ: ${tarGzPath}`);

    return { vsixPath, zipPath, tarGzPath };
  } catch (error) {
    console.error(`❌ Error packaging extension: ${error.message}`);
    throw error;
  }
}

/**
 * Extracts release notes for a specific version from the CHANGELOG.md content.
 * Assumes Keep a Changelog format (## [Version] - YYYY-MM-DD)
 */
async function getReleaseNotes(version) {
  try {
    const changelogContent = await fs.readFile(CHANGELOG_PATH, "utf-8");
    const versionHeader = `## [${version}]`;
    const startIndex = changelogContent.indexOf(versionHeader);

    if (startIndex === -1) {
      throw new Error(`Version ${version} not found in ${CHANGELOG_PATH}`);
    }

    // Find the start of the notes for this version
    const notesStartIndex = startIndex + versionHeader.length;

    // Find the start of the *next* version header (or end of file)
    const nextVersionIndex = changelogContent.indexOf(
      "\n## [",
      notesStartIndex
    );
    const endIndex =
      nextVersionIndex === -1 ? changelogContent.length : nextVersionIndex;

    // Extract and clean up the notes
    let notes = changelogContent.substring(notesStartIndex, endIndex).trim();

    // Remove potential date part from the header line if present
    notes = notes.replace(/^\s*-\s*\d{4}-\d{2}-\d{2}\s*/, "").trim();

    if (!notes) {
      console.warn(
        `No specific notes found for version ${version}. You might want to add some to CHANGELOG.md.`
      );
      return "";
    }

    return notes;
  } catch (error) {
    console.error(`Error reading or parsing CHANGELOG.md: ${error.message}`);
    throw error; // Re-throw to stop the process
  }
}

/**
 * Gets repository owner and name from git remote URL.
 */
async function getRepoDetails() {
  try {
    // Try to get the remote URL from git config
    const remoteUrl = execSync('git config --get remote.origin.url', { encoding: 'utf-8' }).trim();
    const match = remoteUrl.match(/github\.com[\/:]([^\/]+)\/([^\/]+?)(\.git)?$/i);
    if (match && match[1] && match[2]) {
      return { owner: match[1], repo: match[2] };
    }
  } catch (error) {
    console.warn('Could not automatically determine repository details from git remote:', error.message);
  }

  // Fallback to package.json if git remote fails
  try {
    const packageJsonContent = await fs.readFile(PACKAGE_JSON_PATH, "utf-8");
    const packageData = JSON.parse(packageJsonContent);
    if (
      packageData.repository &&
      typeof packageData.repository.url === "string"
    ) {
      const match = packageData.repository.url.match(
        /github\.com[\/:]([^\/]+)\/([^\/]+?)(\.git)?$/i
      );
      if (match && match[1] && match[2]) {
        return { owner: match[1], repo: match[2] };
      }
    }
  } catch (error) {
    console.warn(
      "Could not automatically determine repository details from package.json:",
      error.message
    );
  }

  // Fallback: Prompt user
  console.log("Could not automatically determine repository owner and name.");
  const answers = await inquirer.prompt([
    {
      name: "owner",
      message: "Enter the GitHub repository owner (username or organization):",
    },
    { name: "repo", message: "Enter the GitHub repository name:" },
  ]);
  return { owner: answers.owner, repo: answers.repo };
}

/**
 * Creates a release using Git commands
 * @param {string} tagName - The tag name for the release
 * @param {string} releaseTitle - The title for the release
 * @param {string} releaseNotes - The release notes
 * @param {boolean} isPrerelease - Whether this is a pre-release
 * @param {string} owner - The repository owner
 * @param {string} repo - The repository name
 */
async function createGitHubRelease(tagName, releaseTitle, releaseNotes, isPrerelease, owner, repo) {
  try {
    // Create an annotated tag
    console.log(`Creating git tag ${tagName}...`);
    
    // Write release notes to a temporary file
    const tempNotesPath = path.join(DIST_DIR, 'release-notes.txt');
    await fs.writeFile(tempNotesPath, releaseNotes);
    
    // Create an annotated tag with the release notes as the message
    execSync(`git tag -a ${tagName} -F "${tempNotesPath}"`, {
      cwd: ROOT_DIR,
      stdio: "inherit",
    });
    
    // Push the tag to GitHub
    console.log(`Pushing tag ${tagName} to GitHub...`);
    execSync(`git push origin ${tagName}`, {
      cwd: ROOT_DIR,
      stdio: "inherit",
    });
    
    // Clean up temporary file
    await fs.unlink(tempNotesPath);
    
    console.log(`✅ Successfully created and pushed tag: ${tagName}`);
    console.log(`\nRelease URL: https://github.com/${owner}/${repo}/releases/tag/${tagName}`);
    console.log(`\nNOTE: The tag has been created and pushed to GitHub.`);
    console.log(`To complete the release process, please go to the URL above and:`);
    console.log(`1. Click on "Edit tag"`);
    console.log(`2. Set the release title to: "${releaseTitle}"`);
    console.log(`3. Mark as pre-release: ${isPrerelease ? 'Yes' : 'No'}`);
    console.log(`4. Upload the following assets manually:`);
    console.log(`   - ${vsixPath}`);
    console.log(`   - ${zipPath}`);
    console.log(`   - ${tarGzPath}`);
    
    return true;
  } catch (error) {
    console.error(`❌ Error creating GitHub release: ${error.message}`);
    return false;
  }
}

// --- Main Script Logic ---

async function createRelease() {
  console.log("🚀 Starting GitHub Release Creation Script...");

  try {
    // Check if git is installed and we're in a git repository
    try {
      execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
    } catch (error) {
      console.error("❌ Error: Not in a git repository or git is not installed.");
      return;
    }

    const { owner, repo } = await getRepoDetails();
    if (!owner || !repo) {
      console.error(
        "❌ Error: Could not determine repository owner and name. Exiting."
      );
      return;
    }
    console.log(`Target repository: ${owner}/${repo}`);

    const answers = await inquirer.prompt([
      {
        name: "version",
        message: "Enter the version tag for the new release (e.g., v1.0.0):",
        validate: (input) => !!input || "Version tag cannot be empty.",
      },
      {
        name: "releaseTitle",
        message: "Enter the title for the release (defaults to version tag):",
        default: (ans) => ans.version,
      },
      {
        name: "isPrerelease",
        type: "confirm",
        message: "Is this a pre-release?",
        default: false,
      },
    ]);

    const { version, releaseTitle, isPrerelease } = answers;
    const tagName = version.startsWith("v") ? version : `v${version}`; // Ensure 'v' prefix

    console.log(`\nFetching release notes for version ${version} from CHANGELOG.md...`);
    const releaseNotes = await getReleaseNotes(version);

    console.log("\n--- Release Details ---");
    console.log(`Repository:     ${owner}/${repo}`);
    console.log(`Tag Name:       ${tagName}`);
    console.log(`Release Title:  ${releaseTitle}`);
    console.log(`Pre-release:    ${isPrerelease}`);
    console.log("Release Notes:");
    console.log(releaseNotes || "(No specific notes found/provided)");
    console.log("----------------------\n");

    const { confirm } = await inquirer.prompt([
      {
        name: "confirm",
        type: "confirm",
        message: "Proceed with creating the tag and release on GitHub?",
        default: true,
      },
    ]);

    if (!confirm) {
      console.log("🚫 Release creation cancelled.");
      return;
    }

    // Check if tag already exists
    try {
      execSync(`git show-ref --tags ${tagName}`, { stdio: 'ignore' });
      console.warn(`⚠️ Warning: Tag ${tagName} already exists locally.`);
      
      const { overwriteTag } = await inquirer.prompt([
        {
          name: "overwriteTag",
          type: "confirm",
          message: `Tag ${tagName} already exists. Do you want to overwrite it?`,
          default: false,
        },
      ]);
      
      if (overwriteTag) {
        console.log(`Deleting existing tag ${tagName}...`);
        execSync(`git tag -d ${tagName}`, { stdio: 'inherit' });
        try {
          execSync(`git push origin :refs/tags/${tagName}`, { stdio: 'inherit' });
        } catch (error) {
          console.warn(`Could not delete remote tag (it might not exist): ${error.message}`);
        }
      } else {
        console.log("🚫 Release creation cancelled to avoid overwriting existing tag.");
        return;
      }
    } catch (error) {
      // Tag doesn't exist, which is good
    }

    // Package the extension and create source archives
    console.log("\nPreparing release assets...");
    const { vsixPath, zipPath, tarGzPath } = await packageExtension(version);

    // Create the release using Git commands
    console.log(`\nCreating release ${tagName} on GitHub...`);
    const success = await createGitHubRelease(
      tagName,
      releaseTitle,
      releaseNotes,
      isPrerelease,
      owner,
      repo
    );

    if (success) {
      console.log(`\n🎉 Release process completed successfully!`);
    }
  } catch (error) {
    console.error(`❌ An unexpected error occurred: ${error.message}`);
  }
}

// Run the script
createRelease();
