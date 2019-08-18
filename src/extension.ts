// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
// tslint:disable-next-line: no-implicit-dependencies
import * as vscode from "vscode";
// tslint:disable-next-line: no-duplicate-imports no-implicit-dependencies
import { Range, Selection } from "vscode";

let global = {
  lines: 10,
  buffer: 1,
};

const moveDown = async (lines: number, buffer: number) => {
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
      selecting() ? editor.selection.anchor : newPosition,
      newPosition,
    );
  }
  if (editor.selection.active.compareTo(newRange.end) > 0) {
    const newPosition = newRange.end.with(newRange.end.line - buffer, 0);
    editor.selection = new Selection(
      selecting() ? editor.selection.anchor : newPosition,
      newPosition,
    );
  }
};

const selecting = (): boolean => {
  return vscode.window.activeTextEditor!.selections.some(
    selection => !selection.anchor.isEqual(selection.active),
  );
};

const scrollDown = () => {
  moveDown(global.lines, global.buffer);
};

const scrollUp = () => {
  moveDown(-global.lines, global.buffer);
};

const updateFromConfig = () => {
  const configuration = vscode.workspace.getConfiguration("scrollViewport");
  const lines = configuration.get<number>("lines") || 10;
  const buffer = configuration.get<number>("buffer") || 1;
  global = { ...global, ...{ lines, buffer } };
};

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  context.subscriptions.push(
    vscode.commands.registerCommand("scrollViewport.scrollDown", scrollDown),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("scrollViewport.scrollUp", scrollUp),
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(updateFromConfig),
  );
  updateFromConfig();
}

// this method is called when your extension is deactivated
// tslint:disable-next-line: no-empty
export function deactivate() {}
