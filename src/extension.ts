// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
// tslint:disable-next-line: no-implicit-dependencies
import * as vscode from "vscode";
// tslint:disable-next-line: no-duplicate-imports no-implicit-dependencies
import { Range, Selection } from "vscode";

class ScrollViewport {
  constructor(context: vscode.ExtensionContext) {
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    context.subscriptions.push(
      vscode.commands.registerCommand(
        "scroll-viewport.scrollDown",
        this.scrollDown,
      ),
    );

    context.subscriptions.push(
      vscode.commands.registerCommand(
        "scroll-viewport.scrollUp",
        this.scrollUp,
      ),
    );
  }

  public deactivate() {
    return null;
  }

  public moveDown = async (lines: number, buffer: number = 1) => {
    const editor = vscode.window.activeTextEditor!;
    const { start, end } = editor.visibleRanges[0];
    const newRange = new Range(
      start.with(Math.max(start.line + lines, 0)),
      end.with(Math.max(end.line + lines, 0)),
    );
    editor.revealRange(new Selection(newRange.start, newRange.end));

    // put active inside new revealed range
    if (editor.selection.active.compareTo(newRange.start) < 0) {
      const newPosition = newRange.start.with(newRange.start.line + buffer, 0);
      editor.selection = new Selection(
        this.normalSelecting() ? editor.selection.anchor : newPosition,
        newPosition,
      );
    }
    if (editor.selection.active.compareTo(newRange.end) > 0) {
      const newPosition = newRange.end.with(newRange.end.line - buffer, 0);
      editor.selection = new Selection(
        this.normalSelecting() ? editor.selection.anchor : newPosition,
        newPosition,
      );
    }
  };

  public normalSelecting = (): boolean => {
    return vscode.window.activeTextEditor!.selections.some(
      selection => !selection.anchor.isEqual(selection.active),
    );
  };

  public scrollDown = () => {
    this.moveDown(10);
  };

  public scrollUp = () => {
    this.moveDown(-10);
  };
}

let scrollViewport: ScrollViewport;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  scrollViewport = new ScrollViewport(context);
}

// this method is called when your extension is deactivated
export function deactivate() {
  scrollViewport.deactivate();
}
