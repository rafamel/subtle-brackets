# Subtle Brackets

![Logo](https://raw.githubusercontent.com/rafamel/subtle-brackets/master/images/icon_128.png)

_Underlined matching brackets and more for Visual Studio Code._

[Subtle Brackets @ Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=rafamel.subtle-brackets)

---

_Subtle Brackets_ allows custom styling of matching brackets as VSCode currently [boxes them](https://github.com/Microsoft/vscode/issues/23606), [impairing visibility](https://github.com/Microsoft/vscode/issues/19534). By default, it applies a subtle light/dark underline to the bracket next to the cursor and its matching pair:

![After](https://raw.githubusercontent.com/rafamel/subtle-brackets/master/images/example.png)

You can also customize the style applied to matching brackets.

<!-- ![Settings](https://raw.githubusercontent.com/rafamel/subtle-brackets/master/images/rundown.gif) -->

## Extension Settings

| Setting                          | Default                                                                                         | Description                                                                                                                                                                                                                                     |
| -------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **subtleBrackets.disableNative** | `true`                                                                                          | _Subtle Brackets_ permanently disables the native `matchBrackets` by default. Turn to `false` to prevent this behavior.                                                                                                                         |
| **subtleBrackets.parse**         | `true`                                                                                          | If `true`, documents will be properly parsed via [Prism](http://prismjs.com/), whenever possible, so brackets within strings and comments don't trigger the decoration. There are [some edge cases](http://prismjs.com/examples.html#failures). |
| **subtleBrackets.style**         | `{ "borderWidth": "1px", "borderStyle": "none none solid none" }`                               | Change the default style applied to matching brackets. The default is a light/dark underline (depending on your current theme).                                                                                                                 |
| **subtleBrackets.pairs**         | `[{ "open": "(", "close": ")" }, { "open": "[", "close": "]" }, { "open": "{", "close": "}" }]` | An array of objects defining the bracket pairs to match. They can also define specific styles and whether to take parsing into account for each specific pair.                                                                                  |

### Pairs

Each pair definitition **must** have the `open` and `close` keys, and **can** optionally take custom `style` and `parse` keys for the pair.

As an example, here's how you would disable parsing for the `()` bracket pair, and set a red underline for `{}`.

```javascript
"subtleBrackets.pairs" : [
  {
    "open": "(",
    "close": ")",
    "parse": false
  },
  {
    "open": "[",
    "close": "]"
  },
  {
    "open": "{",
    "close": "}",
    "style": { "borderColor": "red" }
  }
]
```

### Style

If you wish, you can change the default style applied to matching brackets by modifying the **subtleBrackets.style** property. For a list of allowed styles check [DecorationRenderOptions](https://code.visualstudio.com/docs/extensionAPI/vscode-api#DecorationRenderOptions).

As an example, here's how you would set a 2px blue underline default style:

```javascript
"subtleBrackets.style": {
  "borderColor": "blue",
  "borderWidth": "2px"
}
```

You can also target a specific bracket pair by setting a `style` key within its definition. As an example, here's how we'd assign a white font over red a background to the `"[]"` pair.

```javascript
"subtleBrackets.pairs" : [
  {
    "open": "(",
    "close": ")"
  },
  {
    "open": "[",
    "close": "]",
    "style": {
      "color": "white",
      "backgroundColor": "red",
      "borderStyle": "none"
    }
  },
  {
    "open": "{",
    "close": "}"
  }
]
```
