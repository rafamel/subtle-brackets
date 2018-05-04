# Subtle Brackets

![Logo](https://raw.githubusercontent.com/rafamel/subtle-brackets/master/images/icon_128.png)

_Underlined matching brackets and more for Visual Studio Code._

[Subtle Brackets @ Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=rafamel.subtle-brackets)

---

_Subtle Brackets_ allows custom styling of matching brackets as VSCode currently [boxes them](https://github.com/Microsoft/vscode/issues/23606), [impairing visibility](https://github.com/Microsoft/vscode/issues/19534). By default, it applies a subtle light/dark underline to the bracket next to the cursor and its matching pair:

![After](https://raw.githubusercontent.com/rafamel/subtle-brackets/master/images/example.png)

You can also customize the style applied to matching brackets:

![Settings](https://raw.githubusercontent.com/rafamel/subtle-brackets/master/images/rundown.gif)

## Extension Settings

| Setting                          | Default                                                                         | Description                                                                                                                                                                                                                                        |
| -------------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **subtleBrackets.parse**         | `true`                                                                          | If `true`, the document will be properly parsed via [Prism](http://prismjs.com/), whenever possible, so brackets within strings and comments don't trigger the decoration. There are [some edge cases](http://prismjs.com/examples.html#failures). |
| **subtleBrackets.disableNative** | `true`                                                                          | _Subtle Brackets_ permanently disables the native `matchBrackets` by default. Turn to `false` to prevent this behavior.                                                                                                                            |
| **subtleBrackets.bracketPairs**  | `["{}", "[]", "()"]`                                                            | An array of the bracket pairs to match. There must be two characters per string, or they should be separated by `...`. As an example: `["{}", "''", "{{{...}}}", "start...end"]`.                                                                  |
| **subtleBrackets.styles**        | `{ "global": { "borderWidth": "1px", "borderStyle": "none none solid none" } }` | Change the styles applied to matching brackets. The default is a light/dark underline (depending on your current theme).                                                                                                                           |

### Styles

If you wish, you can change the style applied to matching brackets, and even target specific bracket pairs by creating a key matching that pair in **subtleBrackets.styles**. The key for the styles must match the pair definition in **subtleBrackets.bracketPairs**. For a list of allowed styles check [DecorationRenderOptions](https://code.visualstudio.com/docs/extensionAPI/vscode-api#DecorationRenderOptions).

#### Examples

* 2px blue underline global style:

```javascript
"subtleBrackets.styles": {
    "global": {
        "borderColor": "blue",
        "borderWidth": "2px"
    }
}
```

* Default global style and white font over red background only for `"[]"` brackets:

```javascript
"subtleBrackets.styles": {
    "global": {
        "borderWidth": "1px",
        "borderStyle": "none none solid none"
    },
    "[]": {
        "color": "white",
        "backgroundColor": "red",
        "borderStyle": "none"
    }
}
```
