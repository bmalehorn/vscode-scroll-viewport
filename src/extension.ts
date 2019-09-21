// tslint:disable-next-line: no-implicit-dependencies
import * as vscode from "vscode";
// tslint:disable-next-line: no-duplicate-imports no-implicit-dependencies
import { Range, Selection, Position } from "vscode";

let global = {
  lines: 10,
  cursorFollowsViewport: false,
  buffer: 1,
};

type Direction = "down" | "up";

const calculateLimits = (
  lines: number,
  direction: Direction,
): { top: number; bottom: number } => {
  const editor = vscode.window.activeTextEditor!;
  const { visibleRanges } = editor;
  if (direction === "down") {
    const bottom = visibleRanges[visibleRanges.length - 1].end.line + lines;

    let top = visibleRanges[0].start.line;
    let linesRemaining = lines;
    let i = 0;

    while (linesRemaining > 0 && i < visibleRanges.length) {
      const range = visibleRanges[i];
      const toBurn = Math.min(range.end.line - top, linesRemaining);
      linesRemaining -= toBurn;
      top += toBurn;
      i++;
      // burn 1 line to reach next visible range
      if (linesRemaining > 0 && i < visibleRanges.length) {
        linesRemaining--;
        top = visibleRanges[i].start.line;
      }
    }
    top += linesRemaining;

    return { top, bottom };
  }

  return { top: 0, bottom: 0 };
};

const scrollDown = () => {
  const editor = vscode.window.activeTextEditor!;

  const { top, bottom } = calculateLimits(global.lines, "down");

  // update viewport - reveal bottom
  const bottomPosition = new Position(bottom, 0);
  editor.revealRange(new Selection(bottomPosition, bottomPosition));

  // update cursor - move to top
  const topPosition = new Position(top, 0);
  confineCursorToViewport(new Range(topPosition, bottomPosition), 0);
  // if (editor.selection.active.compareTo(topPosition) < 0) {
  //   const newPosition = topPosition.with(topPosition.line + global.buffer, 0);
  //   editor.selection = new Selection(
  //     selecting() ? editor.selection.anchor : newPosition,
  //     newPosition,
  //   );
  // }
};

const scrollUp = () => {
  const newRange = moveDown(-global.lines);
  if (global.cursorFollowsViewport) {
    confineCursorToViewport(newRange, global.buffer);
  }
};

const moveDown = (lines: number): Range => {
  const editor = vscode.window.activeTextEditor!;
  const { start, end } = editor.visibleRanges[0];
  const newRange = new Range(
    start.with(Math.max(start.line + lines, 0)),
    end.with(Math.max(end.line + lines, 0)),
  );
  editor.revealRange(new Selection(newRange.start, newRange.end));
  return newRange;
};

const confineCursorToViewport = (range: Range, buffer: number) => {
  const editor = vscode.window.activeTextEditor!;
  // put active inside new revealed range
  if (editor.selection.active.compareTo(range.start) < 0) {
    const newPosition = range.start.with(range.start.line + buffer, 0);
    editor.selection = new Selection(
      selecting() ? editor.selection.anchor : newPosition,
      newPosition,
    );
  }
  if (editor.selection.active.compareTo(range.end) > 0) {
    const newPosition = range.end.with(range.end.line - buffer, 0);
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

const updateFromConfig = () => {
  const configuration = vscode.workspace.getConfiguration("scrollViewport");
  global = {
    ...global,
    ...{
      lines: configuration.get<number>("lines") || 10,
      cursorFollowsViewport:
        configuration.get<boolean>("cursorFollowsViewport") || false,
    },
    buffer: configuration.get<number>("buffer") || 1,
  };
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
