# 📜🖥 Scroll Viewport

[![version number](https://vsmarketplacebadge.apphb.com/version-short/bmalehorn.scroll-viewport.svg)](https://marketplace.visualstudio.com/items?itemName=bmalehorn.scroll-viewport)
[![download count](https://vsmarketplacebadge.apphb.com/downloads-short/bmalehorn.scroll-viewport.svg)](https://marketplace.visualstudio.com/items?itemName=bmalehorn.scroll-viewport)

![demo](demo.gif)

When you scroll with the mouse, it moves the viewport up and down without moving the cursor.

Scroll Viewport adds keybindings for that behavior:

| keybinding               | command     |
| ------------------------ | ----------- |
| `Ctrl+Down` / `Cmd+Down` | scroll down |
| `Ctrl+Up` / `Cmd+Up`     | scroll up   |

## Extension Settings

| name                                   | default | effect                                                                                                     |
| -------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------- |
| `scrollViewport.lines`                 | `10`    | How many lines to scroll up / down                                                                         |
| `scrollViewport.cursorFollowsViewport` | `false` | When `true`, cursor will stay inside the viewport instead of scrolling off the screen                      |
| `scrollViewport.buffer`                | `1`     | when `cursorFollowsViewport` is true, keep the cursor this many lines above / below the edge of the screen |

## Similar Projects

- [keyboard-scroll](https://github.com/finalclass/vscode-keyboard-scroll)
- [scrollkey](https://github.com/74th/vscode-scrollkey)
- [scrolloff](https://github.com/TickleForce/vscode-scrolloff)
