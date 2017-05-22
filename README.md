# Subtle Brackets

![Logo](https://raw.githubusercontent.com/rafamel/subtle-brackets/master/images/icon.png)

*Underlined matching brackets and more for Visual Studio Code.* 

Please **disable the native** `matchBrackets` (instructions below) after you install *Subtle Brackets*.

---

*Subtle Brackets* allows custom styling of matching brackets as VSCode currently [boxes them](https://github.com/Microsoft/vscode/issues/23606), [impairing visibility](https://github.com/Microsoft/vscode/issues/12402). By default, it applies a subtle light/dark underline to the bracket next to the cursor and its matching pair.

The difference with the default boxes should be clear:

![After](https://raw.githubusercontent.com/rafamel/subtle-brackets/master/images/after.png)

## Extension Settings

If you wish, you can change the style applied to matching brackets. Reload the window after changing your settings by pressing `ctrl(⌘) + shift + p`, typing `Reload Window` and return.

* **subtleBrackets.bracketPairs**: An array of the bracket pairs to match. There must be two characters per string. Default: `["{}", "[]", "()"]`.

* **subtleBrackets.style**: Change the style of matching brackets. Default is light/dark underline (depending on the theme): `{ "borderWidth": "1px", "borderStyle": "none none solid none" }`. For a list of allowed keys check [DecorationRenderOptions](https://code.visualstudio.com/docs/extensionAPI/vscode-api#DecorationRenderOptions). Some alternative examples:
    - *2px Blue underline:* `{ "borderColor": "blue", "borderWidth": "2px" }`
    - *White font over red background:* `{ "color": "white", "backgroundColor": "red", "borderStyle": "none" }`

## How to disable matchBrackets

*Subtle Brackets* does its own parsing, so you'll need to deactivate the native `matchBrackets`:
- Press `ctrl(⌘) + ,` **or** navigate to `Code > Preferences > Settings`
- Manually add `"editor.matchBrackets": false` to your user settings **or** press `ctrl(⌘) + f`, type `editor.matchBrackets` to locate the field, and set it to `false`.

![Settings](https://raw.githubusercontent.com/rafamel/subtle-brackets/master/images/settings.png)


**Enjoy!**
