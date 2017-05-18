# Subtle Brackets

Subtle Brackets allows custom styling of matching brackets as the native VSCode [box around them](https://github.com/Microsoft/vscode/issues/23606) [impairs visibility](https://github.com/Microsoft/vscode/issues/12402). By default, it applies a subtle underline light/dark underline to the bracket next to the cursor and its matching pair.

The difference with the default boxes should be clear:

![After](https://raw.githubusercontent.com/rafamel/subtle-brackets/master/images/after.png)

## How to disable matchBrackets

Subtle Brackets does its own parsing, so you'll need to deactivate the native `matchingBrackets`:
- Press `ctrl(⌘) + ,` or navigate to `Code > Preferences > Settings`
- Manually add `"editor.matchBrackets": false,` to the settings or press `ctrl(⌘) + f`, type `editor.matchBrackets` to locate the field, and set it to `false`.

![Settings](https://raw.githubusercontent.com/rafamel/subtle-brackets/master/images/settings.png)

## Extension Settings

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

This extension contributes the following settings:

* `myExtension.enable`: enable/disable this extension
* `myExtension.thing`: set to `blah` to do something

## Release Notes

### 1.0.0

Initial release of Subtle Brackets


**Enjoy!**
