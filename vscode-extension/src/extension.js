const vscode = require('vscode');
const https = require('https');

let registry = null;

/**
 * Extension activation
 */
function activate(context) {
  console.log('LARC extension is now active');

  // Load registry
  loadRegistry();

  // Register commands
  let newComponent = vscode.commands.registerCommand('larc.newComponent', createNewComponent);
  let addFromRegistry = vscode.commands.registerCommand('larc.addFromRegistry', addComponentFromRegistry);
  let viewDocs = vscode.commands.registerCommand('larc.viewDocs', openDocumentation);

  context.subscriptions.push(newComponent, addFromRegistry, viewDocs);

  // Auto-complete provider for component names
  const completionProvider = vscode.languages.registerCompletionItemProvider(
    ['javascript', 'html'],
    {
      provideCompletionItems(document, position) {
        if (!registry) return [];

        const linePrefix = document.lineAt(position).text.substr(0, position.character);

        // Check if we're in a component context
        if (!linePrefix.includes('<') && !linePrefix.includes('customElements.define')) {
          return [];
        }

        return registry.components.map(component => {
          const item = new vscode.CompletionItem(component.name, vscode.CompletionItemKind.Class);
          item.detail = component.displayName;
          item.documentation = new vscode.MarkdownString(component.description);
          return item;
        });
      }
    }
  );

  context.subscriptions.push(completionProvider);
}

/**
 * Load component registry
 */
function loadRegistry() {
  const config = vscode.workspace.getConfiguration('larc');
  const registryUrl = config.get('registryUrl');

  https.get(registryUrl, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      try {
        registry = JSON.parse(data);
        console.log(`Loaded ${registry.components.length} components from registry`);
      } catch (err) {
        console.error('Failed to parse registry:', err);
      }
    });
  }).on('error', (err) => {
    console.error('Failed to load registry:', err);
  });
}

/**
 * Create new component command
 */
async function createNewComponent() {
  const name = await vscode.window.showInputBox({
    prompt: 'Component name (kebab-case)',
    placeHolder: 'my-component',
    validateInput: (value) => {
      if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)+$/.test(value)) {
        return 'Component name must be kebab-case with at least one hyphen';
      }
      return null;
    }
  });

  if (!name) return;

  const terminal = vscode.window.createTerminal('LARC');
  terminal.show();
  terminal.sendText(`larc generate component ${name}`);
}

/**
 * Add component from registry command
 */
async function addComponentFromRegistry() {
  if (!registry) {
    vscode.window.showErrorMessage('Registry not loaded yet. Please wait and try again.');
    return;
  }

  const items = registry.components.map(component => ({
    label: component.displayName,
    description: component.name,
    detail: component.description,
    component
  }));

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: 'Select a component to add',
    matchOnDescription: true,
    matchOnDetail: true
  });

  if (!selected) return;

  const terminal = vscode.window.createTerminal('LARC');
  terminal.show();
  terminal.sendText(`larc add ${selected.component.name}`);
}

/**
 * Open documentation command
 */
function openDocumentation() {
  vscode.env.openExternal(vscode.Uri.parse('https://larcjs.com/docs'));
}

/**
 * Extension deactivation
 */
function deactivate() {}

module.exports = {
  activate,
  deactivate
};
