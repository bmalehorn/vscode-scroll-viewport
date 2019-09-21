// tslint:disable-next-line: no-implicit-dependencies
import * as vscode from "vscode";
// tslint:disable-next-line: no-duplicate-imports no-implicit-dependencies
import { Position, Range, Selection } from "vscode";

let global = {
  lines: 10,
  cursorFollowsViewport: false,
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
  } else if (direction === "up") {
    // 1. top <=> bottom
    // 2. 0 ... visibleRanges.length <=> visibleRanges.length ... 0
    // 3. + <=> -
    // it's probably possible to use the same code for up & down,
    // but I'd rather have it inlined, out in the open
    const top = visibleRanges[0].start.line - lines;

    let bottom = visibleRanges[visibleRanges.length - 1].end.line;
    let linesRemaining = lines;
    let i = visibleRanges.length - 1;

    while (linesRemaining > 0 && i >= 0) {
      const range = visibleRanges[i];
      const toBurn = Math.min(bottom - range.start.line, linesRemaining);
      linesRemaining -= toBurn;
      bottom -= toBurn;
      i--;
      // burn 1 line to reach next visible range
      if (linesRemaining > 0 && i >= 0) {
        linesRemaining--;
        bottom = visibleRanges[i].start.line;
      }
    }
    bottom -= linesRemaining;

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
  confineCursorToViewport(new Range(topPosition, bottomPosition));
};

const scrollUp = () => {
  const editor = vscode.window.activeTextEditor!;

  const { top, bottom } = calculateLimits(global.lines, "up");

  // update viewport - reveal top
  const topPosition = new Position(top, 0);
  editor.revealRange(new Selection(topPosition, topPosition));

  // update cursor - move to bottom
  const bottomPosition = new Position(bottom, 0);
  confineCursorToViewport(new Range(bottomPosition, topPosition));
};

const confineCursorToViewport = (range: Range) => {
  const editor = vscode.window.activeTextEditor!;
  // put active inside new revealed range
  if (editor.selection.active.compareTo(range.start) < 0) {
    const newPosition = range.start.with(range.start.line, 0);
    editor.selection = new Selection(
      selecting() ? editor.selection.anchor : newPosition,
      newPosition,
    );
  }
  if (editor.selection.active.compareTo(range.end) > 0) {
    const newPosition = range.end.with(range.end.line, 0);
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
